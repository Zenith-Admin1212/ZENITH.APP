'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { format } from 'date-fns'

// ═══════════════════════════════════════════════════════════════
//  LiveClock — HUD-style animated clock
//  Updates every second. Displays time, date, day of week.
// ═══════════════════════════════════════════════════════════════

export function LiveClock() {
  const [now, setNow] = useState<Date | null>(null)

  useEffect(() => {
    setNow(new Date())
    const interval = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  if (!now) {
    return (
      <div className="flex flex-col items-center gap-1">
        <div className="h-10 w-36 rounded animate-pulse" style={{ background: 'var(--color-surface)' }} />
        <div className="h-4 w-28 rounded animate-pulse" style={{ background: 'var(--color-surface)' }} />
      </div>
    )
  }

  const hours   = format(now, 'hh')
  const minutes = format(now, 'mm')
  const ampm    = format(now, 'a')
  const dateStr = format(now, 'MMM dd').toUpperCase()
  const dayStr  = format(now, 'EEEE').toUpperCase()

  return (
    <div className="flex flex-col items-center select-none">
      {/* Time */}
      <div className="flex items-end gap-1.5">
        <motion.span
          key={hours}
          initial={{ opacity: 0.6, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-display font-black leading-none text-glow"
          style={{ fontSize: 'clamp(2.5rem, 10vw, 3.5rem)', letterSpacing: '-0.02em' }}
        >
          {hours}
        </motion.span>

        {/* Blinking colon */}
        <motion.span
          animate={{ opacity: [1, 0.2, 1] }}
          transition={{ duration: 1, repeat: Infinity, ease: 'steps(2)' }}
          className="font-display font-black text-glow pb-1"
          style={{ fontSize: 'clamp(2rem, 8vw, 3rem)' }}
        >
          :
        </motion.span>

        <motion.span
          key={minutes}
          initial={{ opacity: 0.6, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-display font-black leading-none text-glow"
          style={{ fontSize: 'clamp(2.5rem, 10vw, 3.5rem)', letterSpacing: '-0.02em' }}
        >
          {minutes}
        </motion.span>

        <span
          className="font-display font-bold pb-1.5 ml-0.5"
          style={{ fontSize: 'clamp(0.9rem, 3vw, 1.1rem)', color: 'var(--color-primary-dim)' }}
        >
          {ampm}
        </span>
      </div>

      {/* Date + day */}
      <div className="flex items-center gap-2 mt-0.5">
        <span
          className="font-display font-semibold tracking-[0.2em] text-xs"
          style={{ color: 'var(--color-text-muted)' }}
        >
          {dateStr}
        </span>
        <span style={{ color: 'var(--color-border-glow)', fontSize: '10px' }}>|</span>
        <span
          className="font-display font-semibold tracking-[0.2em] text-xs"
          style={{ color: 'var(--color-primary-dim)' }}
        >
          {dayStr}
        </span>
      </div>
    </div>
  )
}
