'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useUserStore }  from '@/stores/userStore'
import { useXPEngine }   from '@/features/xp/hooks/useXPEngine'
import {
  fetchChallenges,
  fetchUserChallenges,
  joinChallenge,
  leaveChallenge,
  grantChallengeReward,
  fetchActiveChallengeDetail,
  type ActiveChallengeDetail,
} from '../services/challengeService'
import type { Challenge, ChallengeParticipant } from '@/types'

// ═══════════════════════════════════════════════════════════════
//  useChallenges
//  Catalog query + enrolled query + join/leave mutations.
//  Completion XP routes through useXPEngine for store sync.
// ═══════════════════════════════════════════════════════════════

const CATALOG_KEY  = ['challenges-catalog']
const ENROLLED_KEY = (uid: string) => ['challenges-enrolled', uid]
const DETAIL_KEY   = (uid: string, cid: string) => ['challenge-detail', uid, cid]

export function useChallenges() {
  const { user }   = useUserStore()
  const { grantXP } = useXPEngine()
  const qc         = useQueryClient()

  // ── All available challenges ──────────────────────────────
  const catalogQuery = useQuery({
    queryKey:  CATALOG_KEY,
    queryFn:   fetchChallenges,
    staleTime: 15 * 60 * 1000,   // challenges change rarely
  })

  // ── User's enrolled challenges ────────────────────────────
  const enrolledQuery = useQuery({
    queryKey:  ENROLLED_KEY(user?.id ?? ''),
    queryFn:   () => fetchUserChallenges(user!.id),
    enabled:   !!user?.id,
    staleTime: 2 * 60 * 1000,
  })

  const enrolled    = enrolledQuery.data ?? []
  const enrolledIds = new Set(enrolled.filter(e => e.status === 'active').map(e => e.challenge_id))

  // ── Join mutation ─────────────────────────────────────────
  const joinMutation = useMutation({
    mutationFn: (challengeId: string) => joinChallenge(user!.id, challengeId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ENROLLED_KEY(user!.id) })
      // Small engagement XP for joining
      grantXP(10, 'challenge_complete', 'Joined a challenge')
    },
  })

  // ── Leave mutation ────────────────────────────────────────
  const leaveMutation = useMutation({
    mutationFn: (challengeId: string) => leaveChallenge(user!.id, challengeId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ENROLLED_KEY(user!.id) })
    },
  })

  // ── Complete challenge + grant XP ─────────────────────────
  const completeMutation = useMutation({
    mutationFn: async ({
      challengeId,
      xpReward,
      badgeName,
    }: { challengeId: string; xpReward: number; badgeName: string | null }) => {
      await grantChallengeReward(user!.id, challengeId, xpReward, badgeName)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ENROLLED_KEY(user!.id) })
    },
  })

  return {
    catalog:     catalogQuery.data ?? [],
    enrolled,
    enrolledIds,
    isLoading:   catalogQuery.isLoading,
    isEnrolling: joinMutation.isPending,
    join:        joinMutation.mutate,
    leave:       leaveMutation.mutate,
    complete:    completeMutation.mutate,
    refetch: () => {
      catalogQuery.refetch()
      enrolledQuery.refetch()
    },
  }
}

// ── Separate hook for a single challenge's detail view ───────
export function useChallengeDetail(challenge: Challenge | null) {
  const { user }   = useUserStore()
  const qc         = useQueryClient()

  const enrolledQuery = useQuery({
    queryKey:  ENROLLED_KEY(user?.id ?? ''),
    queryFn:   () => fetchUserChallenges(user!.id),
    enabled:   !!user?.id,
    staleTime: 2 * 60 * 1000,
  })

  const selfParticipant = enrolledQuery.data?.find(
    e => e.challenge_id === challenge?.id && e.status === 'active'
  ) ?? null

  const detailQuery = useQuery({
    queryKey:  DETAIL_KEY(user?.id ?? '', challenge?.id ?? ''),
    queryFn:   () => fetchActiveChallengeDetail(user!.id, challenge!, selfParticipant!),
    enabled:   !!user?.id && !!challenge && !!selfParticipant,
    staleTime: 60 * 1000,
  })

  return {
    detail:     detailQuery.data ?? null,
    isLoading:  detailQuery.isLoading,
    selfParticipant,
  }
}
