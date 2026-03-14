import { create } from 'zustand'

export const STREAK_MILESTONES = [3, 7, 14, 21, 30, 60, 90, 180, 365]

export function getNextMilestone(streak: number): number | null {
  return STREAK_MILESTONES.find((m) => m > streak) ?? null
}

interface StreakState {
  streak: number
  longestStreak: number
  lastCheckinDate: string | null
  monthlyShieldsRemaining: number
  lastShieldReset: string | null

  setStreak: (streak: number) => void
  setLongestStreak: (streak: number) => void
  setLastCheckinDate: (date: string | null) => void
  setShields: (count: number) => void
  useShield: () => void
  
  // Computed
  getNextMilestone: () => number | null
  getMilestoneProgress: () => number
}

export const useStreakStore = create<StreakState>((set, get) => ({
  streak: 0,
  longestStreak: 0,
  lastCheckinDate: null,
  monthlyShieldsRemaining: 3,
  lastShieldReset: null,

  setStreak: (streak) =>
    set((state) => ({
      streak,
      longestStreak: Math.max(state.longestStreak, streak),
    })),

  setLongestStreak: (longestStreak) => set({ longestStreak }),
  setLastCheckinDate: (lastCheckinDate) => set({ lastCheckinDate }),
  setShields: (monthlyShieldsRemaining) => set({ monthlyShieldsRemaining }),

  useShield: () =>
    set((state) => ({
      monthlyShieldsRemaining: Math.max(0, state.monthlyShieldsRemaining - 1),
    })),

  getNextMilestone: () => getNextMilestone(get().streak),

  getMilestoneProgress: () => {
    const { streak } = get()
    const next = getNextMilestone(streak)
    if (!next) return 100

    const prev = STREAK_MILESTONES
      .slice()
      .reverse()
      .find((m) => m <= streak) ?? 0

    const range = next - prev
    const progress = streak - prev
    return Math.round((progress / range) * 100)
  },
}))
