'use client'

import { motion } from 'framer-motion'
import { Clock, Trophy, AlertTriangle, CheckCircle2, Users, ArrowLeft } from 'lucide-react'
import { CHALLENGE_KIND_META } from '../constants/challengePresets'
import type { ActiveChallengeDetail, EnrichedParticipant } from '../services/challengeService'

// ═══════════════════════════════════════════════════════════════
//  ChallengeProgress — in-challenge detail panel
//  Shows: self progress hero, motivational message,
//         countdown, participant leaderboard with progress bars
// ═══════════════════════════════════════════════════════════════

// Recolor flame based on consecutive misses
function missColor(misses: number): string {
  if (misses === 0) return 'var(--color-primary)'
  if (misses === 1) return '#f97316'
  return '#ef4444'
}

interface ParticipantRowProps {
  p:          EnrichedParticipant
  isSelf:     boolean
  kindColor:  string
  index:      number
  trackUnit:  string
}

function ParticipantRow({ p, isSelf, kindColor, index, trackUnit }: ParticipantRowProps) {
  const isOut = p.status === 'failed' || p.status === 'abandoned'

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="flex items-center gap-3"
      style={{ opacity: isOut ? 0.45 : 1 }}
    >
      {/* Rank */}
      <span
        className="w-6 text-center font-display font-black text-xs flex-shrink-0"
        style={{ color: p.rank <= 3 ? kindColor : 'var(--color-text-faint)' }}
      >
        {p.status === 'completed' ? '✅' :
         p.status === 'failed'    ? '💀' :
         p.rank === 1             ? '🥇' :
         p.rank === 2             ? '🥈' :
         p.rank === 3             ? '🥉' : `#${p.rank}`}
      </span>

      {/* Avatar */}
      <div
        className="w-8 h-8 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
        style={{
          background: 'var(--color-surface-active)',
          border:     `1px solid ${isSelf ? kindColor : 'var(--color-border)'}`,
          boxShadow:  isSelf ? `0 0 8px ${kindColor}60` : 'none',
        }}
      >
        {p.avatar ?? '👤'}
      </div>

      {/* Name + progress bar */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold truncate"
            style={{ color: isSelf ? kindColor : 'var(--color-text)' }}>
            {p.username ?? 'User'}{isSelf ? ' (you)' : ''}
          </span>
          <span className="font-mono text-xs font-bold flex-shrink-0 ml-2"
            style={{ color: isOut ? 'var(--color-text-faint)' : kindColor }}>
            {p.progress_value} <span className="font-normal text-zenith-faint">{trackUnit}</span>
          </span>
        </div>
        {/* Progress bar */}
        <div className="h-1.5 rounded-full overflow-hidden"
          style={{ background: 'var(--color-surface-active)' }}>
          <motion.div
            className="h-full rounded-full"
            initial={{ width: 0 }}
            animate={{ width: isOut ? `${p.pct}%` : `${p.pct}%` }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.2 + index * 0.05 }}
            style={{
              background: isOut
                ? '#6b728080'
                : isSelf
                  ? `linear-gradient(90deg, ${kindColor}, ${kindColor}cc)`
                  : `${kindColor}70`,
              boxShadow:  (!isOut && isSelf) ? `0 0 6px ${kindColor}80` : 'none',
            }}
          />
        </div>
        {/* Consecutive miss warning */}
        {p.consecutive_misses > 0 && p.status === 'active' && (
          <p className="text-2xs mt-0.5" style={{ color: missColor(p.consecutive_misses), fontSize: '9px' }}>
            ⚠️ {p.consecutive_misses === 1 ? 'One miss' : 'Two misses'} — {2 - p.consecutive_misses} left
          </p>
        )}
      </div>
    </motion.div>
  )
}

interface ChallengeProgressProps {
  detail:  ActiveChallengeDetail
  onLeave: () => void
  onBack:  () => void
}

