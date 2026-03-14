'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Swords, RefreshCw, CheckCircle2, Clock } from 'lucide-react'
import { useChallenges, useChallengeDetail } from '../hooks/useChallenges'
import { ChallengeCard }     from './ChallengeCard'
import { ChallengeProgress } from './ChallengeProgress'
import { JoinChallengeModal } from './JoinChallengeModal'
import { CHALLENGE_KIND_META } from '../constants/challengePresets'
import { useUserStore }       from '@/stores/userStore'
import type { Challenge, ChallengeKind } from '@/types'

// ═══════════════════════════════════════════════════════════════
//  ChallengesDashboard — Phase 10 challenges page
//
//  Views:
//   1. Catalog (browse all)
//   2. Detail (progress view for an enrolled challenge)
//
//  Tabs (catalog): All · Active · By kind
// ═══════════════════════════════════════════════════════════════

type CatalogFilter = 'all' | 'enrolled' | ChallengeKind

const KIND_FILTERS: { id: ChallengeKind; label: string; icon: string }[] = [
  { id: 'habit_streak',    label: 'Streak',   icon: '🔥' },
  { id: 'xp_race',         label: 'XP Race',  icon: '⚡' },
  { id: 'perfect_week',    label: 'Perfect',  icon: '⭐' },
  { id: 'pomodoro_sprint', label: 'Focus',    icon: '⏱️' },
]

function ActiveEnrolledBadge({ count }: { count: number }) {
  if (count === 0) return null
  return (
    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-bold"
      style={{ background: '#22c55e18', color: '#22c55e',
               border: '1px solid #22c55e40', fontSize: '9px' }}>
      <CheckCircle2 size={8} /> {count} active
    </span>
  )
}

