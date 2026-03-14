import { supabase } from '@/lib/supabase/client'
import { ACHIEVEMENTS, ACHIEVEMENT_MAP } from '../constants/achievements'
import { format } from 'date-fns'
import type { XPTransactionType } from '@/types'

// ═══════════════════════════════════════════════════════════════
//  XP Engine — single source of truth for all XP operations
//
//  RULES:
//  1. Every XP change must write to xp_transactions
//  2. All XP totals are verified against DB, never client state
//  3. Level-up checked after every XP mutation
//  4. Achievement check triggered after every XP mutation
// ═══════════════════════════════════════════════════════════════

// XPTransactionType is defined in @/types/index.ts and re-exported here
// for backwards compatibility with existing imports from this file.
export type { XPTransactionType }

export interface XPResult {
  previousXP:   number
  newXP:        number
  delta:        number
  leveledUp:    boolean
  newLevel:     string | null
  achievements: string[]   // newly unlocked achievement IDs
}

// ── Level thresholds ─────────────────────────────────────────────
export const LEVELS = [
  { name: 'Bronze',  min: 0,    badge: '🥉' },
  { name: 'Silver',  min: 500,  badge: '🥈' },
  { name: 'Gold',    min: 1200, badge: '🥇' },
  { name: 'Diamond', min: 2500, badge: '💎' },
  { name: 'King',    min: 4000, badge: '👑' },
] as const

export function calculateLevel(totalXP: number): { name: string; badge: string; index: number } {
  let result: { name: string; badge: string; index: number } = { name: LEVELS[0].name, badge: LEVELS[0].badge, index: 0 }
  for (let i = 0; i < LEVELS.length; i++) {
    if (totalXP >= LEVELS[i].min) {
      result = { name: LEVELS[i].name, badge: LEVELS[i].badge, index: i }
    }
  }
  return result
}

export function checkLevelUp(
  previousXP: number,
  newXP: number
): { leveledUp: boolean; newLevel: string; badge: string } | null {
  const prev = calculateLevel(previousXP)
  const next = calculateLevel(newXP)
  if (next.index > prev.index) {
    return { leveledUp: true, newLevel: next.name, badge: next.badge }
  }
  return null
}

// ── Log XP transaction ───────────────────────────────────────────
export async function logXPTransaction(
  userId:      string,
  amount:      number,
  type:        XPTransactionType,
  description: string,
  habitId?:    string
): Promise<void> {
  await supabase.from('xp_transactions').insert({
    user_id:    userId,
    amount,
    type,
    description,
    habit_id:   habitId ?? null,
    date:       format(new Date(), 'yyyy-MM-dd'),
    created_at: new Date().toISOString(),
  })
}

// ── Fetch current XP from DB (anti-cheat: never trust client) ───
async function fetchCurrentXP(userId: string): Promise<number> {
  const { data, error } = await supabase
    .from('users')
    .select('xp')
    .eq('id', userId)
    .single()
  if (error) throw error
  return data?.xp ?? 0
}

// ── Throttle key for achievement checks ─────────────────────────
// Prevents 7 parallel DB queries on every XP gain.
// Achievements are re-evaluated at most once per 5 minutes per user.
const _achievementCheckTimestamps = new Map<string, number>()
const ACHIEVEMENT_CHECK_THROTTLE_MS = 5 * 60 * 1000  // 5 minutes

