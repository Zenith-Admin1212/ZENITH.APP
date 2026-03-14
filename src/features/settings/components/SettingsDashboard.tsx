'use client'

import { useState }              from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User, Bell, Palette, Sliders, Shield,
  ChevronRight, Check, Loader2, LogOut, Trash2,
  Download, Info, Save,
} from 'lucide-react'
import { useSettings, type SettingsSection } from '../hooks/useSettings'
import { ThemeSwitcher }   from '@/features/themes/components/ThemeSwitcher'
import { usePremium }      from '@/features/premium/hooks/usePremium'
import { UpgradeModal }    from '@/features/premium/components/UpgradeModal'
import { PremiumBadge }    from '@/features/premium/components/PremiumBadge'
import { EMOJI_AVATARS }   from '@/features/profile/constants/avatars'
import type { NotificationPreferences } from '../services/settingsService'
import {
  getPushPermissionState,
  requestPushPermission,
  disablePushNotifications,
  savePushPreferenceToDb,
  isServiceWorkerSupported,
} from '@/features/notifications/requestPermission'

// ═══════════════════════════════════════════════════════════════
//  SettingsDashboard  — /app/settings
//
//  Sections:
//   1. Profile     — username, avatar, age, goals
//   2. Notifications — per-type toggle switches
//   3. Theme       — embeds ThemeSwitcher
//   4. Preferences — water goal, units
//   5. Account     — sign out, data export, delete account
// ═══════════════════════════════════════════════════════════════

// ── Section nav config ────────────────────────────────────────

interface SectionDef {
  id:    SettingsSection
  icon:  React.ReactNode
  label: string
  sub:   string
}

const SECTIONS: SectionDef[] = [
  { id: 'profile',       icon: <User      size={15} />, label: 'Profile',        sub: 'Username, avatar, goals'       },
  { id: 'notifications', icon: <Bell      size={15} />, label: 'Notifications',   sub: 'Alert preferences'             },
  { id: 'theme',         icon: <Palette   size={15} />, label: 'Theme',           sub: 'Visual style'                  },
  { id: 'preferences',   icon: <Sliders   size={15} />, label: 'Preferences',     sub: 'Water goal, units'             },
  { id: 'account',       icon: <Shield    size={15} />, label: 'Account',         sub: 'Sign out, data, security'      },
]

// ── Reusable toggle switch ────────────────────────────────────

function Toggle({
  value, onChange, disabled,
}: { value: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      onClick={() => onChange(!value)}
      disabled={disabled}
      className="relative w-10 h-5.5 rounded-full transition-all flex-shrink-0"
      style={{
        background:  value ? 'var(--color-primary)' : 'var(--color-surface-active)',
        border:      `1px solid ${value ? 'var(--color-primary)' : 'var(--color-border)'}`,
        boxShadow:   value ? 'var(--glow-sm)' : 'none',
        minWidth: 40,
        height: 22,
      }}
    >
      <motion.div
        className="absolute top-0.5 w-4 h-4 rounded-full"
        animate={{ left: value ? 'calc(100% - 18px)' : '2px' }}
        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
        style={{ background: value ? 'var(--color-bg)' : 'var(--color-text-faint)' }}
      />
    </button>
  )
}

// ── Section: Profile ─────────────────────────────────────────

