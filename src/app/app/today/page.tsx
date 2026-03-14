'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ClipboardCheck, Plus } from 'lucide-react'

// Features
import { LiveClock }       from '@/features/dashboard/components/LiveClock'
import { PerformanceRing } from '@/features/dashboard/components/PerformanceRing'
import { StatCards }       from '@/features/dashboard/components/StatCards'
import { CheckInModal }    from '@/features/dashboard/components/CheckInModal'
import { WaterWidget }     from '@/features/dashboard/components/WaterWidget'
import { PomodoroWidget }  from '@/features/dashboard/components/PomodoroWidget'
import { HabitList }       from '@/features/habits/components/HabitList'
import { AddHabitModal }   from '@/features/habits/components/AddHabitModal'
import { XPBar }           from '@/features/xp/components/XPBar'
import { StreakWarningBanner } from '@/features/xp/components/StreakWarningBanner'

// Stores
import { useUserStore }  from '@/stores/userStore'
import { useHabitStore } from '@/stores/habitStore'
import { useHabits }     from '@/features/habits/hooks/useHabits'

// ─────────────────────────────────────────────────────────────────
//  Section wrapper — consistent card header style
// ─────────────────────────────────────────────────────────────────
function SectionHeader({ title, icon, action }: {
  title: string; icon?: string; action?: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        {icon && <span className="text-base">{icon}</span>}
        <h3
          className="font-display font-bold text-xs tracking-[0.2em]"
          style={{ color: 'var(--color-text-muted)' }}
        >
          {title.toUpperCase()}
        </h3>
      </div>
      {action}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
//  HUD Corner decorations (visual flourish from ref images)
// ─────────────────────────────────────────────────────────────────
function HUDCorners() {
  const style = { position: 'absolute' as const, width: 16, height: 16 }
  const lineStyle = { background: 'var(--color-primary)', opacity: 0.6 }

  return (
    <>
      {/* Top-left */}
      <div style={{ ...style, top: 0, left: 0 }}>
        <div style={{ ...lineStyle, width: 16, height: 2, position: 'absolute', top: 0, left: 0 }} />
        <div style={{ ...lineStyle, width: 2, height: 16, position: 'absolute', top: 0, left: 0 }} />
      </div>
      {/* Top-right */}
      <div style={{ ...style, top: 0, right: 0 }}>
        <div style={{ ...lineStyle, width: 16, height: 2, position: 'absolute', top: 0, right: 0 }} />
        <div style={{ ...lineStyle, width: 2, height: 16, position: 'absolute', top: 0, right: 0 }} />
      </div>
      {/* Bottom-left */}
      <div style={{ ...style, bottom: 0, left: 0 }}>
        <div style={{ ...lineStyle, width: 16, height: 2, position: 'absolute', bottom: 0, left: 0 }} />
        <div style={{ ...lineStyle, width: 2, height: 16, position: 'absolute', bottom: 0, left: 0 }} />
      </div>
      {/* Bottom-right */}
      <div style={{ ...style, bottom: 0, right: 0 }}>
        <div style={{ ...lineStyle, width: 16, height: 2, position: 'absolute', bottom: 0, right: 0 }} />
        <div style={{ ...lineStyle, width: 2, height: 16, position: 'absolute', bottom: 0, right: 0 }} />
      </div>
    </>
  )
}

// ─────────────────────────────────────────────────────────────────
//  TODAY PAGE
// ─────────────────────────────────────────────────────────────────
export default function TodayPage() {
  const { user }    = useUserStore()
  const { habits }  = useHabits()
  const { getTodayCompletionCount, getTodayCompletionPct } = useHabitStore()

  const [showCheckIn,    setShowCheckIn]    = useState(false)
  const [showAddHabit,   setShowAddHabit]   = useState(false)

  const { done, total } = getTodayCompletionCount()
  const pct = getTodayCompletionPct()

  // Discipline: habits completed / total across active period
  const disciplinePct = total > 0 ? Math.round((done / total) * 100) : 0

  const stagger = (i: number) => ({ initial: { opacity: 0, y: 18 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4, delay: i * 0.07 } })

  return (
    <>
      <div className="px-4 py-4 flex flex-col gap-5 max-w-lg mx-auto pb-6">

        {/* ─── HERO: Clock + Performance Ring ─────────────────── */}
        <motion.div {...stagger(0)}>
          <div
            className="relative rounded-2xl p-5 overflow-hidden"
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border-glow)',
              boxShadow: 'var(--glow-sm)',
            }}
          >
            <HUDCorners />

            {/* Scan-line overlay */}
            <div
              className="absolute inset-0 pointer-events-none opacity-5"
              style={{
                backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, var(--color-primary) 2px, var(--color-primary) 3px)',
                backgroundSize: '100% 6px',
              }}
            />

            <div className="relative z-10 flex flex-col items-center gap-5">
              {/* Clock */}
              <LiveClock />

              {/* Performance ring */}
              <PerformanceRing percentage={pct} done={done} total={total} size={200} />

              {/* Achievement status label */}
              <div className="flex items-center gap-2">
                <div
                  className="h-px flex-1 w-12"
                  style={{ background: 'var(--color-border)' }}
                />
                <span
                  className="font-display font-semibold text-xs tracking-[0.2em]"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  {pct === 100 ? '⚡ PERFECT DAY' : pct >= 80 ? '🔥 ON FIRE' : pct >= 50 ? '💪 IN PROGRESS' : 'DAILY PERFORMANCE'}
                </span>
                <div
                  className="h-px flex-1 w-12"
                  style={{ background: 'var(--color-border)' }}
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* ─── STREAK WARNING ──────────────────────────────────── */}
        <StreakWarningBanner />

        {/* ─── STAT CARDS ─────────────────────────────────────── */}
        <motion.div {...stagger(1)}>
          <StatCards disciplinePct={disciplinePct} />
        </motion.div>

        {/* ─── XP BAR ─────────────────────────────────────────── */}
        <motion.div {...stagger(2)}>
          <XPBar />
        </motion.div>

        {/* ─── WIDGETS ROW ─────────────────────────────────────── */}
        <motion.div {...stagger(3)} className="flex flex-col gap-3">
          <PomodoroWidget />
          <WaterWidget />
        </motion.div>

        {/* ─── HABITS ──────────────────────────────────────────── */}
        <motion.div {...stagger(4)}>
          <div
            className="rounded-2xl p-4 relative overflow-hidden"
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
            }}
          >
            <SectionHeader
              title="Today's Habits"
              icon="⚡"
              action={
                <span className="text-xs font-mono text-zenith-faint">
                  {done}/{total} done
                </span>
              }
            />
            <HabitList onAddHabit={() => setShowAddHabit(true)} />
          </div>
        </motion.div>

        {/* ─── CHECK-IN BUTTON ─────────────────────────────────── */}
        <motion.div {...stagger(5)}>
          <button
            onClick={() => setShowCheckIn(true)}
            className="w-full flex items-center justify-center gap-3 py-4 rounded-xl transition-all duration-200 active:scale-98 group"
            style={{
              background: 'linear-gradient(135deg, var(--color-surface) 0%, rgba(var(--color-primary-rgb,0,245,255),0.04) 100%)',
              border: '1px solid var(--color-border-glow)',
              boxShadow: 'var(--glow-sm)',
            }}
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'var(--color-surface-active)' }}
            >
              <ClipboardCheck size={18} style={{ color: 'var(--color-primary)' }} />
            </div>
            <div className="text-left">
              <p className="font-display font-bold text-sm text-glow">Daily Check-In</p>
              <p className="text-xs text-zenith-muted">Log sleep, mood, focus & more</p>
            </div>
            <div
              className="ml-auto text-xs font-bold px-2.5 py-1 rounded-lg font-display"
              style={{
                background: 'var(--color-surface-active)',
                color: 'var(--color-primary)',
                border: '1px solid var(--color-border-glow)',
              }}
            >
              +XP
            </div>
          </button>
        </motion.div>

      </div>

      {/* ─── CHECK-IN MODAL ──────────────────────────────────── */}
      <AnimatePresence>
        {showCheckIn && (
          <CheckInModal
            onClose={() => setShowCheckIn(false)}
            onSuccess={() => setShowCheckIn(false)}
          />
        )}
        {showAddHabit && (
          <AddHabitModal onClose={() => setShowAddHabit(false)} />
        )}
      </AnimatePresence>
    </>
  )
}
