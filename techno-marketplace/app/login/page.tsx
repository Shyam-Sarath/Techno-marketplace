'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'

type LoginMode = 'auctioneer' | 'team'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [mode, setMode] = useState<LoginMode>('team')
  const [teamName, setTeamName] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (mode === 'auctioneer') {
        // Auctioneer login
        if (password !== 'PLACE-XP-VITC') {
          setError('Invalid auctioneer password.')
          setLoading(false)
          return
        }
        const { error: authErr } = await supabase.auth.signInWithPassword({
          email: 'auctioneer@techno-marketplace.app',
          password: 'PLACE-XP-VITC',
        })
        if (authErr) {
          // If user doesn't exist yet, sign them up
          const { error: signUpErr } = await supabase.auth.signUp({
            email: 'auctioneer@techno-marketplace.app',
            password: 'PLACE-XP-VITC',
            options: {
              data: { role: 'admin', name: 'Auctioneer' },
            },
          })
          if (signUpErr) { setError(signUpErr.message); setLoading(false); return }
          // Sign in again after signup
          await supabase.auth.signInWithPassword({
            email: 'auctioneer@techno-marketplace.app',
            password: 'PLACE-XP-VITC',
          })
        }
        router.push('/admin/auction')
      } else {
        // Team login
        if (password !== 'PLACE-XP-2026') {
          setError('Invalid event password.')
          setLoading(false)
          return
        }
        if (!teamName.trim()) {
          setError('Please enter your team name.')
          setLoading(false)
          return
        }

        const slug = teamName.trim().toLowerCase().replace(/\s+/g, '-')
        const email = `${slug}@techno-marketplace.app`

        const { error: authErr } = await supabase.auth.signInWithPassword({
          email,
          password: 'PLACE-XP-2026',
        })

        if (authErr) {
          // Register the team on first login
          const { error: signUpErr } = await supabase.auth.signUp({
            email,
            password: 'PLACE-XP-2026',
            options: {
              data: { role: 'team', name: teamName.trim() },
            },
          })
          if (signUpErr) { setError(signUpErr.message); setLoading(false); return }

          await supabase.auth.signInWithPassword({ email, password: 'PLACE-XP-2026' })
        }

        router.push('/team/dashboard')
      }
    } catch {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background orbs */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
      }}>
        <div style={{
          position: 'absolute', top: '-10%', left: '50%', transform: 'translateX(-50%)',
          width: '600px', height: '600px',
          background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)',
          borderRadius: '50%',
        }} />
        <div style={{
          position: 'absolute', bottom: '-10%', right: '-5%',
          width: '400px', height: '400px',
          background: 'radial-gradient(circle, rgba(245,158,11,0.07) 0%, transparent 70%)',
          borderRadius: '50%',
        }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
        style={{ width: '100%', maxWidth: '440px', zIndex: 1 }}
      >
        {/* Logo / Header */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '64px', height: '64px', borderRadius: '18px',
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            boxShadow: '0 8px 32px rgba(99,102,241,0.4)',
            marginBottom: '16px',
            fontSize: '28px',
          }}>
            ⚡
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, marginBottom: '6px', letterSpacing: '-0.03em' }}>
            Tech{' '}
            <span className="gradient-text">Marketplace</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            PLACE-XP Auction Platform
          </p>
        </div>

        {/* Mode Toggle */}
        <div style={{
          display: 'flex', gap: '6px',
          background: 'rgba(255,255,255,0.04)',
          borderRadius: '12px', padding: '4px',
          marginBottom: '24px',
          border: '1px solid var(--border)',
        }}>
          {(['team', 'auctioneer'] as LoginMode[]).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError('') }}
              style={{
                flex: 1, padding: '10px', borderRadius: '8px',
                border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '14px',
                fontFamily: 'Space Grotesk, sans-serif',
                transition: 'all 0.2s ease',
                background: mode === m
                  ? (m === 'auctioneer' ? 'linear-gradient(135deg,#6366f1,#4f46e5)' : 'rgba(255,255,255,0.1)')
                  : 'transparent',
                color: mode === m ? '#fff' : 'var(--text-secondary)',
                boxShadow: mode === m && m === 'auctioneer' ? '0 4px 12px rgba(99,102,241,0.4)' : 'none',
              }}
            >
              {m === 'auctioneer' ? '🔨 Auctioneer' : '👥 Team'}
            </button>
          ))}
        </div>

        {/* Login Card */}
        <div className="glass-elevated" style={{ borderRadius: '18px', padding: '28px' }}>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            <AnimatePresence mode="wait">
              {mode === 'team' && (
                <motion.div
                  key="team-name"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <label className="label">Team Name</label>
                  <input
                    id="team-name-input"
                    className="input"
                    type="text"
                    placeholder="e.g. Team Alpha"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    required={mode === 'team'}
                    autoFocus
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <label className="label">
                {mode === 'auctioneer' ? 'Auctioneer Password' : 'Event Password'}
              </label>
              <input
                id="password-input"
                className="input"
                type="password"
                placeholder={mode === 'auctioneer' ? 'PLACE-XP-VITC' : 'PLACE-XP-2026'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoFocus={mode === 'auctioneer'}
              />
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  style={{
                    padding: '10px 14px',
                    background: 'rgba(239,68,68,0.1)',
                    border: '1px solid rgba(239,68,68,0.25)',
                    borderRadius: '8px',
                    color: '#f87171',
                    fontSize: '13px',
                  }}
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <button
              id="login-submit-btn"
              type="submit"
              className={`btn btn-lg btn-full ${mode === 'auctioneer' ? 'btn-primary' : 'btn-secondary'}`}
              disabled={loading}
              style={{ marginTop: '4px' }}
            >
              {loading ? (
                <><span className="loader" style={{ width: '18px', height: '18px' }} /> Signing in…</>
              ) : (
                mode === 'auctioneer' ? '🔨 Enter Auctioneer Panel' : '🚀 Enter Marketplace'
              )}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '12px', color: 'var(--text-muted)' }}>
          PLACE-XP · VITC · Tech Marketplace 2026
        </p>
      </motion.div>
    </main>
  )
}
