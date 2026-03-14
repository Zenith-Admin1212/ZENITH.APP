import { create } from 'zustand'
import type { Habit, HabitWithLog, HabitCategory } from '@/types'

interface HabitState {
  habits: HabitWithLog[]
  categories: HabitCategory[]
  todayDate: string
  isLoading: boolean
  
  setHabits: (habits: HabitWithLog[]) => void
  setCategories: (categories: HabitCategory[]) => void
  setTodayDate: (date: string) => void
  setLoading: (loading: boolean) => void
  
  // Optimistic toggle — update UI instantly before DB confirms
  toggleHabitOptimistic: (habitId: string) => void
  
  // Add / remove habit
  addHabit: (habit: HabitWithLog) => void
  removeHabit: (habitId: string) => void
  updateHabit: (habitId: string, updates: Partial<Habit>) => void
  updateHabitInStore: (habitId: string, updates: Partial<HabitWithLog>) => void
  
  // Computed
  getTodayCompletionCount: () => { done: number; total: number }
  getTodayCompletionPct: () => number
  getHabitsByCategory: () => Record<string, HabitWithLog[]>
}

export const useHabitStore = create<HabitState>((set, get) => ({
  habits: [],
  categories: [],
  todayDate: new Date().toISOString().split('T')[0],
  isLoading: false,

  setHabits: (habits) => set({ habits }),
  setCategories: (categories) => set({ categories }),
  setTodayDate: (todayDate) => set({ todayDate }),
  setLoading: (isLoading) => set({ isLoading }),

  toggleHabitOptimistic: (habitId) =>
    set((state) => ({
      habits: state.habits.map((h) =>
        h.id === habitId
          ? { ...h, completed_today: !h.completed_today }
          : h
      ),
    })),

  addHabit: (habit) =>
    set((state) => ({ habits: [...state.habits, habit] })),

  removeHabit: (habitId) =>
    set((state) => ({
      habits: state.habits.filter((h) => h.id !== habitId),
    })),

  updateHabit: (habitId, updates) =>
    set((state) => ({
      habits: state.habits.map((h) =>
        h.id === habitId ? { ...h, ...updates } : h
      ),
    })),

  updateHabitInStore: (habitId, updates) =>
    set((state) => ({
      habits: state.habits.map((h) =>
        h.id === habitId ? { ...h, ...updates } : h
      ),
    })),

  getTodayCompletionCount: () => {
    const { habits } = get()
    const active = habits.filter((h) => h.active)
    return {
      done: active.filter((h) => h.completed_today).length,
      total: active.length,
    }
  },

  getTodayCompletionPct: () => {
    const { done, total } = get().getTodayCompletionCount()
    if (total === 0) return 0
    return Math.round((done / total) * 100)
  },

  getHabitsByCategory: () => {
    const { habits } = get()
    return habits
      .filter((h) => h.active)
      .reduce<Record<string, HabitWithLog[]>>((acc, habit) => {
        const cat = habit.category || 'custom'
        if (!acc[cat]) acc[cat] = []
        acc[cat].push(habit)
        return acc
      }, {})
  },
}))
