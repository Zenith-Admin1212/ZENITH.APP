'use client'

import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import {
  BarChart3, Target, Award, Timer, FileText,
  Settings, MessageSquare, Crown, X, LogOut,
  ChevronRight, Zap,
} from 'lucide-react'
import { useUIStore } from '@/stores/uiStore'
import { useUserStore } from '@/stores/userStore'
import { useXPStore, getXPProgress } from '@/stores/xpStore'
import { signOut } from '@/services/authService'
import { cn } from '@/lib/utils/cn'

const MENU_ITEMS = [
  { id: 'analytics',    href: '/app/analytics',    icon: BarChart3,      label: 'Analytics',     desc: 'Charts & insights'      },
  { id: 'challenges',   href: '/app/challenges',   icon: Target,         label: 'Challenges',    desc: '30/90 day programs'     },
  { id: 'achievements', href: '/app/achievements', icon: Award,          label: 'Achievements',  desc: '33 badges to unlock'    },
  { id: 'pomodoro',     href: '/app/pomodoro',     icon: Timer,          label: 'Focus Timer',   desc: 'Pomodoro sessions'      },
  { id: 'reports',      href: '/app/reports',      icon: FileText,       label: 'AI Report',     desc: 'Weekly AI summary',     premium: true },
  { id: 'settings',     href: '/app/settings',     icon: Settings,       label: 'Settings',      desc: 'Preferences & reminders' },
  { id: 'feedback',     href: '/app/feedback',     icon: MessageSquare,  label: 'Feedback',      desc: 'Report bugs, ideas'     },
]

const LEVEL_COLORS: Record<string, string> = {
  Bronze:  '#cd7f32',
  Silver:  '#c0c0c0',
  Gold:    '#ffd700',
  Diamond: '#b9f2ff',
  King:    '#f59e0b',
}

