'use client'

import { motion } from 'framer-motion'
import type { Team } from '@/lib/types'

interface TeamPurseTableProps {
  teams: Team[]
  highlightTeamId?: string | null
}

export function TeamPurseTable({ teams, highlightTeamId }: TeamPurseTableProps) {
  const sorted = [...teams].sort((a, b) => b.purse - a.purse)

  return (
    <div>
      <table className="data-table" style={{ width: '100%' }}>
        <thead>
          <tr>
            <th style={{ width: '32px' }}>#</th>
            <th>Team</th>
            <th style={{ textAlign: 'right' }}>Purse</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((team, i) => {
            const isHighlighted = team.id === highlightTeamId
            const pct = Math.min(100, (team.purse / 100000) * 100)
            return (
              <motion.tr
                key={team.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                style={{
                  background: isHighlighted ? 'rgba(99,102,241,0.08)' : 'transparent',
                }}
              >
                <td style={{ color: 'var(--text-muted)', fontSize: '12px', width: '32px' }}>
                  {i + 1}
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '28px', height: '28px', borderRadius: '8px',
                      background: isHighlighted
                        ? 'linear-gradient(135deg,#6366f1,#8b5cf6)'
                        : 'rgba(255,255,255,0.06)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '12px', fontWeight: 700, color: isHighlighted ? '#fff' : 'var(--text-secondary)',
                      flexShrink: 0,
                    }}>
                      {team.team_number}
                    </div>
                    <div>
                      <div style={{
                        fontSize: '13px', fontWeight: 600,
                        color: isHighlighted ? 'var(--text-primary)' : 'var(--text-secondary)',
                      }}>
                        {team.team_name}
                      </div>
                      {/* Purse bar */}
                      <div style={{
                        marginTop: '4px', height: '3px',
                        background: 'rgba(255,255,255,0.06)', borderRadius: '999px',
                        width: '80px', overflow: 'hidden',
                      }}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.6, delay: i * 0.04 }}
                          style={{
                            height: '100%',
                            background: pct > 50
                              ? 'var(--success)'
                              : pct > 25
                              ? 'var(--warning)'
                              : 'var(--danger)',
                            borderRadius: '999px',
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <span style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: team.purse === 0 ? 'var(--danger)' : 'var(--text-primary)',
                  }}>
                    ₹{team.purse.toLocaleString('en-IN')}
                  </span>
                </td>
              </motion.tr>
            )
          })}
          {teams.length === 0 && (
            <tr>
              <td colSpan={3} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                No teams registered yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
