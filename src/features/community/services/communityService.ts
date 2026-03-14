import { supabase } from '@/lib/supabase/client'
import type { CommunityPost, PostReaction, PostComment, PollVote, PostType } from '@/types'

// ═══════════════════════════════════════════════════════════════
//  Community Service
//  Posts, reactions, comments, poll votes.
//  All writes include user_id. All reads are public feed.
// ═══════════════════════════════════════════════════════════════

export interface FeedPost extends CommunityPost {
  author_username:  string | null
  author_avatar:    string | null
  reaction_counts:  Record<string, number>
  user_reaction:    string | null     // the current user's reaction type, if any
  comment_count:    number
  vote_counts:      number[]          // index matches options[]
  user_vote_idx:    number | null
}

// ── Fetch paginated feed ──────────────────────────────────────
export async function fetchFeed(
  userId: string,
  page   = 0,
  limit  = 20
): Promise<FeedPost[]> {
  const { data: posts, error } = await supabase
    .from('community_posts')
    .select(`
      *,
      users!community_posts_user_id_fkey (
        username,
        avatar
      ),
      post_reactions ( user_id, type ),
      post_comments  ( id, deleted ),
      poll_votes     ( user_id, option_idx )
    `)
    .eq('deleted', false)
    .order('pinned', { ascending: false })
    .order('created_at', { ascending: false })
    .range(page * limit, page * limit + limit - 1)

  if (error) throw error

  return (posts ?? []).map(p => {
    // Reaction aggregation
    const reactionCounts: Record<string, number> = {}
    let userReaction: string | null = null
    for (const r of p.post_reactions ?? []) {
      reactionCounts[r.type] = (reactionCounts[r.type] ?? 0) + 1
      if (r.user_id === userId) userReaction = r.type
    }

    // Comment count (non-deleted)
    const commentCount = (p.post_comments ?? []).filter((c: { deleted: boolean }) => !c.deleted).length

    // Poll vote counts per option
    const optionCount = p.options?.length ?? 0
    const voteCounts  = Array.from({ length: optionCount }, (_, i) =>
      (p.poll_votes ?? []).filter((v: { option_idx: number }) => v.option_idx === i).length
    )
    const userVoteIdx = (p.poll_votes ?? []).find((v: { user_id: string }) => v.user_id === userId)?.option_idx ?? null

    return {
      ...p,
      author_username: p.users?.username ?? null,
      author_avatar:   p.users?.avatar   ?? '👤',
      reaction_counts: reactionCounts,
      user_reaction:   userReaction,
      comment_count:   commentCount,
      vote_counts:     voteCounts,
      user_vote_idx:   userVoteIdx,
    } as FeedPost
  })
}

// ── Create post ───────────────────────────────────────────────
export async function createPost(
  userId:  string,
  body:    string,
  type:    PostType   = 'post',
  options: string[]   = []
): Promise<CommunityPost> {
  const { data, error } = await supabase
    .from('community_posts')
    .insert({
      user_id:    userId,
      body:       body.trim(),
      type,
      options:    type === 'poll' ? options : null,
      pinned:     false,
      deleted:    false,
    })
    .select()
    .single()

  if (error) throw error
  return data as CommunityPost
}

// ── Toggle reaction ───────────────────────────────────────────
// Returns 'added' | 'changed' | 'removed'
export async function toggleReaction(
  userId:   string,
  postId:   string,
  type:     PostReaction['type']
): Promise<'added' | 'changed' | 'removed'> {
  // Check existing
  const { data: existing } = await supabase
    .from('post_reactions')
    .select('id, type')
    .eq('user_id', userId)
    .eq('post_id', postId)
    .maybeSingle()

  if (!existing) {
    await supabase.from('post_reactions').insert({ user_id: userId, post_id: postId, type })
    return 'added'
  }

  if (existing.type === type) {
    await supabase.from('post_reactions').delete().eq('id', existing.id)
    return 'removed'
  }

  await supabase.from('post_reactions').update({ type }).eq('id', existing.id)
  return 'changed'
}

// ── Fetch comments for a post ─────────────────────────────────
export async function fetchComments(postId: string): Promise<PostComment[]> {
  const { data, error } = await supabase
    .from('post_comments')
    .select(`
      id, post_id, user_id, text, reported, report_count, deleted, created_at,
      users!post_comments_user_id_fkey ( username )
    `)
    .eq('post_id', postId)
    .eq('deleted', false)
    .order('created_at', { ascending: true })
    .limit(50)

  if (error) throw error

  return (data ?? []).map(c => ({
    ...c,
    user_name: c.users?.username ?? null,
  })) as PostComment[]
}

// ── Add comment ───────────────────────────────────────────────
export async function addComment(
  userId:  string,
  postId:  string,
  text:    string
): Promise<PostComment> {
  const { data, error } = await supabase
    .from('post_comments')
    .insert({
      user_id:  userId,
      post_id:  postId,
      text:     text.trim(),
      deleted:  false,
      reported: false,
      report_count: 0,
    })
    .select()
    .single()

  if (error) throw error
  return data as PostComment
}

// ── Vote on a poll ────────────────────────────────────────────
export async function castPollVote(
  userId:    string,
  postId:    string,
  optionIdx: number
): Promise<void> {
  // Upsert — one vote per user per poll
  const { error } = await supabase
    .from('poll_votes')
    .upsert(
      { user_id: userId, post_id: postId, option_idx: optionIdx },
      { onConflict: 'user_id,post_id' }
    )

  if (error) throw error
}

// ── Delete own post ───────────────────────────────────────────
export async function deletePost(userId: string, postId: string): Promise<void> {
  const { error } = await supabase
    .from('community_posts')
    .update({ deleted: true })
    .eq('id', postId)
    .eq('user_id', userId)   // row-level guard — users can only delete their own

  if (error) throw error
}
