'use client'

import { motion } from 'framer-motion'
import type { Team, Technology } from '@/lib/types'

interface TechnologyInventoryProps {
  technologies: Technology[]
  teams: Team[]
  /** If provided, only show technologies owned by this team */
  filterTeamId?: string
  compact?: boolean
}

export function TechnologyInventory({
  technologies,
  teams,
  filterTeamId,
  compact,
}: TechnologyInventoryProps) {
  const teamMap = Object.fromEntries(teams.map((t) => [t.id, t]))

  const displayed = filterTeamId
    ? technologies.filter((t) => t.sold_to_team_id === filterTeamId)
    : technologies.filter((t) => t.is_sold)

  const catA = displayed.filter((t) => t.category === 'A')
  const catB = displayed.filter((t) => t.category === 'B')

  if (displayed.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)', fontSize: '13px' }}>
        No technologies acquired yet.
      </div>
    )
  }

  const renderTech = (tech: Technology, i: number) => {
    const owner = tech.sold_to_team_id ? teamMap[tech.sold_to_team_id] : null
    const isGolden = tech.is_golden

    return (
      <motion.div
        key={tech.id}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: i * 0.05 }}
        style={{
          padding: compact ? '10px 14px' : '14px 16px',
          borderRadius: '10px',
          background: isGolden
            ? 'rgba(245,158,11,0.06)'
            : tech.category === 'A'
            ? 'rgba(6,182,212,0.04)'
            : 'rgba(139,92,246,0.04)',
          border: isGolden
            ? '1px solid rgba(245,158,11,0.2)'
            : tech.category === 'A'
            ? '1px solid rgba(6,182,212,0.15)'
            : '1px solid rgba(139,92,246,0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
          <span style={{ fontSize: '14px', flexShrink: 0 }}>
            {isGolden ? '⭐' : tech.category === 'A' ? '🧠' : '🔧'}
          </span>
          <div style={{ minWidth: 0 }}>
            <div style={{
              fontSize: compact ? '12px' : '13px',
              fontWeight: 600,
              color: isGolden ? 'var(--gold-light)' : 'var(--text-primary)',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {tech.name}
            </div>
            {!filterTeamId && owner && !compact && (
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                {owner.team_name}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          {tech.sold_price !== null && (
            <span style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '12px', color: 'var(--text-muted)',
            }}>
              ₹{tech.sold_price.toLocaleString('en-IN')}
            </span>
          )}
          {isGolden && (
            <span className="badge badge-gold" style={{ fontSize: '10px' }}>Golden</span>
          )}
        </div>
      </motion.div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {catA.length > 0 && (
        <div>
          <div className="label" style={{ marginBottom: '10px' }}>
            🧠 Category A — Core
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {catA.map((t, i) => renderTech(t, i))}
          </div>
        </div>
      )}
      {catB.length > 0 && (
        <div>
          <div className="label" style={{ marginBottom: '10px' }}>
            🔧 Category B — Support
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {catB.map((t, i) => renderTech(t, catA.length + i))}
          </div>
        </div>
      )}
    </div>
  )
}
