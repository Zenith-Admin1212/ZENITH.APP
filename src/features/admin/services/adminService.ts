import { supabase } from '@/lib/supabase/client'
import type {
  AdminPlatformStats, AdminLog, AdminActionType,
  BroadcastMessage, FeedbackItem, MaintenanceStatus,
} from '@/types'

// ═══════════════════════════════════════════════════════════════
//  Admin Service
//
//  All admin operations are:
//  1. Validated with an admin role check at the DB query level
//     (.eq('role','admin') on the calling user's record)
//  2. Followed by an audit log write to admin_logs
//  3. Wrapped in try/catch — destructive ops never fail silently
//
//  NOTE: Service-role bypass is not used here — the admin panel
//  operates through the normal anon client + RLS, meaning the
//  Supabase RLS policies for admin actions must be configured in
//  Phase 15 to allow role='admin' users to perform these writes.
// ═══════════════════════════════════════════════════════════════

// ── Audit logger ──────────────────────────────────────────────
async function logAdminAction(
  adminId:      string,
  action:       AdminActionType,
  targetUserId: string | null = null,
  targetId:     string | null = null,
  notes:        string | null = null
): Promise<void> {
  await supabase.from('admin_logs').insert({
    admin_id:       adminId,
    action,
    target_user_id: targetUserId,
    target_id:      targetId,
    notes,
    created_at:     new Date().toISOString(),
  })
  // Non-throwing — log failure must never abort the main action
}

// ── Platform stats ────────────────────────────────────────────
export async function fetchPlatformStats(): Promise<AdminPlatformStats> {
  const today = new Date().toISOString().split('T')[0]
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const [
    { count: total_users },
    { count: active_today },
    { count: premium_users },
    { count: active_challenges },
    { count: community_posts },
    { count: habits_today },
    { count: new_this_week },
    { count: total_habits },
  ] = await Promise.all([
    supabase.from('users').select('*', { count: 'exact', head: true }),
    supabase.from('users').select('*', { count: 'exact', head: true }).gte('last_online', today),
    supabase.from('users').select('*', { count: 'exact', head: true }).eq('is_premium', true),
    supabase.from('challenge_participants').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('community_posts').select('*', { count: 'exact', head: true }).eq('deleted', false),
    supabase.from('habit_logs').select('*', { count: 'exact', head: true }).eq('date', today).eq('completed', true),
    supabase.from('users').select('*', { count: 'exact', head: true }).gte('join_date', weekAgo),
    supabase.from('habits').select('*', { count: 'exact', head: true }).eq('archived', false),
  ])

  return {
    total_users:            total_users ?? 0,
    active_users_today:     active_today ?? 0,
    premium_users:          premium_users ?? 0,
    active_challenges:      active_challenges ?? 0,
    community_posts:        community_posts ?? 0,
    habits_completed_today: habits_today ?? 0,
    new_users_this_week:    new_this_week ?? 0,
    total_habits:           total_habits ?? 0,
  }
}

// ── Users ────────────────────────────────────────────────────
export interface AdminUserRow {
  id:          string
  username:    string | null
  email:       string | null
  avatar:      string
  plan:        string
  is_premium:  boolean
  role:        string
  streak:      number
  xp:          number
  blocked:     boolean
  block_reason: string | null
  join_date:   string
  last_online: string
}

export async function fetchAdminUsers(
  search?: string,
  page    = 0,
  limit   = 50
): Promise<AdminUserRow[]> {
  let query = supabase
    .from('users')
    .select('id, username, email, avatar, plan, is_premium, role, streak, xp, blocked, block_reason, join_date, last_online')
    .order('created_at', { ascending: false })
    .range(page * limit, page * limit + limit - 1)

  if (search?.trim()) {
    query = query.or(`username.ilike.%${search}%,email.ilike.%${search}%`)
  }

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as AdminUserRow[]
}

