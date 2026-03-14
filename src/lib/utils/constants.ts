// ═══════════════════════════════════════════════════════════════
//  ZENITH — Constants
//  Single source of truth for all game values
// ═══════════════════════════════════════════════════════════════

export const XP_CONFIG = {
  HABIT_COMPLETE:      15,
  HABIT_MISS:          -3,
  STREAK_MISS_PENALTY: -25,
  PERFECT_DAY_BONUS:   10,
  SLEEP_BONUS:         5,
  FOCUS_BONUS:         5,
  POMODORO_BONUS:      10,
} as const

export const SHIELD_CONFIG = {
  FREE_PER_MONTH:     3,
  PREMIUM_PER_MONTH:  3,
  RESETS_ON_FIRST:    true,
} as const

export const PREMIUM_PRICING = {
  MONTHLY:         14900,  // paise = ₹149
  YEARLY:          129900, // paise = ₹1299
  CURRENCY:        'INR',
  SYMBOL:          '₹',
  MONTHLY_DISPLAY: '149',
  YEARLY_DISPLAY:  '1299',
} as const

export const HABIT_CATEGORIES = [
  { id: 'morning',  label: 'Morning',  icon: '🌅' },
  { id: 'prayers',  label: 'Prayers',  icon: '🤲' },
  { id: 'health',   label: 'Health',   icon: '💪' },
  { id: 'learning', label: 'Learning', icon: '📚' },
  { id: 'evening',  label: 'Evening',  icon: '🌙' },
  { id: 'custom',   label: 'Custom',   icon: '⭐' },
] as const

export const CATEGORY_ORDER = ['morning', 'prayers', 'health', 'learning', 'evening', 'custom']

export const DEFAULT_HABITS_MUSLIM = [
  { name: 'Fajr Prayer',   icon: '🌄', category: 'prayers' },
  { name: 'Dhuhr Prayer',  icon: '☀️', category: 'prayers' },
  { name: 'Asr Prayer',    icon: '🌤️', category: 'prayers' },
  { name: 'Maghrib Prayer',icon: '🌇', category: 'prayers' },
  { name: 'Isha Prayer',   icon: '🌙', category: 'prayers' },
  { name: 'Quran Reading', icon: '📖', category: 'morning' },
  { name: 'Morning Walk',  icon: '🚶', category: 'morning' },
  { name: 'Exercise',      icon: '💪', category: 'health' },
  { name: 'Drink Water',   icon: '💧', category: 'health' },
  { name: 'Read a Book',   icon: '📚', category: 'learning' },
  { name: 'Journaling',    icon: '📝', category: 'evening' },
  { name: 'Sleep by 11pm', icon: '😴', category: 'evening' },
] as const

export const DEFAULT_HABITS_OTHER = [
  { name: 'Morning Meditation', icon: '🧘', category: 'morning' },
  { name: 'Exercise',           icon: '💪', category: 'health' },
  { name: 'Drink Water',        icon: '💧', category: 'health' },
  { name: 'Read 30 Minutes',    icon: '📚', category: 'learning' },
  { name: 'No Social Media',    icon: '📵', category: 'learning' },
  { name: 'Journaling',         icon: '📝', category: 'evening' },
  { name: 'Sleep by 11pm',      icon: '😴', category: 'evening' },
  { name: 'Cold Shower',        icon: '🚿', category: 'morning' },
  { name: 'Healthy Eating',     icon: '🥗', category: 'health' },
  { name: 'Evening Walk',       icon: '🌅', category: 'evening' },
] as const

export const STREAK_MILESTONES = [3, 7, 14, 21, 30, 60, 90, 180, 365] as const

export const MOTIVATION_QUOTES = [
  "The secret of getting ahead is getting started.",
  "Discipline is the bridge between goals and accomplishment.",
  "Small daily improvements are the key to staggering long-term results.",
  "Every morning you have two choices: continue to sleep with your dreams, or wake up and chase them.",
  "The difference between who you are and who you want to be is what you do.",
  "Success is the sum of small efforts, repeated day in and day out.",
  "Consistency is what transforms average into excellence.",
  "Don't wait for the perfect moment. Take the moment and make it perfect.",
  "Your habits will take you farther than your motivation ever will.",
  "Be the person your future self will thank you for.",
  "Discipline weighs ounces. Regret weighs tons.",
  "One day or day one — you decide.",
] as const
