import { supabase } from '@/lib/supabase/client'
import type { ThemeId } from '@/types'

// ═══════════════════════════════════════════════════════════════
//  Theme Service — Supabase sync for theme changes
// ═══════════════════════════════════════════════════════════════

/**
 * Persist the user's active theme selection to the database.
 * Called immediately after a local theme switch so the selection
 * survives cross-device and post-logout re-login.
 */
export async function updateUserTheme(userId: string, themeId: ThemeId): Promise<void> {
  const { error } = await supabase
    .from('users')
    .update({
      active_theme: themeId,
      updated_at:   new Date().toISOString(),
    })
    .eq('id', userId)

  if (error) throw error
}

/**
 * Fetch the user's stored theme from the DB.
 * Used on app init to restore theme before first render.
 */
export async function fetchUserTheme(userId: string): Promise<ThemeId | null> {
  const { data, error } = await supabase
    .from('users')
    .select('active_theme')
    .eq('id', userId)
    .single()

  if (error || !data) return null
  return data.active_theme as ThemeId
}
