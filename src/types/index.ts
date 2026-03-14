// ═══════════════════════════════════════════════════════════════
//  ZENITH — Core TypeScript Types  (canonical, single source)
// ═══════════════════════════════════════════════════════════════

// ── Theme Types ──────────────────────────────────────────────
export type ThemeId =
  | 'dark-cyber'
  | 'cosmic'
  | 'inferno'
  | 'tactician'
  | 'gold-luxe'

export type ThemeTier = 'free' | 'premium'

export interface ThemeConfig {
  id:           ThemeId
  name:         string
  description:  string
  tier:         ThemeTier
  previewColor: string
  gradientFrom: string
  gradientTo:   string
  particleType: 'grid' | 'stars' | 'fire' | 'scanline' | 'dust'
  navStyle:     'neon' | 'hud' | 'flame' | 'tron' | 'gold'
  fontDisplay:  string
  fontBody:     string
  layout?: {
    cardStyle:       string
    navigationStyle: string
    animationStyle:  string
    particleStyle:   string
  }
  shareCardBg?: [string, string]
}

// ── User Types ───────────────────────────────────────────────
export type UserPlan = 'free' | 'premium'
export type UserRole = 'user' | 'admin'
export type LevelName = 'Bronze' | 'Silver' | 'Gold' | 'Diamond' | 'King'

export interface User {
  id: string
  username: string | null
  email: string | null
  avatar: string
  profile_photo_url: string | null
  age: string | null
  goals: string[] | null
  xp: number
  weekly_xp: number
  monthly_xp: number
  level_name: LevelName
  streak: number
  longest_streak: number
  last_checkin_date: string | null
  last_shield_reset: string | null
  monthly_shields_remaining: number
  consecutive_miss_days: number        // FIX: was missing
  timezone: string | null              // FIX: was missing
  active_theme: ThemeId
  plan: UserPlan
  is_premium: boolean
  premium_expiry: string | null
  trial_used: boolean
  role: UserRole
  blocked: boolean
  block_reason: string | null
  water_goal_ml: number
  join_date: string
  last_online: string
  created_at: string
  updated_at: string
}

// ── Habit Types ──────────────────────────────────────────────
export type HabitFrequency = 'daily'

export interface HabitCategory {
  id: string
  user_id: string
  name: string
  icon: string
  color: string
  sort_order: number
  created_at: string
}

export interface Habit {
  id: string
  user_id: string
  name: string
  icon: string
  category_id: string | null
  category: string
  sort_order: number
  active: boolean
  xp_value: number
  frequency: HabitFrequency
  created_at: string
  updated_at: string
}

export interface HabitLog {
  id: string
  user_id: string
  habit_id: string
  date: string
  completed: boolean
  created_at: string
  updated_at: string
}

export interface HabitWithLog extends Habit {
  completed_today: boolean
  last_7_days: boolean[]
  current_streak: number
}

// ── XP Types ─────────────────────────────────────────────────
// FIX: single canonical set matching xpEngine.ts (authoritative, writes to DB)
export type XPTransactionType =
  | 'habit_complete'
  | 'habit_miss'
  | 'streak_penalty'          // FIX: was streak_miss_penalty in index.ts
  | 'perfect_day'
  | 'sleep_bonus'
  | 'focus_bonus'
  | 'pomodoro_session'        // FIX: was pomodoro_complete in index.ts
  | 'achievement_reward'      // FIX: was achievement_unlock in index.ts
  | 'challenge_complete'
  | 'admin_grant'
  | 'admin_deduct'

export interface XPTransaction {
  id: string
  user_id: string
  amount: number
  type: XPTransactionType
  description: string | null
  habit_id: string | null
  date: string
  created_at: string
}

export interface LevelInfo {
  name: LevelName
  minXP: number
  maxXP: number
  badge: string
  color: string
}

// ── Streak Types ─────────────────────────────────────────────
export interface StreakMilestone {
  days: number
  label: string
  icon: string
  xpBonus: number
}

// ── Achievement Types ─────────────────────────────────────────
// FIX: unified with achievements.ts (runtime source of truth)
export type AchievementRarity = 'common' | 'rare' | 'epic' | 'legendary'

export type AchievementCategory =
  | 'streak'
  | 'habits'    // FIX: was 'habit' in index.ts
  | 'xp'
  | 'focus'     // FIX: was 'pomodoro' in index.ts
  | 'wellness'
  | 'social'
  | 'mastery'   // FIX: was 'challenge','premium','general' in index.ts

