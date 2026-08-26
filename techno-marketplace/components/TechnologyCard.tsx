'use client'

import { motion, AnimatePresence } from 'framer-motion'
import type { Technology, Team } from '@/lib/types'

interface TechnologyCardProps {
  technology: Technology | null
  owner?: Team | null
  isLive?: boolean
}

export function TechnologyCard({ technology, owner, isLive }: TechnologyCardProps) {
  if (!technology) {
    return (
      <div style={{
        borderRadius: '20px',
        border: '2px dashed rgba(255,255,255,0.08)',
        padding: '48px',
        textAlign: 'center',
        color: 'var(--text-muted)',
      }}>
        <div style={{ fontSize: '40px', marginBottom: '12px' }}>⏳</div>
        <div style={{ fontFamily: 'Space Grotesk', fontWeight: 600 }}>
          Waiting for next technology…
        </div>
      </div>
    )
  }

  if (technology.is_golden) {
    return <GoldenTechnologyCard technology={technology} owner={owner} isLive={isLive} />
  }

  const isA = technology.category === 'A'

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.93, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.34, 1.56, 0.64, 1] }}
      style={{
        borderRadius: '20px',
        background: 'var(--bg-card)',
        border: `1px solid ${isA ? 'rgba(6,182,212,0.25)' : 'rgba(139,92,246,0.25)'}`,
        padding: '32px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: isA
          ? '0 8px 32px rgba(6,182,212,0.1)'
          : '0 8px 32px rgba(139,92,246,0.1)',
      }}
    >
      {/* Top accent line */}
      <div style={{
        position: 'absolute', top: 0, left: '10%', right: '10%', height: '2px',
        background: isA
          ? 'linear-gradient(90deg, transparent, var(--cat-a), transparent)'
          : 'linear-gradient(90deg, transparent, var(--cat-b), transparent)',
        borderRadius: '999px',
      }} />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
        <div style={{ flex: 1 }}>
          <span className={`badge ${isA ? 'badge-cat-a' : 'badge-cat-b'}`} style={{ marginBottom: '12px' }}>
            {isA ? '🧠 Category A — Core' : '🔧 Category B — Support'}
          </span>
          <h2 style={{
            fontSize: isLive ? '28px' : '20px',
            fontWeight: 800,
            letterSpacing: '-0.02em',
            color: 'var(--text-primary)',
            lineHeight: 1.2,
            marginBottom: '8px',
          }}>
            {technology.name}
          </h2>

          {technology.is_sold && owner && (
            <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className="badge badge-sold">✓ Sold</span>
              <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                {owner.team_name} · ₹{technology.sold_price?.toLocaleString('en-IN')}
              </span>
            </div>
          )}
        </div>

        <div style={{
          width: '56px', height: '56px', borderRadius: '14px',
          background: isA ? 'rgba(6,182,212,0.1)' : 'rgba(139,92,246,0.1)',
          border: `1px solid ${isA ? 'rgba(6,182,212,0.25)' : 'rgba(139,92,246,0.25)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '24px', flexShrink: 0,
        }}>
          {isA ? '🧠' : '🔧'}
        </div>
      </div>
    </motion.div>
  )
}

export function GoldenTechnologyCard({ technology, owner, isLive }: TechnologyCardProps) {
  if (!technology) return null

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85, y: 30 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
      className="animate-golden-pulse"
      style={{
        borderRadius: '20px',
        background: 'linear-gradient(135deg, #1a1400 0%, #1f1800 50%, #1a1400 100%)',
        border: '2px solid var(--gold-border)',
        padding: '32px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Shimmer overlay */}
      <div className="animate-shimmer" style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
        borderRadius: '20px',
      }} />

      {/* Particles */}
      {isLive && Array.from({ length: 6 }).map((_, i) => (
        <motion.div
          key={i}
          style={{
            position: 'absolute',
            bottom: `${15 + Math.random() * 30}%`,
            left: `${10 + i * 15}%`,
            width: '4px', height: '4px',
            background: 'var(--gold-light)',
            borderRadius: '50%',
            zIndex: 1,
          }}
          animate={{
            y: [0, -60 - Math.random() * 40],
            opacity: [1, 0],
            scale: [1, 0.3],
          }}
          transition={{
            duration: 2 + Math.random(),
            repeat: Infinity,
            delay: i * 0.3,
            ease: 'easeOut',
          }}
        />
      ))}

      <div style={{ position: 'relative', zIndex: 2 }}>
        {/* Golden badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <motion.span
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            style={{ fontSize: '20px' }}
          >
            ⭐
          </motion.span>
          <span className="badge badge-gold" style={{ fontSize: '12px', letterSpacing: '0.1em' }}>
            GOLDEN TECHNOLOGY
          </span>
        </div>

        <h2 className="gradient-text-gold" style={{
          fontSize: isLive ? '32px' : '22px',
          fontWeight: 900,
          letterSpacing: '-0.02em',
          lineHeight: 1.15,
          marginBottom: '8px',
        }}>
          {technology.name}
        </h2>

        <span style={{ color: 'rgba(245,158,11,0.6)', fontSize: '13px', fontWeight: 600 }}>
          🧠 Category A — Core Technology
        </span>

        {technology.is_sold && owner && (
          <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(245,158,11,0.2)' }}>
            <span className="badge badge-sold" style={{ marginRight: '10px' }}>✓ Acquired</span>
            <span style={{ color: 'var(--gold-light)', fontSize: '13px' }}>
              {owner.team_name} · ₹{technology.sold_price?.toLocaleString('en-IN')}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  )
}
