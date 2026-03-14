'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format, parseISO } from 'date-fns'
import type { DailyAnalytics } from '../services/analyticsService'

// ═══════════════════════════════════════════════════════════════
//  HabitHeatmap — 30-day grid of daily habit completion
//  Tap/hover any day to see its detail callout
// ═══════════════════════════════════════════════════════════════

// CSS variable-aware heat levels (0–4)
function getHeatLevel(pct: number): 0 | 1 | 2 | 3 | 4 {
  if (pct === 0)   return 0
  if (pct < 34)    return 1
  if (pct < 67)    return 2
  if (pct < 100)   return 3
  return 4
}

// Alpha values mapped to heat level — uses theme primary color
const HEAT_ALPHAS: Record<number, string> = {
  0: '0.06',
  1: '0.18',
  2: '0.38',
  3: '0.62',
  4: '1.00',
}

const HEAT_LABELS = ['0%', '1–33%', '34–66%', '67–99%', '100%']

interface HabitHeatmapProps {
  days:      DailyAnalytics[]
  isLoading: boolean
}

interface DayCalloutProps {
  day: DailyAnalytics
}

function DayCallout({ day }: DayCalloutProps) {
  const label  = format(parseISO(day.date), 'EEE, MMM d')
  const level  = getHeatLevel(day.completionPct)

  return (
    <motion.div
      initial={{ opacity: 0, y: 6, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.2 }}
      className="mt-3 rounded-xl px-4 py-3 flex items-center gap-4"
      style={{
        background: 'var(--color-surface)',
        border:     '1px solid var(--color-border-glow)',
        boxShadow:  'var(--glow-sm)',
      }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center font-display font-black text-sm"
        style={{
          background: `rgba(var(--color-primary-rgb,0,245,255),${HEAT_ALPHAS[level]})`,
          border:     `1px solid rgba(var(--color-primary-rgb,0,245,255),${parseFloat(HEAT_ALPHAS[level]) + 0.2})`,
          color:      level >= 3 ? 'var(--color-primary)' : 'var(--color-text-muted)',
        }}
      >
        {day.completionPct}
        <span style={{ fontSize: '8px' }}>%</span>
      </div>

      <div className="flex-1">
        <p className="font-semibold text-sm">{label}</p>
        <p className="text-xs text-zenith-faint mt-0.5">
          {day.habitsCompleted} / {day.habitsTotal} habits complete
          {day.pomodoroSessions > 0 && ` · ${day.pomodoroSessions} 🍅`}
          {day.hadCheckin && ' · ✅ check-in'}
        </p>
      </div>

      <div className="flex flex-col items-end gap-1">
        {day.moodScore > 0 && (
          <span className="text-xs text-zenith-faint">
            😊 {day.moodScore}/10
          </span>
        )}
        {day.waterMl > 0 && (
          <span className="text-xs text-zenith-faint">
            💧 {(day.waterMl / 1000).toFixed(1)}L
          </span>
        )}
      </div>
    </motion.div>
  )
}

export function HabitHeatmap({ days, isLoading }: HabitHeatmapProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const selectedDay = days.find(d => d.date === selectedDate) ?? null

  const today = format(new Date(), 'yyyy-MM-dd')

  // Calculate streak of consecutive days from today backwards
  let currentStreak = 0
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].habitsCompleted > 0) currentStreak++
    else break
  }

  return (
    <div
      className="rounded-2xl p-4"
      style={{
        background: 'var(--color-surface)',
        border:     '1px solid var(--color-border)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-display font-bold text-sm text-glow tracking-wider">
            30-DAY HEATMAP
          </h3>
          <p className="text-xs text-zenith-faint mt-0.5">
            Tap any day to inspect
          </p>
        </div>
        {!isLoading && currentStreak > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
            style={{ background: 'rgba(var(--color-primary-rgb,0,245,255),0.1)', border: '1px solid var(--color-border-glow)' }}>
            <span className="text-sm">🔥</span>
            <span className="font-display font-bold text-xs text-glow">{currentStreak}d</span>
          </div>
        )}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid gap-1.5" style={{ gridTemplateColumns: 'repeat(10, 1fr)' }}>
          {Array.from({ length: 30 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-lg animate-pulse"
              style={{ background: 'var(--color-surface-active)' }} />
          ))}
        </div>
      ) : (
        <div className="grid gap-1.5" style={{ gridTemplateColumns: 'repeat(10, 1fr)' }}>
          {days.map((day, i) => {
            const level   = getHeatLevel(day.completionPct)
            const isToday = day.date === today
            const isSel   = selectedDate === day.date
            const isFuture = day.date > today

            return (
              <motion.button
                key={day.date}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.015, duration: 0.2 }}
                whileTap={!isFuture ? { scale: 0.85 } : {}}
                onClick={() => !isFuture && setSelectedDate(prev => prev === day.date ? null : day.date)}
                className="aspect-square rounded-lg flex items-center justify-center relative"
                title={`${day.date}: ${day.completionPct}%`}
                style={{
                  background: isFuture
                    ? 'var(--color-surface-active)'
                    : `rgba(var(--color-primary-rgb,0,245,255),${HEAT_ALPHAS[level]})`,
                  border: isToday
                    ? '2px solid var(--color-primary)'
                    : isSel
                      ? '1px solid var(--color-primary)'
                      : '1px solid transparent',
                  boxShadow: isToday ? 'var(--glow-sm)' : isSel ? '0 0 8px var(--color-primary-glow)' : 'none',
                  opacity: isFuture ? 0.2 : 1,
                  cursor:  isFuture ? 'default' : 'pointer',
                }}
              >
                {/* Day number */}
                <span
                  className="font-mono leading-none select-none"
                  style={{
                    fontSize:   '9px',
                    color:      level >= 3 && !isFuture ? 'var(--color-primary)' : 'var(--color-text-faint)',
                    fontWeight: isToday ? 700 : 400,
                  }}
                >
                  {parseInt(day.date.slice(8), 10)}
                </span>
                {/* Perfect day star */}
                {level === 4 && (
                  <span className="absolute -top-0.5 -right-0.5 text-2xs leading-none"
                    style={{ fontSize: '8px' }}>⚡</span>
                )}
              </motion.button>
            )
          })}
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-3 mt-4 pt-3 flex-wrap"
        style={{ borderTop: '1px solid var(--color-border)' }}>
        <span className="text-2xs text-zenith-faint mr-1" style={{ fontSize: '9px' }}>COMPLETION:</span>
        {[0, 1, 2, 3, 4].map(level => (
          <div key={level} className="flex items-center gap-1">
            <div
              className="w-3 h-3 rounded-sm"
              style={{ background: `rgba(var(--color-primary-rgb,0,245,255),${HEAT_ALPHAS[level]})` }}
            />
            <span style={{ fontSize: '9px', color: 'var(--color-text-faint)' }}>
              {HEAT_LABELS[level]}
            </span>
          </div>
        ))}
      </div>

      {/* Day callout */}
      <AnimatePresence>
        {selectedDay && <DayCallout key={selectedDay.date} day={selectedDay} />}
      </AnimatePresence>
    </div>
  )
}