export interface Achievement {
  id: string
  icon: string
  title: string           // FIX: was 'name' in index.ts
  description: string
  category: AchievementCategory
  rarity: AchievementRarity   // FIX: was 'tier: ThemeTier' in index.ts
  xp_reward: number
  condition: {
    type:
      | 'streak_days'
      | 'habits_completed'
      | 'perfect_days'
      | 'total_xp'
      | 'pomodoro_sessions'
      | 'water_days'
      | 'checkin_days'
      | 'level_reached'
      | 'habits_added'
      | 'challenges_completed'
      | 'weekly_perfect'
    threshold: number
  }
}

export interface UserAchievement {
  id: string
  user_id: string
  achievement_id: string
  unlocked_at: string
  achievement?: Achievement
}

// ── Challenge Types ───────────────────────────────────────────
export type ChallengeKind =
  | 'habit_streak'
  | 'xp_race'
  | 'perfect_week'
  | 'pomodoro_sprint'

export type ChallengeStatus = 'active' | 'completed' | 'failed' | 'abandoned'

export interface Challenge {
  id:            string
  title:         string
  description:   string | null
  icon:          string
  kind:          ChallengeKind
  duration_days: number
  target_value:  number
  xp_reward:     number
  badge_icon:    string
  badge_name:    string | null
  tier:          ThemeTier
  active:        boolean
  sort_order:    number
  created_at:    string
  type?:         'preset' | 'custom'
  habits_json?:  Record<string, string>[]
}

export interface ChallengeParticipant {
  id:                 string
  challenge_id:       string
  user_id:            string
  status:             ChallengeStatus
  progress_value:     number
  consecutive_misses: number
  joined_at:          string
  completed_at:       string | null
  failed_at:          string | null
  username?:          string | null
  avatar?:            string
  level_name?:        string
}

export interface ChallengeProgressLog {
  id:           string
  challenge_id: string
  user_id:      string
  date:         string
  value:        number
  created_at:   string
}

export interface UserChallenge {
  id:           string
  user_id:      string
  challenge_id: string
  status:       ChallengeStatus
  current_day:  number
  best_day:     number
  started_at:   string
  completed_at: string | null
  failed_at:    string | null
  xp_earned:    number
  created_at:   string
  challenge?:   Challenge
  participant?: ChallengeParticipant
}

// ── Notification Types ────────────────────────────────────────
export type NotificationType =
  | 'streak_milestone'
  | 'level_up'
  | 'achievement'
  | 'challenge_update'
  | 'weekly_report'
  | 'reaction'
  | 'comment'
  | 'leaderboard'
  | 'challenge_invite'
  | 'premium_expiring'
  | 'admin_message'
  | 'broadcast'
  | 'habit_reminder'

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string | null
  message: string | null
  data: Record<string, unknown>
  read: boolean
  created_at: string
}

// ── Community Types ───────────────────────────────────────────
export type PostType = 'post' | 'poll' | 'announcement' | 'challenge_spotlight'

export interface CommunityPost {
  id: string
  user_id: string | null
  admin_id: string | null
  body: string | null
  img: string | null
  type: PostType
  options: string[] | null
  pinned: boolean
  ts: number
  created_at: string
  updated_at: string
  reactions?: PostReaction[]
  comments?: PostComment[]
  poll_votes?: PollVote[]
}

export interface PostReaction {
  id: string
  post_id: string
  user_id: string
  type: 'heart' | 'fire' | 'clap' | 'mind_blown'
  created_at: string
}

export interface PostComment {
  id: string
  post_id: string
  user_id: string | null
  user_name: string | null
  text: string
  reported: boolean
  report_count: number
  deleted: boolean
  created_at: string
}

export interface PollVote {
  id: string
  post_id: string
  user_id: string
  option_idx: number
  created_at: string
}

// ── Daily Check-in Types ──────────────────────────────────────
export interface DailyCheckin {
  id: string
  user_id: string
  date: string
  sleep: number | null
  focus: number | null
  mood: number | null
  energy: number | null
  stress: number | null
  notes: string | null
  created_at: string
  updated_at: string
}

// ── Water Log Types ───────────────────────────────────────────
export interface WaterEntry {
  time: string
  amount_ml: number
}

