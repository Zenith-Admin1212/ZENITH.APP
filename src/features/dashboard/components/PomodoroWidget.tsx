'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Play, Pause, Square, Timer } from 'lucide-react'
import { useUserStore } from '@/stores/userStore'
import { useXPEngine }  from '@/features/xp/hooks/useXPEngine'
import { supabase }     from '@/lib/supabase/client'
import { XP_CONFIG }    from '@/lib/utils/constants'
import { format }       from 'date-fns'

// ═══════════════════════════════════════════════════════════════
//  PomodoroWidget — Mini timer on dashboard
//  FIX (BUG-1): XP now routes through useXPEngine → addXP which
//  fetches fresh XP from DB before writing. No stale-xp race.
// ═══════════════════════════════════════════════════════════════

const FOCUS_DURATION = 25 * 60
const BREAK_DURATION = 5  * 60

type TimerState = 'idle' | 'running' | 'paused' | 'break'

export function PomodoroWidget() {
  const { user }      = useUserStore()
  const { grantXP }   = useXPEngine()

  const [state, setState]         = useState<TimerState>('idle')
  const [secondsLeft, setSecondsLeft] = useState(FOCUS_DURATION)
  const [sessions, setSessions]   = useState(0)
  const intervalRef  = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<Date | null>(null)

  const totalSeconds = state === 'break' ? BREAK_DURATION : FOCUS_DURATION
  const pct  = ((totalSeconds - secondsLeft) / totalSeconds) * 100
  const mins = Math.floor(secondsLeft / 60)
  const secs = secondsLeft % 60

  const stop = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    intervalRef.current = null
  }, [])

  const handleComplete = useCallback(async () => {
    stop()
    setSessions(s => s + 1)

    if (user?.id) {
      const today = format(new Date(), 'yyyy-MM-dd')

      // Log session first
      await supabase.from('pomodoro_sessions').insert({
        user_id:    user.id,
        duration_min: 25,
        break_min:  5,
        rounds:     1,
        completed:  true,
        xp_earned:  XP_CONFIG.POMODORO_BONUS,
        date:       today,
        started_at: startTimeRef.current?.toISOString() ?? new Date().toISOString(),
        ended_at:   new Date().toISOString(),
      })

      // grantXP fetches fresh XP from DB — no stale-read race condition
      await grantXP(
        XP_CONFIG.POMODORO_BONUS,
        'pomodoro_session',
        'Pomodoro session completed'
      )
    }

    setState('break')
    setSecondsLeft(BREAK_DURATION)
  }, [stop, user?.id, grantXP])

  useEffect(() => {
    if (state === 'running' || state === 'break') {
      intervalRef.current = setInterval(() => {
        setSecondsLeft(s => {
          if (s <= 1) {
            if (state === 'running') handleComplete()
            else { stop(); setState('idle'); setSecondsLeft(FOCUS_DURATION) }
            return 0
          }
          return s - 1
        })
      }, 1000)
    }
    return stop
  }, [state, handleComplete, stop])

  const handleStart  = () => { startTimeRef.current = new Date(); setState('running') }
  const handlePause  = () => { stop(); setState('paused') }
  const handleResume = () => setState('running')
  const handleReset  = () => { stop(); setState('idle'); setSecondsLeft(FOCUS_DURATION) }

  const CIRCUMFERENCE = 2 * Math.PI * 22

  return (
    <div
      className="card flex items-center gap-4"
      style={{
        background: state !== 'idle'
          ? 'linear-gradient(135deg, rgba(167,139,250,0.08) 0%, var(--color-surface) 100%)'
          : 'var(--color-surface)',
      }}
    >
      {/* Mini ring */}
      <div className="relative flex-shrink-0" style={{ width: 56, height: 56 }}>
        <svg viewBox="0 0 56 56" width={56} height={56}>
          <circle cx={28} cy={28} r={22} fill="none" stroke="var(--color-surface-active)" strokeWidth={4} />
          <motion.circle
            cx={28} cy={28} r={22}
            fill="none"
            strokeWidth={4}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            animate={{ strokeDashoffset: CIRCUMFERENCE - (pct / 100) * CIRCUMFERENCE }}
            transition={{ duration: 0.5 }}
            style={{
              stroke: state === 'break' ? '#22c55e' : '#a78bfa',
              rotate: '-90deg',
              transformOrigin: '28px 28px',
              filter: state !== 'idle' ? 'drop-shadow(0 0 4px #a78bfa80)' : 'none',
            }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <Timer size={14} style={{ color: state !== 'idle' ? '#a78bfa' : 'var(--color-text-faint)' }} />
        </div>
      </div>

      {/* Timer info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="font-display font-black text-lg text-glow" style={{ letterSpacing: '-0.02em' }}>
            {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
          </span>
          {state === 'break' && (
            <span
              className="text-2xs font-bold px-1.5 py-0.5 rounded font-display"
              style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e', fontSize: '9px' }}
            >
              BREAK
            </span>
          )}
        </div>
        <p className="text-2xs font-display tracking-wider" style={{ color: 'var(--color-text-faint)' }}>
          {state === 'idle' ? `FOCUS · 25 MIN` : state === 'break' ? 'BREAK TIME' : 'FOCUS SESSION'}
          {sessions > 0 && ` · ${sessions}✓`}
        </p>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {state === 'idle' && (
          <button onClick={handleStart}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-90"
            style={{ background: 'rgba(167,139,250,0.2)', border: '1px solid rgba(167,139,250,0.4)', color: '#a78bfa' }}>
            <Play size={14} fill="currentColor" />
          </button>
        )}
        {state === 'running' && (
          <>
            <button onClick={handlePause}
              className="w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-90"
              style={{ background: 'rgba(167,139,250,0.2)', border: '1px solid rgba(167,139,250,0.4)', color: '#a78bfa' }}>
              <Pause size={14} />
            </button>
            <button onClick={handleReset}
              className="w-7 h-7 rounded-full flex items-center justify-center transition-all active:scale-90"
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-faint)' }}>
              <Square size={11} />
            </button>
          </>
        )}
        {state === 'paused' && (
          <>
            <button onClick={handleResume}
              className="w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-90"
              style={{ background: 'rgba(167,139,250,0.2)', border: '1px solid rgba(167,139,250,0.4)', color: '#a78bfa' }}>
              <Play size={14} fill="currentColor" />
            </button>
            <button onClick={handleReset}
              className="w-7 h-7 rounded-full flex items-center justify-center transition-all active:scale-90"
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-faint)' }}>
              <Square size={11} />
            </button>
          </>
        )}
        {state === 'break' && (
          <button onClick={handleReset}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-90"
            style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.35)', color: '#22c55e' }}>
            <Square size={14} />
          </button>
        )}
      </div>
    </div>
  )
}
