'use client'

import { useMemo, useEffect, useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Area, AreaChart,
  ReferenceLine,
} from 'recharts'
import { format, parseISO } from 'date-fns'
import { motion } from 'framer-motion'
import type { DailyAnalytics } from '../services/analyticsService'

// ═══════════════════════════════════════════════════════════════
//  TrendChart — themed Recharts area chart for wellness metrics
//  Reads CSS variables at render time so themes auto-recolor.
// ═══════════════════════════════════════════════════════════════

export type TrendMetric =
  | 'completionPct'
  | 'pomodoroSessions'
  | 'sleepScore'
  | 'moodScore'
  | 'focusScore'
  | 'waterMl'

const METRIC_CONFIG: Record<TrendMetric, {
  label:  string
  icon:   string
  unit:   string
  max:    number
  color:  string   // fallback if CSS var unavailable
}> = {
  completionPct:    { label: 'Habit Completion', icon: '✅', unit: '%',  max: 100, color: '#00f5ff' },
  pomodoroSessions: { label: 'Focus Sessions',   icon: '⏱️', unit: 'sessions', max: 10,  color: '#60a5fa' },
  sleepScore:       { label: 'Sleep Quality',    icon: '😴', unit: '/10', max: 10,  color: '#818cf8' },
  moodScore:        { label: 'Mood Score',       icon: '😊', unit: '/10', max: 10,  color: '#f59e0b' },
  focusScore:       { label: 'Focus Score',      icon: '🎯', unit: '/10', max: 10,  color: '#22c55e' },
  waterMl:          { label: 'Water Intake',     icon: '💧', unit: 'L',   max: 3000, color: '#38bdf8' },
}

function resolveVar(name: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback
}

interface CustomTooltipProps {
  active?:  boolean
  payload?: { value: number; dataKey: string }[]
  label?:   string
  metric:   TrendMetric
}

function CustomTooltip({ active, payload, label, metric }: CustomTooltipProps) {
  if (!active || !payload?.length || !label) return null
  const config = METRIC_CONFIG[metric]
  const raw    = payload[0]?.value ?? 0
  const display = metric === 'waterMl'
    ? `${(raw / 1000).toFixed(1)}L`
    : `${raw}${config.unit}`

  return (
    <div className="px-3 py-2 rounded-xl text-sm"
      style={{
        background: 'var(--color-bg-secondary)',
        border:     '1px solid var(--color-border-glow)',
        boxShadow:  'var(--glow-sm)',
      }}>
      <p className="font-display font-bold text-xs tracking-wide"
        style={{ color: 'var(--color-text-muted)' }}>
        {format(parseISO(label), 'MMM d')}
      </p>
      <p className="font-mono font-black text-base text-glow mt-0.5">{display}</p>
    </div>
  )
}

interface TrendChartProps {
  days:      DailyAnalytics[]
  metric:    TrendMetric
  isLoading: boolean
}

