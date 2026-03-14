import { supabase } from '@/lib/supabase/client'
import { format, subDays, eachDayOfInterval, startOfDay } from 'date-fns'

// ═══════════════════════════════════════════════════════════════
//  Analytics Service
//
//  ONE function fetches all data needed for the analytics page.
//  All aggregation happens here — components receive clean structs.
//  This keeps TanStack Query to a single cache key for the page.
// ═══════════════════════════════════════════════════════════════

export interface DailyAnalytics {
  date:             string   // 'YYYY-MM-DD'
  habitsCompleted:  number
  habitsTotal:      number
  completionPct:    number   // 0–100
  pomodoroSessions: number
  pomodoroMinutes:  number
  sleepScore:       number   // 0–10 (from check-in)
  moodScore:        number   // 0–10
  focusScore:       number   // 0–10
  waterMl:          number
  hadCheckin:       boolean
}

export interface AnalyticsSummary {
  days:                  DailyAnalytics[]
  // 30-day aggregates
  avgCompletionPct:      number
  totalHabitsCompleted:  number
  totalPomodoroSessions: number
  totalPomodoroMinutes:  number
  avgSleepScore:         number
  avgMoodScore:          number
  avgFocusScore:         number
  avgWaterMl:            number
  perfectDays:           number   // days where completionPct === 100
  activeDays:            number   // days with at least 1 habit completed
  // For discipline score inputs
  habitCompletionRate30d: number  // 0–1
  checkInStreak:          number
}

export async function fetchAnalyticsData(userId: string): Promise<AnalyticsSummary> {
  const today    = format(new Date(), 'yyyy-MM-dd')
  const start30  = format(subDays(new Date(), 29), 'yyyy-MM-dd')

  // ── Single batch: all 4 data sources in parallel ─────────────
  const [
    { data: habitLogs },
    { data: activeHabits },
    { data: pomodoroRows },
    { data: checkinRows },
    { data: waterRows },
  ] = await Promise.all([
    supabase
      .from('habit_logs')
      .select('habit_id, date, completed')
      .eq('user_id', userId)
      .gte('date', start30)
      .lte('date', today),

    supabase
      .from('habits')
      .select('id')
      .eq('user_id', userId)
      .eq('active', true),

    supabase
      .from('pomodoro_sessions')
      .select('date, completed, duration_min')
      .eq('user_id', userId)
      .gte('date', start30)
      .lte('date', today),

    supabase
      .from('daily_checkins')
      .select('date, sleep_hours, mood_score, focus_hours, energy_level')
      .eq('user_id', userId)
      .gte('date', start30)
      .lte('date', today),

    supabase
      .from('water_logs')
      .select('date, amount_ml')
      .eq('user_id', userId)
      .gte('date', start30)
      .lte('date', today),
  ])

  const totalActiveHabits = activeHabits?.length ?? 0

  // ── Build lookup maps for O(1) per-day access ─────────────────
  // Habit completions per date
  const habitsByDate = new Map<string, number>()
  for (const log of habitLogs ?? []) {
    if (log.completed) {
      habitsByDate.set(log.date, (habitsByDate.get(log.date) ?? 0) + 1)
    }
  }

  // Pomodoro per date
  const pomodoroByDate = new Map<string, { sessions: number; minutes: number }>()
  for (const p of pomodoroRows ?? []) {
    if (p.completed) {
      const existing = pomodoroByDate.get(p.date) ?? { sessions: 0, minutes: 0 }
      pomodoroByDate.set(p.date, {
        sessions: existing.sessions + 1,
        minutes:  existing.minutes + (p.duration_min ?? 25),
      })
    }
  }

  // Check-ins per date
  const checkinByDate = new Map<string, typeof checkinRows extends (infer T)[] | null ? T : never>()
  for (const c of checkinRows ?? []) {
    checkinByDate.set(c.date, c)
  }

  // Water per date
  const waterByDate = new Map<string, number>()
  for (const w of waterRows ?? []) {
    waterByDate.set(w.date, (waterByDate.get(w.date) ?? 0) + (w.amount_ml ?? 0))
  }

  // ── Build 30 daily records ─────────────────────────────────────
  const dateRange = eachDayOfInterval({
    start: subDays(new Date(), 29),
    end:   new Date(),
  })

  const days: DailyAnalytics[] = dateRange.map(d => {
    const dateStr        = format(d, 'yyyy-MM-dd')
    const habitsCompleted = habitsByDate.get(dateStr) ?? 0
    const pomo           = pomodoroByDate.get(dateStr) ?? { sessions: 0, minutes: 0 }
    const checkin        = checkinByDate.get(dateStr)
    const water          = waterByDate.get(dateStr) ?? 0
    const isFuture       = dateStr > today

    // Sleep score: map sleep_hours (0–12) → 0–10
    const sleepScore = checkin
      ? Math.min(Math.round((checkin.sleep_hours / 10) * 10), 10)
      : 0

    return {
      date:             dateStr,
      habitsCompleted,
      habitsTotal:      totalActiveHabits,
      completionPct:    isFuture || totalActiveHabits === 0
        ? 0
        : Math.round((habitsCompleted / totalActiveHabits) * 100),
      pomodoroSessions: pomo.sessions,
      pomodoroMinutes:  pomo.minutes,
      sleepScore,
      moodScore:        checkin?.mood_score   ?? 0,
      focusScore:       checkin?.focus_hours  ?? 0,
      waterMl:          water,
      hadCheckin:       !!checkin,
    }
  })

  // ── 30-day aggregates ─────────────────────────────────────────
  const pastDays      = days.filter(d => d.date <= today && d.habitsTotal > 0)
  const checkinDays   = days.filter(d => d.hadCheckin)

  const sum = <K extends keyof DailyAnalytics>(key: K): number =>
    pastDays.reduce((acc, d) => acc + (d[key] as number), 0)

  const avg = <K extends keyof DailyAnalytics>(key: K, overDays?: typeof pastDays): number => {
    const arr = overDays ?? checkinDays
    if (arr.length === 0) return 0
    return Math.round(arr.reduce((acc, d) => acc + (d[key] as number), 0) / arr.length * 10) / 10
  }

  const perfectDays        = pastDays.filter(d => d.completionPct === 100).length
  const activeDays         = pastDays.filter(d => d.habitsCompleted > 0).length
  const avgCompletionPct   = pastDays.length > 0
    ? Math.round(sum('completionPct') / pastDays.length)
    : 0

  // Check-in streak (consecutive days with check-ins going back from today)
  let checkInStreak = 0
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].hadCheckin) checkInStreak++
    else break
  }

  return {
    days,
    avgCompletionPct,
    totalHabitsCompleted:  sum('habitsCompleted'),
    totalPomodoroSessions: sum('pomodoroSessions'),
    totalPomodoroMinutes:  sum('pomodoroMinutes'),
    avgSleepScore:         avg('sleepScore'),
    avgMoodScore:          avg('moodScore'),
    avgFocusScore:         avg('focusScore'),
    avgWaterMl:            avg('waterMl', pastDays),
    perfectDays,
    activeDays,
    habitCompletionRate30d: avgCompletionPct / 100,
    checkInStreak,
  }
}
