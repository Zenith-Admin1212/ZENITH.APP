'use client'

import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import {
  LayoutDashboard,
  CalendarDays,
  Trophy,
  Users,
  Menu,
} from 'lucide-react'
import { useUIStore } from '@/stores/uiStore'
import { useTheme } from '@/lib/themes/theme-provider'
import { cn } from '@/lib/utils/cn'

const NAV_TABS = [
  { id: 'today',       href: '/app/today',       icon: LayoutDashboard, label: 'Today'  },
  { id: 'calendar',    href: '/app/calendar',    icon: CalendarDays,    label: 'Calendar' },
  { id: 'logo',        href: null,               icon: null,            label: 'ZENITH' },
  { id: 'leaderboard', href: '/app/leaderboard', icon: Trophy,          label: 'Leaders' },
  { id: 'community',   href: '/app/community',   icon: Users,           label: 'Community' },
]

export function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { toggleSideMenu } = useUIStore()
  const { activeTheme } = useTheme()

  // Determine active tab from current path
  const activeTab = NAV_TABS.find(t => t.href && pathname.startsWith(t.href))?.id ?? 'today'

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 safe-bottom"
      style={{
        background: 'var(--nav-bg)',
        borderTop: '1px solid var(--nav-border)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      <div className="flex items-center justify-around h-16 px-2 max-w-lg mx-auto">
        {NAV_TABS.map((tab) => {
          // ── Center logo tab ──────────────────────────────────────
          if (tab.id === 'logo') {
            return (
              <button
                key="logo"
                onClick={toggleSideMenu}
                className="relative flex flex-col items-center justify-center w-14 h-14 -mt-4 rounded-full transition-transform active:scale-90"
                style={{
                  background: 'var(--color-bg-secondary)',
                  border: '2px solid var(--color-border-glow)',
                  boxShadow: 'var(--glow-md)',
                }}
                aria-label="Open menu"
              >
                <Image
                  src="/images/logo.png"
                  alt="ZENITH"
                  width={30}
                  height={30}
                  className="object-contain"
                  style={{ filter: 'drop-shadow(0 0 8px var(--color-primary-glow))' }}
                />
              </button>
            )
          }

          const Icon = tab.icon!
          const isActive = activeTab === tab.id

          return (
            <button
              key={tab.id}
              onClick={() => tab.href && router.push(tab.href)}
              className="relative flex flex-col items-center justify-center gap-0.5 w-16 h-full transition-all duration-200 active:scale-90"
              aria-label={tab.label}
            >
              {/* Active indicator — style varies per theme */}
              <AnimatePresence>
                {isActive && <NavActiveIndicator theme={activeTheme} />}
              </AnimatePresence>

              <Icon
                size={22}
                strokeWidth={isActive ? 2.5 : 1.8}
                style={{
                  color: isActive ? 'var(--nav-active-color)' : 'var(--nav-inactive-color)',
                  filter: isActive ? 'drop-shadow(0 0 6px var(--color-primary-glow))' : 'none',
                  transition: 'all 0.2s',
                }}
              />
              <span
                className="text-2xs font-semibold tracking-wide font-display transition-all duration-200"
                style={{
                  color: isActive ? 'var(--nav-active-color)' : 'var(--nav-inactive-color)',
                  fontSize: '9px',
                  letterSpacing: '0.08em',
                }}
              >
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

// ── Per-theme active indicator ────────────────────────────────────
function NavActiveIndicator({ theme }: { theme: string }) {
  // Dark Cyber + Cosmic + Tactician: top line
  if (['dark-cyber', 'cosmic', 'tactician'].includes(theme)) {
    return (
      <motion.div
        layoutId="nav-indicator"
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: 1, opacity: 1 }}
        exit={{ scaleX: 0, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
        className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-full"
        style={{ background: 'var(--color-primary)', boxShadow: 'var(--glow-sm)' }}
      />
    )
  }

  // Inferno: bottom flame dot
  if (theme === 'inferno') {
    return (
      <motion.div
        layoutId="nav-indicator"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full"
        style={{ background: 'var(--color-primary)', boxShadow: '0 0 8px var(--color-primary)' }}
      />
    )
  }

  // Gold Luxe: full background highlight
  if (theme === 'gold-luxe') {
    return (
      <motion.div
        layoutId="nav-indicator"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="absolute inset-x-1 inset-y-1.5 rounded-xl"
        style={{ background: 'var(--color-surface-active)', border: '1px solid var(--color-border-glow)' }}
      />
    )
  }

  // Default
  return (
    <motion.div
      layoutId="nav-indicator"
      initial={{ scaleX: 0 }}
      animate={{ scaleX: 1 }}
      exit={{ scaleX: 0 }}
      className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-6 rounded-full"
      style={{ background: 'var(--color-primary)' }}
    />
  )
}
