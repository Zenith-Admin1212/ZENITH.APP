'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useUserStore }   from '@/stores/userStore'
import { useHabitStore }  from '@/stores/habitStore'
import { useUIStore }     from '@/stores/uiStore'
import { useXPEngine }    from '@/features/xp/hooks/useXPEngine'
import {
  fetchHabitsWithLogs,
  toggleHabitCompletion,
  TODAY,
} from '../services/habitService'
import { XP_CONFIG }      from '@/lib/utils/constants'
import type { HabitWithLog } from '@/types'

// ═══════════════════════════════════════════════════════════════
//  useHabits — fetches habits + logs, handles toggle with XP
//
//  FIX (BUG-1): All XP mutations now route through useXPEngine
//  which calls xpEngine.ts addXP/deductXP — those functions
//  always fetch fresh XP from the DB before writing, eliminating
//  the stale-xp race condition from the previous implementation.
//
//  FIX (BUG-6): No more direct xp_transactions inserts here.
//  The xpEngine pipeline handles transaction logging, level-up
//  detection, and achievement checks in one atomic flow.
// ═══════════════════════════════════════════════════════════════

export function useHabits() {
  const { user }                                              = useUserStore()
  const { setHabits, toggleHabitOptimistic, getTodayCompletionCount } = useHabitStore()
  const { openModal }                                         = useUIStore()
  const { grantXP, penaliseXP, recordStreakProgress }         = useXPEngine()
  const queryClient                                           = useQueryClient()

  const today = TODAY()

  // ── Query ──────────────────────────────────────────────────────
  const query = useQuery({
    queryKey: ['habits', user?.id, today],
    queryFn:  () => fetchHabitsWithLogs(user!.id, today),
    enabled:  !!user?.id,
    staleTime: 2 * 60 * 1000, // 2 min — prevent invalidation loop on every toggle
  })

  // Sync fetched habits to Zustand store
  useEffect(() => {
    if (query.data) setHabits(query.data)
  }, [query.data, setHabits])

  // ── Toggle mutation with optimistic update ─────────────────────
  const toggleMutation = useMutation({
    mutationFn: async ({ habitId, completed }: { habitId: string; completed: boolean }) => {
      return toggleHabitCompletion(user!.id, habitId, today, completed)
    },

    onMutate: async ({ habitId, completed }) => {
      await queryClient.cancelQueries({ queryKey: ['habits', user?.id, today] })

      const prev = queryClient.getQueryData<HabitWithLog[]>(['habits', user?.id, today])

      // Optimistic update in query cache
      queryClient.setQueryData<HabitWithLog[]>(
        ['habits', user?.id, today],
        (old) => old?.map(h =>
          h.id === habitId ? { ...h, completed_today: !completed } : h
        ) ?? []
      )

      // Optimistic update in Zustand store
      toggleHabitOptimistic(habitId)

      return { prev }
    },

    onSuccess: async (_result, { habitId, completed }) => {
      const wasCompleting = !completed  // we toggled, so if it WAS completed, we're un-completing

      if (wasCompleting) {
        // ── Completing a habit ────────────────────────────────────
        // grantXP fetches fresh XP from DB — no stale-read race condition
        await grantXP(
          XP_CONFIG.HABIT_COMPLETE,
          'habit_complete',
          'Habit completed',
          habitId
        )

        // On first habit completion of the day, increment streak
        await recordStreakProgress()

        // Check if all habits done (perfect day)
        const { done, total } = getTodayCompletionCount()
        if (total > 0 && done >= total) {
          await grantXP(
            XP_CONFIG.PERFECT_DAY_BONUS,
            'perfect_day',
            'Perfect day — all habits completed'
          )
          setTimeout(() => openModal('perfect-day'), 600)
        }
      } else {
        // ── Un-completing a habit ─────────────────────────────────
        await penaliseXP(
          Math.abs(XP_CONFIG.HABIT_MISS),
          'habit_miss',
          'Habit uncompleted'
        )
      }
    },

    onError: (_err, _vars, context) => {
      // Rollback optimistic update on error
      if (context?.prev) {
        queryClient.setQueryData(['habits', user?.id, today], context.prev)
        setHabits(context.prev)
      }
    },

    onSettled: () => {
      // Use setQueryData instead of invalidateQueries to avoid refetch loop
      // Only invalidate after a brief delay to allow XP writes to settle
      setTimeout(() => {
        queryClient.invalidateQueries({
          queryKey: ['habits', user?.id, today],
          refetchType: 'none',  // don't immediately refetch — staleTime handles it
        })
      }, 1000)
    },
  })

  return {
    habits:     query.data ?? [],
    isLoading:  query.isLoading,
    isError:    query.isError,
    toggle: (habitId: string, currentlyCompleted: boolean) =>
      toggleMutation.mutate({ habitId, completed: currentlyCompleted }),
    isToggling: toggleMutation.isPending,
    refetch:    query.refetch,
  }
}
