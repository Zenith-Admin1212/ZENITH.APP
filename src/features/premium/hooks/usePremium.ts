'use client'

import { useCallback }  from 'react'
import { useQuery }     from '@tanstack/react-query'
import { useUserStore } from '@/stores/userStore'
import {
  deriveIsPremium,
  isFeatureLocked,
  fetchPremiumStatus,
  type PremiumFeature,
} from '../services/premiumService'

// ═══════════════════════════════════════════════════════════════
//  usePremium
//
//  THE single source of truth for premium state across the app.
//  All components must use this hook — never read user.is_premium
//  or user.plan directly for gating decisions.
//
//  Returns:
//    isPremium      — boolean, refreshed from DB on mount
//    isLocked(f)    — whether a specific feature is locked
//    refreshStatus  — refetch DB to sync after admin grant
// ═══════════════════════════════════════════════════════════════

export function usePremium() {
  const { user, updateUser } = useUserStore()

  // Optimistic state from store (instant, no flicker)
  const optimisticIsPremium = deriveIsPremium(user)

  // Background DB verification — stale 5 min
  // Ensures admin grants propagate without requiring a page reload
  const statusQuery = useQuery({
    queryKey:  ['premium-status', user?.id],
    queryFn:   async () => {
      const status = await fetchPremiumStatus(user!.id)
      // Sync store if DB differs
      if (
        status.is_premium !== user?.is_premium ||
        status.plan       !== user?.plan
      ) {
        updateUser({
          is_premium:     status.is_premium,
          plan:           status.plan as 'free' | 'premium',
          premium_expiry: status.premium_expiry,
        })
      }
      return status
    },
    enabled:   !!user?.id,
    staleTime: 5 * 60 * 1000,
    gcTime:    10 * 60 * 1000,
  })

  // Authoritative: DB value wins if available, fallback to store
  const isPremium = statusQuery.data
    ? (statusQuery.data.is_premium || statusQuery.data.plan === 'premium')
    : optimisticIsPremium

  const isLocked = useCallback(
    (feature: PremiumFeature) => isFeatureLocked(feature, isPremium),
    [isPremium]
  )

  const refreshStatus = useCallback(() => {
    statusQuery.refetch()
  }, [statusQuery])

  return {
    isPremium,
    isLocked,
    refreshStatus,
    isLoading: statusQuery.isLoading,
    plan: user?.plan ?? 'free',
  }
}