export function SideMenu() {
  const router = useRouter()
  const { sideMenuOpen, closeSideMenu } = useUIStore()
  const { user } = useUserStore()
  const { xp, levelName } = useXPStore()

  const progress = getXPProgress(xp)
  const levelColor = LEVEL_COLORS[levelName] || '#00f5ff'

  const handleNav = (href: string) => {
    closeSideMenu()
    router.push(href)
  }

  const handleSignOut = async () => {
    closeSideMenu()
    await signOut()
  }

  return (
    <AnimatePresence>
      {sideMenuOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
            onClick={closeSideMenu}
          />

          {/* Drawer */}
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 38 }}
            className="fixed left-0 top-0 bottom-0 z-50 w-72 flex flex-col safe-top safe-bottom"
            style={{
              background: 'var(--color-bg-secondary)',
              borderRight: '1px solid var(--color-border)',
            }}
          >
            {/* ── Header ── */}
            <div
              className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: '1px solid var(--color-border)' }}
            >
              <div className="flex items-center gap-2.5">
                <Image
                  src="/images/logo.png"
                  alt="ZENITH"
                  width={28}
                  height={28}
                  style={{ filter: 'drop-shadow(0 0 8px var(--color-primary-glow))' }}
                />
                <span className="font-display font-black tracking-[0.2em] text-sm text-glow">
                  ZENITH
                </span>
              </div>
              <button
                onClick={closeSideMenu}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                style={{ background: 'var(--color-surface)', color: 'var(--color-text-muted)' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* ── User profile strip ── */}
            {user && (
              <button
                onClick={() => handleNav('/app/profile')}
                className="flex items-center gap-3 px-5 py-4 transition-colors group"
                style={{ borderBottom: '1px solid var(--color-border)' }}
              >
                {/* Avatar */}
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center text-2xl flex-shrink-0"
                  style={{
                    background: 'var(--color-surface-active)',
                    border: '2px solid var(--color-border-glow)',
                    boxShadow: 'var(--glow-sm)',
                  }}
                >
                  {user.avatar || '⚡'}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-display font-bold text-sm truncate">{user.username}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-xs font-semibold" style={{ color: levelColor }}>
                      {levelName}
                    </span>
                    <span className="text-zenith-faint text-xs">·</span>
                    <span className="text-zenith-muted text-xs">{xp.toLocaleString()} XP</span>
                    {user.plan === 'premium' && (
                      <>
                        <span className="text-zenith-faint text-xs">·</span>
                        <Crown size={10} style={{ color: '#f59e0b' }} />
                      </>
                    )}
                  </div>

                  {/* XP progress bar */}
                  <div className="mt-1.5 h-1 rounded-full overflow-hidden" style={{ background: 'var(--color-surface)' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress.progressPct}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
                      className="h-full rounded-full"
                      style={{ background: 'var(--gradient-primary)' }}
                    />
                  </div>
                </div>

                <ChevronRight
                  size={16}
                  className="flex-shrink-0 transition-transform group-hover:translate-x-1"
                  style={{ color: 'var(--color-text-faint)' }}
                />
              </button>
            )}

            {/* ── Nav items ── */}
            <nav className="flex-1 overflow-y-auto custom-scroll py-3">
              <div className="px-3 space-y-0.5">
                {MENU_ITEMS.map((item, i) => {
                  const Icon = item.icon
                  const isPremiumLocked = item.premium && user?.plan !== 'premium'

                  return (
                    <motion.button
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.05 + i * 0.04, duration: 0.3 }}
                      onClick={() => isPremiumLocked ? handleNav('/premium') : handleNav(item.href)}
                      className="w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-150 group text-left"
                      style={{ background: 'transparent' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--color-surface-hover)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent'
                      }}
                    >
                      {/* Icon container */}
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-200 group-hover:scale-110"
                        style={{
                          background: 'var(--color-surface)',
                          border: '1px solid var(--color-border)',
                        }}
                      >
                        <Icon
                          size={17}
                          style={{ color: isPremiumLocked ? '#f59e0b' : 'var(--color-primary)' }}
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold font-display tracking-wide truncate">
                            {item.label}
                          </span>
                          {item.premium && (
                            <Crown size={10} style={{ color: '#f59e0b', flexShrink: 0 }} />
                          )}
                        </div>
                        <p className="text-xs text-zenith-faint truncate">{item.desc}</p>
                      </div>

                      {isPremiumLocked ? (
                        <span
                          className="text-2xs font-bold px-1.5 py-0.5 rounded font-display tracking-wider flex-shrink-0"
                          style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)', fontSize: '9px' }}
                        >
                          PRO
                        </span>
                      ) : (
                        <ChevronRight
                          size={14}
                          className="opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-0.5 flex-shrink-0"
                          style={{ color: 'var(--color-text-faint)' }}
                        />
                      )}
                    </motion.button>
                  )
                })}
              </div>

              {/* Premium CTA (for free users) */}
              {user?.plan === 'free' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="mx-3 mt-4"
                >
                  <button
                    onClick={() => handleNav('/premium')}
                    className="w-full p-3 rounded-xl text-left transition-all duration-200"
                    style={{
                      background: 'linear-gradient(135deg, rgba(245,158,11,0.12) 0%, rgba(245,158,11,0.06) 100%)',
                      border: '1px solid rgba(245,158,11,0.3)',
                    }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Crown size={14} style={{ color: '#f59e0b' }} />
                      <span className="text-xs font-bold font-display tracking-wider" style={{ color: '#f59e0b' }}>
                        UNLOCK PREMIUM
                      </span>
                    </div>
                    <p className="text-2xs text-zenith-muted leading-relaxed">
                      5 themes · AI reports · 90-day challenge · Analytics PDF
                    </p>
                    <div className="mt-2 flex items-baseline gap-1">
                      <span className="text-sm font-black font-display" style={{ color: '#fbbf24' }}>₹149</span>
                      <span className="text-xs text-zenith-faint">/month</span>
                    </div>
                  </button>
                </motion.div>
              )}
            </nav>

            {/* ── Footer ── */}
            <div
              className="px-5 py-4"
              style={{ borderTop: '1px solid var(--color-border)' }}
            >
              <button
                onClick={handleSignOut}
                className="flex items-center gap-3 w-full py-2 transition-colors group"
              >
                <LogOut
                  size={16}
                  className="group-hover:text-red-400 transition-colors"
                  style={{ color: 'var(--color-text-faint)' }}
                />
                <span
                  className="text-sm font-medium group-hover:text-red-400 transition-colors"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  Sign Out
                </span>
              </button>

              <p className="text-2xs text-zenith-faint mt-3 font-mono">
                ZENITH v1.0 · {user?.plan === 'premium' ? '👑 Premium' : 'Free Plan'}
              </p>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
