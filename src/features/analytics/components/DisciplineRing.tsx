'use client'

import { motion } from 'framer-motion'
import type { DisciplineResult } from '../utils/disciplineScore'

// ═══════════════════════════════════════════════════════════════
//  DisciplineRing — hero metric for the analytics page
//  Animated SVG arc + grade + score breakdown bars
// ═══════════════════════════════════════════════════════════════

const R    = 88
const CIRC = 2 * Math.PI * R
const CX   = 110

// Grade → primary ring color (overrides theme for grade signal)
const GRADE_COLOR: Record<string, string> = {
  S: '#f59e0b',   // gold
  A: '#22c55e',   // green
  B: '#60a5fa',   // blue
  C: '#f97316',   // orange
  D: '#f87171',   // red-ish
  F: '#6b7280',   // gray
}

interface DisciplineRingProps {
  result: DisciplineResult | null
  isLoading?: boolean
}

interface BreakdownBarProps {
  label:   string
  value:   number
  max:     number
  color:   string
  index:   number
}

function BreakdownBar({ label, value, max, color, index }: BreakdownBarProps) {
  const pct = max > 0 ? (value / max) * 100 : 0
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.6 + index * 0.08 }}
      className="flex flex-col gap-1"
    >
      <div className="flex justify-between items-center">
        <span className="text-xs font-display font-semibold tracking-wide"
          style={{ color: 'var(--color-text-muted)', fontSize: '10px', letterSpacing: '0.1em' }}>
          {label.toUpperCase()}
        </span>
        <span className="font-mono text-xs font-bold" style={{ color }}>
          {value}<span style={{ color: 'var(--color-text-faint)' }}>/{max}</span>
        </span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--color-surface-active)' }}>
        <motion.div
          className="h-full rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.7 + index * 0.08 }}
          style={{ background: color, boxShadow: `0 0 6px ${color}80` }}
        />
      </div>
    </motion.div>
  )
}

export function DisciplineRing({ result, isLoading }: DisciplineRingProps) {
  const score     = result?.score ?? 0
  const grade     = result?.grade ?? 'F'
  const label     = result?.label ?? 'Loading...'
  const breakdown = result?.breakdown
  const ringColor = GRADE_COLOR[grade] ?? 'var(--color-primary)'
  const pct       = score / 100

  const breakdownItems = breakdown
    ? [
        { label: 'Habits',   value: breakdown.habits,   max: 40, color: 'var(--color-primary)' },
        { label: 'Focus',    value: breakdown.focus,    max: 20, color: '#60a5fa' },
        { label: 'Wellness', value: breakdown.wellness, max: 20, color: '#22c55e' },
        { label: 'Streak',   value: breakdown.streak,   max: 20, color: '#f59e0b' },
      ]
    : []

  return (
    <div
      className="relative overflow-hidden rounded-2xl px-5 py-5 flex flex-col gap-5"
      style={{
        background: 'var(--color-surface)',
        border:     '1px solid var(--color-border-glow)',
        boxShadow:  'var(--glow-sm)',
      }}
    >
      {/* HUD scan lines */}
      <div className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{ backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 2px,var(--color-primary) 2px,var(--color-primary) 3px)', backgroundSize: '100% 6px' }} />

      <div className="relative z-10 flex items-center gap-5">
        {/* SVG ring */}
        <div className="flex-shrink-0 relative">
          <svg width={220} height={220} viewBox="0 0 220 220">
            {/* Outer dashed ring */}
            <circle cx={CX} cy={CX} r={R + 14} fill="none"
              stroke="var(--color-border)" strokeWidth={1} strokeDasharray="3 7" />
            {/* Track */}
            <circle cx={CX} cy={CX} r={R} fill="none"
              stroke="var(--color-surface-active)" strokeWidth={14} />
            {/* Progress arc */}
            {!isLoading && (
              <motion.circle
                cx={CX} cy={CX} r={R}
                fill="none" strokeWidth={14} strokeLinecap="round"
                strokeDasharray={CIRC}
                initial={{ strokeDashoffset: CIRC }}
                animate={{ strokeDashoffset: CIRC - pct * CIRC }}
                transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
                style={{
                  stroke: ringColor,
                  rotate: '-90deg',
                  transformOrigin: `${CX}px ${CX}px`,
                  filter: `drop-shadow(0 0 10px ${ringColor}90)`,
                }}
              />
            )}
            {/* Loading skeleton arc */}
            {isLoading && (
              <circle cx={CX} cy={CX} r={R} fill="none"
                stroke="var(--color-border-glow)" strokeWidth={14}
                strokeDasharray="40 200" strokeLinecap="round"
                style={{ animation: 'spin 1.5s linear infinite', transformOrigin: `${CX}px ${CX}px` }}
              />
            )}
            {/* Tick marks */}
            {Array.from({ length: 10 }).map((_, i) => {
              const angle = (i * 36 - 90) * (Math.PI / 180)
              const x1 = CX + (R + 2)  * Math.cos(angle)
              const y1 = CX + (R + 2)  * Math.sin(angle)
              const x2 = CX + (R + 10) * Math.cos(angle)
              const y2 = CX + (R + 10) * Math.sin(angle)
              const isActive = i / 10 <= pct
              return (
                <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
                  stroke={isActive ? ringColor : 'var(--color-border)'}
                  strokeWidth={i % 5 === 0 ? 2 : 1}
                  opacity={isActive ? 0.7 : 0.3} />
              )
            })}
          </svg>

          {/* Center display */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
            {isLoading ? (
              <div className="w-12 h-6 rounded animate-pulse"
                style={{ background: 'var(--color-surface-active)' }} />
            ) : (
              <>
                <motion.span
                  className="font-display font-black leading-none"
                  style={{ fontSize: '3rem', color: ringColor,
                    filter: `drop-shadow(0 0 12px ${ringColor}70)` }}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.4, type: 'spring', stiffness: 200 }}
                >
                  {score}
                </motion.span>
                <motion.div
                  className="px-3 py-0.5 rounded-full font-display font-black text-sm"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  style={{
                    background: `${ringColor}20`,
                    border:     `1px solid ${ringColor}60`,
                    color:      ringColor,
                  }}
                >
                  {grade}
                </motion.div>
                <motion.p
                  className="text-xs text-zenith-faint text-center font-display"
                  style={{ fontSize: '9px', letterSpacing: '0.1em' }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                >
                  DISCIPLINE
                </motion.p>
              </>
            )}
          </div>
        </div>

        {/* Right: label + breakdown bars */}
        <div className="flex-1 flex flex-col gap-3">
          <div>
            <motion.h3
              className="font-display font-black text-base text-glow"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              {isLoading ? '...' : label}
            </motion.h3>
            <motion.p className="text-xs text-zenith-faint mt-0.5"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
              30-day performance
            </motion.p>
          </div>

          {/* Breakdown bars */}
          <div className="flex flex-col gap-2.5">
            {isLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex flex-col gap-1">
                    <div className="h-2 w-20 rounded animate-pulse"
                      style={{ background: 'var(--color-surface-active)' }} />
                    <div className="h-1.5 rounded-full animate-pulse"
                      style={{ background: 'var(--color-surface-active)' }} />
                  </div>
                ))
              : breakdownItems.map((b, i) => (
                  <BreakdownBar key={b.label} {...b} index={i} />
                ))
            }
          </div>
        </div>
      </div>
    </div>
  )
}
