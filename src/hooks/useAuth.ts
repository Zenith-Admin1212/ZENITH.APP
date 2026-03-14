'use client'

import { useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { useUserStore } from '@/stores/userStore'
import { useThemeStore } from '@/stores/themeStore'
import { getUserProfile } from '@/services/authService'
import type { ThemeId } from '@/types'

// ═══════════════════════════════════════════════════════════════
//  useAuth — Session persistence and user state sync
//  Initializes user from Supabase session on mount.
//  Syncs theme from DB profile.
//  Listens for auth state changes (login, logout, token refresh).
// ═══════════════════════════════════════════════════════════════

export function useAuth() {
  const router = useRouter()
  const { user, setUser, setLoading, setInitialized, clearUser } = useUserStore()
  const { setTheme } = useThemeStore()

  const loadUser = useCallback(async (userId: string) => {
    try {
      const profile = await getUserProfile(userId)
      if (profile) {
        setUser(profile)
        // Sync theme from DB
        if (profile.active_theme) {
          setTheme(profile.active_theme as ThemeId)
          document.documentElement.setAttribute('data-theme', profile.active_theme)
        }
      }
    } catch (err) {
      console.error('[useAuth] Failed to load user profile:', err)
    }
  }, [setUser, setTheme])

  useEffect(() => {
    let mounted = true

    async function init() {
      setLoading(true)
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user && mounted) {
          await loadUser(session.user.id)
        }
      } finally {
        if (mounted) {
          setLoading(false)
          setInitialized(true)
        }
      }
    }

    init()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return

        if (event === 'SIGNED_IN' && session?.user) {
          setLoading(true)
          await loadUser(session.user.id)
          setLoading(false)
        }

        if (event === 'SIGNED_OUT') {
          clearUser()
          router.push('/login')
        }

        if (event === 'TOKEN_REFRESHED' && session?.user) {
          // Silent refresh — no UI change needed
          await loadUser(session.user.id)
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [loadUser, setLoading, setInitialized, clearUser, router])

  return { user, isLoading: useUserStore((s) => s.isLoading) }
}
