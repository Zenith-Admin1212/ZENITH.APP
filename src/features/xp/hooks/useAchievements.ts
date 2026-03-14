'use client'

import { useQuery }        from '@tanstack/react-query'
import { supabase }         from '@/lib/supabase/client'
import { useUserStore }     from '@/stores/userStore'
import { ACHIEVEMENTS, type Achievement } from '../constants/achievements'

// ═══════════════════════════════════════════════════════════════
//  useAchievements — fetch + merge unlocked/locked status
// ═══════════════════════════════════════════════════════════════

export interface AchievementWithStatus extends Achievement {
  unlocked:    boolean
  unlocked_at: string | null
}

export function useAchievements() {
  const { user } = useUserStore()

  const query = useQuery({
    queryKey: ['achievements', user?.id],
    queryFn: async (): Promise<AchievementWithStatus[]> => {
      const { data, error } = await supabase
        .from('user_achievements')
        .select('achievement_id, unlocked_at')
        .eq('user_id', user!.id)

      if (error) throw error

      const unlockedMap = new Map<string, string>(
        (data ?? []).map((r: { achievement_id: string; unlocked_at: string }) =>
          [r.achievement_id, r.unlocked_at] as [string, string]
        )
      )

      return ACHIEVEMENTS.map((achievement): AchievementWithStatus => ({
        ...achievement,
        unlocked:    unlockedMap.has(achievement.id),
        unlocked_at: unlockedMap.get(achievement.id) ?? null,
      }))
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  })

  const achievements  = query.data ?? []
  const unlocked      = achievements.filter((a: AchievementWithStatus) => a.unlocked)
  const locked        = achievements.filter((a: AchievementWithStatus) => !a.unlocked)
  const totalXPEarned = unlocked.reduce((s: number, a: AchievementWithStatus) => s + a.xp_reward, 0)

  // Group by category
  const byCategory = achievements.reduce(
    (acc: Record<string, AchievementWithStatus[]>, a: AchievementWithStatus) => {
      acc[a.category] = [...(acc[a.category] ?? []), a]
      return acc
    },
    {} as Record<string, AchievementWithStatus[]>
  )

  return {
    achievements,
    unlocked,
    locked,
    byCategory,
    totalXPEarned,
    unlockedCount: unlocked.length,
    totalCount:    achievements.length,
    isLoading: query.isLoading,
    isError:   query.isError,
    refetch:   query.refetch,
  }
}
