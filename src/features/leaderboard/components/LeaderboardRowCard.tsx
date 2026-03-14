'use client'

import { motion }       from 'framer-motion'
import { Crown, Flame } from 'lucide-react'
import type { LeaderboardRow } from '../services/leaderboardService'

// ═══════════════════════════════════════════════════════════════
//  LeaderboardRowCard
//  Streak-based ranking card. Primary stat: 🔥 N-day streak.
// ═══════════════════════════════════════════════════════════════

const MEDALS: Record<number, { icon: string; color: string; glow: string }> = {
  1: { icon: '🥇', color: '#f59e0b', glow: 'rgba(245,158,11,0.35)' },
  2: { icon: '🥈', color: '#94a3b8', glow: 'rgba(148,163,184,0.3)'  },
  3: { icon: '🥉', color: '#b45309', glow: 'rgba(180,83,9,0.3)'     },
}

const LEVEL_COLORS: Record<string, string> = {
  Bronze:  '#b45309',
  Silver:  '#94a3b8',
  Gold:    '#f59e0b',
  Diamond: '#60a5fa',
  King:    '#a855f7',
}

// Streak heat: different flame intensity based on streak length
function streakColor(days: number): string {
  if (days >= 100) return '#f59e0b'   // gold — legendary
  if (days >= 30)  return '#f97316'   // orange — elite
  if (days >= 14)  return '#ef4444'   // red — hot
  if (days >= 7)   return '#fb923c'   // amber — building
  return '#94a3b8'                    // gray — starting
}

interface LeaderboardRowProps {
  entry:    LeaderboardRow
  isSelf:   boolean
  index:    number
  isAllTime: boolean   // all-time boards show longest_streak label
}

export function LeaderboardRowCard({ entry, isSelf, index, isAllTime }: LeaderboardRowProps) {
  const medal      = MEDALS[entry.rank]
  const isTop3     = entry.rank <= 3
  const levelColor = LEVEL_COLORS[entry.level_name] ?? 'var(--color-primary)'
  const flameColor = streakColor(entry.streak)

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.4), duration: 0.3 }}
      className="flex items-center gap-3 px-4 py-3 rounded-2xl relative overflow-hidden"
      style={{
        background: isSelf
          ? 'var(--color-surface-active)'
          : isTop3
            ? `rgba(${medal?.color === '#f59e0b' ? '245,158,11' : medal?.color === '#94a3b8' ? '148,163,184' : '180,83,9'},0.06)`
            : 'var(--color-surface)',
        border: isSelf
          ? '1px solid var(--color-primary)'
          : isTop3
            ? `1px solid ${medal?.color}40`
            : '1px solid var(--color-border)',
        boxShadow: isSelf
          ? 'var(--glow-sm)'
          : isTop3
            ? `0 0 16px ${medal?.glow}`
            : 'none',
      }}
    >
      {/* Self pulse ring */}
      {isSelf && (
        <motion.div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          animate={{ opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 2.5, repeat: Infinity }}
          style={{ border: '1px solid var(--color-primary)', borderRadius: 16 }}
        />
      )}

      {/* Rank / medal */}
      <div
        className="w-8 h-8 flex items-center justify-center flex-shrink-0 font-display font-black text-sm"
        style={{ color: isTop3 ? medal?.color : 'var(--color-text-faint)' }}
      >
        {isTop3
          ? <span className="text-xl leading-none">{medal?.icon}</span>
          : <span className="tabular-nums">{entry.rank}</span>
        }
      </div>

      {/* Avatar */}
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
        style={{
          background: 'var(--color-surface-active)',
          border:     `1px solid ${isTop3 ? medal?.color + '50' : 'var(--color-border)'}`,
          boxShadow:  isTop3 ? `0 0 10px ${medal?.glow}` : 'none',
        }}
      >
        {entry.avatar}
      </div>

      {/* Name + level */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <p
            className="font-semibold text-sm truncate"
            style={{ color: isSelf ? 'var(--color-primary)' : 'var(--color-text)' }}
          >
            {entry.username ?? 'User'}
            {isSelf && (
              <span className="ml-1 text-xs font-display" style={{ color: 'var(--color-primary)' }}>
                (you)
              </span>
            )}
          </p>
          {entry.plan === 'premium' && (
            <Crown size={10} style={{ color: '#f59e0b', flexShrink: 0 }} />
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span
            className="text-2xs font-bold font-display"
            style={{ color: levelColor, fontSize: '9px', letterSpacing: '0.08em' }}
          >
            {entry.level_name.toUpperCase()}
          </span>
          <span className="text-2xs text-zenith-faint" style={{ fontSize: '9px' }}>
            ⚡ {entry.xp.toLocaleString()} xp
          </span>
        </div>
      </div>

      {/* ── Primary stat: streak ── */}
      <div className="flex-shrink-0 flex items-center gap-1.5">
        <motion.span
          className="text-xl leading-none"
          animate={entry.streak > 0
            ? { scale: [1, 1.15, 1] }
            : {}}
          transition={{ duration: 2, repeat: Infinity, delay: index * 0.1 }}
        >
          🔥
        </motion.span>
        <div className="text-right">
          <p
            className="font-mono font-black text-base leading-none"
            style={{
              color:      flameColor,
              textShadow: `0 0 12px ${flameColor}90`,
            }}
          >
            {entry.streak}
          </p>
          <p className="text-2xs mt-0.5" style={{ color: 'var(--color-text-faint)', fontSize: '9px' }}>
            {isAllTime ? 'best' : 'days'}
          </p>
        </div>
      </div>
    </motion.div>
  )
}
