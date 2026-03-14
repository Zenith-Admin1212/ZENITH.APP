'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Download, Share } from 'lucide-react'
import { ZenithLogo } from '@/components/ui/ZenithLogo'

// ═══════════════════════════════════════════════════════════════
//  PWAInstallPrompt — Phase 14 enhanced
//
//  Two paths:
//
//  Path A — Android/Chrome/Edge:
//    Captures `beforeinstallprompt`, shows branded install banner.
//    Banner appears after 3s. Suppressed 7 days on dismiss.
//
//  Path B — iOS Safari:
//    iOS does not fire `beforeinstallprompt`. We detect iOS Safari
//    and show an instruction overlay: "Tap Share → Add to Home Screen"
//    Shown after 4s. Same 7-day suppress logic.
//
//  Both paths skip if already in standalone (installed) mode.
// ═══════════════════════════════════════════════════════════════

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
  prompt(): Promise<void>
}

const SUPPRESS_KEY  = 'zenith-pwa-install-dismissed'
const SUPPRESS_DAYS = 7

// ── iOS detection ─────────────────────────────────────────────
function isIOSSafari(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  const isIOS = /iphone|ipad|ipod/i.test(ua)
  const isWebkit = /WebKit/i.test(ua)
  const isCriOS = /CriOS/i.test(ua)  // Chrome on iOS — has no beforeinstallprompt either
  const isFxiOS = /FxiOS/i.test(ua)  // Firefox on iOS
  return isIOS && isWebkit && !isCriOS && !isFxiOS
}

function isIOSDevice(): boolean {
  if (typeof navigator === 'undefined') return false
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

function isInStandaloneMode(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as any).standalone === true
  )
}

function isSuppressed(): boolean {
  try {
    const dismissed = localStorage.getItem(SUPPRESS_KEY)
    if (!dismissed) return false
    const suppressUntil = parseInt(dismissed, 10) + SUPPRESS_DAYS * 24 * 60 * 60 * 1000
    return Date.now() < suppressUntil
  } catch { return false }
}

function suppress() {
  try { localStorage.setItem(SUPPRESS_KEY, String(Date.now())) } catch {}
}

// ── Main component ────────────────────────────────────────────

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showAndroid,    setShowAndroid]    = useState(false)
  const [showIOS,        setShowIOS]        = useState(false)

  useEffect(() => {
    if (isInStandaloneMode() || isSuppressed()) return

    // ── Path A: Android/Chrome — capture install event ────────
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setTimeout(() => setShowAndroid(true), 3000)
    }
    window.addEventListener('beforeinstallprompt', handler)

    // ── Path B: iOS — show Add to Home Screen instruction ─────
    if (isIOSDevice() && !isInStandaloneMode()) {
      setTimeout(() => setShowIOS(true), 4000)
    }

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleAndroidInstall = async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    setShowAndroid(false)
    setDeferredPrompt(null)
    if (outcome === 'dismissed') suppress()
  }

  const handleDismiss = () => {
    setShowAndroid(false)
    setShowIOS(false)
    suppress()
  }

  return (
    <>
      {/* ── Android / Chrome install banner ─────────────────── */}
      <AnimatePresence>
        {showAndroid && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0,   opacity: 1 }}
            exit={{   y: 100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            className="fixed bottom-20 inset-x-3 z-[60] md:bottom-6 md:left-auto md:right-6 md:inset-x-auto md:w-80"
          >
            <div
              className="flex items-center gap-3 px-4 py-3.5 rounded-2xl"
              style={{
                background:    'var(--color-surface)',
                border:        '1px solid var(--color-border-glow)',
                boxShadow:     '0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(0,245,255,0.1)',
                backdropFilter:'blur(16px)',
              }}
            >
              <div className="flex-shrink-0">
                <ZenithLogo variant="icon" size="sm" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-display font-black text-sm tracking-wide text-glow">
                  Install ZENITH
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                  Add to home screen for the full experience
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={handleAndroidInstall}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold font-display tracking-wide transition-all active:scale-95"
                  style={{
                    background: 'var(--color-primary)',
                    color:      'var(--color-bg)',
                    boxShadow:  'var(--glow-sm)',
                  }}
                >
                  <Download size={12} />
                  Install
                </button>
                <button
                  onClick={handleDismiss}
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ color: 'var(--color-text-faint)' }}
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── iOS Add to Home Screen instruction ─────────────── */}
      <AnimatePresence>
        {showIOS && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0,   opacity: 1 }}
            exit={{   y: 100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 28 }}
            className="fixed bottom-20 inset-x-3 z-[60]"
          >
            <div
              className="flex flex-col gap-3 px-4 py-4 rounded-2xl"
              style={{
                background:    'var(--color-surface)',
                border:        '1px solid var(--color-border-glow)',
                boxShadow:     '0 8px 32px rgba(0,0,0,0.5)',
                backdropFilter:'blur(16px)',
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <ZenithLogo variant="icon" size="sm" />
                  <div>
                    <p className="font-display font-black text-sm tracking-wide text-glow">
                      Install ZENITH
                    </p>
                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      Add to your home screen
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleDismiss}
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ color: 'var(--color-text-faint)' }}
                >
                  <X size={14} />
                </button>
              </div>

              {/* iOS instruction steps */}
              <div
                className="flex flex-col gap-2 p-3 rounded-xl"
                style={{ background: 'var(--color-surface-hover)', border: '1px solid var(--color-border)' }}
              >
                {[
                  {
                    icon: <Share size={14} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />,
                    text: 'Tap the Share button at the bottom of Safari',
                  },
                  {
                    icon: <span className="text-sm flex-shrink-0">＋</span>,
                    text: 'Select "Add to Home Screen" from the menu',
                  },
                  {
                    icon: <span className="text-sm flex-shrink-0">✓</span>,
                    text: 'Tap "Add" to install ZENITH on your home screen',
                  },
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <div
                      className="w-5 h-5 rounded-md flex items-center justify-center mt-0.5 flex-shrink-0"
                      style={{ background: 'var(--color-surface-active)' }}
                    >
                      {step.icon}
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
                      {step.text}
                    </p>
                  </div>
                ))}
              </div>

              {/* Bottom arrow indicating where Share button is */}
              <div className="flex justify-center">
                <div
                  className="w-8 h-1 rounded-full"
                  style={{ background: 'var(--color-border)' }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
