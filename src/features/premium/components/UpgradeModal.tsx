'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Check, Lock, Crown, Sparkles } from 'lucide-react'
import { PREMIUM_FEATURES, FEATURE_TABLE_ORDER } from '../services/premiumService'
import { PremiumBadge } from './PremiumBadge'

// ═══════════════════════════════════════════════════════════════
//  UpgradeModal
//  Full-screen bottom sheet with comparison table.
//  NOTE: No payment integration — Phase 12.
//  CTA shows admin-grant message as per spec.
// ═══════════════════════════════════════════════════════════════

interface UpgradeModalProps {
  onClose:       () => void
  triggerFeature?: string   // optional — highlight which feature was gated
}

export function UpgradeModal({ onClose, triggerFeature }: UpgradeModalProps) {
  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60]"
        style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }}
        onClick={onClose}
      />

      {/* Modal sheet */}
      <motion.div
        initial={{ y: '100%', opacity: 0.7 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 320, damping: 36 }}
        className="fixed inset-x-0 bottom-0 z-[60] flex flex-col max-h-[92vh] rounded-t-3xl overflow-hidden"
        style={{
          background: 'var(--color-bg-secondary)',
          borderTop:  '1px solid rgba(245,158,11,0.3)',
          boxShadow:  '0 -20px 60px rgba(245,158,11,0.08)',
        }}
      >
        {/* Gold shimmer top edge */}
        <div className="h-0.5 w-full" style={{
          background: 'linear-gradient(90deg, transparent, rgba(245,158,11,0.6), rgba(245,158,11,1), rgba(245,158,11,0.6), transparent)'
        }} />

        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full" style={{ background: 'var(--color-border)' }} />
        </div>

        {/* Close */}
        <div className="flex justify-end px-4 flex-shrink-0">
          <button onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'var(--color-surface)' }}>
            <X size={14} style={{ color: 'var(--color-text-muted)' }} />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto custom-scroll px-5 pb-10 flex flex-col gap-6">

          {/* Hero */}
          <div className="flex flex-col items-center gap-3 pt-2 text-center">
            <motion.div
              animate={{ rotate: [0, -10, 10, -10, 0] }}
              transition={{ duration: 1.5, delay: 0.5 }}
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(245,158,11,0.05))',
                border:     '1px solid rgba(245,158,11,0.4)',
                boxShadow:  '0 0 30px rgba(245,158,11,0.2)',
              }}
            >
              <Crown size={28} style={{ color: '#f59e0b' }} />
            </motion.div>
            <h2 className="font-display font-black text-2xl tracking-wider"
              style={{ color: '#fde68a', textShadow: '0 0 20px rgba(245,158,11,0.5)' }}>
              ZENITH PREMIUM
            </h2>
            <p className="text-sm text-zenith-muted max-w-xs leading-relaxed">
              Unlock the full performance system.{' '}
              {triggerFeature && (
                <span style={{ color: '#fde68a' }}>
                  <strong>{triggerFeature}</strong> requires premium.
                </span>
              )}
            </p>
          </div>

          {/* Triggered feature highlight */}
          {triggerFeature && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 px-4 py-3 rounded-2xl"
              style={{
                background: 'rgba(245,158,11,0.08)',
                border:     '1px solid rgba(245,158,11,0.3)',
              }}
            >
              <Lock size={16} style={{ color: '#f59e0b', flexShrink: 0 }} />
              <div>
                <p className="text-sm font-bold" style={{ color: '#fde68a' }}>
                  {triggerFeature} is a Premium feature
                </p>
                <p className="text-xs text-zenith-faint mt-0.5">
                  Upgrade to unlock this and all other premium features.
                </p>
              </div>
            </motion.div>
          )}

          {/* ── Comparison table ── */}
          <div className="flex flex-col gap-1">
            <p className="font-display font-bold text-xs tracking-widest mb-2"
              style={{ color: 'var(--color-text-muted)' }}>
              FREE vs PREMIUM
            </p>

            {/* Header */}
            <div className="grid grid-cols-3 gap-2 mb-2">
              <div /> {/* feature label */}
              <div className="flex items-center justify-center">
                <span className="text-xs font-bold text-zenith-faint font-display tracking-wider">
                  FREE
                </span>
              </div>
              <div className="flex items-center justify-center">
                <PremiumBadge variant="pill" size="xs" />
              </div>
            </div>

            {/* Feature rows */}
            {FEATURE_TABLE_ORDER.map((key, i) => {
              const f = PREMIUM_FEATURES[key]
              return (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * i }}
                  className="grid grid-cols-3 gap-2 items-center py-2.5 rounded-xl px-2"
                  style={{
                    background: i % 2 === 0 ? 'var(--color-surface)' : 'transparent',
                    border:     i % 2 === 0 ? '1px solid var(--color-border)' : 'none',
                  }}
                >
                  {/* Feature name */}
                  <div className="flex items-center gap-2">
                    <span className="text-base">{f.icon}</span>
                    <span className="text-xs font-semibold leading-tight">{f.label}</span>
                  </div>

                  {/* Free column */}
                  <div className="flex items-center justify-center">
                    <span className="text-2xs text-center text-zenith-faint"
                      style={{ fontSize: '10px' }}>
                      {f.free}
                    </span>
                  </div>

                  {/* Premium column */}
                  <div className="flex items-center justify-center gap-1">
                    <Check size={11} style={{ color: '#22c55e', flexShrink: 0 }} />
                    <span className="text-2xs text-center font-semibold"
                      style={{ color: '#fde68a', fontSize: '10px' }}>
                      {f.premium}
                    </span>
                  </div>
                </motion.div>
              )
            })}
          </div>

          {/* Feature pills grid */}
          <div className="flex flex-col gap-3">
            <p className="font-display font-bold text-xs tracking-widest"
              style={{ color: 'var(--color-text-muted)' }}>
              WHAT YOU GET
            </p>
            <div className="flex flex-wrap gap-2">
              {Object.values(PREMIUM_FEATURES).map(f => (
                <div key={f.label}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
                  style={{
                    background: 'rgba(245,158,11,0.08)',
                    border:     '1px solid rgba(245,158,11,0.25)',
                    color:      '#fde68a',
                  }}>
                  <span>{f.icon}</span>
                  {f.label}
                </div>
              ))}
            </div>
          </div>

          {/* ── Admin-grant CTA (no payments yet) ── */}
          <div className="flex flex-col gap-3 pt-2">
            {/* Main CTA — visual only, no payment */}
            <div
              className="relative w-full py-4 rounded-2xl flex items-center justify-center gap-3 overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(245,158,11,0.05))',
                border:     '1px solid rgba(245,158,11,0.4)',
                boxShadow:  '0 0 24px rgba(245,158,11,0.1)',
              }}
            >
              {/* Gold shimmer sweep */}
              <motion.div
                className="absolute inset-0 pointer-events-none"
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 3 }}
                style={{
                  background: 'linear-gradient(90deg, transparent, rgba(245,158,11,0.15), transparent)',
                  width: '40%',
                }}
              />
              <Sparkles size={18} style={{ color: '#f59e0b' }} />
              <div className="text-center">
                <p className="font-display font-black text-sm tracking-wider"
                  style={{ color: '#fde68a' }}>
                  GET ZENITH PREMIUM
                </p>
                <p className="text-xs text-zenith-faint mt-0.5">
                  Coming soon — payments launching shortly
                </p>
              </div>
              <Crown size={18} style={{ color: '#f59e0b' }} />
            </div>

            {/* Admin-grant info box */}
            <div className="flex items-start gap-3 px-4 py-3 rounded-xl"
              style={{
                background: 'var(--color-surface)',
                border:     '1px solid var(--color-border)',
              }}
            >
              <span className="text-xl flex-shrink-0">ℹ️</span>
              <div>
                <p className="text-xs font-bold" style={{ color: 'var(--color-text)' }}>
                  How to get Premium
                </p>
                <p className="text-xs text-zenith-faint mt-1 leading-relaxed">
                  Premium access is currently granted by the admin.
                  Reach out via the feedback section and a team member
                  will review your account.
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  )
}