// ── Check and unlock achievements ────────────────────────────────
export async function checkAchievements(userId: string, force = false): Promise<string[]> {
  // Throttle: skip if checked recently (unless forced)
  if (!force) {
    const lastCheck = _achievementCheckTimestamps.get(userId) ?? 0
    if (Date.now() - lastCheck < ACHIEVEMENT_CHECK_THROTTLE_MS) return []
  }
  _achievementCheckTimestamps.set(userId, Date.now())

  // Fetch already unlocked achievement IDs
  const { data: existing } = await supabase
    .from('user_achievements')
    .select('achievement_id')
    .eq('user_id', userId)

  const unlockedIds = new Set(
    (existing ?? []).map((r: { achievement_id: string }) => r.achievement_id)
  )

  // Short-circuit: all achievements already unlocked
  const remaining = ACHIEVEMENTS.filter(a => !unlockedIds.has(a.id))
  if (remaining.length === 0) return []

  // Fetch stats needed for all condition types in one batch
  const [
    { data: userData },
    { data: habitLogs },
    { data: perfectDayData },
    { data: pomodoroData },
    { data: waterData },
    { data: checkinData },
    { data: habitsData },
    { data: challengeData },
  ] = await Promise.all([
    supabase.from('users').select('xp, streak, longest_streak').eq('id', userId).single(),
    supabase.from('habit_logs').select('id, date').eq('user_id', userId).eq('completed', true),
    // Perfect days: daily_checkins table tracks whether all habits were completed that day
    supabase.from('daily_checkins').select('date, perfect_day').eq('user_id', userId),
    supabase.from('pomodoro_sessions').select('id').eq('user_id', userId).eq('completed', true),
    supabase.from('water_logs').select('date, amount_ml').eq('user_id', userId),
    supabase.from('daily_checkins').select('date').eq('user_id', userId),
    supabase.from('habits').select('id').eq('user_id', userId).eq('active', true),
    supabase.from('user_challenges').select('id').eq('user_id', userId).eq('status', 'completed'),
  ])

  const totalXP             = userData?.xp ?? 0
  const streakDays          = userData?.streak ?? 0
  const habitsCompleted     = habitLogs?.length ?? 0
  const pomodoroCount       = pomodoroData?.length ?? 0
  const habitsAdded         = habitsData?.length ?? 0
  const challengesCompleted = challengeData?.length ?? 0
  const currentLevelIndex   = calculateLevel(totalXP).index

  // FIX: Perfect days — count days where the perfect_day flag is true
  // Falls back to unique-dates heuristic if column not present
  const perfectDays = (perfectDayData ?? []).filter(
    (d: { perfect_day?: boolean }) => d.perfect_day === true
  ).length || new Set(habitLogs?.map((l: { date: string }) => l.date) ?? []).size

  // Water goal days
  const waterGoal = 2000
  const waterGoalDays = (waterData ?? []).filter(
    (w: { amount_ml: number }) => w.amount_ml >= waterGoal
  ).length

  // Check-in count
  const checkinCount = checkinData?.length ?? 0

  // ── Evaluate each unchecked achievement ─────────────────────
  const newlyUnlocked: string[] = []

  for (const achievement of remaining) {
    const { type, threshold } = achievement.condition
    let unlocked = false

    switch (type) {
      case 'streak_days':          unlocked = streakDays >= threshold;          break
      case 'habits_completed':     unlocked = habitsCompleted >= threshold;     break
      case 'perfect_days':         unlocked = perfectDays >= threshold;         break
      case 'total_xp':             unlocked = totalXP >= threshold;             break
      case 'pomodoro_sessions':    unlocked = pomodoroCount >= threshold;       break
      case 'water_days':           unlocked = waterGoalDays >= threshold;       break
      case 'checkin_days':         unlocked = checkinCount >= threshold;        break
      case 'habits_added':         unlocked = habitsAdded >= threshold;         break
      case 'challenges_completed': unlocked = challengesCompleted >= threshold; break
      case 'weekly_perfect':       unlocked = perfectDays >= 7 * threshold;     break
      // FIX: level_reached was completely missing — now implemented
      case 'level_reached':        unlocked = currentLevelIndex >= threshold;   break
    }

    if (unlocked) newlyUnlocked.push(achievement.id)
  }

  if (newlyUnlocked.length === 0) return []

  // Insert newly unlocked achievements
  const today = format(new Date(), 'yyyy-MM-dd')
  await supabase.from('user_achievements').insert(
    newlyUnlocked.map(id => ({
      user_id:        userId,
      achievement_id: id,
      unlocked_at:    new Date().toISOString(),
      date:           today,
    }))
  )

  // Grant XP for achievements that have xp_reward > 0
  let bonusXP = 0
  for (const id of newlyUnlocked) {
    const achievement = ACHIEVEMENT_MAP.get(id)
    if (achievement && achievement.xp_reward > 0) {
      bonusXP += achievement.xp_reward
      await logXPTransaction(
        userId,
        achievement.xp_reward,
        'achievement_reward',
        `Achievement unlocked: ${achievement.title}`
      )
    }
  }

  if (bonusXP > 0) {
    const currentXP = await fetchCurrentXP(userId)
    await supabase
      .from('users')
      .update({ xp: currentXP + bonusXP })
      .eq('id', userId)
  }

  return newlyUnlocked
}

// ── Add XP (primary mutation function) ──────────────────────────
export async function addXP(
  userId:      string,
  amount:      number,
  type:        XPTransactionType,
  description: string,
  habitId?:    string
): Promise<XPResult> {
  if (amount <= 0) throw new Error('addXP: amount must be positive')

  // 1. Fetch current XP from DB (anti-cheat — never trust client state)
  const previousXP = await fetchCurrentXP(userId)
  const newXP      = previousXP + amount

  // 2. Update DB
  const { error } = await supabase
    .from('users')
    .update({ xp: newXP })
    .eq('id', userId)
  if (error) throw error

  // 3. Log transaction
  await logXPTransaction(userId, amount, type, description, habitId)

  // 4. Check level-up
  const levelUp = checkLevelUp(previousXP, newXP)

  // 5. Check achievements (throttled — won't run every single toggle)
  const achievements = await checkAchievements(userId)

  return {
    previousXP,
    newXP,
    delta:       amount,
    leveledUp:   !!levelUp,
    newLevel:    levelUp?.newLevel ?? null,
    achievements,
  }
}

// ── Deduct XP (floor at 0) ───────────────────────────────────────
export async function deductXP(
  userId:      string,
  amount:      number,
  type:        XPTransactionType,
  description: string
): Promise<XPResult> {
  if (amount <= 0) throw new Error('deductXP: amount must be positive')

  const previousXP  = await fetchCurrentXP(userId)
  const newXP       = Math.max(0, previousXP - amount)
  const actualDelta = previousXP - newXP  // may be less than amount if floored

  const { error } = await supabase
    .from('users')
    .update({ xp: newXP })
    .eq('id', userId)
  if (error) throw error

  await logXPTransaction(userId, -actualDelta, type, description)

  return {
    previousXP,
    newXP,
    delta:      -actualDelta,
    leveledUp:  false,
    newLevel:   null,
    achievements: [],
  }
}
