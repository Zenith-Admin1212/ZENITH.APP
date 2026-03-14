import { supabase } from '@/lib/supabase/client'
import type { User } from '@/types'

// ═══════════════════════════════════════════════════════════════
//  Premium Service
//
//  Single source of truth for feature access logic.
//  Premium state derives from BOTH user.is_premium (DB boolean,
//  set by admin) and user.plan === 'premium' (existing enum).
//  Both paths grant full premium access.
//
//  Phase 12 will add Razorpay subscription checks.
//  Phase 13 admin panel will set is_premium directly.
//  No payment logic lives here.
// ═══════════════════════════════════════════════════════════════

// ── Feature registry ──────────────────────────────────────────
// Each feature key maps to its display label and description.
// Used by UpgradeModal comparison table and PremiumGate tooltip.

export type PremiumFeature =
  | 'themes'
  | 'analytics_export'
  | 'challenges_premium'
  | 'ai_reports'
  | 'advanced_stats'
  | 'unlimited_habits'

export const PREMIUM_FEATURES: Record<PremiumFeature, {
  icon:        string
  label:       string
  description: string
  free:        string   // what free users get
  premium:     string   // what premium users get
}> = {
  themes: {
    icon:        '🎨',
    label:       'Premium Themes',
    description: 'Cosmic, Inferno, Tactician & Gold Luxe themes',
    free:        'Dark Cyber only',
    premium:     'All 5 themes unlocked',
  },
  analytics_export: {
    icon:        '📊',
    label:       'Analytics Export',
    description: 'Download a full 1200×1600 PNG analytics report',
    free:        'View only',
    premium:     'Export & share reports',
  },
  challenges_premium: {
    icon:        '🏆',
    label:       'Elite Challenges',
    description: 'Access 30-day, XP Race & Pomodoro Marathon challenges',
    free:        '4 standard challenges',
    premium:     'All 8 challenges',
  },
  ai_reports: {
    icon:        '🤖',
    label:       'AI Weekly Reports',
    description: 'Personalised AI-generated performance insights every week',
    free:        'Not available',
    premium:     'Weekly AI analysis',
  },
  advanced_stats: {
    icon:        '📈',
    label:       'Advanced Analytics',
    description: 'Trend analysis, discipline score breakdown, heatmaps',
    free:        'Basic stats',
    premium:     'Full analytics suite',
  },
  unlimited_habits: {
    icon:        '∞',
    label:       'Unlimited Habits',
    description: 'Track as many habits as you want',
    free:        'Up to 7 habits',
    premium:     'Unlimited habits',
  },
}

// ── Core premium check ─────────────────────────────────────────
// Derives from DB boolean AND plan enum — whichever is set.
export function deriveIsPremium(user: User | null): boolean {
  if (!user) return false
  return user.is_premium === true || user.plan === 'premium'
}

// ── Per-feature gate ─────────────────────────────────────────
export function isFeatureLocked(
  feature:   PremiumFeature,
  isPremium: boolean
): boolean {
  // All premium features require premium
  return !isPremium
}

// ── Re-fetch premium status from DB ──────────────────────────
// Called after admin grants/revokes premium to sync local state.
export async function fetchPremiumStatus(userId: string): Promise<{
  is_premium: boolean
  plan:       string
  premium_expiry: string | null
}> {
  const { data, error } = await supabase
    .from('users')
    .select('is_premium, plan, premium_expiry')
    .eq('id', userId)
    .single()

  if (error) throw error

  return {
    is_premium:     data.is_premium  ?? false,
    plan:           data.plan        ?? 'free',
    premium_expiry: data.premium_expiry ?? null,
  }
}

// ── Premium feature list ordered for comparison table ────────
export const FEATURE_TABLE_ORDER: PremiumFeature[] = [
  'unlimited_habits',
  'themes',
  'challenges_premium',
  'analytics_export',
  'advanced_stats',
  'ai_reports',
]
