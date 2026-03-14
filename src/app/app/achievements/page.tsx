'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Trophy, Lock, Zap } from 'lucide-react'
import { useAchievements } from '@/features/xp/hooks/useAchievements'
import { AchievementCard } from '@/features/xp/components/AchievementCard'
import type { AchievementCategory } from '@/features/xp/constants/achievements'

const CATEGORY_LABELS: Record<AchievementCategory | 'all', string> = {
  all: 'All', streak: '🔥 Streak', habits: '✅ Habits', xp: '⚡ Level',
  focus: '🎯 Focus', wellness: '💧 Wellness', social: '👥 Social', mastery: '🏆 Mastery',
}

export default function AchievementsPage() {
  const { achievements, unlocked, unlockedCount, totalCount, totalXPEarned, isLoading } = useAchievements()
  const [activeCategory, setActiveCategory] = useState<AchievementCategory | 'all'>('all')
  const [showFilter, setShowFilter] = useState<'all' | 'unlocked' | 'locked'>('all')

  const filtered = achievements.filter(a => {
    const catMatch    = activeCategory === 'all' || a.category === activeCategory
    const statusMatch = showFilter === 'all' ? true : showFilter === 'unlocked' ? a.unlocked : !a.unlocked
    return catMatch && statusMatch
  })

  const pct = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0

  return (
    <div className="flex flex-col pb-8 max-w-lg mx-auto">
      <div className="px-4 py-5 relative overflow-hidden" style={{ borderBottom: '1px solid var(--color-border)' }}>
        <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, var(--color-primary) 2px, var(--color-primary) 3px)', backgroundSize: '100% 6px' }} />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <Trophy size={18} style={{ color: 'var(--color-primary)' }} />
            <h1 className="font-display font-black text-base tracking-widest text-glow">ACHIEVEMENTS</h1>
          </div>
          <div className="flex items-center gap-5">
            <div className="relative flex-shrink-0">
              <svg width={80} height={80} viewBox="0 0 80 80">
                <circle cx={40} cy={40} r={32} fill="none" stroke="var(--color-surface-active)" strokeWidth={6} />
                <motion.circle cx={40} cy={40} r={32} fill="none" strokeWidth={6} strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 32}
                  initial={{ strokeDashoffset: 2 * Math.PI * 32 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 32 * (1 - pct / 100) }}
                  transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
                  style={{ stroke: 'var(--color-primary)', rotate: '-90deg', transformOrigin: '40px 40px', filter: 'drop-shadow(0 0 6px var(--color-primary-glow))' }} />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-display font-black text-sm text-glow">{pct}%</span>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xl">🏆</span>
                <div>
                  <p className="font-display font-black text-xl text-glow leading-none">{unlockedCount} <span className="text-sm text-zenith-muted font-normal">/ {totalCount}</span></p>
                  <p className="text-xs text-zenith-faint">Achievements Unlocked</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Zap size={14} style={{ color: 'var(--color-primary)' }} />
                <p className="font-display font-bold text-sm text-glow">{totalXPEarned.toLocaleString()} XP earned</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4">
        <div className="flex gap-1.5 overflow-x-auto pb-2 custom-scroll">
          {(Object.keys(CATEGORY_LABELS) as (AchievementCategory | 'all')[]).map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)}
              className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold font-display tracking-wide transition-all"
              style={{ background: activeCategory === cat ? 'var(--color-surface-active)' : 'var(--color-surface)', border: `1px solid ${activeCategory === cat ? 'var(--color-primary)' : 'var(--color-border)'}`, color: activeCategory === cat ? 'var(--color-primary)' : 'var(--color-text-muted)', boxShadow: activeCategory === cat ? 'var(--glow-sm)' : 'none' }}>
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>
        <div className="flex gap-2 mt-2">
          {(['all', 'unlocked', 'locked'] as const).map(s => (
            <button key={s} onClick={() => setShowFilter(s)}
              className="flex-1 py-1.5 rounded-lg text-xs font-semibold font-display tracking-wider transition-all"
              style={{ background: showFilter === s ? 'var(--color-surface-active)' : 'transparent', border: `1px solid ${showFilter === s ? 'var(--color-border-glow)' : 'var(--color-border)'}`, color: showFilter === s ? 'var(--color-primary)' : 'var(--color-text-faint)' }}>
              {s === 'all' ? 'All' : s === 'unlocked' ? `✅ Unlocked (${unlocked.length})` : `🔒 Locked (${totalCount - unlockedCount})`}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 mt-4">
        {isLoading ? (
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="aspect-square rounded-2xl animate-pulse" style={{ background: 'var(--color-surface)' }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <Lock size={32} style={{ color: 'var(--color-text-faint)' }} />
            <p className="font-display font-bold text-sm text-zenith-muted">No achievements here yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {filtered.map((achievement, i) => (
              <AchievementCard key={achievement.id} achievement={achievement} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
