import { supabase } from '@/lib/supabase/client'
import { deductXP, logXPTransaction } from './xpEngine'

// ═══════════════════════════════════════════════════════════════
//  Streak Engine — timezone-safe streak calculation
//
//  RULES:
//  1. All timestamps stored in UTC (Supabase default)
//  2. Streak boundaries calculated in USER'S timezone
//  3. Never trust client date — derive "today" from server data
//  4. Shields consumed before streak reset
//  5. -25 XP penalty after 3 consecutive missed days
//
//  ANTI-CHEAT:
//  - All streak state verified against habit_logs DB records
//  - Never increment streak based on client-side claims
//  - Consecutive miss count stored in users.consecutive_miss_days
// ═══════════════════════════════════════════════════════════════

export const STREAK_MISS_PENALTY_XP = 25
export const STREAK_MISS_THRESHOLD  = 3
export const SHIELDS_PER_MONTH      = 3

// ── Get "today" and "yesterday" in user's timezone ──────────────
function getTodayAndYesterday(timezone: string): { today: string; yesterday: string } {
  const nowUTC = new Date()

  // Intl.DateTimeFormat is DST-safe — handles 23/25-hour days correctly
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year:     'numeric',
    month:    '2-digit',
    day:      '2-digit',
  })

  const today = formatter.format(nowUTC)

  // FIX (BUG-7): Use 25-hour subtraction to safely cross DST transitions,
  // then re-format in user timezone (Intl handles the actual boundary).
  const prev25h   = new Date(nowUTC.getTime() - 25 * 60 * 60 * 1000)
  const yesterday = formatter.format(prev25h)

  return { today, yesterday }
}

export interface StreakCheckResult {
  streak:               number
  longestStreak:        number
  streakReset:          boolean
  shieldConsumed:       boolean
  penaltyApplied:       boolean
  consecutiveMissdays:  number
  message:              string
}

// ── Run streak check for a user after their habits are evaluated ─
export async function runDailyStreakCheck(userId: string): Promise<StreakCheckResult> {
  const { data: user, error: userErr } = await supabase
    .from('users')
    .select(
      'streak, longest_streak, last_checkin_date, monthly_shields_remaining, ' +
      'consecutive_miss_days, timezone, xp'
    )
    .eq('id', userId)
    .single()

  if (userErr || !user) throw new Error('Could not fetch user for streak check')

  const timezone             = user.timezone ?? 'Asia/Kolkata'
  const { today, yesterday } = getTodayAndYesterday(timezone)

  if (user.last_checkin_date === today) {
    return {
      streak:              user.streak,
      longestStreak:       user.longest_streak,
      streakReset:         false,
      shieldConsumed:      false,
      penaltyApplied:      false,
      consecutiveMissdays: user.consecutive_miss_days ?? 0,
      message:             'Already checked today',
    }
  }

  const { data: yesterdayLogs } = await supabase
    .from('habit_logs')
    .select('id')
    .eq('user_id', userId)
    .eq('date', yesterday)
    .eq('completed', true)
    .limit(1)

  const completedYesterday = (yesterdayLogs?.length ?? 0) > 0

  const { data: activeHabits } = await supabase
    .from('habits')
    .select('id')
    .eq('user_id', userId)
    .eq('active', true)

  const totalHabits = activeHabits?.length ?? 0

  let newStreak           = user.streak ?? 0
  let longestStreak       = user.longest_streak ?? 0
  let streakReset         = false
  let shieldConsumed      = false
  let penaltyApplied      = false
  let consecutiveMissDays = user.consecutive_miss_days ?? 0
  let message             = ''

  if (completedYesterday) {
    newStreak++
    consecutiveMissDays = 0
    message = `Streak extended to ${newStreak} days`
    if (newStreak > longestStreak) longestStreak = newStreak
  } else if (totalHabits === 0) {
    message = 'No active habits — no streak change'
  } else {
    consecutiveMissDays++

    if (consecutiveMissDays >= STREAK_MISS_THRESHOLD) {
      const shieldsLeft = user.monthly_shields_remaining ?? 0

      if (shieldsLeft > 0 && newStreak > 0) {
        shieldConsumed      = true
        consecutiveMissDays = 0
        message = `Shield consumed. Streak protected at ${newStreak} days`

        await supabase
          .from('users')
          .update({ monthly_shields_remaining: shieldsLeft - 1 })
          .eq('id', userId)
      } else {
        streakReset         = true
        newStreak           = 0
        consecutiveMissDays = 0

        await deductXP(userId, STREAK_MISS_PENALTY_XP, 'streak_penalty',
          `Streak lost — missed ${STREAK_MISS_THRESHOLD} consecutive days`)
        penaltyApplied = true
        message = `Streak reset. -${STREAK_MISS_PENALTY_XP} XP penalty applied`
      }
    } else {
      message = `Missed day ${consecutiveMissDays} of ${STREAK_MISS_THRESHOLD}. Warning issued.`
    }
  }

  await supabase
    .from('users')
    .update({
      streak:                newStreak,
      longest_streak:        longestStreak,
      last_checkin_date:     today,
      consecutive_miss_days: consecutiveMissDays,
    })
    .eq('id', userId)

  return {
    streak:              newStreak,
    longestStreak,
    streakReset,
    shieldConsumed,
    penaltyApplied,
    consecutiveMissdays: consecutiveMissDays,
    message,
  }
}

