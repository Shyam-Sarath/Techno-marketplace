'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { getSession, clearSession } from '@/lib/session'
import { TechnologyCard } from '@/components/TechnologyCard'
import { TeamPurseTable } from '@/components/TeamPurseTable'
import { TechnologyInventory } from '@/components/TechnologyInventory'
import type { EventState, Technology, Team, Transaction } from '@/lib/types'

export default function AdminAuctionPage() {
  const router = useRouter()
  const supabase = createClient()

  const [eventState, setEventState] = useState<EventState | null>(null)
  const [technologies, setTechnologies] = useState<Technology[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [currentTech, setCurrentTech] = useState<Technology | null>(null)

  // Assign form
  const [winningTeamId, setWinningTeamId] = useState('')
  const [bidAmount, setBidAmount] = useState('')
  const [assigning, setAssigning] = useState(false)
  const [assignError, setAssignError] = useState('')

  // Add team form
  const [newTeamName, setNewTeamName] = useState('')
  const [addingTeam, setAddingTeam] = useState(false)

  const [activeTab, setActiveTab] = useState<'auction' | 'teams' | 'history'>('auction')
  const [loading, setLoading] = useState(true)

  // Guard: only admin can access this page
  useEffect(() => {
    const session = getSession()
    if (!session || session.role !== 'admin') {
      router.replace('/login')
    }
  }, [router])

  const teamMap = Object.fromEntries(teams.map((t) => [t.id, t]))

  // ─── Load initial data ──────────────────────────────────────
  const loadData = useCallback(async () => {
    const [{ data: es }, { data: techs }, { data: ts }, { data: txs }] = await Promise.all([
      supabase.from('event_state').select('*').single(),
      supabase.from('technologies').select('*').order('display_order'),
      supabase.from('teams').select('*').eq('is_active', true).order('team_number'),
      supabase.from('transactions').select('*').eq('is_voided', false).order('created_at', { ascending: false }),
    ])
    if (es) setEventState(es)
    if (techs) setTechnologies(techs)
    if (ts) setTeams(ts)
    if (txs) setTransactions(txs)

    if (es?.current_technology_id && techs) {
      setCurrentTech(techs.find((t: Technology) => t.id === es.current_technology_id) ?? null)
    }
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  // ─── Real-time subscriptions ────────────────────────────────
  useEffect(() => {
    const channels = [
      supabase.channel('event_state_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'event_state' }, loadData)
        .subscribe(),
      supabase.channel('tech_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'technologies' }, loadData)
        .subscribe(),
      supabase.channel('team_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'teams' }, loadData)
        .subscribe(),
      supabase.channel('tx_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, loadData)
        .subscribe(),
    ]
    return () => { channels.forEach((c) => supabase.removeChannel(c)) }
  }, [loadData])

  // ─── Actions ────────────────────────────────────────────────

  async function startAuction() {
    await supabase.from('event_state').update({
      phase: 'CATEGORY_A',
      started_at: new Date().toISOString(),
    }).eq('id', 1)
  }

  async function chooseNextTechnology() {
    const phase = eventState?.phase
    const category = phase === 'CATEGORY_A' ? 'A' : 'B'
    const unsold = technologies.filter((t) => t.category === category && !t.is_sold)
    if (unsold.length === 0) return
    const pick = unsold[Math.floor(Math.random() * unsold.length)]
    setCurrentTech(pick)
    await supabase.from('event_state').update({ current_technology_id: pick.id }).eq('id', 1)
  }

  async function assignTechnology() {
    setAssignError('')
    if (!currentTech || !winningTeamId || !bidAmount) {
      setAssignError('Please select a team and enter a bid amount.')
      return
    }
    const bid = parseInt(bidAmount)
    if (isNaN(bid) || bid <= 0) { setAssignError('Invalid bid amount.'); return }
    const team = teamMap[winningTeamId]
    if (!team) { setAssignError('Team not found.'); return }
    if (bid > team.purse) { setAssignError(`Bid exceeds ${team.team_name}'s remaining purse of ₹${team.purse.toLocaleString('en-IN')}.`); return }

    setAssigning(true)
    const phase = eventState?.phase === 'CATEGORY_A' ? 'A' : 'B'
    const { error } = await supabase.rpc('assign_technology', {
      p_technology_id: currentTech.id,
      p_team_id: winningTeamId,
      p_bid_amount: bid,
      p_phase: phase,
    })
    if (error) {
      // Fallback: do it manually
      await Promise.all([
        supabase.from('technologies').update({
          is_sold: true, sold_to_team_id: winningTeamId, sold_price: bid,
        }).eq('id', currentTech.id),
        supabase.from('teams').update({ purse: team.purse - bid }).eq('id', winningTeamId),
        supabase.from('transactions').insert({
          technology_id: currentTech.id, team_id: winningTeamId, bid_amount: bid, phase,
        }),
        supabase.from('event_state').update({ current_technology_id: null }).eq('id', 1),
      ])
    }

    setWinningTeamId('')
    setBidAmount('')
    setCurrentTech(null)
    setAssigning(false)
    await loadData()
  }

  async function startCategoryB() {
    await supabase.from('event_state').update({
      phase: 'CATEGORY_B',
      category_b_started_at: new Date().toISOString(),
      current_technology_id: null,
    }).eq('id', 1)
  }

  async function finishAuction() {
    await supabase.from('event_state').update({
      phase: 'GOLDEN_POWER',
      completed_at: new Date().toISOString(),
      current_technology_id: null,
    }).eq('id', 1)
  }

  async function addTeam() {
    if (!newTeamName.trim()) return
    setAddingTeam(true)
    const existing = teams.map((t) => t.team_number)
    const next = existing.length > 0 ? Math.max(...existing) + 1 : 1
    await supabase.from('teams').insert({
      team_number: next,
      team_name: newTeamName.trim(),
      purse: 100000,
    })
    setNewTeamName('')
    setAddingTeam(false)
    await loadData()
  }

  function signOut() {
    clearSession()
    router.push('/login')
  }

  // ─── Derived state ───────────────────────────────────────────
  const phase = eventState?.phase ?? 'NOT_STARTED'
  const catASold = technologies.filter((t) => t.category === 'A' && t.is_sold).length
  const catATotal = technologies.filter((t) => t.category === 'A').length
  const catBSold = technologies.filter((t) => t.category === 'B' && t.is_sold).length
  const catBTotal = technologies.filter((t) => t.category === 'B').length
  const catAComplete = catASold === catATotal
  const catBComplete = catBSold === catBTotal

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="loader" style={{ width: '40px', height: '40px' }} />
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* ── Top Nav ───────────────────────────────────────── */}
      <header className="glass" style={{
        position: 'sticky', top: 0, zIndex: 50,
        borderBottom: '1px solid var(--border)',
        padding: '0 24px',
      }}>
        <div style={{
          maxWidth: '1400px', margin: '0 auto',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          height: '60px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '20px' }}>⚡</span>
            <span style={{
              fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '16px',
            }}>
              Tech Marketplace
            </span>
            <span style={{
              padding: '2px 8px', background: 'rgba(239,68,68,0.15)',
              color: '#f87171', borderRadius: '6px', fontSize: '11px', fontWeight: 700,
              border: '1px solid rgba(239,68,68,0.2)', letterSpacing: '0.06em',
            }}>
              ADMIN
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Phase pill */}
            <span className={`phase-banner ${
              phase === 'CATEGORY_A' ? 'phase-a' :
              phase === 'CATEGORY_B' ? 'phase-b' :
              phase === 'GOLDEN_POWER' || phase === 'COMPLETE' ? 'phase-golden' : ''
            }`}>
              {phase === 'NOT_STARTED' ? '⏸ Not Started' :
               phase === 'CATEGORY_A' ? '🧠 Category A — Live' :
               phase === 'CATEGORY_B' ? '🔧 Category B — Live' :
               phase === 'GOLDEN_POWER' ? '⭐ Golden Powers' : '✅ Complete'}
            </span>

            {phase === 'GOLDEN_POWER' && (
              <button
                id="admin-golden-power-btn"
                className="btn btn-gold btn-sm"
                onClick={() => router.push('/admin/golden-power')}
              >
                ⭐ Golden Powers
              </button>
            )}

            <button className="btn btn-secondary btn-sm" onClick={signOut}>Sign Out</button>
          </div>
        </div>
      </header>

      {/* ── Tabs ─────────────────────────────────────────── */}
      <div style={{ borderBottom: '1px solid var(--border)', padding: '0 24px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', gap: '4px' }}>
          {(['auction', 'teams', 'history'] as const).map((tab) => (
            <button
              key={tab}
              id={`admin-tab-${tab}`}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '14px 18px', background: 'none', border: 'none',
                cursor: 'pointer', fontFamily: 'Space Grotesk', fontWeight: 600,
                fontSize: '13px', letterSpacing: '0.02em',
                color: activeTab === tab ? 'var(--text-primary)' : 'var(--text-muted)',
                borderBottom: activeTab === tab ? '2px solid var(--accent)' : '2px solid transparent',
                transition: 'all 0.2s',
              }}
            >
              {tab === 'auction' ? '🎯 Auction' : tab === 'teams' ? '👥 Teams' : '📋 History'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Main Content ──────────────────────────────────── */}
      <main style={{ flex: 1, padding: '24px', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>

        {/* ────────── AUCTION TAB ────────── */}
        {activeTab === 'auction' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px' }}>

            {/* Left — Auction control */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

              {/* Phase progress */}
              <div className="card" style={{ padding: '20px 24px' }}>
                <div style={{ display: 'flex', gap: '24px' }}>
                  {[
                    { label: 'Category A — Core', sold: catASold, total: catATotal, color: 'var(--cat-a)' },
                    { label: 'Category B — Support', sold: catBSold, total: catBTotal, color: 'var(--cat-b)' },
                  ].map((s) => (
                    <div key={s.label} style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>{s.label}</span>
                        <span style={{ fontFamily: 'JetBrains Mono', fontSize: '13px', color: s.color, fontWeight: 700 }}>
                          {s.sold}/{s.total}
                        </span>
                      </div>
                      <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '999px', overflow: 'hidden' }}>
                        <motion.div
                          animate={{ width: `${(s.sold / s.total) * 100}%` }}
                          transition={{ duration: 0.5 }}
                          style={{ height: '100%', background: s.color, borderRadius: '999px' }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Current Technology */}
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                    Current Technology
                  </h2>
                  {(phase === 'CATEGORY_A' || phase === 'CATEGORY_B') && (
                    <button
                      id="choose-next-tech-btn"
                      className="btn btn-primary btn-sm"
                      onClick={chooseNextTechnology}
                      disabled={!!currentTech}
                    >
                      🎲 Choose Next
                    </button>
                  )}
                </div>
                <AnimatePresence mode="wait">
                  <TechnologyCard key={currentTech?.id ?? 'empty'} technology={currentTech} isLive />
                </AnimatePresence>
              </div>

              {/* Assign form */}
              {currentTech && (phase === 'CATEGORY_A' || phase === 'CATEGORY_B') && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="card"
                >
                  <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '16px' }}>
                    🏆 Assign Technology
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div>
                      <label className="label">Winning Team</label>
                      <select
                        id="winning-team-select"
                        className="input input-select"
                        value={winningTeamId}
                        onChange={(e) => setWinningTeamId(e.target.value)}
                      >
                        <option value="">— Select team —</option>
                        {teams.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.team_name} (₹{t.purse.toLocaleString('en-IN')})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="label">Winning Bid (₹)</label>
                      <input
                        id="bid-amount-input"
                        className="input"
                        type="number"
                        placeholder="e.g. 62000"
                        value={bidAmount}
                        onChange={(e) => setBidAmount(e.target.value)}
                        min={1}
                      />
                    </div>
                    {assignError && (
                      <div style={{
                        padding: '10px 14px', background: 'rgba(239,68,68,0.1)',
                        border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px',
                        color: '#f87171', fontSize: '13px',
                      }}>
                        {assignError}
                      </div>
                    )}
                    <button
                      id="assign-technology-btn"
                      className="btn btn-success btn-full"
                      onClick={assignTechnology}
                      disabled={assigning}
                    >
                      {assigning ? <><span className="loader" style={{ width: '16px', height: '16px' }} /> Assigning…</> : '✓ Assign Technology'}
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Phase transition controls */}
              <div className="card">
                {phase === 'NOT_STARTED' && (
                  <button id="start-auction-btn" className="btn btn-primary btn-full btn-lg" onClick={startAuction}>
                    🚀 Start Category A Auction
                  </button>
                )}
                {phase === 'CATEGORY_A' && catAComplete && (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                    <div style={{
                      textAlign: 'center', padding: '16px',
                      marginBottom: '16px',
                      background: 'rgba(6,182,212,0.08)', borderRadius: '12px',
                      border: '1px solid rgba(6,182,212,0.2)',
                    }}>
                      <div style={{ fontSize: '24px', marginBottom: '8px' }}>🧠</div>
                      <div style={{ fontWeight: 700, color: 'var(--cat-a)', fontSize: '16px' }}>
                        Category A Complete!
                      </div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px' }}>
                        All {catATotal} core technologies have been auctioned.
                      </div>
                    </div>
                    <button id="start-cat-b-btn" className="btn btn-full btn-lg" style={{
                      background: 'linear-gradient(135deg, var(--cat-b) 0%, #7c3aed 100%)',
                      color: '#fff',
                    }} onClick={startCategoryB}>
                      🔧 Start Category B Auction
                    </button>
                  </motion.div>
                )}
                {phase === 'CATEGORY_B' && catBComplete && (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                    <div style={{
                      textAlign: 'center', padding: '16px', marginBottom: '16px',
                      background: 'rgba(245,158,11,0.08)', borderRadius: '12px',
                      border: '1px solid rgba(245,158,11,0.2)',
                    }}>
                      <div style={{ fontSize: '24px', marginBottom: '8px' }}>🎉</div>
                      <div style={{ fontWeight: 700, color: 'var(--gold)', fontSize: '16px' }}>
                        Auction Complete!
                      </div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px' }}>
                        All technologies have been auctioned. Ready to activate Golden Powers.
                      </div>
                    </div>
                    <button id="finish-auction-btn" className="btn btn-gold btn-full btn-lg" onClick={finishAuction}>
                      ⭐ Unlock Golden Powers
                    </button>
                  </motion.div>
                )}
                {(phase === 'GOLDEN_POWER' || phase === 'COMPLETE') && (
                  <div style={{ textAlign: 'center', padding: '20px' }}>
                    <div style={{ fontSize: '28px', marginBottom: '8px' }}>✅</div>
                    <div style={{ fontWeight: 700, color: 'var(--success)' }}>Auction is complete.</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      Use the Golden Powers panel to perform swaps.
                    </div>
                    <button
                      className="btn btn-gold btn-lg"
                      style={{ marginTop: '16px' }}
                      onClick={() => router.push('/admin/golden-power')}
                    >
                      ⭐ Go to Golden Powers
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Right — Team purses + tech list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="card">
                <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '14px', color: 'var(--text-secondary)' }}>
                  💰 Team Purses
                </h3>
                <TeamPurseTable teams={teams} />
              </div>

              <div className="card">
                <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '14px', color: 'var(--text-secondary)' }}>
                  📦 Technologies Sold
                </h3>
                <TechnologyInventory technologies={technologies} teams={teams} compact />
              </div>
            </div>
          </div>
        )}

        {/* ────────── TEAMS TAB ────────── */}
        {activeTab === 'teams' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '24px' }}>
            <div className="card">
              <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '20px' }}>Registered Teams</h2>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th style={{ textAlign: 'right' }}>Purse</th>
                    <th>Technologies</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {teams.map((team) => {
                    const owned = technologies.filter((t) => t.sold_to_team_id === team.id)
                    return (
                      <tr key={team.id}>
                        <td style={{ color: 'var(--text-muted)' }}>{team.team_number}</td>
                        <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{team.team_name}</td>
                        <td style={{ textAlign: 'right', fontFamily: 'JetBrains Mono', fontSize: '13px' }}>
                          ₹{team.purse.toLocaleString('en-IN')}
                        </td>
                        <td>
                          <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                            {owned.length} tech{owned.length !== 1 ? 's' : ''}
                          </span>
                        </td>
                        <td>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={async () => {
                              const purse = prompt(`New purse for ${team.team_name} (current: ₹${team.purse}):`)
                              if (!purse) return
                              const n = parseInt(purse)
                              if (!isNaN(n)) await supabase.from('teams').update({ purse: n }).eq('id', team.id)
                            }}
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="card">
              <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '16px' }}>➕ Add Team</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label className="label">Team Name</label>
                  <input
                    id="new-team-name-input"
                    className="input"
                    type="text"
                    placeholder="e.g. Team Alpha"
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') addTeam() }}
                  />
                </div>
                <button
                  id="add-team-btn"
                  className="btn btn-primary btn-full"
                  onClick={addTeam}
                  disabled={addingTeam || !newTeamName.trim()}
                >
                  {addingTeam ? 'Adding…' : '➕ Add Team (₹1,00,000)'}
                </button>
              </div>
              <div className="divider" />
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                Each team starts with a purse of ₹1,00,000. You can edit individual purses using the Edit button on the left.
              </p>
            </div>
          </div>
        )}

        {/* ────────── HISTORY TAB ────────── */}
        {activeTab === 'history' && (
          <div className="card">
            <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '20px' }}>📋 Auction History</h2>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Technology</th>
                  <th>Category</th>
                  <th>Team</th>
                  <th style={{ textAlign: 'right' }}>Bid</th>
                  <th>Time</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => {
                  const tech = technologies.find((t) => t.id === tx.technology_id)
                  const team = teamMap[tx.team_id]
                  return (
                    <tr key={tx.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {tech?.is_golden && <span>⭐</span>}
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '13px' }}>
                            {tech?.name ?? 'Unknown'}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${tx.phase === 'A' ? 'badge-cat-a' : 'badge-cat-b'}`}>
                          {tx.phase === 'A' ? 'Core' : 'Support'}
                        </span>
                      </td>
                      <td style={{ fontSize: '13px' }}>{team?.team_name ?? '—'}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'JetBrains Mono', fontSize: '13px', color: 'var(--text-primary)' }}>
                        ₹{tx.bid_amount.toLocaleString('en-IN')}
                      </td>
                      <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {new Date(tx.created_at).toLocaleTimeString()}
                      </td>
                      <td>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={async () => {
                            if (!confirm('Void this transaction? This will reverse the assignment.')) return
                            const tech2 = technologies.find((t) => t.id === tx.technology_id)
                            const team2 = teamMap[tx.team_id]
                            await Promise.all([
                              supabase.from('transactions').update({ is_voided: true }).eq('id', tx.id),
                              supabase.from('technologies').update({ is_sold: false, sold_to_team_id: null, sold_price: null }).eq('id', tx.technology_id),
                              supabase.from('teams').update({ purse: (team2?.purse ?? 0) + tx.bid_amount }).eq('id', tx.team_id),
                            ])
                            await loadData()
                          }}
                        >
                          Void
                        </button>
                      </td>
                    </tr>
                  )
                })}
                {transactions.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                      No transactions yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}
