'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Crown, Users, Clock, Zap, CheckCircle2 } from 'lucide-react'
import { CHALLENGE_KIND_META } from '../constants/challengePresets'
import { usePremium }   from '@/features/premium/hooks/usePremium'
import { UpgradeModal } from '@/features/premium/components/UpgradeModal'
import type { Challenge } from '@/types'

// ═══════════════════════════════════════════════════════════════
//  ChallengeCard — browse catalog card
// ═══════════════════════════════════════════════════════════════

interface ChallengeCardProps {
  challenge:       Challenge
  isEnrolled:      boolean
  isPremium:       boolean
  participantCount: number
  index:           number
  onJoin:          () => void
  onView:          () => void
  isJoining:       boolean
}

export function ChallengeCard({
  challenge, isEnrolled, isPremium, participantCount,
  index, onJoin, onView, isJoining,
}: ChallengeCardProps) {
  const meta      = CHALLENGE_KIND_META[challenge.kind]
  const [showUpgrade, setShowUpgrade] = useState(false)
  const isLocked  = challenge.tier === 'premium' && !isPremium
  const kindColor = meta.color

  return (
    <>
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.3 }}
      className="relative rounded-2xl overflow-hidden flex flex-col"
      style={{
        background: isEnrolled
          ? `linear-gradient(135deg, ${kindColor}12 0%, var(--color-surface) 100%)`
          : 'var(--color-surface)',
        border: `1px solid ${isEnrolled ? kindColor + '50' : 'var(--color-border)'}`,
        boxShadow: isEnrolled ? `0 0 18px ${kindColor}20` : 'none',
      }}
    >
      {/* Locked overlay */}
      {isLocked && (
        <div
          className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl cursor-pointer"
          style={{ backdropFilter: 'blur(3px)', background: 'rgba(0,0,0,0.5)' }}
          onClick={() => setShowUpgrade(true)}
        >
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
              style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.4)' }}>
              <Crown size={13} style={{ color: '#f59e0b' }} />
              <span className="text-xs font-bold font-display" style={{ color: '#f59e0b' }}>
                PREMIUM
              </span>
            </div>
            <p className="text-xs text-center" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {challenge.xp_reward} XP reward
            </p>
            <p className="text-2xs font-display tracking-wider"
              style={{ color: 'rgba(245,158,11,0.6)', fontSize: '9px' }}>
              TAP TO UPGRADE
            </p>
          </div>
        </div>
      )}

      {/* Card content */}
      <div className="p-4 flex flex-col gap-3">
        {/* Header row */}
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
            style={{
              background: `${kindColor}18`,
              border:     `1px solid ${kindColor}40`,
              boxShadow:  isEnrolled ? `0 0 12px ${kindColor}40` : 'none',
            }}
          >
            {challenge.icon}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-display font-black text-sm leading-tight">
                {challenge.title}
              </h3>
              {isEnrolled && (
                <span className="flex items-center gap-1 text-2xs px-1.5 py-0.5 rounded-full font-bold"
                  style={{ background: '#22c55e18', color: '#22c55e',
                           border: '1px solid #22c55e40', fontSize: '9px' }}>
                  <CheckCircle2 size={8} /> JOINED
                </span>
              )}
            </div>

            {/* Kind badge */}
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-xs">{meta.icon}</span>
              <span className="text-2xs font-bold font-display tracking-wider"
                style={{ color: kindColor, fontSize: '9px', letterSpacing: '0.1em' }}>
                {meta.label.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
          {challenge.description}
        </p>

        {/* Stats row */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className="flex items-center gap-1 text-xs text-zenith-faint">
            <Clock size={11} style={{ color: kindColor }} />
            {challenge.duration_days}d
          </span>
          <span className="flex items-center gap-1 text-xs text-zenith-faint">
            <Zap size={11} style={{ color: '#f59e0b' }} />
            {challenge.target_value} {CHALLENGE_KIND_META[challenge.kind].trackingUnit}
          </span>
          <span className="flex items-center gap-1 text-xs text-zenith-faint">
            <Users size={11} />
            {participantCount} joined
          </span>
          <span className="ml-auto flex items-center gap-1 text-xs font-bold font-display"
            style={{ color: '#f59e0b' }}>
            ⚡ {challenge.xp_reward} XP
          </span>
        </div>

        {/* Badge reward */}
        {challenge.badge_name && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
            style={{ background: 'var(--color-surface-active)',
                     border: '1px solid var(--color-border)' }}>
            <span className="text-sm">{challenge.badge_icon}</span>
            <span className="text-xs text-zenith-muted">Badge reward: </span>
            <span className="text-xs font-semibold">{challenge.badge_name}</span>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2 pt-1">
          {isEnrolled ? (
            <button
              onClick={onView}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold font-display tracking-wide transition-all active:scale-95"
              style={{
                background: `${kindColor}18`,
                border:     `1px solid ${kindColor}50`,
                color:      kindColor,
                boxShadow:  `0 0 10px ${kindColor}20`,
              }}
            >
              View Progress →
            </button>
          ) : (
            <button
              onClick={onJoin}
              disabled={isLocked || isJoining}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold font-display tracking-wide transition-all active:scale-95 disabled:opacity-50"
              style={{
                background: kindColor,
                color:      '#000',
                boxShadow:  `0 0 14px ${kindColor}50`,
              }}
            >
              {isJoining ? 'Joining…' : `Join Challenge`}
            </button>
          )}
        </div>
      </div>
    </motion.div>
    {/* Upgrade modal */}
    <AnimatePresence>
      {showUpgrade && (
        <UpgradeModal
          triggerFeature="Elite Challenges"
          onClose={() => setShowUpgrade(false)}
        />
      )}
    </AnimatePresence>
    </>
  )
}