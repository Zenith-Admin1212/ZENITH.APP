'use client'

import { useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Trash2, Pencil } from 'lucide-react'
import type { HabitWithLog } from '@/types'

// ═══════════════════════════════════════════════════════════════
//  HabitRow — Single habit item
//  - Tap to complete/uncomplete with spring animation
//  - 7-day dot history
//  - Long-press 800ms → delete confirm
//  - Locked (read-only) for past dates
// ═══════════════════════════════════════════════════════════════

interface HabitRowProps {
  habit: HabitWithLog
  onToggle: (id: string, current: boolean) => void
  onDelete?: (id: string) => void
  onEdit?: (habit: HabitWithLog) => void
  isToggling?: boolean
  isToday?: boolean  // false = past date (locked)
}

// Last 7 days labels: M T W T F S S
const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
function getDayLabels(): string[] {
  const labels = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    labels.push(['M', 'T', 'W', 'T', 'F', 'S', 'S'][d.getDay() === 0 ? 6 : d.getDay() - 1])
  }
  return labels
}

export function HabitRow({ habit, onToggle, onDelete, onEdit, isToggling, isToday = true }: HabitRowProps) {
  const [showDelete, setShowDelete] = useState(false)
  const longPressTimer = useRef<NodeJS.Timeout | null>(null)
  const [pressing, setPressing] = useState(false)
  const dayLabels = getDayLabels()

  // ── Long press handlers ───────────────────────────────────────
  const onPressStart = useCallback(() => {
    if (!isToday || !onDelete) return
    setPressing(true)
    longPressTimer.current = setTimeout(() => {
      setPressing(false)
      setShowDelete(true)
    }, 800)
  }, [isToday, onDelete])

  const onPressEnd = useCallback(() => {
    setPressing(false)
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }, [])

  // ── Toggle tap ────────────────────────────────────────────────
  const handleTap = () => {
    if (showDelete) { setShowDelete(false); return }
    if (!isToday) return  // past days locked
    onToggle(habit.id, habit.completed_today)
  }

  return (
    <AnimatePresence>
      {showDelete ? (
        // ── Delete confirmation ─────────────────────────────────
        <motion.div
          key="delete-confirm"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="flex items-center justify-between px-4 py-3 rounded-xl"
          style={{
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.35)',
          }}
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">{habit.icon}</span>
            <p className="text-sm font-semibold" style={{ color: '#f87171' }}>
              Remove "{habit.name}"?
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setShowDelete(false); onEdit?.(habit) }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95"
              style={{ background: 'var(--color-surface-active)', color: 'var(--color-primary)', border: '1px solid var(--color-border-glow)' }}
            >
              <Pencil size={12} /> Edit
            </button>
            <button
              onClick={() => { onDelete?.(habit.id); setShowDelete(false) }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95"
              style={{ background: 'rgba(239,68,68,0.25)', color: '#f87171', border: '1px solid rgba(239,68,68,0.4)' }}
            >
              <Trash2 size={12} /> Remove
            </button>
            <button
              onClick={() => setShowDelete(false)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95"
              style={{ background: 'var(--color-surface)', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' }}
            >
              Cancel
            </button>
          </div>
        </motion.div>
      ) : (
        // ── Normal habit row ────────────────────────────────────
        <motion.div
          key="habit-row"
          layout
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 12, height: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer select-none transition-all duration-150"
          style={{
            background: habit.completed_today
              ? 'var(--color-surface-active)'
              : 'var(--color-surface)',
            border: `1px solid ${habit.completed_today ? 'var(--color-border-glow)' : 'var(--color-border)'}`,
            boxShadow: habit.completed_today ? 'var(--glow-sm)' : 'none',
            scale: pressing ? 0.98 : 1,
          }}
          onClick={handleTap}
          onMouseDown={onPressStart}
          onMouseUp={onPressEnd}
          onMouseLeave={onPressEnd}
          onTouchStart={onPressStart}
          onTouchEnd={onPressEnd}
        >
          {/* Checkbox */}
          <motion.div
            animate={habit.completed_today
              ? { scale: [1, 1.25, 1], backgroundColor: 'var(--color-primary)' }
              : { scale: 1, backgroundColor: 'transparent' }
            }
            transition={{ duration: 0.3, type: 'spring', stiffness: 400 }}
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
            style={{
              border: `2px solid ${habit.completed_today ? 'var(--color-primary)' : 'var(--color-border-glow)'}`,
              boxShadow: habit.completed_today ? 'var(--glow-sm)' : 'none',
            }}
          >
            <AnimatePresence>
              {habit.completed_today && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                >
                  <Check
                    size={14}
                    strokeWidth={3}
                    style={{ color: 'var(--color-bg)' }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Icon + name */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-lg flex-shrink-0">{habit.icon}</span>
            <span
              className="font-semibold text-sm truncate transition-all"
              style={{
                color: habit.completed_today ? 'var(--color-text)' : 'var(--color-text-muted)',
                textDecoration: habit.completed_today ? 'none' : 'none',
              }}
            >
              {habit.name}
            </span>
          </div>

          {/* 7-day dots */}
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            <div className="flex gap-1">
              {habit.last_7_days.map((done, i) => {
                const isLastDot = i === 6
                return (
                  <div
                    key={i}
                    className="flex flex-col items-center gap-0.5"
                    title={`${dayLabels[i]}: ${done ? 'Done' : 'Missed'}`}
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: i * 0.04 }}
                      className="w-2 h-2 rounded-full"
                      style={{
                        background: done
                          ? isLastDot && !habit.completed_today
                            ? 'var(--color-primary-dim)'  // today not yet done
                            : 'var(--color-primary)'
                          : 'var(--color-surface-active)',
                        boxShadow: done ? '0 0 4px var(--color-primary-glow)' : 'none',
                        opacity: isLastDot && !isToday ? 0.5 : 1,
                      }}
                    />
                  </div>
                )
              })}
            </div>
            {/* Day labels row */}
            <div className="flex gap-1">
              {dayLabels.map((l, i) => (
                <span
                  key={i}
                  className="w-2 text-center"
                  style={{ fontSize: '7px', color: 'var(--color-text-faint)', lineHeight: 1 }}
                >
                  {l}
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