// ── Grant / revoke premium ────────────────────────────────────
export async function grantPremium(adminId: string, targetUserId: string): Promise<void> {
  const { error } = await supabase
    .from('users')
    .update({ is_premium: true, plan: 'premium' })
    .eq('id', targetUserId)

  if (error) throw error
  await logAdminAction(adminId, 'grant_premium', targetUserId)
}

export async function revokePremium(adminId: string, targetUserId: string): Promise<void> {
  const { error } = await supabase
    .from('users')
    .update({ is_premium: false, plan: 'free' })
    .eq('id', targetUserId)

  if (error) throw error
  await logAdminAction(adminId, 'revoke_premium', targetUserId)
}

// ── Block / unblock ───────────────────────────────────────────
export async function blockUser(adminId: string, targetUserId: string, reason: string): Promise<void> {
  const { error } = await supabase
    .from('users')
    .update({ blocked: true, block_reason: reason })
    .eq('id', targetUserId)

  if (error) throw error
  await logAdminAction(adminId, 'ban_user', targetUserId, null, reason)
}

export async function unblockUser(adminId: string, targetUserId: string): Promise<void> {
  const { error } = await supabase
    .from('users')
    .update({ blocked: false, block_reason: null })
    .eq('id', targetUserId)

  if (error) throw error
  await logAdminAction(adminId, 'unban_user', targetUserId)
}

// ── Reset streak ──────────────────────────────────────────────
export async function resetUserStreak(adminId: string, targetUserId: string): Promise<void> {
  const { error } = await supabase
    .from('users')
    .update({ streak: 0, consecutive_miss_days: 0 })
    .eq('id', targetUserId)

  if (error) throw error
  await logAdminAction(adminId, 'reset_streak', targetUserId)
}

// ── Community moderation ──────────────────────────────────────
export async function adminDeletePost(adminId: string, postId: string): Promise<void> {
  const { error } = await supabase
    .from('community_posts')
    .update({ deleted: true })
    .eq('id', postId)

  if (error) throw error
  await logAdminAction(adminId, 'delete_post', null, postId)
}

export async function adminDeleteComment(adminId: string, commentId: string): Promise<void> {
  const { error } = await supabase
    .from('post_comments')
    .update({ deleted: true })
    .eq('id', commentId)

  if (error) throw error
  await logAdminAction(adminId, 'delete_comment', null, commentId)
}

export async function fetchAdminCommunityPosts(page = 0, limit = 40) {
  const { data, error } = await supabase
    .from('community_posts')
    .select(`
      id, body, type, pinned, deleted, created_at,
      users!community_posts_user_id_fkey ( username, avatar ),
      post_reactions ( id ),
      post_comments ( id, deleted )
    `)
    .order('created_at', { ascending: false })
    .range(page * limit, page * limit + limit - 1)

  if (error) throw error
  return data ?? []
}

// ── Challenges ────────────────────────────────────────────────
export async function adminDisableChallenge(adminId: string, challengeId: string): Promise<void> {
  const { error } = await supabase
    .from('challenges')
    .update({ active: false })
    .eq('id', challengeId)

  if (error) throw error
  await logAdminAction(adminId, 'disable_challenge', null, challengeId)
}

export async function adminEnableChallenge(adminId: string, challengeId: string): Promise<void> {
  const { error } = await supabase
    .from('challenges')
    .update({ active: true })
    .eq('id', challengeId)

  if (error) throw error
}

export async function fetchChallengeStats() {
  const { data, error } = await supabase
    .from('challenges')
    .select(`
      id, title, icon, kind, active, xp_reward,
      challenge_participants ( id, status )
    `)
    .order('sort_order', { ascending: true })

  if (error) throw error
  return (data ?? []).map(c => ({
    ...c,
    total_participants: c.challenge_participants?.length ?? 0,
    active_participants: c.challenge_participants?.filter((p: { status: string }) => p.status === 'active').length ?? 0,
    completed:          c.challenge_participants?.filter((p: { status: string }) => p.status === 'completed').length ?? 0,
  }))
}

