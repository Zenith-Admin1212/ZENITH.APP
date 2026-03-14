'use client'

import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Camera, Loader2, Edit2 } from 'lucide-react'
import { useUserStore }  from '@/stores/userStore'
import { useXPStore }    from '@/stores/xpStore'
import { useStreakStore } from '@/stores/streakStore'
import { supabase }      from '@/lib/supabase/client'
import { LEVELS }        from '@/features/xp/services/xpEngine'

// ═══════════════════════════════════════════════════════════════
//  ProfileHeader
//  Avatar (editable), username, level badge, XP bar, streak
// ═══════════════════════════════════════════════════════════════

const AVATAR_OPTIONS = [
  '🧑‍💻','👤','🦁','🐺','🦅','🐉','⚡','👑','💎','🔱',
  '🤺','🥷','🧙','🧞','🦊','🐯','🦄','🌟','⭐','🔥',
]

export function ProfileHeader() {
  const { user, updateUser }            = useUserStore()
  const { xp, getProgress }             = useXPStore()
  const { streak, monthlyShieldsRemaining } = useStreakStore()

  const [showAvatarPicker, setShowAvatarPicker] = useState(false)
  const [uploadingAvatar,  setUploadingAvatar]  = useState(false)

  const progress  = getProgress()
  const level     = progress.current
  const joinYear  = user?.join_date
    ? new Date(user.join_date).getFullYear()
    : new Date().getFullYear()

  const handleEmojiAvatar = async (emoji: string) => {
    if (!user?.id) return
    setShowAvatarPicker(false)
    setUploadingAvatar(true)
    try {
      await supabase
        .from('users')
        .update({ avatar: emoji, updated_at: new Date().toISOString() })
        .eq('id', user.id)
      updateUser({ avatar: emoji })
    } catch (err) {
      console.error('Avatar update failed:', err)
    } finally {
      setUploadingAvatar(false)
    }
  }

  return (
    <div
      className="relative overflow-hidden px-5 py-6"
      style={{ borderBottom: '1px solid var(--color-border)' }}
    >
      {/* HUD scan lines */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, var(--color-primary) 2px, var(--color-primary) 3px)', backgroundSize: '100% 6px' }} />

      {/* Corner brackets */}
      {[['top-3 left-3', 'border-t border-l'], ['top-3 right-3', 'border-t border-r'],
        ['bottom-3 left-3', 'border-b border-l'], ['bottom-3 right-3', 'border-b border-r']].map(([pos, border]) => (
        <div key={pos} className={`absolute ${pos} w-4 h-4 ${border}`}
          style={{ borderColor: 'var(--color-primary)', opacity: 0.4 }} />
      ))}

      <div className="relative z-10 flex items-start gap-4">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <motion.div
            className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl cursor-pointer"
            style={{
              background: 'var(--color-surface-active)',
              border: '2px solid var(--color-border-glow)',
              boxShadow: 'var(--glow-sm)',
            }}
            whileTap={{ scale: 0.92 }}
            onClick={() => setShowAvatarPicker(!showAvatarPicker)}
          >
            {uploadingAvatar
              ? <Loader2 size={24} className="animate-spin" style={{ color: 'var(--color-primary)' }} />
              : <span>{user?.avatar ?? '👤'}</span>
            }
          </motion.div>
          {/* Edit badge */}
          <div
            className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center"
            style={{ background: 'var(--color-primary)', boxShadow: 'var(--glow-sm)' }}
          >
            <Camera size={11} style={{ color: 'var(--color-bg)' }} />
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 pt-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="font-display font-black text-lg text-glow leading-none">
              {user?.username ?? 'Zenith User'}
            </h2>
            <div
              className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold"
              style={{
                background: `rgba(var(--color-primary-rgb,0,245,255),0.12)`,
                border: '1px solid var(--color-border-glow)',
                color: 'var(--color-primary)',
              }}
            >
              <span>{level.badge}</span>
              <span className="font-display">{level.name.toUpperCase()}</span>
            </div>
          </div>

          <p className="text-xs text-zenith-faint mt-0.5">
            Member since {joinYear} · {user?.plan === 'premium' ? '⭐ Premium' : 'Free'}
          </p>

          {/* XP bar */}
          <div className="mt-3 flex flex-col gap-1">
            <div className="flex justify-between items-center">
              <span className="font-mono text-xs text-glow font-bold">{xp.toLocaleString()} XP</span>
              {progress.next && (
                <span className="text-2xs text-zenith-faint">
                  {progress.neededXP - progress.progressXP} to {progress.next.name}
                </span>
              )}
            </div>
            <div className="h-2 rounded-full overflow-hidden"
              style={{ background: 'var(--color-surface-active)' }}>
              <motion.div
                className="h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress.progressPct}%` }}
                transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
                style={{
                  background: `linear-gradient(90deg, var(--color-primary), var(--color-primary-dim))`,
                  boxShadow: '0 0 8px var(--color-primary-glow)',
                }}
              />
            </div>
          </div>

          {/* Quick stats row */}
          <div className="flex items-center gap-3 mt-2">
            <span className="text-xs text-zenith-muted flex items-center gap-1">
              🔥 <strong className="text-glow">{streak}</strong>
            </span>
            <span className="text-xs text-zenith-muted flex items-center gap-1">
              🛡️ <strong className="text-glow">{monthlyShieldsRemaining}</strong>
            </span>
            <span className="text-xs text-zenith-muted flex items-center gap-1">
              📊 <strong style={{ color: 'var(--color-primary)' }}>{progress.progressPct}%</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Avatar picker */}
      {showAvatarPicker && (
        <motion.div
          initial={{ opacity: 0, y: 8, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="mt-4 rounded-2xl p-4"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border-glow)' }}
        >
          <p className="text-xs font-display font-bold text-zenith-muted tracking-widest mb-3">
            CHOOSE AVATAR
          </p>
          <div className="grid grid-cols-10 gap-2">
            {AVATAR_OPTIONS.map(emoji => (
              <motion.button
                key={emoji}
                whileTap={{ scale: 0.85 }}
                onClick={() => handleEmojiAvatar(emoji)}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-xl transition-all"
                style={{
                  background: user?.avatar === emoji ? 'var(--color-surface-active)' : 'transparent',
                  border: `1px solid ${user?.avatar === emoji ? 'var(--color-primary)' : 'var(--color-border)'}`,
                  boxShadow: user?.avatar === emoji ? 'var(--glow-sm)' : 'none',
                }}
              >
                {emoji}
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}