export function ChallengesDashboard() {
  const { user }   = useUserStore()
  const {
    catalog, enrolled, enrolledIds,
    isLoading, isEnrolling, join, leave, refetch,
  } = useChallenges()

  const [filter,          setFilter]          = useState<CatalogFilter>('all')
  const [joinTarget,      setJoinTarget]      = useState<Challenge | null>(null)
  const [viewingChallenge, setViewingChallenge] = useState<Challenge | null>(null)

  const { detail, isLoading: detailLoading } = useChallengeDetail(viewingChallenge)

  const isPremium        = user?.plan === 'premium'
  const activeEnrolled   = enrolled.filter(e => e.status === 'active')
  const participantCounts: Record<string, number> = {}  // placeholder — populated from Phase 15 DB

  // ── Filter catalog ────────────────────────────────────────
  const filtered = catalog.filter(c => {
    if (filter === 'enrolled') return enrolledIds.has(c.id)
    if (filter === 'all')      return true
    return c.kind === filter
  })

  // ── Handle join confirm ───────────────────────────────────
  const handleJoinConfirm = () => {
    if (!joinTarget) return
    join(joinTarget.id)
    setJoinTarget(null)
  }

  // ── Handle "View Progress" ────────────────────────────────
  const handleViewProgress = (challenge: Challenge) => {
    setViewingChallenge(challenge)
  }

  // ── Detail view ───────────────────────────────────────────
  if (viewingChallenge) {
    return (
      <div className="flex flex-col pb-10 max-w-lg mx-auto px-4 py-4">
        {detailLoading || !detail ? (
          <div className="flex flex-col gap-4 animate-pulse">
            <div className="h-10 w-32 rounded-xl" style={{ background: 'var(--color-surface)' }} />
            <div className="h-48 rounded-2xl" style={{ background: 'var(--color-surface)' }} />
            <div className="h-64 rounded-2xl" style={{ background: 'var(--color-surface)' }} />
          </div>
        ) : (
          <ChallengeProgress
            detail={detail}
            onLeave={() => {
              leave(viewingChallenge.id)
              setViewingChallenge(null)
            }}
            onBack={() => setViewingChallenge(null)}
          />
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col pb-10 max-w-lg mx-auto gap-4 px-4 py-4">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Swords size={17} style={{ color: 'var(--color-primary)' }} />
          <h1 className="font-display font-black text-base tracking-widest text-glow">
            CHALLENGES
          </h1>
          <ActiveEnrolledBadge count={activeEnrolled.length} />
        </div>
        <button
          onClick={refetch}
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-all active:scale-90"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        >
          <RefreshCw size={13} style={{ color: 'var(--color-text-faint)' }} />
        </button>
      </div>

      {/* ── Hero copy ── */}
      <div className="px-4 py-3 rounded-2xl"
        style={{ background: 'linear-gradient(135deg, rgba(var(--color-primary-rgb,0,245,255),0.06), transparent)',
                 border: '1px solid var(--color-border-glow)' }}>
        <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
          Compete against the community. Prove your discipline.
          Each challenge tests a different dimension of your consistency.
        </p>
      </div>

      {/* ── Active enrollments summary ── */}
      {activeEnrolled.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="font-display font-bold text-xs tracking-widest"
            style={{ color: 'var(--color-text-muted)' }}>
            YOUR ACTIVE CHALLENGES
          </span>
          {activeEnrolled.map(e => {
            const c = catalog.find(ch => ch.id === e.challenge_id)
            if (!c) return null
            const meta = CHALLENGE_KIND_META[c.kind]
            return (
              <motion.button
                key={e.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={() => handleViewProgress(c)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all active:scale-98"
                style={{
                  background: `${meta.color}10`,
                  border:     `1px solid ${meta.color}40`,
                }}
              >
                <span className="text-xl">{c.icon}</span>
                <div className="flex-1">
                  <p className="font-semibold text-sm">{c.title}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-xs">{meta.icon}</span>
                    <span className="text-xs text-zenith-faint">{meta.label}</span>
                    <span className="text-2xs text-zenith-faint">·</span>
                    <span className="text-2xs font-bold" style={{ color: meta.color, fontSize: '9px' }}>
                      {e.progress_value} {meta.trackingUnit}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs text-zenith-faint">
                  <Clock size={11} />
                  <span>View</span>
                </div>
              </motion.button>
            )
          })}
        </div>
      )}

      {/* ── Filter tabs ── */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 custom-scroll">
        {[
          { id: 'all' as CatalogFilter,      label: 'All',      icon: '🎯' },
          { id: 'enrolled' as CatalogFilter, label: 'Joined',   icon: '✅' },
          ...KIND_FILTERS.map(k => ({ id: k.id as CatalogFilter, label: k.label, icon: k.icon })),
        ].map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold
                       font-display tracking-wide transition-all"
            style={{
              background: filter === f.id ? 'var(--color-surface-active)' : 'var(--color-surface)',
              border:     `1px solid ${filter === f.id ? 'var(--color-primary)' : 'var(--color-border)'}`,
              color:      filter === f.id ? 'var(--color-primary)' : 'var(--color-text-muted)',
              boxShadow:  filter === f.id ? 'var(--glow-sm)' : 'none',
            }}
          >
            <span>{f.icon}</span>
            <span>{f.label}</span>
          </button>
        ))}
      </div>

      {/* ── Catalog ── */}
      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-44 rounded-2xl animate-pulse"
              style={{ background: 'var(--color-surface)' }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-14 text-center rounded-2xl"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <span className="text-4xl">🎯</span>
          <p className="font-display font-bold text-sm text-glow">
            {filter === 'enrolled' ? 'No active challenges' : 'No challenges found'}
          </p>
          <p className="text-xs text-zenith-faint">
            {filter === 'enrolled' ? 'Join a challenge from the catalog.' : 'Check back soon.'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((c, i) => (
            <ChallengeCard
              key={c.id}
              challenge={c}
              isEnrolled={enrolledIds.has(c.id)}
              isPremium={isPremium}
              participantCount={participantCounts[c.id] ?? 0}
              index={i}
              isJoining={isEnrolling}
              onJoin={() => setJoinTarget(c)}
              onView={() => handleViewProgress(c)}
            />
          ))}
        </div>
      )}

      {/* ── Join modal ── */}
      <AnimatePresence>
        {joinTarget && (
          <JoinChallengeModal
            challenge={joinTarget}
            onConfirm={handleJoinConfirm}
            onClose={() => setJoinTarget(null)}
            isJoining={isEnrolling}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
