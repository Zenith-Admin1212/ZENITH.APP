'use client'

import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell } from 'lucide-react'
import { useUIStore } from '@/stores/uiStore'
import { useUserStore } from '@/stores/userStore'
import { useNotifications }   from '@/features/notifications/hooks/useNotifications'

interface TopBarProps {
  title?: string
  showLogo?: boolean
}

export function TopBar({ title, showLogo = true }: TopBarProps) {
  const router = useRouter()
  const { toggleNotificationPanel } = useUIStore()
  const { user } = useUserStore()

  const { unreadCount } = useNotifications()

  return (
    <header
      className="sticky top-0 z-30 flex items-center justify-between px-4 safe-top"
      style={{
        height: 'var(--topbar-height, 56px)',
        background: 'rgba(var(--color-bg-rgb, 4,4,10), 0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--color-border)',
      }}
    >
      {/* Left: Logo or back */}
      {showLogo ? (
        <div className="flex items-center gap-2">
          <Image
            src="/images/logo.png"
            alt="ZENITH"
            width={28}
            height={28}
            className="object-contain"
            style={{ filter: 'drop-shadow(0 0 8px var(--color-primary-glow))' }}
          />
          <span className="font-display font-black tracking-[0.2em] text-sm text-glow">
            ZENITH
          </span>
        </div>
      ) : (
        <h1 className="font-display font-bold text-base tracking-wider">
          {title}
        </h1>
      )}

      {/* Right: Notification bell + avatar */}
      <div className="flex items-center gap-3">
        {/* Bell */}
        <button
          onClick={toggleNotificationPanel}
          className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 active:scale-90"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
          aria-label="Notifications"
        >
          <Bell
            size={18}
            style={{ color: unreadCount > 0 ? 'var(--color-primary)' : 'var(--color-text-muted)' }}
          />
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center"
                style={{ background: 'var(--color-primary)', boxShadow: 'var(--glow-sm)' }}
              >
                <span className="text-2xs font-bold" style={{ color: 'var(--color-bg)', fontSize: '9px' }}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </button>

        {/* Avatar */}
        <button
          onClick={() => router.push('/app/profile')}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-lg transition-all duration-200 active:scale-90 flex-shrink-0"
          style={{
            background: 'var(--color-surface-active)',
            border: '1px solid var(--color-border-glow)',
            boxShadow: 'var(--glow-sm)',
          }}
          aria-label="Profile"
        >
          {user?.avatar || '⚡'}
        </button>
      </div>
    </header>
  )
}
