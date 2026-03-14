// ═══════════════════════════════════════════════════════════════
//  Discipline Score Utility
//
//  Phase 7: Returns a placeholder score derived from streak.
//  Phase 8: Will replace with full weighted calculation using:
//    - habit completion rate (30d)
//    - pomodoro session frequency
//    - check-in streak
//    - water intake consistency
//    - sleep + focus scores from check-ins
//    - streak bonus multiplier
//
//  Score range: 0–100
// ═══════════════════════════════════════════════════════════════

export interface DisciplineInputs {
  habitCompletionRate30d: number   // 0–1
  pomodoroSessionsThisWeek: number
  checkInStreak: number
  waterGoalDaysThisWeek: number
  sleepAvgScore: number            // 0–10 (from check-ins)
  focusAvgScore: number            // 0–10
  currentStreak: number
}

export interface DisciplineResult {
  score: number          // 0–100
  grade: 'S' | 'A' | 'B' | 'C' | 'D' | 'F'
  label: string
  breakdown: {
    habits:   number     // 0–40 pts
    focus:    number     // 0–20 pts
    wellness: number     // 0–20 pts
    streak:   number     // 0–20 pts
  }
}

/**
 * Calculate the discipline score from user stats.
 *
 * Phase 7: lightweight version using only streak + completion rate.
 * Phase 8: will replace with full weighted calculation.
 */
export function calculateDisciplineScore(inputs: Partial<DisciplineInputs>): DisciplineResult {
  const {
    habitCompletionRate30d    = 0,
    pomodoroSessionsThisWeek  = 0,
    checkInStreak             = 0,
    waterGoalDaysThisWeek     = 0,
    sleepAvgScore             = 5,
    focusAvgScore             = 5,
    currentStreak             = 0,
  } = inputs

  // ── Habits component (40 pts max) ────────────────────────────
  const habitsScore = Math.round(habitCompletionRate30d * 40)

  // ── Focus component (20 pts max) ─────────────────────────────
  const pomodoroBonus = Math.min(pomodoroSessionsThisWeek * 2, 10)
  const focusScore    = Math.round((focusAvgScore / 10) * 10 + pomodoroBonus)

  // ── Wellness component (20 pts max) ──────────────────────────
  const waterBonus    = Math.min(waterGoalDaysThisWeek * 1.5, 7)
  const sleepBonus    = Math.round((sleepAvgScore / 10) * 7)
  const checkinBonus  = Math.min(checkInStreak, 6)
  const wellnessScore = Math.round(waterBonus + sleepBonus + checkinBonus)

  // ── Streak bonus (20 pts max) ─────────────────────────────────
  const streakScore = Math.min(Math.floor(currentStreak / 3) * 2, 20)

  const total = Math.min(habitsScore + focusScore + wellnessScore + streakScore, 100)

  const grade =
    total >= 95 ? 'S' :
    total >= 80 ? 'A' :
    total >= 65 ? 'B' :
    total >= 50 ? 'C' :
    total >= 35 ? 'D' : 'F'

  const label =
    grade === 'S' ? 'Zenith Elite' :
    grade === 'A' ? 'High Performer' :
    grade === 'B' ? 'On Track' :
    grade === 'C' ? 'Building Momentum' :
    grade === 'D' ? 'Needs Improvement' :
    'Just Getting Started'

  return {
    score: total,
    grade,
    label,
    breakdown: {
      habits:   habitsScore,
      focus:    focusScore,
      wellness: wellnessScore,
      streak:   streakScore,
    },
  }
}

/** Quick helper: calculate discipline from habit completion rate + streak only. */
export function quickDisciplineScore(completionRate: number, streak: number): number {
  return calculateDisciplineScore({
    habitCompletionRate30d: completionRate,
    currentStreak: streak,
  }).score
}
