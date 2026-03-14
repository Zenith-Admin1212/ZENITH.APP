'use client'

// ═══════════════════════════════════════════════════════════════
//  XPRewardAnimation
//
//  A celebratory burst shown when XP is awarded.
//  More elaborate than XPFloatOverlay (which is a simple float).
//  This component shows a full celebration: particle burst,
//  large +XP number popup, and a ring-pulse.
//
//  Usage:
//    <XPRewardAnimation amount={15} onComplete={() => setShow(false)} />
//
//  "Not deeply wired yet" — prepared for Phase 14, can be triggered
//  from habitStore after completing a habit, or from xpStore after
//  any addXP call with a 'celebrate' flag.
//
//  Design:
//   • Centered burst (position: fixed, centered)
//   • Large XP number with scale-in + float-up
//   • 8 particle lines radiating outward
//   • Outer ring pulse expands and fades
//   • Duration: ~800ms, auto-calls onComplete
// ═══════════════════════════════════════════════════════════════

import { motion, AnimatePresence } from 'framer-motion'
import { useEffect } from 'react'

interface XPRewardAnimationProps {
  /** XP amount to display */
  amount:     number
  /** Called when animation finishes */
  onComplete?: () => void
  /** Optional custom label (default: "+{amount} XP") */
  label?:     string
}

// 8 particle angles: evenly spaced around 360°
const PARTICLE_ANGLES = Array.from({ length: 8 }, (_, i) => (i * 360) / 8)

export function XPRewardAnimation({ amount, onComplete, label }: XPRewardAnimationProps) {
  useEffect(() => {
    const timer = setTimeout(() => onComplete?.(), 900)
    return () => clearTimeout(timer)
  }, [onComplete])

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-[150] pointer-events-none flex items-center justify-center"
    >
      {/* Outer ring pulse */}
      <motion.div
        className="absolute rounded-full"
        initial={{ width: 40, height: 40, opacity: 0.8 }}
        animate={{ width: 160, height: 160, opacity: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        style={{ border: '2px solid var(--color-primary)', boxShadow: 'var(--glow-md)' }}
      />

      {/* Secondary ring */}
      <motion.div
        className="absolute rounded-full"
        initial={{ width: 30, height: 30, opacity: 0.6 }}
        animate={{ width: 120, height: 120, opacity: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut', delay: 0.08 }}
        style={{ border: '1px solid var(--color-primary)' }}
      />

      {/* Particle burst lines */}
      {PARTICLE_ANGLES.map((angle, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{ transformOrigin: '0 0', transform: `rotate(${angle}deg)` }}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 1, 0] }}
          transition={{ duration: 0.5, delay: i * 0.02, times: [0, 0.1, 0.6, 1] }}
        >
          <motion.div
            initial={{ x: 12, scaleY: 1 }}
            animate={{ x: 60, scaleY: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut', delay: i * 0.02 }}
            style={{
              width: 20, height: 2,
              background: 'linear-gradient(90deg, var(--color-primary), transparent)',
              borderRadius: 2,
            }}
          />
        </motion.div>
      ))}

      {/* XP number */}
      <motion.div
        initial={{ scale: 0.3, opacity: 0, y: 0 }}
        animate={{ scale: 1, opacity: [0, 1, 1, 0], y: -20 }}
        transition={{ duration: 0.7, ease: [0.34, 1.56, 0.64, 1], times: [0, 0.2, 0.7, 1] }}
        className="relative font-display font-black text-3xl"
        style={{
          color:      'var(--color-primary)',
          textShadow: '0 0 20px var(--color-primary-glow), 0 0 40px var(--color-primary-glow)',
        }}
      >
        {label ?? `+${amount} XP`}
      </motion.div>
    </div>
  )
}

// ── Compact variant (inline, not fixed) ───────────────────────
// For use inside cards/habit rows when a more subtle reward is needed.

interface XPBadgePopProps {
  amount:     number
  onComplete?: () => void
}

export function XPBadgePop({ amount, onComplete }: XPBadgePopProps) {
  useEffect(() => {
    const t = setTimeout(() => onComplete?.(), 700)
    return () => clearTimeout(t)
  }, [onComplete])

  return (
    <motion.span
      aria-hidden="true"
      initial={{ scale: 0.4, opacity: 0, y: 0 }}
      animate={{ scale: 1, opacity: [0, 1, 1, 0], y: -28 }}
      transition={{ duration: 0.65, ease: [0.34, 1.56, 0.64, 1], times: [0, 0.15, 0.65, 1] }}
      className="absolute pointer-events-none font-display font-black text-xs"
      style={{
        color:      'var(--color-primary)',
        textShadow: '0 0 10px var(--color-primary-glow)',
        whiteSpace: 'nowrap',
        zIndex: 50,
      }}
    >
      +{amount} XP
    </motion.span>
  )
}
