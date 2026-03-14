'use client'

import { motion } from 'framer-motion'
import { useXPStore, getXPProgress, LEVELS } from '@/stores/xpStore'
import { Zap } from 'lucide-react'

// ═══════════════════════════════════════════════════════════════
//  XPBar — Level progress bar with glow animation
// ═══════════════════════════════════════════════════════════════

const LEVEL_COLORS: Record<string, string> = {
  Bronze:  '#cd7f32',
  Silver:  '#c0c0c0',
  Gold:    '#ffd700',
  Diamond: '#b9f2ff',
  King:    '#f59e0b',
}
const LEVEL_BADGES: Record<string, string> = {
  Bronze: '🥉', Silver: '🥈', Gold: '🥇', Diamond: '💎', King: '👑',
}

export function XPBar() {
  const { xp, levelName } = useXPStore()
  const progress = getXPProgress(xp)
  const levelColor = LEVEL_COLORS[levelName] || 'var(--color-primary)'
  const badge = LEVEL_BADGES[levelName] || '⚡'

  return (
    <div className="card flex flex-col gap-2.5">
      {/* Top row: level badge + name + XP */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">{badge}</span>
          <div>
            <p
              className="font-display font-black text-sm leading-none"
              style={{ color: levelColor, textShadow: `0 0 12px ${levelColor}60` }}
            >
              {levelName.toUpperCase()}
            </p>
            {progress.next && (
              <p className="text-2xs text-zenith-faint mt-0.5 font-display">
                → {progress.next.name}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <Zap size={13} style={{ color: 'var(--color-primary)' }} />
          <span className="font-display font-black text-sm text-glow">
            {xp.toLocaleString()}
          </span>
          <span className="text-2xs text-zenith-faint font-display">XP</span>
        </div>
      </div>

      {/* Progress bar */}
      <div>
        <div
          className="relative h-3 rounded-full overflow-hidden"
          style={{ background: 'var(--color-surface-active)' }}
        >
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress.progressPct}%` }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
            className="absolute inset-y-0 left-0 rounded-full"
            style={{
              background: `linear-gradient(90deg, ${levelColor}99, ${levelColor})`,
              boxShadow: `0 0 12px ${levelColor}60`,
            }}
          />
          {/* Shimmer overlay */}
          <motion.div
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3, ease: 'linear' }}
            className="absolute inset-0 rounded-full"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
              width: '40%',
            }}
          />
        </div>

        {/* Progress text */}
        <div className="flex justify-between mt-1">
          <span className="text-2xs text-zenith-faint font-mono">
            {progress.progressXP.toLocaleString()} XP
          </span>
          {progress.next ? (
            <span className="text-2xs text-zenith-faint font-mono">
              {(progress.neededXP - progress.progressXP).toLocaleString()} to {progress.next.name}
            </span>
          ) : (
            <span className="text-2xs font-mono" style={{ color: levelColor }}>MAX LEVEL</span>
          )}
        </div>
      </div>
    </div>
  )
}
