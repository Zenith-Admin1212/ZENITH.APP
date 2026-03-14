'use client'

// ═══════════════════════════════════════════════════════════════
//  StreakGlow
//
//  A reusable glow animation for the streak counter.
//  Shows when the user's streak increases or hits a milestone.
//
//  Two variants:
//   <StreakGlowPulse />  — wraps any element, adds a pulsing
//                          orange/fire glow ring around it.
//   <StreakMilestone />  — full-screen celebration banner for
//                          milestone streaks (7, 30, 100 days etc.)
//
//  "Not deeply wired" — ready for Phase 14+ wiring into:
//   • streakStore when streak increments
//   • TodayPage after check-in completes
//   • dashboard streak card on mount if streak >= threshold
// ═══════════════════════════════════════════════════════════════

import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState }     from 'react'

// ── Streak glow pulse ring ────────────────────────────────────
// Wraps children in a glowing fire-orange pulse effect.
// Uses streak-specific orange colour, not primary theme colour.

interface StreakGlowPulseProps {
  /** Whether the pulse is active */
  active:    boolean
  children:  React.ReactNode
  /** Intensity: 'subtle' | 'strong' (default: 'subtle') */
  intensity?: 'subtle' | 'strong'
}

export function StreakGlowPulse({ active, children, intensity = 'subtle' }: StreakGlowPulseProps) {
  const glow = intensity === 'strong'
    ? '0 0 24px rgba(249,115,22,0.7), 0 0 48px rgba(249,115,22,0.3)'
    : '0 0 12px rgba(249,115,22,0.45), 0 0 24px rgba(249,115,22,0.15)'

  return (
    <div className="relative inline-block">
      <AnimatePresence>
        {active && (
          <motion.div
            key="glow-ring"
            className="absolute inset-0 rounded-2xl pointer-events-none"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{
              opacity: [0, 1, 0.7, 1, 0],
              scale:   [0.9, 1.05, 1, 1.08, 1],
              boxShadow: [
                '0 0 0 rgba(249,115,22,0)',
                glow,
                glow,
                '0 0 0 rgba(249,115,22,0)',
              ],
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: 'easeInOut' }}
            style={{ border: '1.5px solid rgba(249,115,22,0.4)' }}
          />
        )}
      </AnimatePresence>
      {children}
    </div>
  )
}

// ── Streak milestone banner ───────────────────────────────────
// Full celebration shown at milestone streaks: 7, 14, 30, 60, 100+

interface StreakMilestoneProps {
  streak:     number
  onDismiss:  () => void
}

const MILESTONES: Record<number, { emoji: string; title: string; sub: string }> = {
  3:   { emoji: '🔥',  title: '3-Day Streak',   sub: 'You\'re building momentum!'          },
  7:   { emoji: '🔥',  title: '1-Week Streak',   sub: 'Seven days of discipline. Elite.'    },
  14:  { emoji: '⚡',  title: '2-Week Streak',   sub: 'Two weeks strong. Keep going.'       },
  21:  { emoji: '💪',  title: '21-Day Streak',   sub: 'Habit locked in. Unstoppable.'       },
  30:  { emoji: '🏆',  title: '1-Month Streak',  sub: 'One month of excellence. Legendary.' },
  60:  { emoji: '💎',  title: '2-Month Streak',  sub: 'Diamond discipline. Rare.'           },
  100: { emoji: '👑',  title: '100-Day Streak',  sub: 'One hundred days. King tier.'        },
}

function getNearestMilestone(streak: number) {
  const milestones = Object.keys(MILESTONES).map(Number).sort((a, b) => b - a)
  const hit = milestones.find(m => streak === m)
  return hit ? MILESTONES[hit] : null
}

export function StreakMilestone({ streak, onDismiss }: StreakMilestoneProps) {
  const milestone = getNearestMilestone(streak)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => { setVisible(false); setTimeout(onDismiss, 400) }, 3500)
    return () => clearTimeout(t)
  }, [onDismiss])

  if (!milestone) return null

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 280, damping: 24 }}
          className="fixed bottom-24 inset-x-4 z-[80] pointer-events-none mx-auto"
          style={{ maxWidth: 380 }}
          aria-live="assertive"
          role="status"
        >
          <div
            className="flex items-center gap-4 px-5 py-4 rounded-2xl"
            style={{
              background:    'linear-gradient(135deg, rgba(249,115,22,0.18) 0%, rgba(249,115,22,0.06) 100%)',
              border:        '1px solid rgba(249,115,22,0.4)',
              boxShadow:     '0 8px 32px rgba(0,0,0,0.5), 0 0 24px rgba(249,115,22,0.2)',
              backdropFilter:'blur(16px)',
            }}
          >
            <motion.span
              className="text-4xl flex-shrink-0"
              animate={{ rotate: [0, -15, 15, -8, 8, 0], scale: [1, 1.3, 1.3, 1.1, 1.1, 1] }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              {milestone.emoji}
            </motion.span>
            <div>
              <p className="font-display font-black text-base tracking-wide" style={{ color: '#f97316' }}>
                {milestone.title}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.55)' }}>
                {milestone.sub}
              </p>
            </div>
            <motion.div
              className="ml-auto font-display font-black text-2xl"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 15, delay: 0.4 }}
              style={{ color: '#f97316', textShadow: '0 0 20px rgba(249,115,22,0.8)' }}
            >
              {streak}
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