// ── Increment streak after completing today's first habit ────────
// FIX (BUG-4): Now verifies in DB that at least one habit was actually
// completed today before incrementing — cannot be gamed by client calls.
export async function incrementStreakForToday(userId: string): Promise<void> {
  const timezone  = await getUserTimezone(userId)
  const { today } = getTodayAndYesterday(timezone)

  // Fetch user's current streak state
  const { data: user } = await supabase
    .from('users')
    .select('streak, longest_streak, last_checkin_date, consecutive_miss_days')
    .eq('id', userId)
    .single()

  if (!user) return

  // Only increment once per day
  if (user.last_checkin_date === today) return

  // FIX (BUG-4): Verify at least one habit was completed today in the DB
  // Client cannot fake this — the log is written by the server-side toggle
  const { data: todayLogs } = await supabase
    .from('habit_logs')
    .select('id')
    .eq('user_id', userId)
    .eq('date', today)
    .eq('completed', true)
    .limit(1)

  // Guard: no completed habits logged today — don't increment
  if (!todayLogs || todayLogs.length === 0) return

  const newStreak     = (user.streak ?? 0) + 1
  const longestStreak = Math.max(newStreak, user.longest_streak ?? 0)

  await supabase
    .from('users')
    .update({
      streak:                newStreak,
      longest_streak:        longestStreak,
      last_checkin_date:     today,
      consecutive_miss_days: 0,
    })
    .eq('id', userId)

  // Check if today is a perfect day (all active habits completed)
  // Write perfect_day = true to daily_checkins for xpEngine achievement tracking
  const { data: activeHabits } = await supabase
    .from('habits')
    .select('id')
    .eq('user_id', userId)
    .eq('active', true)

  const totalHabits = activeHabits?.length ?? 0
  if (totalHabits > 0) {
    const { data: completedToday } = await supabase
      .from('habit_logs')
      .select('id')
      .eq('user_id', userId)
      .eq('date', today)
      .eq('completed', true)

    const isPerfectDay = (completedToday?.length ?? 0) >= totalHabits

    if (isPerfectDay) {
      await supabase
        .from('daily_checkins')
        .upsert(
          { user_id: userId, date: today, perfect_day: true },
          { onConflict: 'user_id,date' }
        )
    }
  }
}

// ── Monthly shield reset ─────────────────────────────────────────
export async function resetMonthlyShields(userId: string): Promise<void> {
  await supabase
    .from('users')
    .update({ monthly_shields_remaining: SHIELDS_PER_MONTH })
    .eq('id', userId)
}

// ── Consume a shield manually ────────────────────────────────────
export async function consumeShield(userId: string): Promise<{ remaining: number }> {
  const { data: user } = await supabase
    .from('users')
    .select('monthly_shields_remaining')
    .eq('id', userId)
    .single()

  const current = user?.monthly_shields_remaining ?? 0
  if (current <= 0) throw new Error('No shields remaining')

  const remaining = current - 1
  await supabase
    .from('users')
    .update({ monthly_shields_remaining: remaining })
    .eq('id', userId)

  return { remaining }
}

// ── Get user timezone ────────────────────────────────────────────
async function getUserTimezone(userId: string): Promise<string> {
  const { data } = await supabase
    .from('users')
    .select('timezone')
    .eq('id', userId)
    .single()
  return data?.timezone ?? 'Asia/Kolkata'
}

// ── Streak warning level ─────────────────────────────────────────
export function getStreakWarning(consecutiveMissDays: number): {
  level: 'none' | 'warning' | 'danger'
  message: string
} {
  if (consecutiveMissDays === 0) return { level: 'none', message: '' }
  if (consecutiveMissDays === 1) return { level: 'warning', message: "You missed yesterday. Don't miss today!" }
  if (consecutiveMissDays === 2) return { level: 'danger', message: '⚠️ Miss one more day and your streak resets!' }
  return { level: 'danger', message: '🛡️ Streak at risk! Use a shield to protect it.' }
}
