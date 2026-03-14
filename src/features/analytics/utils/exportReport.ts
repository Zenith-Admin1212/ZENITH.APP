import type { AnalyticsSummary } from '../services/analyticsService'
import type { DisciplineResult } from './disciplineScore'
import { format } from 'date-fns'

// ═══════════════════════════════════════════════════════════════
//  Export Report Utility
//
//  Generates a canvas-based PNG report and triggers download.
//  PDF wrapping (one-page letter) uses browser print or a simple
//  data-URI trick — no server or jsPDF required.
//
//  PREMIUM ONLY — caller must gate before invoking.
// ═══════════════════════════════════════════════════════════════

const W = 1200
const H = 1600

function drawRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
  fill?: string, stroke?: string
) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y); ctx.arcTo(x + w, y, x + w, y + r, r)
  ctx.lineTo(x + w, y + h - r); ctx.arcTo(x + w, y + h, x + w - r, y + h, r)
  ctx.lineTo(x + r, y + h); ctx.arcTo(x, y + h, x, y + h - r, r)
  ctx.lineTo(x, y + r); ctx.arcTo(x, y, x + r, y, r)
  ctx.closePath()
  if (fill)   { ctx.fillStyle = fill;   ctx.fill()   }
  if (stroke) { ctx.strokeStyle = stroke; ctx.stroke() }
}

function drawHeatmapCell(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, size: number,
  pct: number, primaryHex: string, date: string, today: string
) {
  const alpha =
    pct === 0   ? 0.07 :
    pct < 34    ? 0.22 :
    pct < 67    ? 0.44 :
    pct < 100   ? 0.68 : 1.0

  const [r, g, b] = hexToRgb(primaryHex)
  const isToday   = date === today

  drawRoundRect(ctx, x, y, size, size, 6,
    `rgba(${r},${g},${b},${alpha})`,
    isToday ? primaryHex : `rgba(${r},${g},${b},${alpha + 0.1})`
  )
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ]
}

