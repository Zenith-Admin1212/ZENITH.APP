import { create } from 'zustand'
import type { LevelName, LevelInfo } from '@/types'

// ── Level thresholds ─────────────────────────────────────────
export const LEVELS: LevelInfo[] = [
  { name: 'Bronze',  minXP: 0,    maxXP: 499,  badge: '🥉', color: '#cd7f32' },
  { name: 'Silver',  minXP: 500,  maxXP: 1199, badge: '🥈', color: '#c0c0c0' },
  { name: 'Gold',    minXP: 1200, maxXP: 2499, badge: '🥇', color: '#ffd700' },
  { name: 'Diamond', minXP: 2500, maxXP: 3999, badge: '💎', color: '#b9f2ff' },
  { name: 'King',    minXP: 4000, maxXP: Infinity, badge: '👑', color: '#f59e0b' },
]

export function getLevelFromXP(xp: number): LevelInfo {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].minXP) return LEVELS[i]
  }
  return LEVELS[0]
}

export function getXPProgress(xp: number): {
  current: LevelInfo
  next: LevelInfo | null
  progressXP: number
  neededXP: number
  progressPct: number
} {
  const current = getLevelFromXP(xp)
  const currentIdx = LEVELS.findIndex((l) => l.name === current.name)
  const next = LEVELS[currentIdx + 1] || null

  if (!next) {
    return { current, next: null, progressXP: xp - current.minXP, neededXP: 0, progressPct: 100 }
  }

  const progressXP = xp - current.minXP
  const neededXP = next.minXP - current.minXP
  const progressPct = Math.min(Math.round((progressXP / neededXP) * 100), 100)

  return { current, next, progressXP, neededXP, progressPct }
}

interface XPState {
  xp: number
  weeklyXP: number
  monthlyXP: number
  levelName: LevelName
  recentGain: number | null

  setXP: (xp: number) => void
  setWeeklyXP: (xp: number) => void
  setMonthlyXP: (xp: number) => void
  setLevelName: (name: LevelName) => void
  addXP: (amount: number) => void
  setRecentGain: (amount: number | null) => void
  
  // Computed
  getLevelInfo: () => LevelInfo
  getProgress: () => ReturnType<typeof getXPProgress>
}

export const useXPStore = create<XPState>((set, get) => ({
  xp: 0,
  weeklyXP: 0,
  monthlyXP: 0,
  levelName: 'Bronze',
  recentGain: null,

  setXP: (xp) => {
    const level = getLevelFromXP(xp)
    set({ xp, levelName: level.name as LevelName })
  },
  
  setWeeklyXP: (weeklyXP) => set({ weeklyXP }),
  setMonthlyXP: (monthlyXP) => set({ monthlyXP }),
  setLevelName: (levelName) => set({ levelName }),
  
  addXP: (amount) => {
    set((state) => {
      const newXP = state.xp + amount
      const level = getLevelFromXP(newXP)
      return {
        xp: newXP,
        weeklyXP: state.weeklyXP + amount,
        monthlyXP: state.monthlyXP + amount,
        levelName: level.name as LevelName,
        recentGain: amount,
      }
    })
    // Auto-clear the gain display after animation
    setTimeout(() => set({ recentGain: null }), 2000)
  },

  setRecentGain: (recentGain) => set({ recentGain }),

  getLevelInfo: () => getLevelFromXP(get().xp),
  getProgress: () => getXPProgress(get().xp),
}))
