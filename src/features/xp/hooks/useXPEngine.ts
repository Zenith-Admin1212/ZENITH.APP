'use client'

import { useCallback } from 'react'
import { ACHIEVEMENT_MAP } from '../constants/achievements'
import { useUserStore }  from '@/stores/userStore'
import { useXPStore }    from '@/stores/xpStore'
import { useStreakStore } from '@/stores/streakStore'
import { useUIStore }    from '@/stores/uiStore'
import { addXP, deductXP, checkLevelUp, calculateLevel } from '../services/xpEngine'
import { incrementStreakForToday, getStreakWarning } from '../services/streakEngine'
import type { XPTransactionType, XPResult } from '../services/xpEngine'

// ═══════════════════════════════════════════════════════════════
//  useXPEngine — React hook that wraps the XP + streak services
//
//  Components NEVER call xpEngine.ts directly.
//  They call these hook functions instead.
//  The hook handles all Zustand store updates after DB ops.
// ═══════════════════════════════════════════════════════════════

export function useXPEngine() {
  const { user }                                                   = useUserStore()
  const { xp, setXP, levelName, setLevelName }                     = useXPStore()
  const { streak, setStreak, setLongestStreak }                    = useStreakStore()
  const { showXPGain, openModal }                                   = useUIStore()

  // ── Grant XP (calls DB, updates stores, triggers modals) ─────
  const grantXP = useCallback(async (
    amount:      number,
    type:        XPTransactionType,
    description: string,
    habitId?:    string
  ): Promise<XPResult | null> => {
    if (!user?.id) return null
    try {
      const result = await addXP(user.id, amount, type, description, habitId)

      // 1. Update XP store
      setXP(result.newXP)

      // 2. Show float
      showXPGain(amount)

      // 3. Level-up modal
      if (result.leveledUp && result.newLevel) {
        const levelData = calculateLevel(result.newXP)
        setLevelName(result.newLevel)
        setTimeout(() => {
          openModal('level-up', { level: result.newLevel, badge: levelData.badge })
        }, 800)
      }

      // 4. Achievement toasts — queue them with delay
      if (result.achievements.length > 0) {
        result.achievements.forEach((achievementId, i) => {
          const achievement = ACHIEVEMENT_MAP.get(achievementId)
          if (achievement) {
            setTimeout(() => {
              openModal('achievement', {
                icon:      achievement.icon,
                name:      achievement.title,
                xp_reward: achievement.xp_reward,
              })
            }, (i + 1) * 1800)
          }
        })
      }

      return result
    } catch (err) {
      console.error('[useXPEngine] grantXP failed:', err)
      return null
    }
  }, [user?.id, setXP, showXPGain, setLevelName, openModal])

  // ── Deduct XP ─────────────────────────────────────────────────
  const penaliseXP = useCallback(async (
    amount:      number,
    type:        XPTransactionType,
    description: string
  ): Promise<XPResult | null> => {
    if (!user?.id) return null
    try {
      const result = await deductXP(user.id, amount, type, description)
      setXP(result.newXP)

      // Update level name if it dropped (rare but possible)
      const newLevel = calculateLevel(result.newXP)
      setLevelName(newLevel.name)

      return result
    } catch (err) {
      console.error('[useXPEngine] penaliseXP failed:', err)
      return null
    }
  }, [user?.id, setXP, setLevelName])

  // ── Increment streak after first habit completion today ───────
  const recordStreakProgress = useCallback(async () => {
    if (!user?.id) return
    try {
      await incrementStreakForToday(user.id)
      setStreak(streak + 1)
    } catch (err) {
      console.error('[useXPEngine] recordStreakProgress failed:', err)
    }
  }, [user?.id, streak, setStreak])

  // ── Streak warning display data ───────────────────────────────
  const streakWarning = getStreakWarning(
    (user as { consecutive_miss_days?: number } | null)?.consecutive_miss_days ?? 0
  )

  return {
    grantXP,
    penaliseXP,
    recordStreakProgress,
    streakWarning,
  }
}