export async function generateAnalyticsReport(
  summary:     AnalyticsSummary,
  discipline:  DisciplineResult,
  username:    string,
  primaryHex:  string = '#00f5ff',
  bgColors:    [string, string] = ['#0a0a1a', '#0d1a2e']
): Promise<string> {
  const canvas = document.createElement('canvas')
  canvas.width  = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!

  const [r, g, b]   = hexToRgb(primaryHex)
  const today        = format(new Date(), 'yyyy-MM-dd')

  // ── Background ────────────────────────────────────────────────
  const bgGrad = ctx.createLinearGradient(0, 0, W, H)
  bgGrad.addColorStop(0, bgColors[0])
  bgGrad.addColorStop(1, bgColors[1])
  ctx.fillStyle = bgGrad
  ctx.fillRect(0, 0, W, H)

  // Grid overlay
  ctx.strokeStyle = `rgba(${r},${g},${b},0.05)`
  ctx.lineWidth   = 1
  for (let x = 0; x <= W; x += 50) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke()
  }
  for (let y = 0; y <= H; y += 50) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke()
  }

  // HUD glow orb
  const orb = ctx.createRadialGradient(W - 100, 100, 0, W - 100, 100, 500)
  orb.addColorStop(0, `rgba(${r},${g},${b},0.14)`)
  orb.addColorStop(1, 'transparent')
  ctx.fillStyle = orb; ctx.fillRect(0, 0, W, H)

  // ── Header ────────────────────────────────────────────────────
  ctx.shadowColor  = primaryHex
  ctx.shadowBlur   = 24
  ctx.fillStyle    = primaryHex
  ctx.font         = 'bold 52px monospace'
  ctx.letterSpacing = '8px'
  ctx.fillText('ZENITH', 60, 90)
  ctx.shadowBlur = 0

  ctx.fillStyle    = `rgba(${r},${g},${b},0.6)`
  ctx.font         = '16px monospace'
  ctx.letterSpacing = '4px'
  ctx.fillText('ANALYTICS REPORT', 60, 126)

  ctx.fillStyle    = `rgba(255,255,255,0.3)`
  ctx.font         = '14px monospace'
  ctx.letterSpacing = '1px'
  const dateStr    = format(new Date(), 'MMMM d, yyyy').toUpperCase()
  ctx.fillText(`${username.toUpperCase()} · ${dateStr}`, 60, 160)

  // Divider
  const div = ctx.createLinearGradient(60, 0, W - 60, 0)
  div.addColorStop(0, primaryHex); div.addColorStop(1, 'transparent')
  ctx.strokeStyle = div; ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(60, 184); ctx.lineTo(W - 60, 184); ctx.stroke()

  // ── Discipline Score block ────────────────────────────────────
  drawRoundRect(ctx, 60, 204, 340, 160, 16,
    `rgba(${r},${g},${b},0.07)`, `rgba(${r},${g},${b},0.3)`)

  ctx.fillStyle = primaryHex
  ctx.shadowColor = primaryHex; ctx.shadowBlur = 16
  ctx.font = 'bold 80px monospace'
  ctx.letterSpacing = '-2px'
  ctx.fillText(String(discipline.score), 80, 310)
  ctx.shadowBlur = 0

  ctx.fillStyle = `rgba(${r},${g},${b},0.7)`
  ctx.font = 'bold 22px monospace'
  ctx.letterSpacing = '2px'
  ctx.fillText(`GRADE ${discipline.grade}`, 80, 348)

  ctx.fillStyle = 'rgba(255,255,255,0.4)'
  ctx.font = '14px monospace'
  ctx.letterSpacing = '1px'
  ctx.fillText(discipline.label.toUpperCase(), 80, 374)

  // Breakdown bars
  const breakdownItems = [
    { label: 'HABITS',   value: discipline.breakdown.habits,   max: 40 },
    { label: 'FOCUS',    value: discipline.breakdown.focus,    max: 20 },
    { label: 'WELLNESS', value: discipline.breakdown.wellness, max: 20 },
    { label: 'STREAK',   value: discipline.breakdown.streak,   max: 20 },
  ]
  const bX = 440, bY = 220, bW = 660
  breakdownItems.forEach((item, i) => {
    const y   = bY + i * 38
    const pct = item.max > 0 ? item.value / item.max : 0
    ctx.fillStyle = 'rgba(255,255,255,0.3)'
    ctx.font = '12px monospace'; ctx.letterSpacing = '2px'
    ctx.fillText(item.label, bX, y + 14)

    ctx.fillStyle = `rgba(${r},${g},${b},0.15)`
    drawRoundRect(ctx, bX + 120, y, bW - 120, 16, 8, `rgba(${r},${g},${b},0.12)`)
    ctx.fillStyle = primaryHex
    drawRoundRect(ctx, bX + 120, y, Math.max(8, (bW - 120) * pct), 16, 8, primaryHex)

    ctx.fillStyle = primaryHex; ctx.font = 'bold 12px monospace'
    ctx.fillText(`${item.value}/${item.max}`, bX + bW + 8, y + 14)
  })

  // ── Stats row ─────────────────────────────────────────────────
  const stats = [
    { label: 'AVG COMPLETION', value: `${summary.avgCompletionPct}%` },
    { label: 'HABITS DONE',    value: String(summary.totalHabitsCompleted) },
    { label: 'PERFECT DAYS',   value: String(summary.perfectDays) },
    { label: 'POMODOROS',      value: String(summary.totalPomodoroSessions) },
    { label: 'FOCUS HOURS',    value: `${Math.round(summary.totalPomodoroMinutes / 60)}h` },
    { label: 'AVG SLEEP',      value: `${summary.avgSleepScore}/10` },
  ]
  const sW = (W - 120) / 3
  stats.forEach((s, i) => {
    const col = i % 3, row = Math.floor(i / 3)
    const sx  = 60 + col * sW, sy = 394 + row * 100
    drawRoundRect(ctx, sx, sy, sW - 20, 80, 12, `rgba(255,255,255,0.03)`, `rgba(${r},${g},${b},0.15)`)
    ctx.fillStyle = primaryHex; ctx.shadowColor = primaryHex; ctx.shadowBlur = 8
    ctx.font = 'bold 28px monospace'; ctx.letterSpacing = '0px'
    ctx.fillText(s.value, sx + 16, sy + 44); ctx.shadowBlur = 0
    ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.font = '11px monospace'; ctx.letterSpacing = '2px'
    ctx.fillText(s.label, sx + 16, sy + 66)
  })

  // ── Heatmap ───────────────────────────────────────────────────
  const hmY   = 616
  ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = 'bold 16px monospace'; ctx.letterSpacing = '3px'
  ctx.fillText('30-DAY HEATMAP', 60, hmY)

  const cellSize = 72, cellGap = 10, hmStartX = 60, hmStartY = hmY + 20
  summary.days.forEach((day, i) => {
    const col = i % 10, row = Math.floor(i / 10)
    const cx  = hmStartX + col * (cellSize + cellGap)
    const cy  = hmStartY + row * (cellSize + cellGap)
    drawHeatmapCell(ctx, cx, cy, cellSize, day.completionPct, primaryHex, day.date, today)

    ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.font = '13px monospace'; ctx.letterSpacing = '0px'
    const dayNum = parseInt(day.date.slice(8), 10)
    ctx.fillText(String(dayNum), cx + 4, cy + 18)
  })

  // ── Wellness summary ──────────────────────────────────────────
  const wY = hmY + 20 + 3 * (cellSize + cellGap) + 40
  ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = 'bold 16px monospace'; ctx.letterSpacing = '3px'
  ctx.fillText('WELLNESS AVERAGES', 60, wY)

  const wellness = [
    { icon: '😴', label: 'Sleep',  value: `${summary.avgSleepScore}/10`, color: '#818cf8' },
    { icon: '😊', label: 'Mood',   value: `${summary.avgMoodScore}/10`,  color: '#f59e0b' },
    { icon: '🎯', label: 'Focus',  value: `${summary.avgFocusScore}/10`, color: '#22c55e' },
    { icon: '💧', label: 'Water',  value: `${(summary.avgWaterMl / 1000).toFixed(1)}L`, color: '#38bdf8' },
  ]
  const wW = (W - 140) / 4
  wellness.forEach((w, i) => {
    const wx = 60 + i * (wW + 10), wy = wY + 20
    const [wr, wg, wb] = hexToRgb(w.color)
    drawRoundRect(ctx, wx, wy, wW, 100, 14, `rgba(${wr},${wg},${wb},0.08)`, `rgba(${wr},${wg},${wb},0.3)`)
    ctx.font = '28px sans-serif'; ctx.fillText(w.icon, wx + 16, wy + 44)
    ctx.fillStyle = w.color; ctx.font = 'bold 26px monospace'; ctx.letterSpacing = '0px'
    ctx.fillText(w.value, wx + 16, wy + 78)
    ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.font = '11px monospace'; ctx.letterSpacing = '2px'
    ctx.fillText(w.label.toUpperCase(), wx + 16, wy + 96)
  })

  // ── Footer ────────────────────────────────────────────────────
  ctx.fillStyle = `rgba(${r},${g},${b},0.06)`
  ctx.fillRect(0, H - 56, W, 56)
  ctx.strokeStyle = `rgba(${r},${g},${b},0.2)`; ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(0, H - 56); ctx.lineTo(W, H - 56); ctx.stroke()
  ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.font = '13px monospace'; ctx.letterSpacing = '2px'
  ctx.fillText('ZENITH — BUILD THE BEST VERSION OF YOURSELF · zenith.app', 60, H - 22)

  return canvas.toDataURL('image/png')
}

export async function downloadAnalyticsReport(
  summary:    AnalyticsSummary,
  discipline: DisciplineResult,
  username:   string,
  primaryHex: string,
  bgColors:   [string, string]
): Promise<void> {
  const dataURL = await generateAnalyticsReport(summary, discipline, username, primaryHex, bgColors)
  const a       = document.createElement('a')
  a.href        = dataURL
  a.download    = `zenith-analytics-${format(new Date(), 'yyyy-MM-dd')}.png`
  a.click()
}
