'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useUserStore } from '@/stores/userStore'

// ── App shell auth guard ──────────────────────────────────────────
// This client-side guard works alongside the middleware.
// Middleware handles server-side redirects.
// This hook handles client-side session sync and profile loading.

export function AppAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { isLoading } = useAuth()
  const { user, isInitialized } = useUserStore()

  useEffect(() => {
    if (!isInitialized) return
    if (!user) {
      router.push('/login')
      return
    }
    // Redirect to onboarding if profile not complete
    if (!user.username) {
      router.push('/onboard')
    }
  }, [user, isInitialized, router])

  if (isLoading || !isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-12 h-12 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }}
          />
          <p className="text-zenith-muted text-sm font-display tracking-widest">LOADING</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  return <>{children}</>
}
