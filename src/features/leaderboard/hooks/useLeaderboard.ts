'use client'

import { useState }    from 'react'
import { useQuery }    from '@tanstack/react-query'
import { useUserStore } from '@/stores/userStore'
import {
  fetchWeeklyLeaderboard,
  fetchMonthlyLeaderboard,
  fetchAlltimeLeaderboard,
  fetchUserRank,
} from '../services/leaderboardService'
import type { LeaderboardPeriod } from '@/types'

// ═══════════════════════════════════════════════════════════════
//  useLeaderboard
//  Separate cache keys per period so switching tabs is instant
//  after the first fetch.
// ═══════════════════════════════════════════════════════════════

export function useLeaderboard() {
  const { user }  = useUserStore()
  const [period, setPeriod] = useState<LeaderboardPeriod>('weekly')

  const weekly = useQuery({
    queryKey:  ['leaderboard', 'weekly'],
    queryFn:   fetchWeeklyLeaderboard,
    staleTime: 3 * 60 * 1000,   // 3 min — rankings shift slowly
    gcTime:    10 * 60 * 1000,
  })

  const monthly = useQuery({
    queryKey:  ['leaderboard', 'monthly'],
    queryFn:   fetchMonthlyLeaderboard,
    staleTime: 5 * 60 * 1000,
    gcTime:    15 * 60 * 1000,
    enabled:   period === 'monthly',  // only load when tab opened
  })

  const alltime = useQuery({
    queryKey:  ['leaderboard', 'alltime'],
    queryFn:   fetchAlltimeLeaderboard,
    staleTime: 10 * 60 * 1000,
    gcTime:    20 * 60 * 1000,
    enabled:   period === 'alltime',
  })

  const boards = {
    weekly:  weekly.data  ?? [],
    monthly: monthly.data ?? [],
    alltime: alltime.data ?? [],
  }

  const activeBoard = boards[period]

  const userRankQuery = useQuery({
    queryKey: ['leaderboard-rank', user?.id, period, activeBoard.length],
    queryFn:  () => fetchUserRank(user!.id, period, activeBoard),
    enabled:  !!user?.id && activeBoard.length > 0,
    staleTime: 3 * 60 * 1000,
  })

  const isLoading =
    (period === 'weekly'  && weekly.isLoading)  ||
    (period === 'monthly' && monthly.isLoading) ||
    (period === 'alltime' && alltime.isLoading)

  return {
    period,
    setPeriod,
    board:     activeBoard,
    userRank:  userRankQuery.data ?? null,
    isLoading,
    refetch: () => {
      weekly.refetch()
      if (period === 'monthly') monthly.refetch()
      if (period === 'alltime') alltime.refetch()
    },
  }
}