export function ChallengeProgress({ detail, onLeave, onBack }: ChallengeProgressProps) {
  const { challenge, participants, self, daysLeft, daysTotal, endDate } = detail
  const meta       = CHALLENGE_KIND_META[challenge.kind]
  const kindColor  = meta.color
  const isFinished = self?.status === 'completed' || self?.status === 'failed'
  const selfPct    = self?.pct ?? 0

  // Urgency color for countdown
  const countdownColor =
    daysLeft <= 1 ? '#ef4444' :
    daysLeft <= 3 ? '#f97316' :
    kindColor

  return (
    <div className="flex flex-col gap-4">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-xs text-zenith-muted transition-colors self-start"
      >
        <ArrowLeft size={13} /> Back to challenges
      </button>

      {/* ── Self hero card ── */}
      <div
        className="relative rounded-2xl p-5 overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${kindColor}15 0%, var(--color-surface) 100%)`,
          border:     `1px solid ${kindColor}40`,
          boxShadow:  `0 0 24px ${kindColor}18`,
        }}
      >
        {/* HUD scan lines */}
        <div className="absolute inset-0 opacity-[0.025] pointer-events-none"
          style={{ backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 2px,var(--color-primary) 2px,var(--color-primary) 3px)', backgroundSize: '100% 6px' }} />

        {/* Status states */}
        {self?.status === 'completed' && (
          <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-xl"
            style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)' }}>
            <CheckCircle2 size={15} style={{ color: '#22c55e' }} />
            <p className="text-sm font-bold" style={{ color: '#22c55e' }}>
              Challenge Complete — {challenge.xp_reward} XP awarded!
            </p>
          </div>
        )}
        {self?.status === 'failed' && (
          <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-xl"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
            <AlertTriangle size={15} style={{ color: '#ef4444' }} />
            <p className="text-sm font-bold" style={{ color: '#ef4444' }}>
              Challenge Failed — 2 consecutive misses
            </p>
          </div>
        )}

        <div className="relative z-10 flex items-center gap-4">
          {/* Challenge icon */}
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
            style={{ background: `${kindColor}20`, border: `1px solid ${kindColor}50`,
                     boxShadow: `0 0 16px ${kindColor}40` }}
          >
            {challenge.icon}
          </div>

          <div className="flex-1">
            <h2 className="font-display font-black text-base text-glow">{challenge.title}</h2>
            <p className="text-xs text-zenith-faint mt-0.5">{meta.label}</p>

            {/* Countdown */}
            {!isFinished && (
              <div className="flex items-center gap-1.5 mt-2">
                <Clock size={12} style={{ color: countdownColor }} />
                <span className="text-xs font-bold" style={{ color: countdownColor }}>
                  {daysLeft === 0
                    ? 'Last day!'
                    : `${daysLeft} day${daysLeft > 1 ? 's' : ''} left`}
                </span>
                <span className="text-2xs text-zenith-faint">· ends {endDate}</span>
              </div>
            )}
          </div>
        </div>

        {/* Self progress bar */}
        {self && (
          <div className="relative z-10 mt-4 flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold" style={{ color: kindColor }}>
                Your Progress
              </span>
              <span className="font-mono text-xs font-black text-glow">
                {self.progress_value} / {challenge.target_value} {meta.trackingUnit}
              </span>
            </div>
            <div className="h-3 rounded-full overflow-hidden"
              style={{ background: 'var(--color-surface-active)' }}>
              <motion.div
                className="h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${selfPct}%` }}
                transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
                style={{
                  background: `linear-gradient(90deg, ${kindColor}, ${kindColor}cc)`,
                  boxShadow:  `0 0 8px ${kindColor}80`,
                }}
              />
            </div>
            <div className="flex justify-between">
              <span className="text-xs font-bold" style={{ color: kindColor }}>{selfPct}%</span>
              {self.rank !== undefined && !isFinished && (
                <span className="text-xs text-zenith-faint">Rank #{self.rank} of {participants.length}</span>
              )}
            </div>

            {/* Motivational message */}
            {self.motivationalMsg && (
              <motion.p
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-xs mt-1 font-semibold"
                style={{ color: 'var(--color-text-muted)' }}
              >
                {self.motivationalMsg}
              </motion.p>
            )}
          </div>
        )}

        {/* Miss warning */}
        {self?.consecutive_misses === 1 && self.status === 'active' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative z-10 mt-3 flex items-center gap-2 px-3 py-2 rounded-xl"
            style={{ background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.3)' }}
          >
            <AlertTriangle size={13} style={{ color: '#f97316' }} />
            <p className="text-xs font-semibold" style={{ color: '#fed7aa' }}>
              You missed yesterday — one more miss and you fail the challenge!
            </p>
          </motion.div>
        )}
      </div>

      {/* ── Participant leaderboard ── */}
      <div
        className="rounded-2xl p-4 flex flex-col gap-4"
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy size={14} style={{ color: kindColor }} />
            <span className="font-display font-bold text-xs tracking-widest"
              style={{ color: 'var(--color-text-muted)' }}>
              PARTICIPANTS
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs text-zenith-faint">
            <Users size={11} />
            {participants.length}
          </div>
        </div>

        {/* Participant rows */}
        <div className="flex flex-col gap-3">
          {participants.length === 0 ? (
            <p className="text-xs text-zenith-faint text-center py-4">
              No other participants yet — invite friends!
            </p>
          ) : (
            participants.map((p, i) => (
              <ParticipantRow
                key={p.id}
                p={p}
                isSelf={p.user_id === (self?.user_id)}
                kindColor={kindColor}
                index={i}
                trackUnit={meta.trackingUnit}
              />
            ))
          )}
        </div>
      </div>

      {/* Leave button */}
      {self?.status === 'active' && (
        <button
          onClick={onLeave}
          className="w-full py-2.5 rounded-xl text-xs font-semibold transition-all active:scale-95"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)',
                   color: '#f87171' }}
        >
          Abandon Challenge
        </button>
      )}
    </div>
  )
}