export function TrendChart({ days, metric, isLoading }: TrendChartProps) {
  const [primaryColor, setPrimaryColor] = useState(METRIC_CONFIG[metric].color)
  const config = METRIC_CONFIG[metric]

  // Resolve theme CSS variable on mount and when metric changes
  useEffect(() => {
    const color = resolveVar('--color-primary', config.color)
    if (color) setPrimaryColor(color)
  }, [metric, config.color])

  // Use metric-specific color for non-primary charts
  const lineColor = metric === 'completionPct'
    ? primaryColor
    : config.color

  const data = useMemo(() => {
    // Only show days with data for non-habit metrics (otherwise flat zero lines)
    const filtered = days.filter(d => {
      if (metric === 'completionPct' || metric === 'pomodoroSessions') return true
      return d.hadCheckin || metric === 'waterMl'
    })
    return filtered.map(d => {
      const raw = d[metric] as number
      return {
        date:   d.date,
        value:  metric === 'waterMl' ? Math.round(raw / 100) / 10 : raw,  // convert mL→L for display
        raw,
      }
    })
  }, [days, metric])

  // 7-day moving average
  const withAvg = useMemo(() => data.map((d, i) => {
    const window = data.slice(Math.max(0, i - 6), i + 1)
    const avg    = window.reduce((s, x) => s + x.value, 0) / window.length
    return { ...d, avg: Math.round(avg * 10) / 10 }
  }), [data])

  // Stats
  const values  = data.map(d => d.value).filter(v => v > 0)
  const avgVal  = values.length > 0
    ? Math.round(values.reduce((s, v) => s + v, 0) / values.length * 10) / 10
    : 0
  const maxVal  = values.length > 0 ? Math.max(...values) : 0
  const trend   = values.length >= 2
    ? values[values.length - 1] - values[0] > 0 ? '↑' : values[values.length - 1] - values[0] < 0 ? '↓' : '→'
    : '→'
  const trendColor = trend === '↑' ? '#22c55e' : trend === '↓' ? '#f87171' : 'var(--color-text-muted)'

  const yMax = metric === 'waterMl' ? 4 : config.max
  const unit = metric === 'waterMl' ? 'L' : config.unit

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-4 flex flex-col gap-4"
      style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{config.icon}</span>
          <div>
            <h4 className="font-display font-bold text-xs tracking-wider"
              style={{ color: 'var(--color-text)', letterSpacing: '0.1em' }}>
              {config.label.toUpperCase()}
            </h4>
            <p className="text-2xs text-zenith-faint" style={{ fontSize: '9px' }}>
              Last 30 days
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="font-mono font-black text-lg text-glow leading-none">
              {metric === 'waterMl' ? `${avgVal}L` : `${avgVal}${unit}`}
            </p>
            <p className="text-2xs text-zenith-faint" style={{ fontSize: '9px' }}>AVG</p>
          </div>
          <span className="font-display font-black text-xl" style={{ color: trendColor }}>
            {trend}
          </span>
        </div>
      </div>

      {/* Chart */}
      {isLoading ? (
        <div className="h-28 rounded-xl animate-pulse"
          style={{ background: 'var(--color-surface-active)' }} />
      ) : withAvg.length < 2 ? (
        <div className="h-28 flex items-center justify-center rounded-xl"
          style={{ background: 'var(--color-surface-active)' }}>
          <p className="text-xs text-zenith-faint">
            Not enough data yet — log your check-ins daily
          </p>
        </div>
      ) : (
        <div className="h-28">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={withAvg} margin={{ top: 4, right: 0, bottom: 0, left: -28 }}>
              <defs>
                <linearGradient id={`grad-${metric}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={lineColor} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={lineColor} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--color-border)"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tickFormatter={d => format(parseISO(d), 'd')}
                tick={{ fill: 'var(--color-text-faint)', fontSize: 9 }}
                tickLine={false}
                axisLine={false}
                interval={4}
              />
              <YAxis
                domain={[0, yMax]}
                tick={{ fill: 'var(--color-text-faint)', fontSize: 9 }}
                tickLine={false}
                axisLine={false}
                tickCount={4}
              />
              <Tooltip
                content={<CustomTooltip metric={metric} />}
                cursor={{ stroke: lineColor, strokeWidth: 1, strokeDasharray: '4 4' }}
              />
              {/* Average reference line */}
              <ReferenceLine
                y={avgVal}
                stroke={lineColor}
                strokeDasharray="4 4"
                strokeOpacity={0.35}
              />
              {/* Filled area */}
              <Area
                type="monotone"
                dataKey="value"
                stroke={lineColor}
                strokeWidth={2}
                fill={`url(#grad-${metric})`}
                dot={false}
                activeDot={{ r: 4, fill: lineColor, stroke: 'var(--color-bg)', strokeWidth: 2 }}
              />
              {/* 7-day moving average overlay */}
              <Line
                type="monotone"
                dataKey="avg"
                stroke={lineColor}
                strokeWidth={1}
                strokeDasharray="3 3"
                strokeOpacity={0.5}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </motion.div>
  )
}
