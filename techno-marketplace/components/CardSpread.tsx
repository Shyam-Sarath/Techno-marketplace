'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getTechDescription } from '@/lib/techDescriptions'
import type { Technology, Team } from '@/lib/types'

interface CardSpreadProps {
  technology: Technology | null
  owner?: Team | null
  isLive?: boolean
}

export function CardSpread({ technology, owner, isLive }: CardSpreadProps) {
  const [isRevealed, setIsRevealed] = useState(false)

  // Reset reveal state when a new technology is selected
  useEffect(() => {
    setIsRevealed(false)
  }, [technology?.id])

  if (!technology) {
    // ─── Fanned Deck Spread (Idle State) ───────────────────────────
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 0' }}>
        <h3 style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '32px' }}>
          📦 Tech Deck Fanned Spread
        </h3>
        
        {/* Parent container controls the hover state */}
        <motion.div
          className="perspective-container"
          initial="idle"
          whileHover="hover"
          style={{
            position: 'relative',
            width: '280px',
            height: '380px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Card 1 (Left Card) */}
          <motion.div
            variants={{
              idle: { rotate: -12, x: -35, y: 10, scale: 0.95 },
              hover: { rotate: -24, x: -110, y: -5, scale: 1.02 }
            }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            style={{
              position: 'absolute',
              width: '240px',
              height: '340px',
              borderRadius: '20px',
              background: 'linear-gradient(145deg, #0e172a 0%, #070a13 100%)',
              border: '1px solid rgba(6, 182, 212, 0.25)',
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              padding: '24px',
              pointerEvents: 'none',
            }}
          >
            <span className="badge badge-cat-a" style={{ width: 'fit-content', fontSize: '10px' }}>Category A</span>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(6,182,212,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>🧠</div>
          </motion.div>

          {/* Card 2 (Center Card) */}
          <motion.div
            variants={{
              idle: { rotate: 0, x: 0, y: 0, scale: 1 },
              hover: { rotate: 0, x: 0, y: -25, scale: 1.05 }
            }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            style={{
              position: 'absolute',
              width: '240px',
              height: '340px',
              borderRadius: '20px',
              background: 'linear-gradient(145deg, #1b1502 0%, #0f0c01 100%)',
              border: '2px solid var(--gold-border)',
              boxShadow: '0 15px 40px rgba(245,158,11,0.15)',
              zIndex: 10,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px',
            }}
          >
            <img 
              src="/placexp_logo.png" 
              alt="PLACE-XP" 
              style={{ width: '70px', height: '70px', objectFit: 'contain', marginBottom: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }} 
            />
            <div style={{ color: 'var(--gold-light)', fontWeight: 800, fontSize: '14px', fontFamily: 'Space Grotesk', letterSpacing: '0.1em' }}>PLACE-XP VITC</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '4px' }}>HOVER TO FAN OPEN</div>
          </motion.div>

          {/* Card 3 (Right Card) */}
          <motion.div
            variants={{
              idle: { rotate: 12, x: 35, y: 10, scale: 0.95 },
              hover: { rotate: 24, x: 110, y: -5, scale: 1.02 }
            }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            style={{
              position: 'absolute',
              width: '240px',
              height: '340px',
              borderRadius: '20px',
              background: 'linear-gradient(145deg, #120e2b 0%, #090616 100%)',
              border: '1px solid rgba(139, 92, 246, 0.25)',
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              padding: '24px',
              pointerEvents: 'none',
              alignItems: 'flex-end',
            }}
          >
            <span className="badge badge-cat-b" style={{ width: 'fit-content', fontSize: '10px' }}>Category B</span>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(139,92,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>🔧</div>
          </motion.div>
        </motion.div>

        <div style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '24px', fontWeight: 500 }}>
          Waiting for next pick…
        </div>
      </div>
    )
  }

  // ─── Active Drawn Card ─────────────────────────────────────────
  const isA = technology.category === 'A'
  const isGolden = technology.is_golden

  // Theme borders/glows
  const borderStyle = isGolden
    ? '2px solid var(--gold-border)'
    : isA
    ? '1px solid rgba(6,182,212,0.4)'
    : '1px solid rgba(139,92,246,0.4)'

  const cardBackground = isGolden
    ? 'linear-gradient(135deg, #100b00 0%, #1c1300 100%)'
    : isA
    ? 'linear-gradient(135deg, #091322 0%, #050812 100%)'
    : 'linear-gradient(135deg, #100924 0%, #05040d 100%)'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 0' }}>
      <h3 style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '20px' }}>
        🎯 Current Live Auction Asset
      </h3>

      {/* 3D Flip Container */}
      <motion.div
        initial={{ scale: 0.6, y: 80, rotate: -15, opacity: 0 }}
        animate={{ scale: 1, y: 0, rotate: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 18 }}
        onClick={() => setIsRevealed(!isRevealed)}
        className="card-3d-wrapper"
        style={{
          width: '380px',
          height: '460px',
          cursor: 'pointer',
          perspective: '1500px',
          position: 'relative',
        }}
      >
        <motion.div
          animate={{ rotateY: isRevealed ? 180 : 0 }}
          transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
          style={{
            width: '100%',
            height: '100%',
            transformStyle: 'preserve-3d',
            position: 'relative',
          }}
        >
          {/* ─── CARD BACK (Face Down) ─── */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '24px',
              background: 'linear-gradient(145deg, #080d1a 0%, #020409 100%)',
              border: '2px solid rgba(99,102,241,0.3)',
              boxShadow: '0 20px 50px rgba(99,102,241,0.15), inset 0 0 20px rgba(99,102,241,0.05)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '32px',
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              zIndex: 2,
            }}
          >
            {/* Tech grid overlay */}
            <div style={{
              position: 'absolute', inset: '10px', borderRadius: '18px',
              border: '1px dashed rgba(99,102,241,0.15)', pointerEvents: 'none'
            }} />

            <motion.div
              animate={{ 
                scale: [1, 1.05, 1],
                boxShadow: ['0 0 10px rgba(99,102,241,0.2)', '0 0 20px rgba(99,102,241,0.4)', '0 0 10px rgba(99,102,241,0.2)']
              }}
              transition={{ repeat: Infinity, duration: 2.5 }}
              style={{
                width: '100px', height: '100px', borderRadius: '24px',
                background: 'rgba(255,255,255,0.02)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '24px', border: '1px solid rgba(255,255,255,0.08)'
              }}
            >
              <img 
                src="/placexp_logo.png" 
                alt="PLACE-XP" 
                style={{ width: '80px', height: '80px', objectFit: 'contain', borderRadius: '16px' }} 
              />
            </motion.div>

            <h2 style={{ fontSize: '18px', fontWeight: 800, fontFamily: 'Space Grotesk', letterSpacing: '0.05em', color: '#f1f5f9', marginBottom: '8px' }}>
              PLACE-XP AUCTION
            </h2>
            
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', textAlign: 'center', maxWidth: '240px', lineHeight: 1.5, marginBottom: '24px' }}>
              Ready to reveal this Category {technology.category === 'A' ? 'A Core' : 'B Support'} asset.
            </p>

            <div style={{
              padding: '8px 18px', borderRadius: '999px',
              background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)',
              fontSize: '11px', fontWeight: 700, color: 'var(--accent-light)',
              letterSpacing: '0.1em', textTransform: 'uppercase'
            }}>
              👆 Tap to Reveal Card
            </div>
          </div>

          {/* ─── CARD FRONT (Revealed Details) ─── */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '24px',
              background: cardBackground,
              border: borderStyle,
              boxShadow: isGolden
                ? '0 25px 60px rgba(245,158,11,0.25), inset 0 0 25px rgba(245,158,11,0.08)'
                : isA
                ? '0 20px 50px rgba(6,182,212,0.15), inset 0 0 20px rgba(6,182,212,0.05)'
                : '0 20px 50px rgba(139,92,246,0.15), inset 0 0 20px rgba(139,92,246,0.05)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              padding: '32px',
              transform: 'rotateY(180deg)',
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              zIndex: 1,
            }}
          >
            {/* Shimmer overlay for golden card */}
            {isGolden && (
              <div className="animate-shimmer" style={{
                position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
                borderRadius: '22px', opacity: 0.15
              }} />
            )}

            {/* Glowing Category Badge & Category Indicator */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 2 }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span className={`badge ${
                  isGolden ? 'badge-gold' : isA ? 'badge-cat-a' : 'badge-cat-b'
                }`} style={{ fontSize: '11px' }}>
                  {isGolden ? '⭐ Golden Core' : isA ? '🧠 Category A' : '🔧 Category B'}
                </span>
                <span className={`badge ${
                  technology.is_sold ? 'badge-sold' : ''
                }`} style={{
                  fontSize: '10px',
                  background: !technology.is_sold ? 'rgba(239, 68, 68, 0.12)' : undefined,
                  color: !technology.is_sold ? '#f87171' : undefined,
                  border: !technology.is_sold ? '1px solid rgba(239, 68, 68, 0.25)' : undefined,
                }}>
                  {technology.is_sold ? '✓ SOLD' : '✖ UNSOLD'}
                </span>
              </div>
              
              <div style={{
                width: '40px', height: '40px', borderRadius: '10px',
                background: isA ? 'rgba(6,182,212,0.08)' : 'rgba(139,92,246,0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '18px', border: `1px solid ${isA ? 'rgba(6,182,212,0.15)' : 'rgba(139,92,246,0.15)'}`
              }}>
                {isGolden ? '⭐' : isA ? '🧠' : '🔧'}
              </div>
            </div>

            {/* Content Panel */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', margin: '16px 0', zIndex: 2 }}>
              <h2 className={isGolden ? 'gradient-text-gold' : ''} style={{
                fontSize: '26px',
                fontWeight: 900,
                lineHeight: 1.2,
                color: isGolden ? undefined : 'var(--text-primary)',
                fontFamily: 'Space Grotesk',
                marginBottom: '14px',
                letterSpacing: '-0.02em'
              }}>
                {technology.name}
              </h2>

              <p style={{
                fontSize: '13px',
                lineHeight: 1.6,
                color: 'var(--text-secondary)',
                background: 'rgba(255,255,255,0.015)',
                border: '1px solid rgba(255,255,255,0.03)',
                borderRadius: '12px',
                padding: '16px',
              }}>
                {getTechDescription(technology.name)}
              </p>
            </div>

            {/* Bottom Section - Sold / Price or tap to flip back */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 2, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}>
              {technology.is_sold && owner ? (
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Acquired By</div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>{owner.team_name}</div>
                </div>
              ) : (
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  Unsold · Bidding Open
                </div>
              )}

              {technology.is_sold && technology.sold_price !== null ? (
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Price</div>
                  <div style={{ fontSize: '15px', fontWeight: 800, fontFamily: 'JetBrains Mono', color: isGolden ? 'var(--gold-light)' : 'var(--success)', marginTop: '2px' }}>
                    ₹{technology.sold_price.toLocaleString('en-IN')}
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  🔄 Tap to hide
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}
