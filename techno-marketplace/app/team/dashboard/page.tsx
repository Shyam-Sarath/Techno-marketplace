'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { getSession, clearSession, saveSession } from '@/lib/session'
import { TechnologyCard } from '@/components/TechnologyCard'
import { TeamPurseTable } from '@/components/TeamPurseTable'
import { TechnologyInventory } from '@/components/TechnologyInventory'
import type { EventState, Technology, Team } from '@/lib/types'

export default function TeamDashboardPage() {
  const router = useRouter()
  const supabase = createClient()

  const [user, setUser] = useState<{ name: string; email: string } | null>(null)
  const [myTeam, setMyTeam] = useState<Team | null>(null)
  const [eventState, setEventState] = useState<EventState | null>(null)
  const [technologies, setTechnologies] = useState<Technology[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [currentTech, setCurrentTech] = useState<Technology | null>(null)
  const [activeTab, setActiveTab] = useState<'live' | 'my-tech' | 'marketplace'>('live')
  const [loading, setLoading] = useState(true)

  const session = typeof window !== 'undefined' ? getSession() : null
  const userName = session?.teamName ?? 'Team'

  const loadData = useCallback(async () => {
    const session = getSession()
    if (!session) { router.replace('/login'); return }
    if (session.role === 'admin') { router.replace('/admin/auction'); return }

    const name = session.teamName

    const [{ data: es }, { data: techs }, { data: ts }] = await Promise.all([
      supabase.from('event_state').select('*').single(),
      supabase.from('technologies').select('*').order('display_order'),
      supabase.from('teams').select('*').eq('is_active', true).order('purse', { ascending: false }),
    ])

    if (es) setEventState(es)
    if (techs) setTechnologies(techs)
    if (ts) {
      setTeams(ts)
      // Match team by name
      const found = ts.find((t: Team) =>
        t.team_name.toLowerCase() === name.toLowerCase()
      )
      setMyTeam(found ?? null)
      // Save teamId back into session if we found it
      if (found && session?.teamId !== found.id) {
        saveSession({ ...session!, teamId: found.id })
      }
    }

    if (es?.current_technology_id && techs) {
      setCurrentTech(techs.find((t: Technology) => t.id === es.current_technology_id) ?? null)
    } else {
      setCurrentTech(null)
    }

    setLoading(false)
  }, [router])

  useEffect(() => { loadData() }, [loadData])

  // Real-time
  useEffect(() => {
    const channels = [
      supabase.channel('rt_event_state')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'event_state' }, loadData)
        .subscribe(),
      supabase.channel('rt_technologies')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'technologies' }, loadData)
        .subscribe(),
      supabase.channel('rt_teams')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'teams' }, loadData)
        .subscribe(),
    ]
    return () => { channels.forEach((c) => supabase.removeChannel(c)) }
  }, [loadData])

  const phase = eventState?.phase ?? 'NOT_STARTED'
  const teamMap = Object.fromEntries(teams.map((t) => [t.id, t]))
  const myTechs = myTeam ? technologies.filter((t) => t.sold_to_team_id === myTeam.id) : []

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="loader" style={{ width: '40px', height: '40px' }} />
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* ── Nav ── */}
      <header className="glass" style={{
        position: 'sticky', top: 0, zIndex: 50,
        borderBottom: '1px solid var(--border)',
        padding: '0 20px',
      }}>
        <div style={{
          maxWidth: '1200px', margin: '0 auto',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          height: '60px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '20px' }}>⚡</span>
            <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '16px' }}>
              Tech Marketplace
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Phase indicator */}
            <span className={`phase-banner ${
              phase === 'CATEGORY_A' ? 'phase-a' :
              phase === 'CATEGORY_B' ? 'phase-b' :
              (phase === 'GOLDEN_POWER' || phase === 'COMPLETE') ? 'phase-golden' : ''
            }`} style={{ fontSize: '12px' }}>
              {phase === 'NOT_STARTED' ? '⏸ Auction not started' :
               phase === 'CATEGORY_A' ? '🧠 Category A — Live' :
               phase === 'CATEGORY_B' ? '🔧 Category B — Live' :
               phase === 'GOLDEN_POWER' ? '⭐ Golden Powers Active' : '✅ Auction Complete'}
            </span>

            {myTeam && (
              <div style={{
                padding: '6px 12px', borderRadius: '8px',
                background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)',
                fontSize: '13px', fontWeight: 700, color: 'var(--accent-light)',
              }}>
                {myTeam.team_name}
              </div>
            )}

            <button
              className="btn btn-secondary btn-sm"
              onClick={() => { clearSession(); router.push('/login') }}
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* ── Purse Hero ── */}
      {myTeam && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(139,92,246,0.06) 100%)',
          borderBottom: '1px solid var(--border)',
          padding: '24px 20px',
        }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '4px' }}>
                💰 Your Remaining Purse
              </div>
              <motion.div
                key={myTeam.purse}
                initial={{ scale: 1.05, color: '#34d399' }}
                animate={{ scale: 1, color: 'var(--text-primary)' }}
                transition={{ duration: 0.4 }}
                style={{ fontSize: '36px', fontWeight: 900, fontFamily: 'Space Grotesk', letterSpacing: '-0.02em' }}
              >
                ₹{myTeam.purse.toLocaleString('en-IN')}
              </motion.div>
            </div>
            <div style={{ display: 'flex', gap: '16px' }}>
              {[
                { label: 'Core Tech', count: myTechs.filter((t) => t.category === 'A').length, icon: '🧠' },
                { label: 'Support Tech', count: myTechs.filter((t) => t.category === 'B').length, icon: '🔧' },
                { label: 'Golden', count: myTechs.filter((t) => t.is_golden).length, icon: '⭐' },
              ].map((s) => (
                <div key={s.label} style={{
                  textAlign: 'center', padding: '12px 20px', borderRadius: '12px',
                  background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)',
                }}>
                  <div style={{ fontSize: '20px', marginBottom: '4px' }}>{s.icon}</div>
                  <div style={{ fontSize: '22px', fontWeight: 800, fontFamily: 'Space Grotesk' }}>{s.count}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Tabs ── */}
      <div style={{ borderBottom: '1px solid var(--border)', padding: '0 20px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', gap: '4px' }}>
          {(['live', 'my-tech', 'marketplace'] as const).map((tab) => (
            <button
              key={tab}
              id={`team-tab-${tab}`}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '14px 18px', background: 'none', border: 'none',
                cursor: 'pointer', fontFamily: 'Space Grotesk', fontWeight: 600,
                fontSize: '13px',
                color: activeTab === tab ? 'var(--text-primary)' : 'var(--text-muted)',
                borderBottom: activeTab === tab ? '2px solid var(--accent)' : '2px solid transparent',
                transition: 'all 0.2s',
              }}
            >
              {tab === 'live' ? '📡 Live Auction' : tab === 'my-tech' ? '🎒 My Technologies' : '🌐 Marketplace'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <main style={{ flex: 1, padding: '24px 20px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

          {/* LIVE AUCTION */}
          {activeTab === 'live' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="card">
                  <div style={{ marginBottom: '12px', fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                    📡 Currently on Auction
                  </div>
                  <AnimatePresence mode="wait">
                    <TechnologyCard
                      key={currentTech?.id ?? 'empty'}
                      technology={currentTech}
                      owner={currentTech?.sold_to_team_id ? teamMap[currentTech.sold_to_team_id] : null}
                      isLive
                    />
                  </AnimatePresence>
                </div>

                {/* Phase info */}
                {(phase === 'CATEGORY_A' || phase === 'CATEGORY_B') && (
                  <div className="card" style={{ padding: '16px 20px' }}>
                    <div style={{ display: 'flex', gap: '24px' }}>
                      {[
                        { label: 'Category A', sold: technologies.filter((t) => t.category === 'A' && t.is_sold).length, total: technologies.filter((t) => t.category === 'A').length, color: 'var(--cat-a)' },
                        { label: 'Category B', sold: technologies.filter((t) => t.category === 'B' && t.is_sold).length, total: technologies.filter((t) => t.category === 'B').length, color: 'var(--cat-b)' },
                      ].map((s) => (
                        <div key={s.label} style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{s.label}</span>
                            <span style={{ fontFamily: 'JetBrains Mono', fontSize: '13px', color: s.color, fontWeight: 700 }}>
                              {s.sold}/{s.total}
                            </span>
                          </div>
                          <div style={{ height: '5px', background: 'rgba(255,255,255,0.06)', borderRadius: '999px', overflow: 'hidden' }}>
                            <motion.div
                              animate={{ width: `${(s.sold / s.total) * 100}%` }}
                              style={{ height: '100%', background: s.color, borderRadius: '999px' }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {phase === 'NOT_STARTED' && (
                  <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    <div style={{ fontSize: '48px', marginBottom: '12px' }}>⏳</div>
                    <div style={{ fontWeight: 600, fontSize: '16px' }}>Auction hasn't started yet.</div>
                    <div style={{ fontSize: '13px', marginTop: '6px' }}>The auctioneer will start shortly.</div>
                  </div>
                )}

                {(phase === 'GOLDEN_POWER' || phase === 'COMPLETE') && (
                  <div style={{
                    textAlign: 'center', padding: '40px',
                    background: 'rgba(245,158,11,0.06)', borderRadius: '16px',
                    border: '1px solid rgba(245,158,11,0.2)',
                  }}>
                    <div style={{ fontSize: '48px', marginBottom: '12px' }}>⭐</div>
                    <div className="gradient-text-gold" style={{ fontWeight: 800, fontSize: '20px', marginBottom: '8px' }}>
                      Auction Complete!
                    </div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                      The auctioneer is now processing Golden Powers.<br />Check your technologies below.
                    </div>
                  </div>
                )}
              </div>

              {/* Recent sales */}
              <div className="card">
                <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '14px', color: 'var(--text-secondary)' }}>
                  🕐 Recent Sales
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {technologies
                    .filter((t) => t.is_sold)
                    .slice(-8)
                    .reverse()
                    .map((t, i) => (
                      <motion.div
                        key={t.id}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        style={{
                          padding: '10px 12px', borderRadius: '8px',
                          background: 'rgba(255,255,255,0.03)', fontSize: '12px',
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {t.is_golden && <span>⭐</span>}
                            {t.name}
                          </div>
                          <div style={{ color: 'var(--text-muted)', marginTop: '2px' }}>
                            {t.sold_to_team_id ? teamMap[t.sold_to_team_id]?.team_name : '—'}
                          </div>
                        </div>
                        <span style={{ fontFamily: 'JetBrains Mono', color: 'var(--text-secondary)', fontSize: '11px' }}>
                          ₹{t.sold_price?.toLocaleString('en-IN')}
                        </span>
                      </motion.div>
                    ))}
                  {technologies.filter((t) => t.is_sold).length === 0 && (
                    <p style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', padding: '16px' }}>
                      No technologies sold yet.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* MY TECHNOLOGIES */}
          {activeTab === 'my-tech' && (
            <div style={{ maxWidth: '700px' }}>
              <div className="card">
                <h2 style={{ fontSize: '17px', fontWeight: 800, marginBottom: '20px' }}>
                  🎒 {myTeam?.team_name ?? user?.name}'s Technologies
                </h2>
                <TechnologyInventory technologies={technologies} teams={teams} filterTeamId={myTeam?.id} />
              </div>
            </div>
          )}

          {/* MARKETPLACE */}
          {activeTab === 'marketplace' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              <div className="card">
                <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '16px' }}>💰 All Team Purses</h3>
                <TeamPurseTable teams={teams} highlightTeamId={myTeam?.id} />
              </div>
              <div className="card">
                <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '16px' }}>📦 All Acquired Technologies</h3>
                <TechnologyInventory technologies={technologies} teams={teams} />
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  )
}
