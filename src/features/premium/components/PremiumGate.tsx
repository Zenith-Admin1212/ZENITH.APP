'use client'

import { useState }              from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock }                  from 'lucide-react'
import { usePremium }            from '../hooks/usePremium'
import { UpgradeModal }          from './UpgradeModal'
import { PremiumBadge }          from './PremiumBadge'
import type { PremiumFeature }   from '../services/premiumService'
import { PREMIUM_FEATURES }      from '../services/premiumService'

// ═══════════════════════════════════════════════════════════════
//  PremiumGate
//
//  Drop-in wrapper: if the user is not premium, renders a
//  blurred overlay with lock icon + upgrade CTA over children.
//  If premium, children render normally with zero overhead.
//
//  Usage:
//    <PremiumGate feature="analytics_export">
//      <ExportButton />
//    </PremiumGate>
//
//  Props:
//    feature      — which feature this gate is for (drives modal copy)
//    locked       — explicit override (default: derives from usePremium)
//    blur         — blur intensity in px (default: 4)
//    showLabel    — show the "Premium" pill below lock icon
//    inline       — compact inline mode (no full-cover overlay)
// ═══════════════════════════════════════════════════════════════

interface PremiumGateProps {
  children:    React.ReactNode
  feature?:    PremiumFeature
  locked?:     boolean               // explicit override
  blur?:       number
  showLabel?:  boolean
  inline?:     boolean               // small inline lock instead of full overlay
  className?:  string
}

export function PremiumGate({
  children,
  feature,
  locked:    lockedProp,
  blur       = 4,
  showLabel  = true,
  inline     = false,
  className  = '',
}: PremiumGateProps) {
  const { isPremium, isLocked } = usePremium()
  const [showModal, setShowModal] = useState(false)

  // Explicit prop wins; fallback to feature-based check; fallback to !isPremium
  const isGated = lockedProp !== undefined
    ? lockedProp
    : feature
      ? isLocked(feature)
      : !isPremium

  if (!isGated) {
    // Premium user — render children with no wrapper overhead
    return <>{children}</>
  }

  const featureLabel = feature ? PREMIUM_FEATURES[feature]?.label : 'Premium Feature'

  // ── Inline compact mode ───────────────────────────────────
  if (inline) {
    return (
      <>
        <div
          className={`relative inline-flex cursor-pointer ${className}`}
          onClick={() => setShowModal(true)}
        >
          <div style={{ filter: `blur(${blur}px)`, pointerEvents: 'none', userSelect: 'none' }}>
            {children}
          </div>
          <div className="absolute inset-0 flex items-center justify-center rounded-lg"
            style={{ background: 'rgba(0,0,0,0.5)' }}>
            <Lock size={12} style={{ color: '#f59e0b' }} />
          </div>
        </div>

        <AnimatePresence>
          {showModal && (
            <UpgradeModal
              triggerFeature={featureLabel}
              onClose={() => setShowModal(false)}
            />
          )}
        </AnimatePresence>
      </>
    )
  }

  // ── Full overlay mode (default) ───────────────────────────
  return (
    <>
      <div className={`relative overflow-hidden rounded-2xl ${className}`}>
        {/* Blurred children */}
        <div
          style={{
            filter:        `blur(${blur}px)`,
            pointerEvents: 'none',
            userSelect:    'none',
            opacity:       0.6,
          }}
        >
          {children}
        </div>

        {/* Lock overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 flex flex-col items-center justify-center gap-3 cursor-pointer rounded-2xl"
          style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(2px)' }}
          onClick={() => setShowModal(true)}
        >
          {/* Lock icon with gold glow */}
          <motion.div
            className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(245,158,11,0.05))',
              border:     '1px solid rgba(245,158,11,0.5)',
              boxShadow:  '0 0 20px rgba(245,158,11,0.25)',
            }}
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2.5, repeat: Infinity }}
          >
            <Lock size={20} style={{ color: '#f59e0b' }} />
          </motion.div>

          {showLabel && (
            <div className="flex flex-col items-center gap-1.5">
              <PremiumBadge variant="pill" size="sm" />
              {featureLabel && (
                <p className="text-xs text-center font-semibold"
                  style={{ color: 'rgba(255,255,255,0.6)' }}>
                  {featureLabel}
                </p>
              )}
              <p className="text-2xs font-display tracking-wider"
                style={{ color: 'rgba(245,158,11,0.7)', fontSize: '9px' }}>
                TAP TO UPGRADE
              </p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Upgrade modal */}
      <AnimatePresence>
        {showModal && (
          <UpgradeModal
            triggerFeature={featureLabel}
            onClose={() => setShowModal(false)}
          />
        )}
      </AnimatePresence>
    </>
  )
}
