'use client'

import { useEffect, useRef } from 'react'
import { motion, useSpring, useTransform } from 'framer-motion'

// ═══════════════════════════════════════════════════════════════
//  PerformanceRing — Animated SVG arc ring
//  Shows today's habit completion percentage.
//  Multiple concentric rings create the HUD aesthetic.
// ═══════════════════════════════════════════════════════════════

interface PerformanceRingProps {
  percentage: number   // 0–100
  done: number
  total: number
  size?: number
}

const RADIUS = 80
const STROKE = 10
const CIRCUMFERENCE = 2 * Math.PI * RADIUS
const CENTER = RADIUS + STROKE + 10  // canvas center

function polarToXY(angleDeg: number, r: number, cx: number, cy: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  }
}

function describeArc(cx: number, cy: number, r: number, startDeg: number, endDeg: number) {
  if (endDeg - startDeg >= 360) endDeg = startDeg + 359.999
  const s = polarToXY(startDeg, r, cx, cy)
  const e = polarToXY(endDeg,   r, cx, cy)
  const large = endDeg - startDeg > 180 ? 1 : 0
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`
}

export function PerformanceRing({ percentage, done, total, size = 220 }: PerformanceRingProps) {
  const spring = useSpring(0, { stiffness: 60, damping: 18 })
  const strokeDashoffset = useTransform(spring, v =>
    CIRCUMFERENCE - (v / 100) * CIRCUMFERENCE
  )

  useEffect(() => {
    const timer = setTimeout(() => { spring.set(percentage) }, 300)
    return () => clearTimeout(timer)
  }, [percentage, spring])

  const cx = CENTER
  const cy = CENTER
  const viewBox = `0 0 ${CENTER * 2} ${CENTER * 2}`

  // Tick marks every 30 degrees
  const ticks = Array.from({ length: 12 }, (_, i) => i * 30)

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg
        viewBox={viewBox}
        width={size}
        height={size}
        className="absolute inset-0"
        style={{ overflow: 'visible' }}
      >
        {/* Outer decorative ring */}
        <circle
          cx={cx} cy={cy}
          r={RADIUS + STROKE + 16}
          fill="none"
          stroke="var(--color-border)"
          strokeWidth={1}
          strokeDasharray="4 8"
        />

        {/* Track */}
        <circle
          cx={cx} cy={cy}
          r={RADIUS}
          fill="none"
          stroke="var(--color-surface-active)"
          strokeWidth={STROKE}
          strokeLinecap="round"
        />

        {/* Progress arc */}
        <motion.circle
          cx={cx} cy={cy}
          r={RADIUS}
          fill="none"
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          style={{
            stroke: 'var(--color-primary)',
            strokeDashoffset,
            rotate: '-90deg',
            transformOrigin: `${cx}px ${cy}px`,
            filter: 'drop-shadow(0 0 8px var(--color-primary-glow))',
          }}
        />

        {/* Inner glow ring */}
        <circle
          cx={cx} cy={cy}
          r={RADIUS - STROKE / 2 - 2}
          fill="none"
          stroke="var(--color-primary)"
          strokeWidth={1}
          strokeOpacity={0.15}
        />

        {/* Tick marks */}
        {ticks.map(angle => {
          const inner = polarToXY(angle - 90 + 90, RADIUS + STROKE + 4, cx, cy)
          const outer = polarToXY(angle - 90 + 90, RADIUS + STROKE + 10, cx, cy)
          return (
            <line
              key={angle}
              x1={inner.x} y1={inner.y}
              x2={outer.x} y2={outer.y}
              stroke="var(--color-primary)"
              strokeWidth={angle % 90 === 0 ? 2 : 1}
              strokeOpacity={angle % 90 === 0 ? 0.6 : 0.25}
            />
          )
        })}

        {/* Segment dots at cardinal positions */}
        {[0, 90, 180, 270].map(angle => {
          const p = polarToXY(angle, RADIUS + STROKE + 10, cx, cy)
          return (
            <circle
              key={angle}
              cx={p.x} cy={p.y}
              r={3}
              fill="var(--color-primary)"
              opacity={0.7}
            />
          )
        })}
      </svg>

      {/* Center content */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.4, type: 'spring', stiffness: 200 }}
        >
          {/* Percentage number */}
          <motion.p
            className="font-display font-black leading-none text-glow"
            style={{ fontSize: 'clamp(2.2rem, 8vw, 2.8rem)' }}
          >
            {Math.round(percentage)}%
          </motion.p>

          {/* Label */}
          <p
            className="font-display font-semibold tracking-[0.15em] mt-0.5"
            style={{ fontSize: '10px', color: 'var(--color-text-muted)', letterSpacing: '0.2em' }}
          >
            COMPLETE
          </p>

          {/* Count */}
          <p
            className="font-display font-bold mt-1.5"
            style={{ fontSize: '13px', color: 'var(--color-primary-dim)' }}
          >
            {done} / {total}
          </p>
        </motion.div>
      </div>
    </div>
  )
}
