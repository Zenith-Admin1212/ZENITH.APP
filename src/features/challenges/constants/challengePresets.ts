import type { Challenge, ChallengeKind } from '@/types'

// ═══════════════════════════════════════════════════════════════
//  Challenge Presets
//
//  These are the four challenge types shipped with ZENITH.
//  Phase 15 will seed these into the `challenges` table.
//  Until then, components fall back to this local definition
//  if the DB query returns an empty array.
// ═══════════════════════════════════════════════════════════════

export const CHALLENGE_KIND_META: Record<ChallengeKind, {
  label:       string
  icon:        string
  description: string
  color:       string
  trackingUnit: string
}> = {
  habit_streak: {
    label:        'Habit Streak',
    icon:         '🔥',
    description:  'Maintain your daily habit streak for the full duration.',
    color:        '#f97316',
    trackingUnit: 'day streak',
  },
  xp_race: {
    label:        'XP Race',
    icon:         '⚡',
    description:  'Earn the most XP before the timer runs out.',
    color:        '#f59e0b',
    trackingUnit: 'XP earned',
  },
  perfect_week: {
    label:        'Perfect Week',
    icon:         '⭐',
    description:  'Complete every single habit for 7 days straight.',
    color:        '#22c55e',
    trackingUnit: 'perfect days',
  },
  pomodoro_sprint: {
    label:        'Pomodoro Sprint',
    icon:         '⏱️',
    description:  'Log the most Pomodoro focus sessions in the window.',
    color:        '#60a5fa',
    trackingUnit: 'sessions',
  },
}

export const PRESET_CHALLENGES: Challenge[] = [
  {
    id:            'preset-habit-7',
    title:         '7-Day Streak Lock',
    description:   'Maintain your habit streak every day for 7 days. Break it and you\'re out.',
    icon:          '🔥',
    kind:          'habit_streak',
    duration_days: 7,
    target_value:  7,
    xp_reward:     200,
    badge_icon:    '🏅',
    badge_name:    'Streak Guardian',
    tier:          'free',
    active:        true,
    sort_order:    1,
    created_at:    new Date().toISOString(),
  },
  {
    id:            'preset-habit-14',
    title:         '14-Day Consistency',
    description:   'Two weeks of unbroken daily discipline. No excuses.',
    icon:          '💪',
    kind:          'habit_streak',
    duration_days: 14,
    target_value:  14,
    xp_reward:     500,
    badge_icon:    '🔱',
    badge_name:    'Iron Will',
    tier:          'free',
    active:        true,
    sort_order:    2,
    created_at:    new Date().toISOString(),
  },
  {
    id:            'preset-habit-30',
    title:         '30-Day Elite Streak',
    description:   'A full month of daily habits. Only the disciplined survive.',
    icon:          '👑',
    kind:          'habit_streak',
    duration_days: 30,
    target_value:  30,
    xp_reward:     1500,
    badge_icon:    '👑',
    badge_name:    'Zenith Elite',
    tier:          'premium',
    active:        true,
    sort_order:    3,
    created_at:    new Date().toISOString(),
  },
  {
    id:            'preset-xp-1000',
    title:         'XP Sprint: 1000',
    description:   'Race to 1000 XP in 7 days. Habits, pomodoros, check-ins — everything counts.',
    icon:          '⚡',
    kind:          'xp_race',
    duration_days: 7,
    target_value:  1000,
    xp_reward:     250,
    badge_icon:    '⚡',
    badge_name:    'Speed Demon',
    tier:          'free',
    active:        true,
    sort_order:    4,
    created_at:    new Date().toISOString(),
  },
  {
    id:            'preset-xp-3000',
    title:         'XP Race: 3000',
    description:   'Accumulate 3000 XP in 14 days. Compete against the community.',
    icon:          '🚀',
    kind:          'xp_race',
    duration_days: 14,
    target_value:  3000,
    xp_reward:     750,
    badge_icon:    '🚀',
    badge_name:    'Rocket',
    tier:          'premium',
    active:        true,
    sort_order:    5,
    created_at:    new Date().toISOString(),
  },
  {
    id:            'preset-perfect-week',
    title:         'Perfect Week',
    description:   'Complete every habit, every day, for 7 days. No partial credit.',
    icon:          '⭐',
    kind:          'perfect_week',
    duration_days: 7,
    target_value:  7,
    xp_reward:     400,
    badge_icon:    '🌟',
    badge_name:    'Flawless',
    tier:          'free',
    active:        true,
    sort_order:    6,
    created_at:    new Date().toISOString(),
  },
  {
    id:            'preset-pomodoro-20',
    title:         'Focus Sprint: 20 Sessions',
    description:   'Complete 20 Pomodoro sessions in 7 days. Prove your focus.',
    icon:          '⏱️',
    kind:          'pomodoro_sprint',
    duration_days: 7,
    target_value:  20,
    xp_reward:     300,
    badge_icon:    '🍅',
    badge_name:    'Deep Focus',
    tier:          'free',
    active:        true,
    sort_order:    7,
    created_at:    new Date().toISOString(),
  },
  {
    id:            'preset-pomodoro-50',
    title:         'Pomodoro Marathon',
    description:   '50 focus sessions in 14 days. The ultimate attention discipline.',
    icon:          '🎯',
    kind:          'pomodoro_sprint',
    duration_days: 14,
    target_value:  50,
    xp_reward:     800,
    badge_icon:    '🎯',
    badge_name:    'Laser Focus',
    tier:          'premium',
    active:        true,
    sort_order:    8,
    created_at:    new Date().toISOString(),
  },
]

export const PRESET_MAP = new Map(PRESET_CHALLENGES.map(c => [c.id, c]))

// Max consecutive misses before auto-fail
export const CHALLENGE_FAIL_THRESHOLD = 2

// XP reward for joining (small engagement reward)
export const CHALLENGE_JOIN_XP = 10
