'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useUIStore } from '@/stores/uiStore'

interface FloatInstance {
  id: number
  amount: number
  x: number
}

// ── XP Float Overlay ──────────────────────────────────────────────
// Listens for xpGain in uiStore and renders floating +XP text
// Supports multiple simultaneous floats at different x positions
export function XPFloatOverlay() {
  const { xpGain } = useUIStore()
  const [floats, setFloats] = useState<FloatInstance[]>([])
  const [counter, setCounter] = useState(0)

  useEffect(() => {
    if (!xpGain) return

    // Random x position within center 40% of screen
    const x = 30 + Math.random() * 40  // 30-70% of viewport width

    const id = counter
    setCounter(c => c + 1)

    setFloats(prev => [...prev, { id, amount: xpGain, x }])

    // Remove after animation
    setTimeout(() => {
      setFloats(prev => prev.filter(f => f.id !== id))
    }, 1600)
  }, [xpGain]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="fixed inset-0 pointer-events-none z-[60]">
      <AnimatePresence>
        {floats.map((f) => (
          <motion.div
            key={f.id}
            initial={{ opacity: 1, y: 0, scale: 0.8 }}
            animate={{ opacity: 0, y: -80, scale: 1.2 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
            className="absolute bottom-32 font-display font-black text-xl select-none"
            style={{
              left: `${f.x}%`,
              transform: 'translateX(-50%)',
              color: 'var(--color-primary)',
              textShadow: '0 0 20px var(--color-primary-glow), 0 0 40px var(--color-primary-glow)',
              filter: 'drop-shadow(0 0 8px var(--color-primary-glow))',
            }}
          >
            +{f.amount} XP
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
