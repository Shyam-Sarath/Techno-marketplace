'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import type { Team, Technology, EventState } from '@/lib/types'

type SwapStep = 1 | 2 | 3 | 4

interface PendingSwap {
  goldenTeam: Team
  goldenTech: Technology
  initiatingTech: Technology | null
  receivingTeam: Team | null
  receivingTech: Technology | null
}

export default function GoldenPowerPage() {
  const router = useRouter()
  const supabase = createClient()

  const [eventState, setEventState] = useState<EventState | null>(null)
  const [teams, setTeams] = useState<Team[]>([])
  const [technologies, setTechnologies] = useState<Technology[]>([])
  const [loading, setLoading] = useState(true)

  const [step, setStep] = useState<SwapStep>(1)
  const [pending, setPending] = useState<Partial<PendingSwap>>({})
  const [confirming, setConfirming] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [error, setError] = useState('')

  const loadData = useCallback(async () => {
    const [{ data: es }, { data: techs }, { data: ts }] = await Promise.all([
      supabase.from('event_state').select('*').single(),
      supabase.from('technologies').select('*').order('display_order'),
      supabase.from('teams').select('*').eq('is_active', true).order('team_number'),
    ])
    if (es) setEventState(es)
    if (techs) setTechnologies(techs)
    if (ts) setTeams(ts)
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  // Golden teams = teams that own at least one golden technology
  const goldenTeams = teams.filter((team) =>
    technologies.some((t) => t.is_golden && t.sold_to_team_id === team.id)
  )

  function getTeamGoldenTechs(teamId: string) {
    return technologies.filter((t) => t.is_golden && t.sold_to_team_id === teamId)
  }

  function getTeamCatBTechs(teamId: string) {
    return technologies.filter((t) => t.category === 'B' && t.sold_to_team_id === teamId)
  }

  async function confirmSwap() {
    const { goldenTeam, goldenTech, initiatingTech, receivingTeam, receivingTech } = pending as PendingSwap
    if (!goldenTeam || !goldenTech || !initiatingTech || !receivingTeam || !receivingTech) return

    setError('')
    setConfirming(true)

    // Validate: both must be Cat B
    if (initiatingTech.category !== 'B' || receivingTech.category !== 'B') {
      setError('Only Category B technologies can be swapped.')
      setConfirming(false)
      return
    }

    await Promise.all([
      // Swap ownership
      supabase.from('technologies').update({ sold_to_team_id: receivingTeam.id }).eq('id', initiatingTech.id),
      supabase.from('technologies').update({ sold_to_team_id: goldenTeam.id }).eq('id', receivingTech.id),
      // Record the swap
      supabase.from('golden_swaps').insert({
        golden_team_id: goldenTeam.id,
        golden_tech_id: goldenTech.id,
        initiating_tech_id: initiatingTech.id,
        receiving_team_id: receivingTeam.id,
        receiving_tech_id: receivingTech.id,
      }),
    ])

    setSuccessMsg(`✓ Swap confirmed: ${goldenTeam.team_name} gave "${initiatingTech.name}" and received "${receivingTech.name}" from ${receivingTeam.team_name}.`)
    setPending({})
    setStep(1)
    setConfirming(false)
    await loadData()
  }

  const phase = eventState?.phase

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="loader" style={{ width: '40px', height: '40px' }} />
      </div>
    )
  }

  if (phase !== 'GOLDEN_POWER' && phase !== 'COMPLETE') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
        <div style={{ fontSize: '48px' }}>🔒</div>
        <h2 style={{ fontFamily: 'Space Grotesk', fontSize: '24px' }}>Golden Powers Locked</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Complete both auction phases first.</p>
        <button className="btn btn-secondary" onClick={() => router.push('/admin/auction')}>← Back to Auction</button>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', padding: '24px' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <button className="btn btn-secondary btn-sm" style={{ marginBottom: '16px' }} onClick={() => router.push('/admin/auction')}>
              ← Back
            </button>
            <h1 style={{ fontSize: '28px', fontWeight: 800 }}>
              <span className="gradient-text-gold">⭐ Golden Powers</span>
            </h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: '6px', fontSize: '14px' }}>
              Perform Category-B technology swaps for teams with Golden Core Technologies.
            </p>
          </div>
          <div style={{
            padding: '12px 16px', background: 'rgba(245,158,11,0.08)',
            border: '1px solid rgba(245,158,11,0.2)', borderRadius: '12px',
            fontSize: '13px', color: 'var(--gold)',
          }}>
            <div style={{ fontWeight: 700, marginBottom: '2px' }}>{goldenTeams.length} Golden Teams</div>
            <div style={{ color: 'rgba(245,158,11,0.6)', fontSize: '12px' }}>eligible for swaps</div>
          </div>
        </div>

        {/* Success message */}
        <AnimatePresence>
          {successMsg && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{
                marginBottom: '20px', padding: '14px 18px',
                background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)',
                borderRadius: '10px', color: '#34d399', fontSize: '14px',
              }}
            >
              {successMsg}
              <button onClick={() => setSuccessMsg('')} style={{ float: 'right', background: 'none', border: 'none', color: '#34d399', cursor: 'pointer' }}>✕</button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Swap Wizard */}
        <div className="card" style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
            {[1, 2, 3, 4].map((s) => (
              <div key={s} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{
                  height: '4px', borderRadius: '999px',
                  background: step >= s ? 'var(--gold)' : 'rgba(255,255,255,0.1)',
                  transition: 'background 0.3s',
                }} />
                <div style={{ fontSize: '11px', color: step >= s ? 'var(--gold)' : 'var(--text-muted)', fontWeight: 600 }}>
                  {s === 1 ? 'Golden Team' : s === 2 ? 'Give Away' : s === 3 ? 'Other Team' : 'Receive'}
                </div>
              </div>
            ))}
          </div>

          {/* Step 1 — Select golden team */}
          {step === 1 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <h3 style={{ fontWeight: 700, marginBottom: '16px' }}>Step 1 — Select Golden Team</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {goldenTeams.map((team) => {
                  const goldens = getTeamGoldenTechs(team.id)
                  return (
                    <button
                      key={team.id}
                      id={`select-golden-team-${team.team_number}`}
                      onClick={() => {
                        setPending({ goldenTeam: team, goldenTech: goldens[0] })
                        setStep(2)
                      }}
                      style={{
                        padding: '16px', borderRadius: '12px', textAlign: 'left',
                        background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)',
                        cursor: 'pointer', width: '100%', transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(245,158,11,0.12)' }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(245,158,11,0.06)' }}
                    >
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                        {team.team_name}
                      </div>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {goldens.map((g) => (
                          <span key={g.id} className="badge badge-gold" style={{ fontSize: '11px' }}>⭐ {g.name}</span>
                        ))}
                      </div>
                    </button>
                  )
                })}
                {goldenTeams.length === 0 && (
                  <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '24px' }}>
                    No teams have acquired golden technologies yet.
                  </p>
                )}
              </div>
            </motion.div>
          )}

          {/* Step 2 — Select Cat-B tech to give away */}
          {step === 2 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <h3 style={{ fontWeight: 700, marginBottom: '4px' }}>Step 2 — Select Technology to Give Away</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '16px' }}>
                {pending.goldenTeam?.team_name}'s Category B technologies:
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {getTeamCatBTechs(pending.goldenTeam!.id).map((tech) => (
                  <button
                    key={tech.id}
                    id={`give-tech-${tech.id}`}
                    onClick={() => { setPending((p) => ({ ...p, initiatingTech: tech })); setStep(3) }}
                    style={{
                      padding: '14px 16px', borderRadius: '10px', textAlign: 'left',
                      background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.2)',
                      cursor: 'pointer', width: '100%', color: 'var(--text-primary)',
                      fontWeight: 600, fontSize: '14px', transition: 'all 0.2s',
                    }}
                  >
                    🔧 {tech.name}
                  </button>
                ))}
                {getTeamCatBTechs(pending.goldenTeam!.id).length === 0 && (
                  <p style={{ color: 'var(--text-muted)', padding: '16px' }}>This team has no Category B technologies.</p>
                )}
              </div>
              <button className="btn btn-secondary btn-sm" style={{ marginTop: '16px' }} onClick={() => setStep(1)}>← Back</button>
            </motion.div>
          )}

          {/* Step 3 — Select receiving team */}
          {step === 3 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <h3 style={{ fontWeight: 700, marginBottom: '16px' }}>Step 3 — Select Other Team</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {teams.filter((t) => t.id !== pending.goldenTeam?.id).map((team) => (
                  <button
                    key={team.id}
                    id={`select-other-team-${team.team_number}`}
                    onClick={() => { setPending((p) => ({ ...p, receivingTeam: team })); setStep(4) }}
                    style={{
                      padding: '14px 16px', borderRadius: '10px', textAlign: 'left',
                      background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)',
                      cursor: 'pointer', width: '100%', color: 'var(--text-primary)',
                      fontWeight: 600, fontSize: '14px', transition: 'all 0.2s',
                    }}
                  >
                    {team.team_name}
                  </button>
                ))}
              </div>
              <button className="btn btn-secondary btn-sm" style={{ marginTop: '16px' }} onClick={() => setStep(2)}>← Back</button>
            </motion.div>
          )}

          {/* Step 4 — Select tech to receive */}
          {step === 4 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <h3 style={{ fontWeight: 700, marginBottom: '4px' }}>Step 4 — Select Technology to Receive</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '16px' }}>
                {pending.receivingTeam?.team_name}'s Category B technologies:
              </p>

              {/* Swap summary */}
              <div style={{
                padding: '14px', marginBottom: '16px',
                background: 'rgba(255,255,255,0.03)', borderRadius: '10px',
                border: '1px solid var(--border)', fontSize: '13px',
              }}>
                <div style={{ color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 600 }}>Swap Summary</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <span style={{ color: 'var(--cat-b)' }}>🔧 {pending.initiatingTech?.name}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '18px' }}>⇄</span>
                  <span style={{ color: 'var(--text-secondary)' }}>? (select below)</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                {getTeamCatBTechs(pending.receivingTeam!.id).map((tech) => (
                  <button
                    key={tech.id}
                    id={`receive-tech-${tech.id}`}
                    onClick={() => setPending((p) => ({ ...p, receivingTech: tech }))}
                    style={{
                      padding: '14px 16px', borderRadius: '10px', textAlign: 'left',
                      background: pending.receivingTech?.id === tech.id
                        ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.04)',
                      border: pending.receivingTech?.id === tech.id
                        ? '1px solid rgba(245,158,11,0.4)' : '1px solid var(--border)',
                      cursor: 'pointer', width: '100%', color: 'var(--text-primary)',
                      fontWeight: 600, fontSize: '14px', transition: 'all 0.2s',
                    }}
                  >
                    🔧 {tech.name}
                  </button>
                ))}
                {getTeamCatBTechs(pending.receivingTeam!.id).length === 0 && (
                  <p style={{ color: 'var(--text-muted)', padding: '16px' }}>This team has no Category B technologies.</p>
                )}
              </div>

              {error && (
                <div style={{
                  padding: '10px 14px', background: 'rgba(239,68,68,0.1)',
                  border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px',
                  color: '#f87171', fontSize: '13px', marginBottom: '12px',
                }}>
                  {error}
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="btn btn-secondary" onClick={() => setStep(3)}>← Back</button>
                <button
                  id="confirm-swap-btn"
                  className="btn btn-gold"
                  style={{ flex: 1 }}
                  onClick={confirmSwap}
                  disabled={!pending.receivingTech || confirming}
                >
                  {confirming ? 'Confirming…' : '⭐ Confirm Swap'}
                </button>
              </div>
            </motion.div>
          )}
        </div>

        {/* Golden teams overview */}
        <div className="card">
          <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '16px' }}>Golden Teams Overview</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {goldenTeams.map((team) => {
              const goldens = getTeamGoldenTechs(team.id)
              const catB = getTeamCatBTechs(team.id)
              return (
                <div key={team.id} style={{
                  padding: '14px', borderRadius: '10px',
                  background: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.15)',
                }}>
                  <div style={{ fontWeight: 700, marginBottom: '8px' }}>{team.team_name}</div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {goldens.map((g) => (
                      <span key={g.id} className="badge badge-gold" style={{ fontSize: '11px' }}>⭐ {g.name}</span>
                    ))}
                    {catB.map((b) => (
                      <span key={b.id} className="badge badge-cat-b" style={{ fontSize: '11px' }}>🔧 {b.name}</span>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
