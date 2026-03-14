import { supabase } from '@/lib/supabase/client'
import type { User, ThemeId } from '@/types'

// ── Get user profile ──────────────────────────────────────────────
export async function updateUserProfile(
  userId: string,
  updates: Partial<Pick<User, 'username' | 'avatar' | 'age' | 'goals' | 'water_goal_ml'>>
): Promise<User> {
  const { data, error } = await supabase
    .from('users')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single()

  if (error) throw error
  return data as User
}

// ── Update active theme ───────────────────────────────────────────
export async function updateUserTheme(userId: string, themeId: ThemeId): Promise<void> {
  const { error } = await supabase
    .from('users')
    .update({ active_theme: themeId, updated_at: new Date().toISOString() })
    .eq('id', userId)

  if (error) throw error
}

// ── Update last online ────────────────────────────────────────────
export async function updateLastOnline(userId: string): Promise<void> {
  const { error } = await supabase
    .from('users')
    .update({ last_online: new Date().toISOString() })
    .eq('id', userId)

  if (error) console.warn('[updateLastOnline]', error.message)
}

// ── Upload profile photo ──────────────────────────────────────────
export async function uploadProfilePhoto(userId: string, file: File): Promise<string> {
  const ext = file.name.split('.').pop()
  const path = `${userId}/avatar.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true, contentType: file.type })

  if (uploadError) throw uploadError

  const { data } = supabase.storage.from('avatars').getPublicUrl(path)
  return data.publicUrl
}
