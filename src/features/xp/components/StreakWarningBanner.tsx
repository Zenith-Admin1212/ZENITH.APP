'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, Shield } from 'lucide-react'
import { useUserStore }  from '@/stores/userStore'
import { useStreakStore } from '@/stores/streakStore'

// ═══════════════════════════════════════════════════════════════
//  StreakWarningBanner — shows when consecutive_miss_days > 0
// ═══════════════════════════════════════════════════════════════

export function StreakWarningBanner() {
  const { user }   = useUserStore()
  const { streak } = useStreakStore()

  const missDays   = (user as { consecutive_miss_days?: number } | null)?.consecutive_miss_days ?? 0
  const shields    = (user as { monthly_shields_remaining?: number } | null)?.monthly_shields_remaining ?? 0

  if (missDays === 0 || streak === 0) return null

  const isDanger = missDays >= 2

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -12, height: 0 }}
        animate={{ opacity: 1, y: 0, height: 'auto' }}
        exit={{ opacity: 0, y: -8, height: 0 }}
        transition={{ duration: 0.3 }}
        className="mx-4 mt-1 rounded-xl px-4 py-3 flex items-center gap-3"
        style={{
          background: isDanger ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
          border:     `1px solid ${isDanger ? 'rgba(239,68,68,0.35)' : 'rgba(245,158,11,0.35)'}`,
        }}
      >
        <AlertTriangle
          size={16}
          style={{ color: isDanger ? '#f87171' : '#fbbf24', flexShrink: 0 }}
        />
        <div className="flex-1 min-w-0">
          <p
            className="text-xs font-semibold"
            style={{ color: isDanger ? '#fca5a5' : '#fde68a' }}
          >
            {isDanger
              ? `⚠️ Streak at risk — missed ${missDays} days`
              : `Missed yesterday — don't miss today!`
            }
          </p>
          {shields > 0 && isDanger && (
            <p className="text-2xs mt-0.5" style={{ color: 'var(--color-text-faint)' }}>
              You have {shields} 🛡️ shield{shields !== 1 ? 's' : ''} available
            </p>
          )}
        </div>
        {shields > 0 && (
          <div className="flex items-center gap-1 flex-shrink-0">
            <Shield size={13} style={{ color: '#60a5fa' }} />
            <span className="text-xs font-bold" style={{ color: '#60a5fa' }}>{shields}</span>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}
