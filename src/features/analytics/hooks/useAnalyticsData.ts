'use client'

import { useQuery }     from '@tanstack/react-query'
import { useUserStore } from '@/stores/userStore'
import { useStreakStore } from '@/stores/streakStore'
import { fetchAnalyticsData } from '../services/analyticsService'
import { calculateDisciplineScore } from '../utils/disciplineScore'

// ═══════════════════════════════════════════════════════════════
//  useAnalyticsData
//
//  Single cache key for all analytics page data.
//  Stale time: 5 min — analytics don't need real-time updates.
//  All components read from this one hook.
// ═══════════════════════════════════════════════════════════════

export function useAnalyticsData() {
  const { user }  = useUserStore()
  const { streak } = useStreakStore()

  const query = useQuery({
    queryKey:  ['analytics', user?.id],
    queryFn:   () => fetchAnalyticsData(user!.id),
    enabled:   !!user?.id,
    staleTime: 5 * 60 * 1000,
    gcTime:    10 * 60 * 1000,
  })

  const summary = query.data

  // Compute discipline score from real analytics data
  const disciplineResult = summary
    ? calculateDisciplineScore({
        habitCompletionRate30d:   summary.habitCompletionRate30d,
        pomodoroSessionsThisWeek: Math.round(summary.totalPomodoroSessions / 4),
        checkInStreak:            summary.checkInStreak,
        waterGoalDaysThisWeek:    summary.days
          .slice(-7)
          .filter(d => d.waterMl >= 2000).length,
        sleepAvgScore:  summary.avgSleepScore,
        focusAvgScore:  summary.avgFocusScore,
        currentStreak:  streak,
      })
    : null

  return {
    summary,
    disciplineResult,
    days:      summary?.days ?? [],
    isLoading: query.isLoading,
    isError:   query.isError,
    refetch:   query.refetch,
  }
}
