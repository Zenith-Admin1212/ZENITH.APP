'use client'

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useUIStore } from '@/stores/uiStore'
import { useXPStore } from '@/stores/xpStore'

// ── Level Up Modal ────────────────────────────────────────────────
function LevelUpModal({ data }: { data: Record<string, unknown> }) {
  const { closeModal } = useUIStore()
  const badge = data.badge as string || '🥈'
  const level = data.level as string || 'Silver'

  useEffect(() => {
    const t = setTimeout(closeModal, 4500)
    return () => clearTimeout(t)
  }, [closeModal])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }}
      onClick={closeModal}
    >
      <motion.div
        initial={{ scale: 0.3, opacity: 0, rotate: -10 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.1 }}
        className="flex flex-col items-center gap-6 px-8 py-10 text-center"
        onClick={e => e.stopPropagation()}
      >
        {/* Badge */}
        <motion.div
          animate={{ y: [0, -12, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="text-8xl"
          style={{ filter: 'drop-shadow(0 0 30px var(--color-primary-glow))' }}
        >
          {badge}
        </motion.div>

        {/* Text */}
        <div>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-zenith-muted text-sm font-display tracking-widest mb-1 uppercase"
          >
            Level Up
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="font-display font-black text-4xl text-glow tracking-wider"
          >
            {level}
          </motion.h2>
        </div>

        {/* Particles ring */}
        <motion.div
          initial={{ scale: 0, opacity: 1 }}
          animate={{ scale: 3, opacity: 0 }}
          transition={{ duration: 1, delay: 0.15 }}
          className="absolute w-24 h-24 rounded-full border-2"
          style={{ borderColor: 'var(--color-primary)' }}
        />

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-zenith-faint text-xs"
        >
          Tap to dismiss
        </motion.p>
      </motion.div>
    </motion.div>
  )
}

// ── Perfect Day Modal ─────────────────────────────────────────────
function PerfectDayModal() {
  const { closeModal } = useUIStore()

  useEffect(() => {
    const t = setTimeout(closeModal, 4000)
    return () => clearTimeout(t)
  }, [closeModal])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(12px)' }}
      onClick={closeModal}
    >
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 280, damping: 22 }}
        className="flex flex-col items-center gap-4 text-center px-8"
      >
        <motion.div
          animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-7xl"
        >
          ⚡
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="font-display font-black text-4xl text-glow"
        >
          PERFECT DAY!
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-zenith-muted text-base"
        >
          All habits completed! +10 XP bonus
        </motion.p>

        {/* Expanding ring */}
        {[0, 0.2, 0.4].map((delay, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0.5, opacity: 0.8 }}
            animate={{ scale: 2.5 + i * 0.5, opacity: 0 }}
            transition={{ duration: 1.5, delay, repeat: Infinity, repeatDelay: 1 }}
            className="absolute w-20 h-20 rounded-full border"
            style={{ borderColor: 'var(--color-primary)' }}
          />
        ))}
      </motion.div>
    </motion.div>
  )
}

// ── Achievement Modal ─────────────────────────────────────────────
function AchievementModal({ data }: { data: Record<string, unknown> }) {
  const { closeModal } = useUIStore()
  const icon = data.icon as string || '🏆'
  const name = data.name as string || 'Achievement Unlocked'
  const xpReward = data.xp_reward as number || 0

  useEffect(() => {
    const t = setTimeout(closeModal, 3500)
    return () => clearTimeout(t)
  }, [closeModal])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] flex items-end justify-center pb-24 px-4"
      style={{ pointerEvents: 'none' }}
    >
      <motion.div
        initial={{ y: 120, opacity: 0, scale: 0.8 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className="w-full max-w-sm rounded-2xl p-4 flex items-center gap-4"
        style={{
          background: 'var(--color-bg-secondary)',
          border: '1px solid var(--color-border-glow)',
          boxShadow: 'var(--glow-lg)',
          pointerEvents: 'auto',
        }}
        onClick={closeModal}
      >
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
          style={{ background: 'var(--color-surface-active)', boxShadow: 'var(--glow-sm)' }}
        >
          {icon}
        </div>
        <div>
          <p className="text-xs text-zenith-muted font-display tracking-widest uppercase mb-0.5">
            Achievement Unlocked
          </p>
          <p className="font-display font-bold text-sm text-glow">{name}</p>
          {xpReward > 0 && (
            <p className="text-xs text-zenith-muted mt-0.5">+{xpReward} XP</p>
          )}
        </div>
        <div
          className="ml-auto w-6 h-6 rounded-full flex items-center justify-center"
          style={{ background: 'var(--color-primary)', boxShadow: 'var(--glow-sm)' }}
        >
          <span style={{ color: 'var(--color-bg)', fontSize: '12px', fontWeight: 900 }}>✓</span>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Modal Layer — renders the active modal ────────────────────────
export function GlobalModalLayer() {
  const { activeModal, modalData } = useUIStore()

  return (
    <AnimatePresence>
      {activeModal === 'level-up' && (
        <LevelUpModal key="level-up" data={modalData} />
      )}
      {activeModal === 'perfect-day' && (
        <PerfectDayModal key="perfect-day" />
      )}
      {activeModal === 'achievement' && (
        <AchievementModal key="achievement" data={modalData} />
      )}
    </AnimatePresence>
  )
}
