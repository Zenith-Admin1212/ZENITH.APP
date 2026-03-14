import { supabase } from '@/lib/supabase/client'
import type { Habit, HabitLog, HabitWithLog } from '@/types'
import { format } from 'date-fns'

// ═══════════════════════════════════════════════════════════════
//  Habit Service — Supabase operations
// ═══════════════════════════════════════════════════════════════

export const TODAY = () => format(new Date(), 'yyyy-MM-dd')

// ── Fetch habits with today's log status ─────────────────────────
export async function fetchHabitsWithLogs(
  userId: string,
  date: string
): Promise<HabitWithLog[]> {
  // Fetch active habits
  const { data: habits, error: hErr } = await supabase
    .from('habits')
    .select('*')
    .eq('user_id', userId)
    .eq('active', true)
    .order('sort_order', { ascending: true })

  if (hErr) throw hErr
  if (!habits || habits.length === 0) return []

  // Fetch today's logs
  const { data: logs } = await supabase
    .from('habit_logs')
    .select('*')
    .eq('user_id', userId)
    .eq('date', date)

  // Fetch last 7 days logs for the dot history
  const sevenDaysAgo = format(
    new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    'yyyy-MM-dd'
  )
  const { data: recentLogs } = await supabase
    .from('habit_logs')
    .select('habit_id, date, completed')
    .eq('user_id', userId)
    .gte('date', sevenDaysAgo)
    .lte('date', date)

  const logMap = new Map<string, boolean>()
  logs?.forEach(l => logMap.set(l.habit_id, l.completed))

  // Build 7-day history for each habit
  const last7Dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return format(d, 'yyyy-MM-dd')
  })

  return (habits as Habit[]).map(habit => {
    const last7 = last7Dates.map(d => {
      const log = recentLogs?.find(l => l.habit_id === habit.id && l.date === d)
      return log?.completed ?? false
    })

    return {
      ...habit,
      completed_today: logMap.get(habit.id) ?? false,
      last_7_days: last7,
      current_streak: 0, // computed separately by streak engine
    }
  })
}

// ── Toggle habit completion for today ────────────────────────────
export async function toggleHabitCompletion(
  userId: string,
  habitId: string,
  date: string,
  currentlyCompleted: boolean
): Promise<{ completed: boolean }> {
  const newState = !currentlyCompleted

  if (newState) {
    // Upsert log as completed
    const { error } = await supabase
      .from('habit_logs')
      .upsert(
        { user_id: userId, habit_id: habitId, date, completed: true },
        { onConflict: 'user_id,habit_id,date' }
      )
    if (error) throw error
  } else {
    // Mark as not completed (keep the log record)
    const { error } = await supabase
      .from('habit_logs')
      .upsert(
        { user_id: userId, habit_id: habitId, date, completed: false },
        { onConflict: 'user_id,habit_id,date' }
      )
    if (error) throw error
  }

  return { completed: newState }
}

// ── Create new habit ──────────────────────────────────────────────
export async function createHabit(
  userId: string,
  data: { name: string; icon: string; category: string; sort_order: number }
): Promise<Habit> {
  const { data: habit, error } = await supabase
    .from('habits')
    .insert({
      user_id: userId,
      ...data,
      active: true,
      xp_value: 15,
      frequency: 'daily',
    })
    .select()
    .single()

  if (error) throw error
  return habit as Habit
}

// ── Update habit fields ───────────────────────────────────────────
export async function updateHabit(
  userId: string,
  habitId: string,
  data: Partial<{ name: string; icon: string; category: string; sort_order: number }>
): Promise<void> {
  const { error } = await supabase
    .from('habits')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', habitId)
    .eq('user_id', userId)

  if (error) throw error
}

// ── Fetch habit logs for a date range (for calendar) ─────────────
export async function fetchHabitLogsForRange(
  userId: string,
  startDate: string,
  endDate: string
): Promise<{ habit_id: string; date: string; completed: boolean }[]> {
  const { data, error } = await supabase
    .from('habit_logs')
    .select('habit_id, date, completed')
    .eq('user_id', userId)
    .gte('date', startDate)
    .lte('date', endDate)

  if (error) throw error
  return data ?? []
}

// ── Soft delete habit (sets active = false) ───────────────────────
export async function softDeleteHabit(userId: string, habitId: string): Promise<void> {
  const { error } = await supabase
    .from('habits')
    .update({ active: false, updated_at: new Date().toISOString() })
    .eq('id', habitId)
    .eq('user_id', userId)

  if (error) throw error
}

// ── Reorder habits ────────────────────────────────────────────────
export async function reorderHabits(
  updates: { id: string; sort_order: number }[]
): Promise<void> {
  // Batch update sort orders
  await Promise.all(
    updates.map(({ id, sort_order }) =>
      supabase.from('habits').update({ sort_order }).eq('id', id)
    )
  )
}
