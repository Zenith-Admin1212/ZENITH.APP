'use client'

import { useAuth } from '@/hooks/useAuth'
import { useUserStore } from '@/stores/userStore'
import { useXPStore } from '@/stores/xpStore'
import { useStreakStore } from '@/stores/streakStore'
import { useEffect, useState } from 'react'
import { BottomNav }           from './BottomNav'
import { SideMenu }            from './SideMenu'
import { TopBar }              from './TopBar'
import { NotificationPanel }   from './NotificationPanel'
import { ThemeParticles }      from '@/components/themes/ThemeParticles'
import { GlobalModalLayer }    from '@/components/animations/GlobalModalLayer'
import { XPFloatOverlay }      from '@/components/animations/XPFloatOverlay'
import { PWAInstallPrompt }    from '@/components/pwa/PWAInstallPrompt'
import { SplashScreen }        from '@/features/splash/components/SplashScreen'

// ═══════════════════════════════════════════════════════════════
//  AppShell
//  The client wrapper that:
//  1. Initialises the auth session (useAuth)
//  2. Syncs DB user data into Zustand stores
//  3. Renders: particles → content → top bar → bottom nav
//             side menu → notifications → modals → XP floats
// ═══════════════════════════════════════════════════════════════

interface AppShellProps {
  children: React.ReactNode
  showTopBar?: boolean
  topBarTitle?: string
}

function useStoreSync() {
  const { user } = useUserStore()
  const { setXP, setWeeklyXP, setMonthlyXP } = useXPStore()
  const { setStreak, setLongestStreak, setLastCheckinDate, setShields } = useStreakStore()

  useEffect(() => {
    if (!user) return
    setXP(user.xp ?? 0)
    setWeeklyXP(user.weekly_xp ?? 0)
    setMonthlyXP(user.monthly_xp ?? 0)
    setStreak(user.streak ?? 0)
    setLongestStreak(user.longest_streak ?? 0)
    setLastCheckinDate(user.last_checkin_date ?? null)
    setShields(user.monthly_shields_remaining ?? 3)
  }, [user, setXP, setWeeklyXP, setMonthlyXP, setStreak, setLongestStreak, setLastCheckinDate, setShields])
}

export function AppShell({ children, showTopBar = true, topBarTitle }: AppShellProps) {
  const { isLoading } = useAuth()
  const { user, isInitialized } = useUserStore()
  const [splashDone, setSplashDone] = useState(false)

  // Sync user data from DB into individual stores
  useStoreSync()

  // ── Splash screen ─────────────────────────────────────────────
  // Shows on first visit this session. Renders regardless of auth
  // state — it runs while auth is initialising, not after.
  if (!splashDone) {
    return (
      <div style={{ background: 'var(--color-bg)', minHeight: '100vh' }}>
        <SplashScreen onDone={() => setSplashDone(true)} />
      </div>
    )
  }

  // ── Auth still loading (after splash) ────────────────────────
  // Splash already played; show minimal indicator if auth still
  // hasn't resolved. In practice this is <100ms after splash.
  if (!isInitialized || isLoading) {
    return (
      <div
        className="fixed inset-0 flex items-center justify-center"
        style={{ background: 'var(--color-bg)' }}
      >
        <div
          className="w-1.5 h-1.5 rounded-full animate-pulse"
          style={{ background: 'var(--color-primary)', boxShadow: 'var(--glow-sm)' }}
        />
      </div>
    )
  }

  // ── Not authenticated — middleware handles redirect ─────────────
  if (!user) return null

  return (
    <div
      className="relative min-h-screen"
      style={{ background: 'var(--color-bg)' }}
    >
      {/* Layer 0: Theme background particles */}
      <ThemeParticles />

      {/* Layer 1: Main content */}
      <div
        className="relative z-10 flex flex-col"
        style={{
          minHeight: '100vh',
          paddingBottom: 'calc(64px + env(safe-area-inset-bottom))',
        }}
      >
        {showTopBar && <TopBar title={topBarTitle} />}
        <main className="flex-1">
          {children}
        </main>
      </div>

      {/* Layer 2: Fixed navigation */}
      <BottomNav />

      {/* Layer 3: Drawers (above nav) */}
      <SideMenu />
      <NotificationPanel />

      {/* Layer 4: Modals + overlays (topmost) */}
      <GlobalModalLayer />
      <XPFloatOverlay />
      <PWAInstallPrompt />
    </div>
  )
}
