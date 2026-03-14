'use client'

import { useQuery } from '@tanstack/react-query'
import { useUserStore } from '@/stores/userStore'
import { fetchHabitsWithLogs, fetchHabitLogsForRange } from '@/features/habits/services/habitService'
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns'
import type { HabitWithLog } from '@/types'

// ═══════════════════════════════════════════════════════════════
//  useCalendarData — fetches all habit logs for a given month
//  Returns a map: date → { completedCount, totalCount, pct }
// ═══════════════════════════════════════════════════════════════

export interface DaySummary {
  date: string
  completedCount: number
  totalCount: number
  pct: number                    // 0–100
  isToday: boolean
  isFuture: boolean
}

export function useCalendarData(year: number, month: number) {
  const { user } = useUserStore()
  const today = format(new Date(), 'yyyy-MM-dd')

  const monthStart = format(startOfMonth(new Date(year, month - 1)), 'yyyy-MM-dd')
  const monthEnd   = format(endOfMonth(new Date(year, month - 1)),   'yyyy-MM-dd')

  // Fetch all active habits (we just need their IDs and count)
  const habitsQuery = useQuery({
    queryKey: ['habits-list', user?.id],
    queryFn: () => fetchHabitsWithLogs(user!.id, today),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  })

  // Fetch all logs for the month
  const logsQuery = useQuery({
    queryKey: ['habit-logs-range', user?.id, monthStart, monthEnd],
    queryFn: () => fetchHabitLogsForRange(user!.id, monthStart, monthEnd),
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000,
  })

  const habits = habitsQuery.data ?? []
  const logs   = logsQuery.data  ?? []
  const totalHabits = habits.length

  // Build day-by-day summary map
  const days = eachDayOfInterval({
    start: startOfMonth(new Date(year, month - 1)),
    end:   endOfMonth(new Date(year, month - 1)),
  })

  const summaryMap: Record<string, DaySummary> = {}

  days.forEach(day => {
    const dateStr  = format(day, 'yyyy-MM-dd')
    const isFuture = dateStr > today
    const isToday  = dateStr === today

    const dayLogs       = logs.filter(l => l.date === dateStr && l.completed)
    const completedCount = dayLogs.length
    const pct = totalHabits > 0 && !isFuture
      ? Math.round((completedCount / totalHabits) * 100)
      : 0

    summaryMap[dateStr] = {
      date: dateStr,
      completedCount,
      totalCount: totalHabits,
      pct,
      isToday,
      isFuture,
    }
  })

  return {
    summaryMap,
    habits,
    isLoading: habitsQuery.isLoading || logsQuery.isLoading,
    isError:   habitsQuery.isError   || logsQuery.isError,
    totalHabits,
  }
}
