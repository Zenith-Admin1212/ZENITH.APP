'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, RefreshCw, Flame, ChevronUp } from 'lucide-react'
import { useLeaderboard }    from '../hooks/useLeaderboard'
import { LeaderboardRowCard } from './LeaderboardRowCard'
import { useUserStore }      from '@/stores/userStore'
import type { LeaderboardPeriod } from '@/types'

// ═══════════════════════════════════════════════════════════════
//  LeaderboardDashboard  (streak-based)
// ═══════════════════════════════════════════════════════════════

const TABS: { id: LeaderboardPeriod; label: string; icon: string; sub: string }[] = [
  { id: 'weekly',  label: 'Week',    icon: '⚡', sub: 'Active this week' },
  { id: 'monthly', label: 'Month',   icon: '📅', sub: 'Active this month' },
  { id: 'alltime', label: 'All‑Time', icon: '👑', sub: 'Best streak ever' },
]

function SkeletonRow({ index }: { index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.04 }}
      className="flex items-center gap-3 px-4 py-3 rounded-2xl animate-pulse"
      style={{ background: 'var(--color-surface)' }}
    >
      <div className="w-8 h-8 rounded-lg"  style={{ background: 'var(--color-surface-active)' }} />
      <div className="w-10 h-10 rounded-xl" style={{ background: 'var(--color-surface-active)' }} />
      <div className="flex-1 flex flex-col gap-2">
        <div className="h-3 w-28 rounded" style={{ background: 'var(--color-surface-active)' }} />
        <div className="h-2 w-16 rounded" style={{ background: 'var(--color-surface-active)' }} />
      </div>
      <div className="h-5 w-10 rounded"  style={{ background: 'var(--color-surface-active)' }} />
    </motion.div>
  )
}

export function LeaderboardDashboard() {
  const { user }                                             = useUserStore()
  const { period, setPeriod, board, userRank, isLoading, refetch } = useLeaderboard()

  const top3       = board.slice(0, 3)
  const rest       = board.slice(3)
  const isAllTime  = period === 'alltime'
  const activeTab  = TABS.find(t => t.id === period)!

  return (
    <div className="flex flex-col pb-10 max-w-lg mx-auto gap-4 px-4 py-4">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy size={17} style={{ color: 'var(--color-primary)' }} />
          <h1 className="font-display font-black text-base tracking-widest text-glow">
            LEADERBOARD
          </h1>
        </div>
        <button
          onClick={refetch}
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-all active:scale-90"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        >
          <RefreshCw size={13} style={{ color: 'var(--color-text-faint)' }} />
        </button>
      </div>

      {/* ── Ranked-by callout ── */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
        style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.25)' }}>
        <Flame size={14} style={{ color: '#f97316' }} />
        <p className="text-xs font-semibold" style={{ color: '#fed7aa' }}>
          Ranked by <strong>streak</strong> — consistency wins.
        </p>
        <span className="ml-auto text-2xs text-zenith-faint">{activeTab.sub}</span>
      </div>

      {/* ── Period tabs ── */}
      <div className="flex gap-1.5">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setPeriod(tab.id)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold font-display tracking-wide transition-all"
            style={{
              background: period === tab.id ? 'var(--color-surface-active)' : 'var(--color-surface)',
              border:     `1px solid ${period === tab.id ? 'var(--color-primary)' : 'var(--color-border)'}`,
              color:      period === tab.id ? 'var(--color-primary)' : 'var(--color-text-muted)',
              boxShadow:  period === tab.id ? 'var(--glow-sm)' : 'none',
            }}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ── User rank card ── */}
      {userRank && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 px-4 py-3 rounded-2xl"
          style={{
            background: 'linear-gradient(135deg, rgba(var(--color-primary-rgb,0,245,255),0.07), transparent)',
            border:     '1px solid var(--color-border-glow)',
          }}
        >
          <Flame size={16} style={{ color: '#f97316', flexShrink: 0 }} />
          <div className="flex-1">
            {userRank.rank ? (
              <>
                <p className="text-sm font-semibold">
                  You're ranked <span className="text-glow font-black">#{userRank.rank}</span>
                  {' '}with a <span style={{ color: '#f97316' }} className="font-black">{userRank.streak}-day streak</span>
                </p>
                {userRank.above && (
                  <p className="text-xs text-zenith-faint mt-0.5">
                    <ChevronUp size={10} className="inline" />
                    {' '}{userRank.above.streak - userRank.streak} more days to pass <strong>{userRank.above.username}</strong>
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm font-semibold text-zenith-muted">
                Keep your streak alive to appear on the board
              </p>
            )}
          </div>
          {userRank.rank && (
            <div
              className="px-3 py-1 rounded-full font-display font-black text-sm text-glow"
              style={{
                background: 'rgba(var(--color-primary-rgb,0,245,255),0.12)',
                border:     '1px solid var(--color-border-glow)',
              }}
            >
              #{userRank.rank}
            </div>
          )}
        </motion.div>
      )}

      {/* ── Board ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={period}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="flex flex-col gap-2"
        >
          {isLoading ? (
            Array.from({ length: 10 }).map((_, i) => <SkeletonRow key={i} index={i} />)
          ) : board.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-14 text-center rounded-2xl"
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
              <span className="text-4xl">🔥</span>
              <p className="font-display font-bold text-sm text-glow">No streaks yet</p>
              <p className="text-xs text-zenith-faint">
                {period === 'weekly'
                  ? 'Complete habits this week to appear here.'
                  : period === 'monthly'
                    ? 'Stay active this month to rank.'
                    : 'Build a streak to claim your all-time rank.'}
              </p>
            </div>
          ) : (
            <>
              {/* Top 3 hero */}
              {top3.length > 0 && (
                <div className="flex flex-col gap-2 mb-1">
                  {top3.map((entry, i) => (
                    <LeaderboardRowCard
                      key={entry.id}
                      entry={entry}
                      isSelf={entry.id === user?.id}
                      index={i}
                      isAllTime={isAllTime}
                    />
                  ))}
                </div>
              )}

              {rest.length > 0 && (
                <div className="flex items-center gap-2 py-1">
                  <div className="flex-1 h-px" style={{ background: 'var(--color-border)' }} />
                  <span className="text-2xs text-zenith-faint font-display tracking-wider"
                    style={{ fontSize: '9px' }}>TOP 30</span>
                  <div className="flex-1 h-px" style={{ background: 'var(--color-border)' }} />
                </div>
              )}

              {rest.map((entry, i) => (
                <LeaderboardRowCard
                  key={entry.id}
                  entry={entry}
                  isSelf={entry.id === user?.id}
                  index={i + 3}
                  isAllTime={isAllTime}
                />
              ))}
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
