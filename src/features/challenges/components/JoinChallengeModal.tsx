'use client'

import { motion } from 'framer-motion'
import { X, AlertTriangle, Zap, Clock, Trophy, CheckCircle2 } from 'lucide-react'
import { CHALLENGE_KIND_META, CHALLENGE_FAIL_THRESHOLD } from '../constants/challengePresets'
import type { Challenge } from '@/types'

// ═══════════════════════════════════════════════════════════════
//  JoinChallengeModal — confirmation bottom sheet
//  Shows rules, rewards, fail conditions before user commits.
// ═══════════════════════════════════════════════════════════════

const KIND_RULES: Record<string, string[]> = {
  habit_streak: [
    'Complete at least one habit every day',
    'Missing 2 days in a row ends the challenge',
    'Streak must stay active for the full duration',
  ],
  xp_race: [
    'Earn XP from habits, pomodoros, and check-ins',
    'Missing 2 days with 0 XP ends the challenge',
    'Whoever earns the most XP wins the badge',
  ],
  perfect_week: [
    'Complete ALL your habits every single day',
    'A partial day counts as a miss',
    '2 consecutive misses and you\'re out',
  ],
  pomodoro_sprint: [
    'Complete Pomodoro sessions every day',
    'Missing 2 consecutive days fails the challenge',
    'Each 25-minute session counts as 1 session',
  ],
}

interface JoinChallengeModalProps {
  challenge:  Challenge
  onConfirm:  () => void
  onClose:    () => void
  isJoining:  boolean
}

export function JoinChallengeModal({ challenge, onConfirm, onClose, isJoining }: JoinChallengeModalProps) {
  const meta  = CHALLENGE_KIND_META[challenge.kind]
  const rules = KIND_RULES[challenge.kind] ?? []

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50"
        style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
        onClick={onClose}
      />

      {/* Sheet */}
      <motion.div
        initial={{ y: '100%', opacity: 0.8 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 340, damping: 36 }}
        className="fixed inset-x-0 bottom-0 z-50 rounded-t-3xl flex flex-col max-h-[88vh] overflow-y-auto custom-scroll"
        style={{
          background: 'var(--color-bg-secondary)',
          border:     '1px solid var(--color-border-glow)',
        }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ background: 'var(--color-border)' }} />
        </div>

        {/* Close button */}
        <div className="flex justify-end px-4 pt-1">
          <button onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'var(--color-surface)' }}>
            <X size={14} style={{ color: 'var(--color-text-muted)' }} />
          </button>
        </div>

        <div className="px-5 pb-8 flex flex-col gap-5">
          {/* Challenge hero */}
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
              style={{
                background: `${meta.color}18`,
                border:     `1px solid ${meta.color}50`,
                boxShadow:  `0 0 20px ${meta.color}30`,
              }}
            >
              {challenge.icon}
            </div>
            <div>
              <h2 className="font-display font-black text-lg text-glow leading-tight">
                {challenge.title}
              </h2>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-sm">{meta.icon}</span>
                <span className="text-xs font-bold font-display"
                  style={{ color: meta.color, letterSpacing: '0.08em' }}>
                  {meta.label.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {/* Description */}
          <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
            {challenge.description}
          </p>

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { icon: <Clock size={14} style={{ color: meta.color }} />,
                label: 'Duration', value: `${challenge.duration_days} days` },
              { icon: <Zap size={14} style={{ color: '#f59e0b' }} />,
                label: 'XP Reward', value: `${challenge.xp_reward} XP` },
              { icon: <Trophy size={14} style={{ color: '#a855f7' }} />,
                label: 'Badge', value: challenge.badge_name ?? '—' },
            ].map(s => (
              <div key={s.label}
                className="flex flex-col items-center gap-1.5 py-3 rounded-xl"
                style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                {s.icon}
                <span className="font-bold text-sm text-glow">{s.value}</span>
                <span className="text-2xs text-zenith-faint" style={{ fontSize: '9px' }}>
                  {s.label.toUpperCase()}
                </span>
              </div>
            ))}
          </div>

          {/* Rules */}
          <div className="flex flex-col gap-2">
            <p className="text-xs font-display font-bold tracking-wider"
              style={{ color: 'var(--color-text-muted)' }}>
              RULES
            </p>
            {rules.map((rule, i) => (
              <div key={i} className="flex items-start gap-2">
                <CheckCircle2 size={13} className="mt-0.5 flex-shrink-0"
                  style={{ color: meta.color }} />
                <p className="text-xs leading-relaxed">{rule}</p>
              </div>
            ))}
          </div>

          {/* Fail condition warning */}
          <div className="flex items-start gap-3 px-3 py-3 rounded-xl"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
            <AlertTriangle size={14} style={{ color: '#f87171', flexShrink: 0, marginTop: 1 }} />
            <p className="text-xs leading-relaxed" style={{ color: '#fca5a5' }}>
              <strong>Fail condition:</strong> Missing {CHALLENGE_FAIL_THRESHOLD} consecutive days
              will automatically fail the challenge. No exceptions.
            </p>
          </div>

          {/* Confirm button */}
          <button
            onClick={onConfirm}
            disabled={isJoining}
            className="w-full py-4 rounded-2xl font-display font-black text-sm tracking-wider
                       transition-all active:scale-95 disabled:opacity-60"
            style={{
              background: meta.color,
              color:      '#000',
              boxShadow:  `0 0 20px ${meta.color}60`,
            }}
          >
            {isJoining ? 'Joining…' : `Accept Challenge → ${challenge.xp_reward} XP`}
          </button>

          <p className="text-xs text-zenith-faint text-center">
            You can abandon this challenge at any time from the progress view.
          </p>
        </div>
      </motion.div>
    </>
  )
}
