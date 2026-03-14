'use client'

// ═══════════════════════════════════════════════════════════════
//  SplashScreen
//
//  Lifecycle controller for the ZENITH startup crystal animation.
//
//  States (internal FSM):
//    'animating'  — CrystalZAnimation playing entrance sequence
//    'exiting'    — playing=false, crystal Z fades out
//    'done'       — fully unmounted; onDone() has fired
//
//  Rules:
//   • Shows ONCE per browser session (sessionStorage flag)
//   • Makes ZERO API calls — fully static, startup-safe
//   • Total duration never exceeds 2 seconds
//   • aria-hidden — screen readers skip entirely
//   • Skips itself if sessionStorage is unavailable (SSR, private)
//
//  Integration:
//   AppShell renders <SplashScreen onDone={fn} /> during its
//   loading state. When onDone fires, AppShell shows the main app.
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence }                   from 'framer-motion'
import { CrystalZAnimation }                         from './CrystalZAnimation'

interface SplashScreenProps {
  /** Called once when splash animation fully completes and unmounts */
  onDone: () => void
  /**
   * How long (ms) to hold after entrance animation before triggering exit.
   * Adds breathing room between assembly and dismiss. Default: 380ms.
   */
  holdMs?: number
}

const SESSION_KEY  = 'zenith-splash-shown'
const DEFAULT_HOLD = 380

export function SplashScreen({ onDone, holdMs = DEFAULT_HOLD }: SplashScreenProps) {

  // playing: drives CrystalZAnimation — true=entrance, false=exit
  const [playing,  setPlaying]  = useState(true)
  // visible: controls AnimatePresence mount
  const [visible,  setVisible]  = useState(false)

  const holdTimer  = useRef<ReturnType<typeof setTimeout> | null>(null)
  const exitTimer  = useRef<ReturnType<typeof setTimeout> | null>(null)
  const doneFired  = useRef(false)

  useEffect(() => {
    // Check if already shown this session
    try {
      if (sessionStorage.getItem(SESSION_KEY)) {
        onDone()
        return
      }
      sessionStorage.setItem(SESSION_KEY, '1')
    } catch {
      // sessionStorage blocked (SSR, private mode) — skip splash
      onDone()
      return
    }

    // Mount the splash
    setVisible(true)

    return () => {
      holdTimer.current && clearTimeout(holdTimer.current)
      exitTimer.current && clearTimeout(exitTimer.current)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Called by CrystalZAnimation when its entrance sequence completes
  const handleEntranceDone = useCallback(() => {
    holdTimer.current = setTimeout(() => {
      // Trigger exit animation
      setPlaying(false)
      // After exit animation (350ms), fire onDone and unmount
      exitTimer.current = setTimeout(() => {
        setVisible(false)
        if (!doneFired.current) {
          doneFired.current = true
          onDone()
        }
      }, 380)
    }, holdMs)
  }, [holdMs, onDone])

  return (
    <AnimatePresence onExitComplete={() => {
      if (!doneFired.current) {
        doneFired.current = true
        onDone()
      }
    }}>
      {visible && (
        <motion.div
          key="zenith-splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.28, ease: 'easeInOut' } }}
          aria-hidden="true"
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center"
          style={{
            background:    'var(--color-bg)',
            pointerEvents: 'none',
          }}
        >
          {/* Radial background glow — matches the reference image's dark teal bg */}
          <div
            aria-hidden="true"
            style={{
              position:     'absolute',
              inset:         0,
              background: `
                radial-gradient(
                  ellipse 56% 48% at 50% 44%,
                  var(--color-primary-glow) 0%,
                  transparent 72%
                )
              `,
              opacity:       0.14,
              pointerEvents: 'none',
            }}
          />

          {/* Crystal Z animation — centred */}
          <div className="relative z-10">
            <CrystalZAnimation
              size={180}
              playing={playing}
              onComplete={handleEntranceDone}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