function ProfileSection() {
  const { user, saveProfile, isSavingProfile, saveStatus } = useSettings()

  const [username, setUsername]         = useState(user?.username ?? '')
  const [selectedAvatar, setAvatar]     = useState(user?.avatar ?? '🔥')
  const [age, setAge]                   = useState(user?.age ?? '')
  const [waterGoal, setWaterGoal]       = useState(String(user?.water_goal_ml ?? 2000))
  const [showAvatarPicker, setAvatarPicker] = useState(false)

  const isDirty =
    username !== (user?.username ?? '') ||
    selectedAvatar !== (user?.avatar ?? '') ||
    age !== (user?.age ?? '') ||
    waterGoal !== String(user?.water_goal_ml ?? 2000)

  const handleSave = () => {
    if (!isDirty) return
    saveProfile({
      username:      username.trim() || undefined,
      avatar:        selectedAvatar,
      age:           age || undefined,
      water_goal_ml: parseInt(waterGoal) || 2000,
    })
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Avatar picker */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-display font-bold tracking-wider"
          style={{ color: 'var(--color-text-muted)' }}>
          AVATAR
        </label>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setAvatarPicker(p => !p)}
            className="w-16 h-16 rounded-2xl text-3xl flex items-center justify-center transition-all"
            style={{
              background: 'var(--color-surface-active)',
              border:     '2px solid var(--color-primary)',
              boxShadow:  'var(--glow-sm)',
            }}
          >
            {selectedAvatar}
          </button>
          <div>
            <p className="text-sm font-semibold">Your avatar</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
              Tap to change
            </p>
          </div>
        </div>

        <AnimatePresence>
          {showAvatarPicker && (
            <motion.div
              initial={{ opacity: 0, y: -8, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -8, height: 0 }}
              className="rounded-2xl p-3 overflow-hidden"
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
            >
              <div className="flex flex-wrap gap-2">
                {(EMOJI_AVATARS ?? DEFAULT_AVATARS).map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => { setAvatar(emoji); setAvatarPicker(false) }}
                    className="w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all"
                    style={{
                      background: selectedAvatar === emoji
                        ? 'var(--color-surface-active)' : 'transparent',
                      border: selectedAvatar === emoji
                        ? '1px solid var(--color-primary)' : '1px solid transparent',
                    }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Username */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-display font-bold tracking-wider"
          style={{ color: 'var(--color-text-muted)' }}>
          USERNAME
        </label>
        <input
          value={username}
          onChange={e => setUsername(e.target.value)}
          maxLength={24}
          placeholder="your_username"
          className="px-4 py-3 rounded-xl text-sm outline-none"
          style={{
            background: 'var(--color-surface)',
            border:     '1px solid var(--color-border)',
            color:      'var(--color-text)',
          }}
        />
        <p className="text-xs" style={{ color: 'var(--color-text-faint)' }}>
          {username.length}/24 · Shown on leaderboard and community feed
        </p>
      </div>

      {/* Age */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-display font-bold tracking-wider"
          style={{ color: 'var(--color-text-muted)' }}>
          AGE GROUP
        </label>
        <div className="flex gap-2 flex-wrap">
          {['Under 18', '18–24', '25–34', '35–44', '45+'].map(a => (
            <button
              key={a}
              onClick={() => setAge(a)}
              className="px-3 py-2 rounded-xl text-xs font-semibold transition-all"
              style={{
                background: age === a ? 'var(--color-surface-active)' : 'var(--color-surface)',
                border:     `1px solid ${age === a ? 'var(--color-primary)' : 'var(--color-border)'}`,
                color:      age === a ? 'var(--color-primary)' : 'var(--color-text-muted)',
              }}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      {/* Water goal */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-display font-bold tracking-wider"
          style={{ color: 'var(--color-text-muted)' }}>
          DAILY WATER GOAL
        </label>
        <div className="flex items-center gap-3">
          <input
            type="number"
            value={waterGoal}
            onChange={e => setWaterGoal(e.target.value)}
            min={500} max={6000} step={100}
            className="w-24 px-3 py-2.5 rounded-xl text-sm text-center outline-none font-mono"
            style={{
              background: 'var(--color-surface)',
              border:     '1px solid var(--color-border)',
              color:      'var(--color-text)',
            }}
          />
          <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>ml / day</span>
          <div className="flex gap-1 ml-auto">
            {[1500, 2000, 2500, 3000].map(v => (
              <button key={v} onClick={() => setWaterGoal(String(v))}
                className="px-2 py-1 rounded-lg text-xs font-mono transition-all"
                style={{
                  background: waterGoal === String(v) ? 'var(--color-surface-active)' : 'var(--color-surface)',
                  border:     `1px solid ${waterGoal === String(v) ? 'var(--color-primary)' : 'var(--color-border)'}`,
                  color:      waterGoal === String(v) ? 'var(--color-primary)' : 'var(--color-text-faint)',
                }}>
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Save */}
      <SaveBar
        isDirty={isDirty}
        saveStatus={saveStatus}
        isLoading={isSavingProfile}
        onSave={handleSave}
      />
    </div>
  )
}

// ── Section: Notifications ────────────────────────────────────

const NOTIF_ITEMS: Array<{
  key:   keyof NotificationPreferences
  label: string
  sub:   string
  icon:  string
}> = [
  { key: 'streak_alerts',      label: 'Streak Reminders',  sub: 'Daily check-in reminder if you haven\'t logged today', icon: '🔥' },
  { key: 'achievement_alerts', label: 'Achievement Alerts', sub: 'Notify when you unlock a badge',                       icon: '🏅' },
  { key: 'challenge_alerts',   label: 'Challenge Updates',  sub: 'Progress, completions, and fail alerts',               icon: '🏆' },
  { key: 'community_alerts',   label: 'Community Reactions',sub: 'When someone reacts to or comments on your posts',     icon: '💬' },
  { key: 'leaderboard_alerts', label: 'Rank Changes',       sub: 'When your leaderboard position changes',               icon: '📊' },
  { key: 'broadcast_alerts',   label: 'Platform Broadcasts',sub: 'Announcements from the ZENITH team',                  icon: '📣' },
]

function NotificationsSection() {
  const { notifPrefs, notifLoading, saveNotifPrefs, saveStatus, user } = useSettings()

  const [localPrefs, setLocalPrefs] = useState<NotificationPreferences | null>(null)
  const prefs = localPrefs ?? notifPrefs

  // Push notification state
  const [pushState,    setPushState]    = useState(() => getPushPermissionState())
  const [pushLoading,  setPushLoading]  = useState(false)
  const pushSupported = typeof window !== 'undefined' && isServiceWorkerSupported()

  const toggle = (key: keyof NotificationPreferences) => {
    if (!prefs) return
    const next = { ...prefs, [key]: !prefs[key] }
    setLocalPrefs(next)
    saveNotifPrefs(next)
  }

  const handlePushToggle = async () => {
    if (!user) return
    setPushLoading(true)
    try {
      if (pushState === 'granted') {
        await disablePushNotifications(user.id)
        setPushState('default')
      } else {
        const state = await requestPushPermission()
        if (state === 'granted') {
          await savePushPreferenceToDb(user.id, true)
        }
        setPushState(state)
      }
    } finally {
      setPushLoading(false)
    }
  }

  if (notifLoading || !prefs) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-14 rounded-xl animate-pulse"
            style={{ background: 'var(--color-surface)' }} />
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl mb-1"
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
        <Info size={13} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
          These control in-app notification delivery. Enable push notifications below to receive alerts even when the app is closed.
        </p>
      </div>

      {NOTIF_ITEMS.map(item => (
        <div key={item.key}
          className="flex items-center gap-4 px-4 py-3.5 rounded-2xl"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <span className="text-xl flex-shrink-0">{item.icon}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">{item.label}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
              {item.sub}
            </p>
          </div>
          <Toggle
            value={prefs[item.key]}
            onChange={() => toggle(item.key)}
          />
        </div>
      ))}

      {/* Push notification permission toggle */}
      {pushSupported && (
        <div
          className="flex items-center gap-4 px-4 py-3.5 rounded-2xl"
          style={{
            background: 'var(--color-surface)',
            border:     `1px solid ${pushState === 'granted' ? 'var(--color-border-glow)' : 'var(--color-border)'}`,
          }}>
          <span className="text-xl flex-shrink-0">🔔</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">Push Notifications</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
              {pushState === 'granted'     ? 'Enabled — alerts arrive even when app is closed'
               : pushState === 'denied'   ? 'Blocked — enable in browser settings'
               : 'Get notified about streaks and achievements'}
            </p>
          </div>
          {pushState === 'denied' ? (
            <span className="text-xs px-2 py-1 rounded-lg"
              style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }}>
              Blocked
            </span>
          ) : (
            <Toggle
              value={pushState === 'granted'}
              onChange={handlePushToggle}
              disabled={pushLoading}
            />
          )}
        </div>
      )}

      {saveStatus !== 'idle' && (
        <SaveStatusPill status={saveStatus} />
      )}
    </div>
  )
}

// ── Section: Theme ────────────────────────────────────────────

function ThemeSection() {
  const { isPremium } = usePremium()
  const [showUpgrade, setShowUpgrade] = useState(false)

  return (
    <div className="flex flex-col gap-4">
      {!isPremium && (
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-2xl cursor-pointer"
          style={{
            background: 'linear-gradient(135deg, rgba(245,158,11,0.08), transparent)',
            border:     '1px solid rgba(245,158,11,0.25)',
          }}
          onClick={() => setShowUpgrade(true)}
        >
          <span className="text-lg">🎨</span>
          <div className="flex-1">
            <p className="text-sm font-bold" style={{ color: '#fde68a' }}>
              4 more themes available
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Cosmic, Inferno, Tactician, Gold Luxe — unlock with Premium
            </p>
          </div>
          <PremiumBadge variant="pill" size="xs" />
        </div>
      )}

      <ThemeSwitcher />

      <AnimatePresence>
        {showUpgrade && (
          <UpgradeModal triggerFeature="Premium Themes" onClose={() => setShowUpgrade(false)} />
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Section: Account ──────────────────────────────────────────

function AccountSection() {
  const { user, signOut, isSigningOut, deleteAccount, isDeletingAccount, exportData } = useSettings()
  const { isPremium } = usePremium()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [showUpgrade, setShowUpgrade]     = useState(false)

  return (
    <div className="flex flex-col gap-3">
      {/* User info */}
      <div className="flex items-center gap-4 px-4 py-4 rounded-2xl"
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
        <span className="text-4xl">{user?.avatar ?? '👤'}</span>
        <div>
          <p className="font-display font-black text-base text-glow">
            {user?.username ?? 'User'}
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
            {user?.email}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs" style={{ color: 'var(--color-text-faint)' }}>
              {user?.level_name} · {user?.xp?.toLocaleString()} XP
            </span>
            {isPremium && <PremiumBadge variant="pill" size="xs" />}
          </div>
        </div>
      </div>

      {/* Account actions */}
      {[
        {
          icon: '📤',
          label: 'Export My Data',
          sub:   'Download all your habits and logs as CSV',
          onClick: () => exportData(),
          badge: null,
        },
        {
          icon: '🔒',
          label: 'Privacy Policy',
          sub:   'How ZENITH handles your data',
          onClick: () => window.open('https://zenithapp.com/privacy', '_blank'),
          badge: null,
        },
        {
          icon: '📋',
          label: 'Terms of Service',
          sub:   'Usage terms and conditions',
          onClick: () => window.open('https://zenithapp.com/terms', '_blank'),
          badge: null,
        },
      ].map(action => (
        <button
          key={action.label}
          onClick={action.onClick}
          className="flex items-center gap-4 px-4 py-3.5 rounded-2xl text-left w-full transition-all active:scale-[0.98]"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        >
          <span className="text-xl flex-shrink-0">{action.icon}</span>
          <div className="flex-1">
            <p className="text-sm font-semibold">{action.label}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{action.sub}</p>
          </div>
          <ChevronRight size={15} style={{ color: 'var(--color-text-faint)' }} />
        </button>
      ))}

      {/* App version info */}
      <div className="px-4 py-3 rounded-2xl"
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
        <div className="flex items-center justify-between">
          <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>App Version</span>
          <span className="font-mono text-xs" style={{ color: 'var(--color-text-faint)' }}>
            ZENITH v1.0.0
          </span>
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Member since</span>
          <span className="text-xs" style={{ color: 'var(--color-text-faint)' }}>
            {user?.join_date ? new Date(user.join_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '—'}
          </span>
        </div>
      </div>

      {/* Sign out */}
      <button
        onClick={() => signOut()}
        disabled={isSigningOut}
        className="flex items-center gap-3 px-4 py-3.5 rounded-2xl w-full transition-all active:scale-[0.98]"
        style={{
          background: 'rgba(239,68,68,0.06)',
          border:     '1px solid rgba(239,68,68,0.2)',
          color:      '#f87171',
        }}
      >
        <LogOut size={16} />
        <span className="text-sm font-semibold">
          {isSigningOut ? 'Signing out…' : 'Sign Out'}
        </span>
      </button>

      {/* Delete account */}
      {!confirmDelete ? (
        <button
          onClick={() => setConfirmDelete(true)}
          className="text-xs text-center py-2 transition-all"
          style={{ color: 'var(--color-text-faint)' }}
        >
          Delete account
        </button>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-2 p-4 rounded-2xl"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}
        >
          <p className="text-sm font-bold" style={{ color: '#f87171' }}>
            Delete account permanently?
          </p>
          <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Your streaks, XP, habits and data will be permanently removed.
            This cannot be undone.
          </p>
          <div className="flex gap-2 mt-1">
            <button
              onClick={() => setConfirmDelete(false)}
              className="flex-1 py-2 rounded-xl text-xs font-semibold"
              style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-muted)',
              }}>
              Cancel
            </button>
            <button
              onClick={() => deleteAccount()}
              disabled={isDeletingAccount}
              className="flex-1 py-2 rounded-xl text-xs font-bold"
              style={{
                background: 'rgba(239,68,68,0.15)',
                border: '1px solid rgba(239,68,68,0.5)',
                color: '#ef4444',
              }}>
              {isDeletingAccount ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </motion.div>
      )}
    </div>
  )
}

// ── Shared: SaveBar + SaveStatusPill ─────────────────────────

function SaveBar({
  isDirty, saveStatus, isLoading, onSave,
}: {
  isDirty: boolean; saveStatus: string; isLoading: boolean; onSave: () => void
}) {
  if (!isDirty && saveStatus === 'idle') return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between px-4 py-3 rounded-2xl"
      style={{
        background: 'var(--color-surface-active)',
        border:     '1px solid var(--color-border-glow)',
      }}
    >
      <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
        Unsaved changes
      </span>
      <button
        onClick={onSave}
        disabled={isLoading}
        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold font-display tracking-wide transition-all"
        style={{
          background: 'var(--color-primary)',
          color:      'var(--color-bg)',
          boxShadow:  'var(--glow-sm)',
          opacity:    isLoading ? 0.7 : 1,
        }}
      >
        {isLoading
          ? <><Loader2 size={12} className="animate-spin" /> Saving…</>
          : saveStatus === 'saved'
            ? <><Check size={12} /> Saved</>
            : <><Save size={12} /> Save Changes</>
        }
      </button>
    </motion.div>
  )
}

function SaveStatusPill({ status }: { status: string }) {
  const config = {
    saving: { color: 'var(--color-primary)', text: 'Saving…'   },
    saved:  { color: '#22c55e',              text: '✓ Saved'    },
    error:  { color: '#ef4444',              text: '✗ Save failed' },
    idle:   { color: 'transparent',          text: '' },
  }[status] ?? { color: 'transparent', text: '' }

  if (!config.text) return null

  return (
    <motion.p
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="text-xs text-center font-semibold"
      style={{ color: config.color }}
    >
      {config.text}
    </motion.p>
  )
}

// ── Avatar fallback if profile constants not found ────────────
const DEFAULT_AVATARS = [
  '🔥','⚡','💪','🎯','🚀','👑','💎','🏆','🌟','⭐',
  '🦁','🐺','🦅','🐉','🦊','🤖','👾','🧠','💡','🎮',
  '🏋️','🧘','🏃','🚴','🎵','🌙','☀️','🌊','🌿','🍀',
]

// ── Main dashboard component ──────────────────────────────────

export function SettingsDashboard() {
  const { activeSection, setActiveSection } = useSettings()

  return (
    <div className="flex flex-col pb-10 max-w-lg mx-auto">

      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex items-center gap-2">
        <Sliders size={16} style={{ color: 'var(--color-primary)' }} />
        <h1 className="font-display font-black text-base tracking-widest text-glow">
          SETTINGS
        </h1>
      </div>

      {/* Section nav */}
      <div className="px-4 pb-4 overflow-x-auto custom-scroll">
        <div className="flex gap-2 min-w-max">
          {SECTIONS.map(s => {
            const isActive = activeSection === s.id
            return (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold font-display tracking-wide transition-all whitespace-nowrap"
                style={{
                  background: isActive ? 'var(--color-surface-active)' : 'var(--color-surface)',
                  border:     `1px solid ${isActive ? 'var(--color-primary)' : 'var(--color-border)'}`,
                  color:      isActive ? 'var(--color-primary)' : 'var(--color-text-muted)',
                  boxShadow:  isActive ? 'var(--glow-sm)' : 'none',
                }}
              >
                {s.icon}
                {s.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Section content */}
      <div className="px-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {activeSection === 'profile'       && <ProfileSection />}
            {activeSection === 'notifications' && <NotificationsSection />}
            {activeSection === 'theme'         && <ThemeSection />}
            {activeSection === 'preferences'   && <PreferencesSection />}
            {activeSection === 'account'       && <AccountSection />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

// ── Section: Preferences ──────────────────────────────────────
// (defined after main component for readability)

function PreferencesSection() {
  const { appPrefs, appPrefsLoading, saveAppPrefs: save, saveStatus } = useSettings()
  const [localPrefs, setLocalPrefs] = useState(appPrefs)
  const prefs = localPrefs ?? appPrefs

  if (appPrefsLoading || !prefs) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-14 rounded-xl animate-pulse"
            style={{ background: 'var(--color-surface)' }} />
        ))}
      </div>
    )
  }

  const update = (patch: Partial<typeof prefs>) => {
    const next = { ...prefs, ...patch }
    setLocalPrefs(next)
    save(next)
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Water unit */}
      <div className="flex items-center gap-4 px-4 py-3.5 rounded-2xl"
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
        <span className="text-xl">💧</span>
        <div className="flex-1">
          <p className="text-sm font-semibold">Water Unit</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
            Millilitres or fluid ounces
          </p>
        </div>
        <div className="flex gap-1">
          {(['ml', 'oz'] as const).map(u => (
            <button key={u} onClick={() => update({ water_unit: u })}
              className="px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all"
              style={{
                background: prefs.water_unit === u ? 'var(--color-primary)' : 'var(--color-surface-active)',
                color:      prefs.water_unit === u ? 'var(--color-bg)' : 'var(--color-text-muted)',
              }}>
              {u}
            </button>
          ))}
        </div>
      </div>

      {/* Compact mode */}
      <div className="flex items-center gap-4 px-4 py-3.5 rounded-2xl"
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
        <span className="text-xl">📐</span>
        <div className="flex-1">
          <p className="text-sm font-semibold">Compact Mode</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
            Reduce card sizes for more content on screen
          </p>
        </div>
        <Toggle
          value={prefs.compact_mode}
          onChange={v => update({ compact_mode: v })}
        />
      </div>

      {saveStatus !== 'idle' && (
        <SaveStatusPill status={saveStatus} />
      )}
    </div>
  )
}
