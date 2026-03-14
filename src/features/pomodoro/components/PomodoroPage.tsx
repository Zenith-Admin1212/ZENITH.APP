'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause, Square, RotateCcw, Zap, Clock, CheckCircle2 } from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase }       from '@/lib/supabase/client'
import { useUserStore }   from '@/stores/userStore'
import { useXPEngine }    from '@/features/xp/hooks/useXPEngine'
import { format }         from 'date-fns'

// ═══════════════════════════════════════════════════════════════
//  Full Pomodoro Page
//  25-min focus + 5-min break, session counter, history, XP
// ═══════════════════════════════════════════════════════════════

const FOCUS_SECS = 25 * 60
const BREAK_SECS = 5  * 60
type TimerMode  = 'focus' | 'break'
type TimerState = 'idle' | 'running' | 'paused'

// Circular progress arc helpers
const R             = 110
const CIRC          = 2 * Math.PI * R
const CENTER        = 130

function arcPath(pct: number) {
  return CIRC - (pct / 100) * CIRC
}

// Format seconds as MM:SS
function fmt(secs: number) {
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

interface SessionRecord {
  id: string
  duration_min: number
  completed: boolean
  xp_earned: number
  started_at: string
}

export default function PomodoroPage() {
  const { user }        = useUserStore()
  const { grantXP }     = useXPEngine()
  const queryClient     = useQueryClient()

  const [mode,     setMode]     = useState<TimerMode>('focus')
  const [timerState, setTimerState] = useState<TimerState>('idle')
  const [secs,     setSecs]     = useState(FOCUS_SECS)
  const [sessions, setSessions] = useState(0)
  const [totalFocusMin, setTotalFocusMin] = useState(0)

  const startTimeRef  = useRef<Date | null>(null)
  const intervalRef   = useRef<NodeJS.Timeout | null>(null)

  const totalSecs = mode === 'focus' ? FOCUS_SECS : BREAK_SECS
  const pct       = ((totalSecs - secs) / totalSecs) * 100
  const today     = format(new Date(), 'yyyy-MM-dd')

  // ── Fetch session history ─────────────────────────────────────
  const historyQuery = useQuery({
    queryKey: ['pomodoro-history', user?.id, today],
    queryFn:  async () => {
      const { data } = await supabase
        .from('pomodoro_sessions')
        .select('id, duration_min, completed, xp_earned, started_at')
        .eq('user_id', user!.id)
        .eq('date', today)
        .order('started_at', { ascending: false })
        .limit(10)
      return data as SessionRecord[]
    },
    enabled: !!user?.id,
    staleTime: 30_000,
  })

  // ── Complete a focus session ──────────────────────────────────
  const handleFocusComplete = useCallback(async () => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    const focusMin = 25
    setSessions(s => s + 1)
    setTotalFocusMin(m => m + focusMin)

    // Grant XP
    await grantXP(10, 'pomodoro_session', 'Pomodoro session completed')

    // Log to DB
    if (user?.id) {
      await supabase.from('pomodoro_sessions').insert({
        user_id:    user.id,
        duration_min: focusMin,
        break_min:  5,
        rounds:     1,
        completed:  true,
        xp_earned:  10,
        date:       today,
        started_at: startTimeRef.current?.toISOString() ?? new Date().toISOString(),
        ended_at:   new Date().toISOString(),
      })
      queryClient.invalidateQueries({ queryKey: ['pomodoro-history', user.id, today] })
    }

    // Start break
    setMode('break')
    setSecs(BREAK_SECS)
    setTimerState('running')
  }, [grantXP, user?.id, today, queryClient])

  // ── Complete a break ──────────────────────────────────────────
  const handleBreakComplete = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setMode('focus')
    setSecs(FOCUS_SECS)
    setTimerState('idle')
  }, [])

  // ── Tick ──────────────────────────────────────────────────────
  useEffect(() => {
    if (timerState !== 'running') {
      if (intervalRef.current) clearInterval(intervalRef.current)
      return
    }
    intervalRef.current = setInterval(() => {
      setSecs(s => {
        if (s <= 1) {
          if (mode === 'focus')  handleFocusComplete()
          else                   handleBreakComplete()
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [timerState, mode, handleFocusComplete, handleBreakComplete])

  const handleStart = () => {
    startTimeRef.current = new Date()
    setTimerState('running')
  }
  const handlePause  = () => setTimerState('paused')
  const handleResume = () => setTimerState('running')
  const handleReset  = () => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setTimerState('idle')
    setMode('focus')
    setSecs(FOCUS_SECS)
  }

  // Pulse ring color
  const ringColor    = mode === 'break' ? '#22c55e' : 'var(--color-primary)'
  const ringGlow     = mode === 'break' ? 'rgba(34,197,94,0.6)' : 'var(--color-primary-glow)'

  return (
    <div className="flex flex-col pb-8 max-w-lg mx-auto px-4 py-4 gap-6">

      {/* ── Header ── */}
      <div className="flex items-center gap-2">
        <Clock size={17} style={{ color: 'var(--color-primary)' }} />
        <h1 className="font-display font-black text-base tracking-widest text-glow">FOCUS TIMER</h1>
      </div>

      {/* ── Timer card ── */}
      <motion.div
        className="relative rounded-2xl overflow-hidden p-6 flex flex-col items-center gap-6"
        style={{
          background: 'var(--color-surface)',
          border:     '1px solid var(--color-border-glow)',
          boxShadow:  timerState === 'running' ? 'var(--glow-md)' : 'var(--glow-sm)',
        }}
        animate={{ boxShadow: timerState === 'running' ? ['var(--glow-sm)', 'var(--glow-md)', 'var(--glow-sm)'] : 'var(--glow-sm)' }}
        transition={{ duration: 3, repeat: timerState === 'running' ? Infinity : 0 }}
      >
        {/* Scan-line */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, var(--color-primary) 2px, var(--color-primary) 3px)', backgroundSize: '100% 6px' }} />

        {/* Mode badge */}
        <motion.div
          key={mode}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-3 py-1 rounded-full text-xs font-bold font-display tracking-widest"
          style={{
            background: mode === 'break' ? 'rgba(34,197,94,0.15)' : 'rgba(var(--color-primary-rgb,0,245,255),0.1)',
            border:     `1px solid ${mode === 'break' ? 'rgba(34,197,94,0.4)' : 'var(--color-border-glow)'}`,
            color:      mode === 'break' ? '#22c55e' : 'var(--color-primary)',
          }}
        >
          {mode === 'break' ? '☕ BREAK TIME' : '⚡ FOCUS SESSION'}
        </motion.div>

        {/* SVG ring + time display */}
        <div className="relative" style={{ width: 260, height: 260 }}>
          <svg viewBox="0 0 260 260" width={260} height={260} style={{ overflow: 'visible' }}>
            {/* Outer dashed ring */}
            <circle cx={CENTER} cy={CENTER} r={R + 16} fill="none" stroke="var(--color-border)" strokeWidth={1} strokeDasharray="4 8" />
            {/* Track */}
            <circle cx={CENTER} cy={CENTER} r={R} fill="none" stroke="var(--color-surface-active)" strokeWidth={12} />
            {/* Progress */}
            <motion.circle
              cx={CENTER} cy={CENTER} r={R}
              fill="none"
              strokeWidth={12}
              strokeLinecap="round"
              strokeDasharray={CIRC}
              animate={{ strokeDashoffset: arcPath(pct) }}
              transition={{ duration: 0.8 }}
              style={{
                stroke: ringColor,
                rotate: '-90deg',
                transformOrigin: `${CENTER}px ${CENTER}px`,
                filter: `drop-shadow(0 0 10px ${ringGlow})`,
              }}
            />
            {/* Tick marks */}
            {Array.from({ length: 12 }).map((_, i) => {
              const angle = (i * 30 - 90) * (Math.PI / 180)
              const x1 = CENTER + (R + 4)  * Math.cos(angle)
              const y1 = CENTER + (R + 4)  * Math.sin(angle)
              const x2 = CENTER + (R + 14) * Math.cos(angle)
              const y2 = CENTER + (R + 14) * Math.sin(angle)
              return (
                <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
                  stroke={ringColor} strokeWidth={i % 3 === 0 ? 2 : 1} opacity={i % 3 === 0 ? 0.6 : 0.2} />
              )
            })}
          </svg>

          {/* Time display */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.p
              key={`${mode}-${timerState}`}
              initial={{ scale: 0.9, opacity: 0.7 }}
              animate={{ scale: 1, opacity: 1 }}
              className="font-display font-black text-glow"
              style={{ fontSize: '3.5rem', letterSpacing: '-0.03em', lineHeight: 1 }}
            >
              {fmt(secs)}
            </motion.p>
            <p className="text-xs font-display font-semibold tracking-widest mt-2"
              style={{ color: 'var(--color-text-muted)' }}>
              {mode === 'focus' ? `${sessions} session${sessions !== 1 ? 's' : ''} today` : 'Rest & recover'}
            </p>
            {timerState === 'running' && (
              <motion.div
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="w-2 h-2 rounded-full mt-3"
                style={{ background: ringColor, boxShadow: `0 0 8px ${ringGlow}` }}
              />
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4">
          {/* Reset */}
          <button onClick={handleReset}
            className="w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-90"
            style={{ background: 'var(--color-surface-active)', border: '1px solid var(--color-border)' }}>
            <RotateCcw size={18} style={{ color: 'var(--color-text-muted)' }} />
          </button>

          {/* Play/Pause */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={timerState === 'idle' ? handleStart : timerState === 'running' ? handlePause : handleResume}
            className="w-20 h-20 rounded-full flex items-center justify-center transition-all"
            style={{
              background: `linear-gradient(135deg, ${ringColor}33, ${ringColor}11)`,
              border:     `2px solid ${ringColor}`,
              boxShadow:  timerState === 'running' ? `0 0 30px ${ringGlow}` : `0 0 16px ${ringGlow}80`,
            }}
          >
            {timerState === 'running' ? (
              <Pause size={28} style={{ color: ringColor }} />
            ) : (
              <Play size={28} fill={ringColor} style={{ color: ringColor, marginLeft: 3 }} />
            )}
          </motion.button>

          {/* Stop */}
          <button onClick={handleReset}
            className="w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-90"
            style={{ background: 'var(--color-surface-active)', border: '1px solid var(--color-border)' }}>
            <Square size={16} style={{ color: 'var(--color-text-muted)' }} />
          </button>
        </div>

        {/* XP info */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl"
          style={{ background: 'var(--color-surface-active)', border: '1px solid var(--color-border)' }}>
          <Zap size={13} style={{ color: 'var(--color-primary)' }} />
          <span className="text-xs font-display font-semibold" style={{ color: 'var(--color-text-muted)' }}>
            +10 XP per session · {totalFocusMin} min focused today
          </span>
        </div>
      </motion.div>

      {/* ── Session history ── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle2 size={15} style={{ color: 'var(--color-primary)' }} />
          <h2 className="font-display font-bold text-xs tracking-widest" style={{ color: 'var(--color-text-muted)' }}>
            TODAY'S SESSIONS
          </h2>
        </div>

        {historyQuery.isLoading ? (
          <div className="flex flex-col gap-2">
            {[1,2,3].map(i => (
              <div key={i} className="h-14 rounded-xl animate-pulse" style={{ background: 'var(--color-surface)' }} />
            ))}
          </div>
        ) : !historyQuery.data || historyQuery.data.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center rounded-xl"
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
            <Clock size={28} style={{ color: 'var(--color-text-faint)' }} />
            <p className="text-xs text-zenith-faint">No sessions yet today.</p>
            <p className="text-xs text-zenith-faint">Start a session to earn XP!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {historyQuery.data.map((session, i) => (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3 px-4 py-3 rounded-xl"
                style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
              >
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 text-lg"
                  style={{ background: 'var(--color-surface-active)' }}>
                  {session.completed ? '✅' : '⏹️'}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm">
                    {session.completed ? `${session.duration_min}-min Session` : 'Interrupted'}
                  </p>
                  <p className="text-xs text-zenith-faint">
                    {format(new Date(session.started_at), 'h:mm a')}
                  </p>
                </div>
                {session.completed && (
                  <div className="flex items-center gap-1">
                    <Zap size={12} style={{ color: 'var(--color-primary)' }} />
                    <span className="text-xs font-bold text-glow">+{session.xp_earned}</span>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}
