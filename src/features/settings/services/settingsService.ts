import { supabase }          from '@/lib/supabase/client'
import { updateUserProfile } from '@/services/userService'
import type { User }         from '@/types'

// ═══════════════════════════════════════════════════════════════
//  Settings Service
//
//  Handles all user-configurable preferences:
//   • Profile (username, avatar, age, goals)
//   • Notification preferences (stored in user_preferences table)
//   • App preferences (water goal, units)
//   • Account actions (sign out)
//
//  Thin wrappers over existing userService where possible
//  to avoid duplicating DB logic.
// ═══════════════════════════════════════════════════════════════

// ── Profile section ───────────────────────────────────────────

export async function saveProfileSettings(
  userId:  string,
  updates: {
    username?:     string
    avatar?:       string
    age?:          string
    goals?:        string[]
    water_goal_ml?: number
  }
): Promise<User> {
  return updateUserProfile(userId, updates)
}

// ── Notification preferences ──────────────────────────────────
// Stored in a `user_preferences` table (key-value per user).
// Falls back gracefully if table doesn't exist yet (Phase 15).

export interface NotificationPreferences {
  streak_alerts:     boolean   // "you haven't checked in today"
  achievement_alerts:boolean   // "you unlocked a badge"
  challenge_alerts:  boolean   // challenge updates
  community_alerts:  boolean   // reactions + comments on my posts
  broadcast_alerts:  boolean   // admin broadcasts
  leaderboard_alerts:boolean   // rank changes
}

export const DEFAULT_NOTIFICATION_PREFS: NotificationPreferences = {
  streak_alerts:     true,
  achievement_alerts:true,
  challenge_alerts:  true,
  community_alerts:  true,
  broadcast_alerts:  true,
  leaderboard_alerts:false,
}

export async function fetchNotificationPrefs(
  userId: string
): Promise<NotificationPreferences> {
  const { data, error } = await supabase
    .from('user_preferences')
    .select('value')
    .eq('user_id', userId)
    .eq('key', 'notification_prefs')
    .maybeSingle()

  if (error || !data) return DEFAULT_NOTIFICATION_PREFS
  return { ...DEFAULT_NOTIFICATION_PREFS, ...(data.value as NotificationPreferences) }
}

export async function saveNotificationPrefs(
  userId: string,
  prefs:  NotificationPreferences
): Promise<void> {
  const { error } = await supabase
    .from('user_preferences')
    .upsert(
      { user_id: userId, key: 'notification_prefs', value: prefs },
      { onConflict: 'user_id,key' }
    )

  if (error) throw error
}

// ── App preferences ───────────────────────────────────────────

export interface AppPreferences {
  water_unit:    'ml' | 'oz'
  theme_id:      string
  compact_mode:  boolean
}

export const DEFAULT_APP_PREFS: AppPreferences = {
  water_unit:   'ml',
  theme_id:     'dark-cyber',
  compact_mode: false,
}

export async function fetchAppPrefs(userId: string): Promise<AppPreferences> {
  const { data, error } = await supabase
    .from('user_preferences')
    .select('value')
    .eq('user_id', userId)
    .eq('key', 'app_prefs')
    .maybeSingle()

  if (error || !data) return DEFAULT_APP_PREFS
  return { ...DEFAULT_APP_PREFS, ...(data.value as AppPreferences) }
}

export async function saveAppPrefs(userId: string, prefs: AppPreferences): Promise<void> {
  const { error } = await supabase
    .from('user_preferences')
    .upsert(
      { user_id: userId, key: 'app_prefs', value: prefs },
      { onConflict: 'user_id,key' }
    )

  if (error) throw error
}

// ── Account actions ───────────────────────────────────────────

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function deleteAccount(userId: string): Promise<void> {
  // Soft-delete: mark as deleted, auth deletion happens server-side in Phase 15
  const { error } = await supabase
    .from('users')
    .update({ blocked: true, block_reason: 'account_deleted' })
    .eq('id', userId)

  if (error) throw error
  await supabase.auth.signOut()
}

// ── Data export (CSV) ─────────────────────────────────────────
// Returns a Blob the caller can trigger download for.
// Fetches habits + habit_logs for the user.

export async function exportUserData(userId: string): Promise<Blob> {
  const [habitsRes, logsRes] = await Promise.all([
    supabase.from('habits').select('*').eq('user_id', userId),
    supabase.from('habit_logs').select('*').eq('user_id', userId).order('date', { ascending: false }).limit(365),
  ])

  const habits   = habitsRes.data  ?? []
  const logs     = logsRes.data    ?? []

  const habitsCsv = [
    'id,name,icon,category,archived,created_at',
    ...habits.map((h: Record<string, string | boolean | null>) =>
      `${h.id},${JSON.stringify(h.name)},${h.icon},${h.category},${h.archived},${h.created_at}`
    ),
  ].join('\n')

  const logsCsv = [
    'habit_id,date,completed,notes',
    ...logs.map((l: Record<string, string | boolean | null>) =>
      `${l.habit_id},${l.date},${l.completed},${JSON.stringify(l.notes ?? '')}`
    ),
  ].join('\n')

  const combined = `ZENITH DATA EXPORT\nGenerated: ${new Date().toISOString()}\n\n== HABITS ==\n${habitsCsv}\n\n== HABIT LOGS ==\n${logsCsv}`
  return new Blob([combined], { type: 'text/csv;charset=utf-8;' })
}
