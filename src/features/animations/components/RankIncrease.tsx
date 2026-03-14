'use client'

// ═══════════════════════════════════════════════════════════════
//  RankIncrease
//
//  Leaderboard rank change animation components.
//  Visualises position changes on the ZENITH streak leaderboard.
//
//  Components:
//   <RankChangeBadge />   — inline badge showing +N / -N rank shift
//   <RankUpBanner />      — bottom-anchored celebration banner
//   <RankPositionFlash /> — the rank number animates when it changes
//
//  "Not deeply wired" — prepared to be triggered by:
//   • useNotifications hook when a rank-change notification arrives
//   • LeaderboardDashboard when user's position changes
//   • Any component that receives the user's current rank
// ═══════════════════════════════════════════════════════════════

import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState }     from 'react'
import { ArrowUp, ArrowDown }      from 'lucide-react'

// ── Inline rank change badge ──────────────────────────────────
// Shows "+3" or "-1" next to a leaderboard position.
// Fades out after 2s automatically.

interface RankChangeBadgeProps {
  delta:      number     // positive = moved up, negative = moved down
  onComplete?: () => void
}

export function RankChangeBadge({ delta, onComplete }: RankChangeBadgeProps) {
  const isUp = delta > 0
  const label = isUp ? `+${delta}` : String(delta)

  useEffect(() => {
    const t = setTimeout(() => onComplete?.(), 2200)
    return () => clearTimeout(t)
  }, [onComplete])

  return (
    <motion.div
      aria-label={`Rank changed by ${label}`}
      initial={{ opacity: 0, scale: 0.5, y: 0 }}
      animate={{ opacity: [0, 1, 1, 0], scale: [0.5, 1.1, 1, 0.8], y: [0, -4, -8, -14] }}
      transition={{ duration: 2.0, times: [0, 0.1, 0.5, 1], ease: 'easeOut' }}
      className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-lg text-xs font-black font-display"
      style={{
        background: isUp
          ? 'rgba(34,197,94,0.15)'
          : 'rgba(239,68,68,0.12)',
        border: `1px solid ${isUp ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.35)'}`,
        color:  isUp ? '#22c55e' : '#ef4444',
        boxShadow: isUp
          ? '0 0 8px rgba(34,197,94,0.3)'
          : '0 0 8px rgba(239,68,68,0.2)',
      }}
    >
      {isUp
        ? <ArrowUp  size={9} strokeWidth={3} />
        : <ArrowDown size={9} strokeWidth={3} />
      }
      {label}
    </motion.div>
  )
}

// ── Rank-up banner ────────────────────────────────────────────
// Full banner celebrating a rank improvement.
// Appears at bottom of screen, auto-dismisses after 3s.

interface RankUpBannerProps {
  newRank:    number
  oldRank:    number
  onDismiss:  () => void
}

export function RankUpBanner({ newRank, oldRank, onDismiss }: RankUpBannerProps) {
  const [visible, setVisible] = useState(true)
  const gained = oldRank - newRank  // positive = moved up in ranks

  useEffect(() => {
    const t = setTimeout(() => { setVisible(false); setTimeout(onDismiss, 400) }, 3200)
    return () => clearTimeout(t)
  }, [onDismiss])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 80 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40, scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 300, damping: 26 }}
          className="fixed bottom-24 inset-x-4 z-[80] pointer-events-none mx-auto"
          style={{ maxWidth: 380 }}
          aria-live="polite"
          role="status"
        >
          <div
            className="flex items-center gap-4 px-5 py-4 rounded-2xl"
            style={{
              background:    'linear-gradient(135deg, rgba(34,197,94,0.14) 0%, rgba(0,245,255,0.06) 100%)',
              border:        '1px solid rgba(34,197,94,0.35)',
              boxShadow:     '0 8px 32px rgba(0,0,0,0.5), 0 0 20px rgba(34,197,94,0.15)',
              backdropFilter:'blur(16px)',
            }}
          >
            {/* Arrow icon */}
            <motion.div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.35)' }}
              animate={{ scale: [1, 1.2, 1], rotate: [0, -10, 0] }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <ArrowUp size={18} style={{ color: '#22c55e' }} strokeWidth={2.5} />
            </motion.div>

            {/* Text */}
            <div className="flex-1">
              <p className="font-display font-black text-sm tracking-wide" style={{ color: '#22c55e' }}>
                Rank Up! #{newRank}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>
                You moved up {gained} position{gained !== 1 ? 's' : ''} on the leaderboard
              </p>
            </div>

            {/* Position numbers */}
            <div className="flex flex-col items-end flex-shrink-0">
              <span className="text-xs line-through opacity-40" style={{ color: 'rgba(255,255,255,0.5)' }}>
                #{oldRank}
              </span>
              <motion.span
                className="font-display font-black text-lg"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 14, delay: 0.35 }}
                style={{ color: '#22c55e', textShadow: '0 0 12px rgba(34,197,94,0.6)' }}
              >
                #{newRank}
              </motion.span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ── Rank position flash ───────────────────────────────────────
// Wraps the rank number cell in a leaderboard row.
// Flashes green/red when the value changes.

interface RankPositionFlashProps {
  rank:     number
  previous?: number   // if provided, determines flash colour
  children: React.ReactNode
}

export function RankPositionFlash({ rank, previous, children }: RankPositionFlashProps) {
  const [flash, setFlash] = useState(false)
  const isUp   = previous !== undefined && rank < previous
  const isDown = previous !== undefined && rank > previous

  useEffect(() => {
    if (previous !== undefined && rank !== previous) {
      setFlash(true)
      const t = setTimeout(() => setFlash(false), 800)
      return () => clearTimeout(t)
    }
  }, [rank, previous])

  return (
    <div className="relative">
      <AnimatePresence>
        {flash && (
          <motion.div
            key={`flash-${rank}`}
            className="absolute inset-0 rounded-lg pointer-events-none"
            initial={{ opacity: 0.8 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            style={{
              background: isUp
                ? 'rgba(34,197,94,0.25)'
                : 'rgba(239,68,68,0.20)',
              boxShadow: isUp
                ? '0 0 12px rgba(34,197,94,0.4)'
                : '0 0 12px rgba(239,68,68,0.3)',
            }}
          />
        )}
      </AnimatePresence>
      {children}
    </div>
  )
}
