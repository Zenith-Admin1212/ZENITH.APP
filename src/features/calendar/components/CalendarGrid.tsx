'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  format, addMonths, subMonths,
  startOfMonth, getDay, getDaysInMonth,
  isSameMonth,
} from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useCalendarData, type DaySummary } from '../hooks/useCalendarData'
import { useHabits } from '@/features/habits/hooks/useHabits'
import { HabitRow } from '@/features/habits/components/HabitRow'

// ═══════════════════════════════════════════════════════════════
//  CalendarGrid
//  Month grid showing daily habit completion heat.
//  Tap a past day to see that day's habit completion status.
// ═══════════════════════════════════════════════════════════════

const DAY_HEADERS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

// Colour intensity based on completion %
function getCellStyle(summary: DaySummary | undefined, isSelected: boolean) {
  if (!summary || summary.isFuture || summary.totalCount === 0) return {}

  const { pct } = summary

  let bg = 'var(--color-surface)'
  let border = 'var(--color-border)'
  let glow = 'none'

  if (pct === 100) {
    bg     = 'rgba(var(--color-primary-rgb, 0,245,255), 0.22)'
    border = 'var(--color-primary)'
    glow   = 'var(--glow-sm)'
  } else if (pct >= 75) {
    bg     = 'rgba(var(--color-primary-rgb, 0,245,255), 0.14)'
    border = 'rgba(var(--color-primary-rgb, 0,245,255), 0.5)'
  } else if (pct >= 50) {
    bg     = 'rgba(var(--color-primary-rgb, 0,245,255), 0.08)'
    border = 'rgba(var(--color-primary-rgb, 0,245,255), 0.3)'
  } else if (pct > 0) {
    bg     = 'rgba(var(--color-primary-rgb, 0,245,255), 0.04)'
    border = 'rgba(var(--color-primary-rgb, 0,245,255), 0.15)'
  }

  if (isSelected) {
    border = 'var(--color-primary)'
    glow   = 'var(--glow-md)'
  }

  return { background: bg, borderColor: border, boxShadow: glow }
}

interface DayDetailProps {
  dateStr: string
  summary: DaySummary
}

function DayDetail({ dateStr, summary }: DayDetailProps) {
  const { habits } = useHabits()

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25 }}
    >
      <div
        className="rounded-2xl p-4 mt-4"
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border-glow)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-display font-bold text-sm text-glow tracking-wider">
              {format(new Date(dateStr + 'T12:00:00'), 'EEEE, MMM d')}
            </h3>
            <p className="text-xs text-zenith-muted mt-0.5">
              {summary.completedCount} / {summary.totalCount} habits completed
            </p>
          </div>
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center font-display font-black text-lg"
            style={{
              background: summary.pct === 100 ? 'rgba(34,197,94,0.15)' : 'var(--color-surface-active)',
              border: `2px solid ${summary.pct === 100 ? '#22c55e' : 'var(--color-border-glow)'}`,
              color: summary.pct === 100 ? '#22c55e' : 'var(--color-primary)',
            }}
          >
            {summary.pct}%
          </div>
        </div>

        {/* Habit rows — read-only for past days */}
        <div className="flex flex-col gap-2">
          {habits.length === 0 && (
            <p className="text-xs text-zenith-faint text-center py-4">No habits to show</p>
          )}
          {habits.map(habit => (
            <HabitRow
              key={habit.id}
              habit={habit}
              onToggle={() => {}}       // no-op for past days
              isToday={summary.isToday}
            />
          ))}
        </div>
      </div>
    </motion.div>
  )
}

