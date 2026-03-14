'use client'

import { useEffect, useCallback }         from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase }         from '@/lib/supabase/client'
import { useUserStore }     from '@/stores/userStore'
import {
  fetchFeed, createPost, toggleReaction,
  addComment, castPollVote, deletePost,
  type FeedPost,
} from '../services/communityService'
import type { PostType, PostReaction } from '@/types'

// ═══════════════════════════════════════════════════════════════
//  useCommunityFeed
//
//  Feed data + mutations + Supabase Realtime subscription.
//  Realtime: when any insert/update arrives on community_posts,
//  post_reactions, or post_comments → refetch the feed.
//
//  Optimistic updates: reactions and votes update the cache
//  immediately without waiting for the DB round-trip.
// ═══════════════════════════════════════════════════════════════

export const FEED_KEY = (userId: string) => ['community-feed', userId]

export function useCommunityFeed() {
  const { user }   = useUserStore()
  const qc         = useQueryClient()

  const invalidate = useCallback(() => {
    if (user?.id) qc.invalidateQueries({ queryKey: FEED_KEY(user.id) })
  }, [user?.id, qc])

  // ── Primary feed query ────────────────────────────────────────
  const feedQuery = useQuery({
    queryKey:  FEED_KEY(user?.id ?? ''),
    queryFn:   () => fetchFeed(user!.id),
    enabled:   !!user?.id,
    staleTime: 60 * 1000,   // 1 min — Realtime handles live updates
  })

  // ── Supabase Realtime subscription ────────────────────────────
  useEffect(() => {
    if (!user?.id) return

    const channel = supabase
      .channel('community-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'community_posts' },
        () => invalidate()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'post_reactions' },
        () => invalidate()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'post_comments' },
        () => invalidate()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'poll_votes' },
        () => invalidate()
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user?.id, invalidate])

  // ── Create post mutation ──────────────────────────────────────
  const createPostMutation = useMutation({
    mutationFn: ({ body, type, options }: { body: string; type: PostType; options?: string[] }) =>
      createPost(user!.id, body, type, options ?? []),
    onSuccess: invalidate,
  })

  // ── Reaction mutation (optimistic) ───────────────────────────
  const reactMutation = useMutation({
    mutationFn: ({ postId, type }: { postId: string; type: PostReaction['type'] }) =>
      toggleReaction(user!.id, postId, type),

    onMutate: async ({ postId, type }) => {
      const key = FEED_KEY(user!.id)
      await qc.cancelQueries({ queryKey: key })
      const prev = qc.getQueryData<FeedPost[]>(key)

      qc.setQueryData<FeedPost[]>(key, old => (old ?? []).map(post => {
        if (post.id !== postId) return post
        const counts = { ...post.reaction_counts }
        const prev_r = post.user_reaction

        if (prev_r === type) {
          // Remove reaction
          counts[type] = Math.max(0, (counts[type] ?? 1) - 1)
          return { ...post, reaction_counts: counts, user_reaction: null }
        }
        if (prev_r) {
          // Switch reaction
          counts[prev_r] = Math.max(0, (counts[prev_r] ?? 1) - 1)
        }
        counts[type] = (counts[type] ?? 0) + 1
        return { ...post, reaction_counts: counts, user_reaction: type }
      }))

      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(FEED_KEY(user!.id), ctx.prev)
    },
  })

  // ── Comment mutation ──────────────────────────────────────────
  const commentMutation = useMutation({
    mutationFn: ({ postId, text }: { postId: string; text: string }) =>
      addComment(user!.id, postId, text),
    onSuccess: invalidate,
  })

  // ── Poll vote mutation (optimistic) ──────────────────────────
  const voteMutation = useMutation({
    mutationFn: ({ postId, optionIdx }: { postId: string; optionIdx: number }) =>
      castPollVote(user!.id, postId, optionIdx),

    onMutate: async ({ postId, optionIdx }) => {
      const key = FEED_KEY(user!.id)
      await qc.cancelQueries({ queryKey: key })
      const prev = qc.getQueryData<FeedPost[]>(key)

      qc.setQueryData<FeedPost[]>(key, old => (old ?? []).map(post => {
        if (post.id !== postId) return post
        const counts      = [...post.vote_counts]
        const prevVoteIdx = post.user_vote_idx

        if (prevVoteIdx !== null) counts[prevVoteIdx] = Math.max(0, counts[prevVoteIdx] - 1)
        counts[optionIdx] = (counts[optionIdx] ?? 0) + 1
        return { ...post, vote_counts: counts, user_vote_idx: optionIdx }
      }))

      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(FEED_KEY(user!.id), ctx.prev)
    },
  })

  // ── Delete post mutation ──────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: (postId: string) => deletePost(user!.id, postId),
    onSuccess:  invalidate,
  })

  return {
    posts:      feedQuery.data ?? [],
    isLoading:  feedQuery.isLoading,
    isError:    feedQuery.isError,
    refetch:    feedQuery.refetch,
    createPost: createPostMutation.mutate,
    react:      reactMutation.mutate,
    comment:    commentMutation.mutate,
    vote:       voteMutation.mutate,
    deletePost: deleteMutation.mutate,
    isPosting:  createPostMutation.isPending,
    isDeleting: deleteMutation.isPending,
  }
}
