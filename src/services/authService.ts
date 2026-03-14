import { supabase } from '@/lib/supabase/client'
import type { User } from '@/types'

// Safe origin helper — works in both browser and SSR
const getOrigin = () =>
  typeof window !== 'undefined'
    ? window.location.origin
    : (process.env.NEXT_PUBLIC_APP_URL ?? 'https://zenith.app')

// ═══════════════════════════════════════════════════════════════
//  ZENITH — Auth Service
//  All authentication operations via Supabase Auth
// ═══════════════════════════════════════════════════════════════

export interface SignUpData {
  email: string
  password: string
  username: string
}

export interface SignInData {
  email: string
  password: string
}

// ── Sign Up ──────────────────────────────────────────────────────
export async function signUp({ email, password, username }: SignUpData) {
  const { data, error } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    options: {
      data: { username: username.trim() },
      emailRedirectTo: `${getOrigin()}/auth/callback`,
    },
  })
  if (error) throw error
  return data
}

// ── Sign In ───────────────────────────────────────────────────────
export async function signIn({ email, password }: SignInData) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  })
  if (error) throw error
  return data
}

// ── Google OAuth ──────────────────────────────────────────────────
export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${getOrigin()}/auth/callback`,
      queryParams: { access_type: 'offline', prompt: 'consent' },
    },
  })
  if (error) throw error
  return data
}

// ── Sign Out ──────────────────────────────────────────────────────
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

// ── Forgot Password ───────────────────────────────────────────────
export async function sendPasswordReset(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(
    email.trim().toLowerCase(),
    { redirectTo: `${getOrigin()}/auth/reset-password` }
  )
  if (error) throw error
}

// ── Get Session ───────────────────────────────────────────────────
export async function getSession() {
  const { data: { session }, error } = await supabase.auth.getSession()
  if (error) throw error
  return session
}

// ── Get Current User Profile ──────────────────────────────────────
export async function getUserProfile(userId: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    // PGRST116 = row not found — user hasn't completed onboarding yet
    if (error.code === 'PGRST116') return null
    throw error
  }
  return data as User
}

// ── Create User Profile (called after onboarding) ────────────────
export async function createUserProfile(
  userId: string,
  data: {
    username: string
    avatar: string
    age: string
    goals: string[]
    active_theme: string
  }
): Promise<User> {
  const { data: user, error } = await supabase
    .from('users')
    .upsert({
      id: userId,
      ...data,
      xp: 0,
      streak: 0,
      longest_streak: 0,
      monthly_shields_remaining: 3,
      plan: 'free',
      role: 'user',
      blocked: false,
      water_goal_ml: 2000,
      join_date: new Date().toISOString().split('T')[0],
    })
    .select()
    .single()

  if (error) throw error
  return user as User
}

// ── Insert Default Habits ─────────────────────────────────────────
export async function insertDefaultHabits(
  userId: string,
  religion: 'muslim' | 'other' | 'custom',
  habits: Array<{ name: string; icon: string; category: string }>
) {
  if (habits.length === 0) return

  const rows = habits.map((h, i) => ({
    user_id: userId,
    name: h.name,
    icon: h.icon,
    category: h.category,
    sort_order: i,
    active: true,
    xp_value: 15,
    frequency: 'daily',
  }))

  const { error } = await supabase.from('habits').insert(rows)
  if (error) throw error
}

// ── Check if user has completed onboarding ───────────────────────
export async function hasCompletedOnboarding(userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('users')
    .select('username')
    .eq('id', userId)
    .single()

  return !!data?.username
}