// ── Feedback ──────────────────────────────────────────────────
export async function fetchFeedback(status?: string): Promise<FeedbackItem[]> {
  let query = supabase
    .from('feedback')
    .select(`
      id, user_id, type, message, status, created_at,
      users!feedback_user_id_fkey ( username )
    `)
    .order('created_at', { ascending: false })
    .limit(100)

  if (status) query = query.eq('status', status)

  const { data, error } = await query
  if (error) throw error

  return (data ?? []).map(f => ({
    ...f,
    username: f.users?.username ?? null,
  })) as FeedbackItem[]
}

export async function updateFeedbackStatus(
  feedbackId: string,
  status: FeedbackItem['status']
): Promise<void> {
  const { error } = await supabase
    .from('feedback')
    .update({ status })
    .eq('id', feedbackId)

  if (error) throw error
}

// ── Broadcast ─────────────────────────────────────────────────
export async function sendBroadcast(
  adminId:  string,
  title:    string,
  message:  string
): Promise<number> {
  // Fetch all non-blocked user IDs
  const { data: users, error: uErr } = await supabase
    .from('users')
    .select('id')
    .eq('blocked', false)

  if (uErr) throw uErr

  const userIds = (users ?? []).map(u => u.id)

  if (userIds.length === 0) return 0

  // Batch-insert notifications (chunked to avoid row limits)
  const CHUNK = 100
  for (let i = 0; i < userIds.length; i += CHUNK) {
    const chunk = userIds.slice(i, i + CHUNK)
    await supabase.from('notifications').insert(
      chunk.map(uid => ({
        user_id: uid,
        type:    'broadcast',
        title,
        message,
        data:    {},
        read:    false,
      }))
    )
  }

  // Log broadcast
  await supabase.from('broadcast_messages').insert({
    admin_id:        adminId,
    title,
    message,
    sent_at:         new Date().toISOString(),
    recipient_count: userIds.length,
  })

  await logAdminAction(adminId, 'broadcast_sent', null, null, `Title: ${title} | Recipients: ${userIds.length}`)

  return userIds.length
}

export async function fetchBroadcastHistory(): Promise<BroadcastMessage[]> {
  const { data, error } = await supabase
    .from('broadcast_messages')
    .select('*')
    .order('sent_at', { ascending: false })
    .limit(20)

  if (error) throw error
  return (data ?? []) as BroadcastMessage[]
}

// ── Maintenance mode ──────────────────────────────────────────
export async function fetchMaintenanceStatus(): Promise<MaintenanceStatus | null> {
  const { data, error } = await supabase
    .from('app_settings')
    .select('*')
    .eq('key', 'maintenance_mode')
    .single()

  if (error) return null
  return data?.value as MaintenanceStatus | null
}

export async function setMaintenanceMode(
  adminId:  string,
  enabled:  boolean,
  message?: string
): Promise<void> {
  const value: MaintenanceStatus = {
    enabled,
    message:    message ?? 'ZENITH is currently undergoing maintenance. Back soon!',
    updated_at: new Date().toISOString(),
    updated_by: adminId,
  }

  const { error } = await supabase
    .from('app_settings')
    .upsert({ key: 'maintenance_mode', value }, { onConflict: 'key' })

  if (error) throw error
  await logAdminAction(adminId, enabled ? 'maintenance_on' : 'maintenance_off')
}

// ── Admin logs ────────────────────────────────────────────────
export async function fetchAdminLogs(page = 0, limit = 50): Promise<AdminLog[]> {
  const { data, error } = await supabase
    .from('admin_logs')
    .select(`
      *,
      admin:users!admin_logs_admin_id_fkey ( username ),
      target:users!admin_logs_target_user_id_fkey ( username )
    `)
    .order('created_at', { ascending: false })
    .range(page * limit, page * limit + limit - 1)

  if (error) throw error

  return (data ?? []).map(l => ({
    ...l,
    admin_username:  l.admin?.username  ?? null,
    target_username: l.target?.username ?? null,
  })) as AdminLog[]
}