export function CalendarGrid() {
  const today = new Date()
  const [currentDate, setCurrentDate] = useState(today)
  const [selectedDate, setSelectedDate] = useState<string | null>(
    format(today, 'yyyy-MM-dd')
  )

  const year  = currentDate.getFullYear()
  const month = currentDate.getMonth() + 1  // 1-based

  const { summaryMap, isLoading, totalHabits } = useCalendarData(year, month)
  const todayStr = format(today, 'yyyy-MM-dd')

  // Build grid cells: empty leading days + actual days
  const firstDayOfMonth = startOfMonth(currentDate)
  // getDay returns 0=Sun, we want 0=Mon
  const leadingBlanks = (getDay(firstDayOfMonth) + 6) % 7
  const daysInMonth   = getDaysInMonth(currentDate)

  const prevMonth = () => {
    setCurrentDate(d => subMonths(d, 1))
    setSelectedDate(null)
  }
  const nextMonth = () => {
    // Don't allow navigating to future months beyond today's month
    const nextM = addMonths(currentDate, 1)
    if (nextM > today) return
    setCurrentDate(nextM)
    setSelectedDate(null)
  }

  const isFutureMonth = addMonths(currentDate, 1) > today

  const handleDayTap = (dateStr: string, summary?: DaySummary) => {
    if (!summary || summary.isFuture) return
    setSelectedDate(prev => prev === dateStr ? null : dateStr)
  }

  // Month stats
  const monthDays  = Object.values(summaryMap)
  const pastDays   = monthDays.filter(d => !d.isFuture && d.totalCount > 0)
  const perfectDays = pastDays.filter(d => d.pct === 100).length
  const avgPct = pastDays.length > 0
    ? Math.round(pastDays.reduce((s, d) => s + d.pct, 0) / pastDays.length)
    : 0

  return (
    <div className="flex flex-col gap-5 px-4 py-4 pb-6 max-w-lg mx-auto">
      {/* ── Month header ── */}
      <div className="flex items-center justify-between">
        <button
          onClick={prevMonth}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-90"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        >
          <ChevronLeft size={18} style={{ color: 'var(--color-text-muted)' }} />
        </button>

        <motion.div key={format(currentDate, 'yyyy-MM')} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <h2 className="font-display font-black text-lg text-glow tracking-wider">
            {format(currentDate, 'MMMM').toUpperCase()}
          </h2>
          <p className="text-xs text-zenith-muted font-mono">{year}</p>
        </motion.div>

        <button
          onClick={nextMonth}
          disabled={isFutureMonth}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-90 disabled:opacity-30"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        >
          <ChevronRight size={18} style={{ color: 'var(--color-text-muted)' }} />
        </button>
      </div>

      {/* ── Month stats ── */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Perfect Days', value: perfectDays, icon: '⚡' },
          { label: 'Avg Complete', value: `${avgPct}%`, icon: '📊' },
          { label: 'Active Habits', value: totalHabits, icon: '🎯' },
        ].map(stat => (
          <div
            key={stat.label}
            className="flex flex-col items-center py-3 rounded-xl gap-1"
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
          >
            <span className="text-lg">{stat.icon}</span>
            <span className="font-display font-black text-base text-glow">{stat.value}</span>
            <span className="text-2xs text-zenith-faint text-center" style={{ fontSize: '9px' }}>
              {stat.label.toUpperCase()}
            </span>
          </div>
        ))}
      </div>

      {/* ── Grid ── */}
      <div
        className="rounded-2xl p-4"
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        {/* Day-of-week headers */}
        <div className="grid grid-cols-7 mb-2">
          {DAY_HEADERS.map(d => (
            <div key={d} className="flex items-center justify-center pb-2">
              <span
                className="font-display font-bold text-center"
                style={{ fontSize: '10px', color: 'var(--color-text-faint)', letterSpacing: '0.1em' }}
              >
                {d}
              </span>
            </div>
          ))}
        </div>

        {/* Day cells */}
        {isLoading ? (
          <div className="grid grid-cols-7 gap-1.5">
            {Array.from({ length: 35 }).map((_, i) => (
              <div
                key={i}
                className="aspect-square rounded-lg animate-pulse"
                style={{ background: 'var(--color-surface-active)' }}
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-1.5">
            {/* Leading blanks */}
            {Array.from({ length: leadingBlanks }).map((_, i) => (
              <div key={`blank-${i}`} className="aspect-square" />
            ))}

            {/* Day cells */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1
              const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`
              const summary  = summaryMap[dateStr]
              const isSelected = selectedDate === dateStr
              const isToday   = dateStr === todayStr
              const isFuture  = dateStr > todayStr

              return (
                <motion.button
                  key={dateStr}
                  whileTap={!isFuture ? { scale: 0.88 } : {}}
                  onClick={() => handleDayTap(dateStr, summary)}
                  className="aspect-square rounded-lg flex flex-col items-center justify-center transition-all relative overflow-hidden border"
                  style={{
                    cursor: isFuture ? 'default' : 'pointer',
                    opacity: isFuture ? 0.25 : 1,
                    ...getCellStyle(summary, isSelected),
                  }}
                >
                  {/* Today ring */}
                  {isToday && (
                    <div
                      className="absolute inset-0 rounded-lg"
                      style={{ border: '2px solid var(--color-primary)', boxShadow: 'var(--glow-sm)' }}
                    />
                  )}

                  <span
                    className="font-display font-bold z-10 relative"
                    style={{
                      fontSize: 'clamp(10px, 3vw, 13px)',
                      color: isToday
                        ? 'var(--color-primary)'
                        : summary?.pct === 100
                          ? 'var(--color-primary)'
                          : 'var(--color-text)',
                    }}
                  >
                    {dayNum}
                  </span>

                  {/* Completion dot */}
                  {summary && !isFuture && summary.totalCount > 0 && (
                    <div
                      className="w-1 h-1 rounded-full mt-0.5 z-10 relative"
                      style={{
                        background: summary.pct === 100
                          ? 'var(--color-primary)'
                          : summary.pct > 0
                            ? 'var(--color-primary-dim)'
                            : 'var(--color-surface-active)',
                      }}
                    />
                  )}
                </motion.button>
              )
            })}
          </div>
        )}

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 mt-4 pt-3" style={{ borderTop: '1px solid var(--color-border)' }}>
          {[
            { label: 'None', opacity: 0.3 },
            { label: '1–49%', opacity: 0.5 },
            { label: '50–99%', opacity: 0.75 },
            { label: '100%', opacity: 1 },
          ].map(l => (
            <div key={l.label} className="flex items-center gap-1.5">
              <div
                className="w-3 h-3 rounded-sm"
                style={{ background: 'var(--color-primary)', opacity: l.opacity }}
              />
              <span className="text-2xs text-zenith-faint">{l.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Selected day detail ── */}
      <AnimatePresence>
        {selectedDate && summaryMap[selectedDate] && (
          <DayDetail
            key={selectedDate}
            dateStr={selectedDate}
            summary={summaryMap[selectedDate]}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