export interface WaterLog {
  id: string
  user_id: string
  date: string
  amount_ml: number
  entries: WaterEntry[]
  created_at: string
  updated_at: string
}

// ── Pomodoro Types ────────────────────────────────────────────
export interface PomodoroSession {
  id: string
  user_id: string
  habit_id: string | null
  label: string | null
  duration_min: number
  break_min: number
  rounds: number
  completed: boolean
  xp_earned: number
  date: string
  started_at: string
  ended_at: string | null
  created_at: string
}

// ── Subscription Types ────────────────────────────────────────
export type SubscriptionPlan = 'monthly' | 'yearly'
export type SubscriptionStatus = 'active' | 'cancelled' | 'expired' | 'pending' | 'failed'

export interface Subscription {
  id: string
  user_id: string
  plan: SubscriptionPlan
  status: SubscriptionStatus
  amount: number
  currency: string
  razorpay_order_id: string | null
  razorpay_payment_id: string | null
  razorpay_signature: string | null
  started_at: string
  expires_at: string | null
  next_billing_at: string | null
  cancelled_at: string | null
  granted_by_admin: boolean
  admin_note: string | null
  created_at: string
  updated_at: string
}

// ── Weekly Report Types ───────────────────────────────────────
export interface WeeklyReport {
  id: string
  user_id: string
  week_start: string
  week_end: string
  report_text: string | null
  highlights: string[] | null
  stats: {
    xp_gained: number
    habits_completed: number
    habits_total: number
    best_day: string | null
    worst_day: string | null
    avg_mood: number | null
    avg_sleep: number | null
    avg_focus: number | null
    streak_at_end: number
    discipline_pct: number
    water_avg_ml: number | null
    pomodoro_sessions: number
  }
  generated_at: string
  read_at: string | null
}

// ── App Settings Types ────────────────────────────────────────
export interface PremiumPricing {
  monthly: number
  yearly: number
  currency: string
  symbol: string
  monthly_display: string
  yearly_display: string
}

export interface XPConfig {
  habit_complete: number
  habit_miss: number
  streak_miss_penalty: number
  perfect_day_bonus: number
  sleep_bonus: number
  focus_bonus: number
  pomodoro_bonus: number
}

export interface ShieldConfig {
  free_per_month: number
  premium_per_month: number
  resets_on_first: boolean
}

// ── Leaderboard Types ─────────────────────────────────────────
export type LeaderboardPeriod = 'weekly' | 'monthly' | 'alltime'

export interface LeaderboardEntry {
  id: string
  username: string | null
  avatar: string
  level_name: LevelName
  streak: number
  plan: UserPlan
  rank: number
}

// ── Sharing Card Types ────────────────────────────────────────
export type SharingCardType =
  | 'streak_milestone'
  | 'level_up'
  | 'achievement'
  | 'weekly_stats'
  | 'challenge_complete'
  | 'perfect_day'

// ── API Response Types ────────────────────────────────────────
export interface ApiResponse<T> {
  data: T | null
  error: string | null
  success: boolean
}

// ── Admin Types ───────────────────────────────────────────────
export type AdminActionType =
  | 'grant_premium'
  | 'revoke_premium'
  | 'ban_user'
  | 'unban_user'
  | 'delete_post'
  | 'delete_comment'
  | 'reset_streak'
  | 'create_challenge'
  | 'disable_challenge'
  | 'broadcast_sent'
  | 'maintenance_on'
  | 'maintenance_off'

export interface AdminLog {
  id:             string
  admin_id:       string
  action:         AdminActionType
  target_user_id: string | null
  target_id:      string | null
  notes:          string | null
  created_at:     string
  admin_username?: string | null
  target_username?: string | null
}

export interface AdminPlatformStats {
  total_users:            number
  active_users_today:     number
  premium_users:          number
  active_challenges:      number
  community_posts:        number
  habits_completed_today: number
  new_users_this_week:    number
  total_habits:           number
}

export interface BroadcastMessage {
  id:              string
  admin_id:        string
  title:           string
  message:         string
  sent_at:         string
  recipient_count: number
}

export interface FeedbackItem {
  id:         string
  user_id:    string
  type:       'bug' | 'feature' | 'general'
  message:    string
  status:     'open' | 'reviewed' | 'resolved'
  created_at: string
  username?:  string | null
}

export interface MaintenanceStatus {
  enabled:    boolean
  message:    string
  updated_at: string
  updated_by: string | null
}
