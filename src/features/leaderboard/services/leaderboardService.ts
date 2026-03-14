import { supabase } from '@/lib/supabase/client'
import type { LeaderboardEntry, LeaderboardPeriod, LevelName, UserPlan } from '@/types'

// ═══════════════════════════════════════════════════════════════
//  Leaderboard Service  (Phase 9 — streak-based revision)
//
//  ZENITH leaderboards rank by DISCIPLINE (streak), not XP.
//  Streak reflects consistency — the core product value.
//
//  Weekly  → users who maintained their streak through this week
//            ordered by current_streak DESC
//  Monthly → users active this month ordered by current_streak DESC
//  All-time → all users ordered by longest_streak DESC
// ═══════════════════════════════════════════════════════════════

export interface LeaderboardRow extends LeaderboardEntry {
  streak:         number   // primary sort key
  longest_streak: number
  xp:             number   // shown as secondary info only
}

export interface UserRankResult {
  rank:  number | null
  streak: number
  above: LeaderboardRow | null
}

// ── Shared user select fields ─────────────────────────────────
const USER_FIELDS = 'id, username, avatar, level_name, streak, longest_streak, xp, plan, last_checkin_date'

// ── Weekly leaderboard ────────────────────────────────────────
// Users who checked in at least once this week, ordered by current streak.
export async function fetchWeeklyLeaderboard(): Promise<LeaderboardRow[]> {
  // Monday of current week
  const now       = new Date()
  const day       = now.getDay() === 0 ? 6 : now.getDay() - 1  // Mon=0
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - day)
  weekStart.setHours(0, 0, 0, 0)
  const weekStartStr = weekStart.toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('users')
    .select(USER_FIELDS)
    .eq('blocked', false)
    .gte('last_checkin_date', weekStartStr)   // active this week
    .order('streak', { ascending: false })
    .limit(30)

  if (error) throw error

  return buildRows(data ?? [])
}

// ── Monthly leaderboard ───────────────────────────────────────
// Users who checked in this month, ordered by current streak.
export async function fetchMonthlyLeaderboard(): Promise<LeaderboardRow[]> {
  const now        = new Date()
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`

  const { data, error } = await supabase
    .from('users')
    .select(USER_FIELDS)
    .eq('blocked', false)
    .gte('last_checkin_date', monthStart)
    .order('streak', { ascending: false })
    .limit(30)

  if (error) throw error

  return buildRows(data ?? [])
}

// ── All-time leaderboard ──────────────────────────────────────
// All users ordered by their longest_streak ever recorded.
export async function fetchAlltimeLeaderboard(): Promise<LeaderboardRow[]> {
  const { data, error } = await supabase
    .from('users')
    .select(USER_FIELDS)
    .eq('blocked', false)
    .order('longest_streak', { ascending: false })
    .limit(30)

  if (error) throw error

  // For all-time, use longest_streak as the display value
  return (data ?? []).map((u, i) => ({
    id:             u.id,
    username:       u.username,
    avatar:         u.avatar ?? '👤',
    level_name:     u.level_name as LevelName,
    streak:         u.longest_streak ?? u.streak ?? 0,  // show best streak ever
    longest_streak: u.longest_streak ?? 0,
    xp:             u.xp ?? 0,
    plan:           u.plan as UserPlan,
    rank:           i + 1,
  }))
}

// ── Build ranked rows ─────────────────────────────────────────
function buildRows(data: Record<string, unknown>[]): LeaderboardRow[] {
  return data.map((u, i) => ({
    id:             u.id as string,
    username:       u.username as string | null,
    avatar:         (u.avatar as string) ?? '👤',
    level_name:     u.level_name as LevelName,
    streak:         (u.streak as number) ?? 0,
    longest_streak: (u.longest_streak as number) ?? 0,
    xp:             (u.xp as number) ?? 0,
    plan:           u.plan as UserPlan,
    rank:           i + 1,
  }))
}

// ── Current user's rank in the active board ───────────────────
export async function fetchUserRank(
  userId: string,
  _period: LeaderboardPeriod,
  board:  LeaderboardRow[]
): Promise<UserRankResult> {
  const entry = board.find(r => r.id === userId)

  if (!entry) return { rank: null, streak: 0, above: null }

  const above = board[entry.rank - 2] ?? null

  return {
    rank:   entry.rank,
    streak: entry.streak,
    above:  above?.id !== userId ? above : null,
  }
}
