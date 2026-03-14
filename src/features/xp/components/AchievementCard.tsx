'use client'

import { motion } from 'framer-motion'
import { Lock } from 'lucide-react'
import { RARITY_CONFIG } from '../constants/achievements'
import type { AchievementWithStatus } from '../hooks/useAchievements'
import { format } from 'date-fns'

// ═══════════════════════════════════════════════════════════════
//  AchievementCard — locked / unlocked display
// ═══════════════════════════════════════════════════════════════

interface AchievementCardProps {
  achievement: AchievementWithStatus
  index?: number
}

export function AchievementCard({ achievement, index = 0 }: AchievementCardProps) {
  const rarity = RARITY_CONFIG[achievement.rarity]

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: index * 0.03 }}
      className="relative flex flex-col items-center gap-2 p-4 rounded-2xl text-center overflow-hidden"
      style={{
        background: achievement.unlocked
          ? `linear-gradient(135deg, ${rarity.glow.replace(')', ',0.08)')} 0%, var(--color-surface) 100%)`
          : 'var(--color-surface)',
        border: `1px solid ${achievement.unlocked ? rarity.color + '50' : 'var(--color-border)'}`,
        boxShadow: achievement.unlocked ? `0 0 20px ${rarity.glow}` : 'none',
        opacity: achievement.unlocked ? 1 : 0.55,
      }}
    >
      {/* Corner rarity accent */}
      {achievement.unlocked && (
        <div
          className="absolute top-0 right-0 px-1.5 py-0.5 rounded-bl-lg"
          style={{ background: rarity.color + '22', borderLeft: `1px solid ${rarity.color}40`, borderBottom: `1px solid ${rarity.color}40` }}
        >
          <span style={{ fontSize: '8px', color: rarity.color, fontWeight: 700, letterSpacing: '0.1em' }}>
            {rarity.label.toUpperCase()}
          </span>
        </div>
      )}

      {/* Icon */}
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center relative"
        style={{
          background: achievement.unlocked ? `${rarity.color}18` : 'var(--color-surface-active)',
          border:     `2px solid ${achievement.unlocked ? rarity.color + '60' : 'var(--color-border)'}`,
          boxShadow:  achievement.unlocked ? `0 0 16px ${rarity.glow}` : 'none',
        }}
      >
        {achievement.unlocked ? (
          <span className="text-3xl">{achievement.icon}</span>
        ) : (
          <div className="relative flex items-center justify-center w-full h-full">
            <span className="text-3xl opacity-30">{achievement.icon}</span>
            <Lock
              size={14}
              className="absolute bottom-0.5 right-0.5"
              style={{ color: 'var(--color-text-faint)' }}
            />
          </div>
        )}
      </div>

      {/* Title */}
      <div className="flex flex-col gap-0.5">
        <p
          className="font-display font-bold text-xs leading-tight"
          style={{ color: achievement.unlocked ? 'var(--color-text)' : 'var(--color-text-muted)' }}
        >
          {achievement.title}
        </p>
        <p
          className="text-2xs leading-snug"
          style={{ color: 'var(--color-text-faint)', fontSize: '9px' }}
        >
          {achievement.description}
        </p>
      </div>

      {/* XP reward or unlock date */}
      {achievement.unlocked ? (
        <div className="flex flex-col items-center gap-0.5">
          {achievement.xp_reward > 0 && (
            <span
              className="text-2xs font-bold px-2 py-0.5 rounded-full font-mono"
              style={{ background: `${rarity.color}20`, color: rarity.color, fontSize: '9px' }}
            >
              +{achievement.xp_reward} XP
            </span>
          )}
          {achievement.unlocked_at && (
            <span className="text-2xs" style={{ color: 'var(--color-text-faint)', fontSize: '8px' }}>
              {format(new Date(achievement.unlocked_at), 'MMM d')}
            </span>
          )}
        </div>
      ) : (
        achievement.xp_reward > 0 && (
          <span
            className="text-2xs font-bold px-2 py-0.5 rounded-full font-mono opacity-50"
            style={{ background: 'var(--color-surface-active)', color: 'var(--color-text-faint)', fontSize: '9px' }}
          >
            +{achievement.xp_reward} XP
          </span>
        )
      )}
    </motion.div>
  )
}
