'use client'

import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Share2, Download, Loader2, ImageIcon } from 'lucide-react'
import { useUserStore }   from '@/stores/userStore'
import { useXPStore }     from '@/stores/xpStore'
import { useStreakStore }  from '@/stores/streakStore'
import { useTheme }       from '@/lib/themes/theme-provider'
import { THEMES }         from '@/lib/themes/theme-config'
import { format }         from 'date-fns'

// ═══════════════════════════════════════════════════════════════
//  ShareCardGenerator
//  Renders a 900×500 canvas card and exports as PNG
// ═══════════════════════════════════════════════════════════════

const CARD_W = 900
const CARD_H = 500

function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return [r, g, b]
}

function drawRoundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.arcTo(x + w, y, x + w, y + r, r)
  ctx.lineTo(x + w, y + h - r)
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r)
  ctx.lineTo(x + r, y + h)
  ctx.arcTo(x, y + h, x, y + h - r, r)
  ctx.lineTo(x, y + r)
  ctx.arcTo(x, y, x + r, y, r)
  ctx.closePath()
}

export function ShareCardGenerator() {
  const { user }  = useUserStore()
  const { xp, getProgress } = useXPStore()
  const { streak, monthlyShieldsRemaining } = useStreakStore()
  const { activeTheme } = useTheme()

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [preview,    setPreview]    = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)

  const theme    = THEMES[activeTheme]
  const progress = getProgress()

  const generateCard = useCallback(async () => {
    setGenerating(true)
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.width  = CARD_W
    canvas.height = CARD_H
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const [bg1, bg2]   = theme.shareCardBg
    const primary      = theme.previewColor
    const accent       = theme.gradientTo
    const [pr, pg, pb] = hexToRgb(primary)

    // ── Background gradient ───────────────────────────────────────
    const bgGrad = ctx.createLinearGradient(0, 0, CARD_W, CARD_H)
    bgGrad.addColorStop(0, bg1)
    bgGrad.addColorStop(1, bg2)
    ctx.fillStyle = bgGrad
    ctx.fillRect(0, 0, CARD_W, CARD_H)

    // ── Grid pattern ──────────────────────────────────────────────
    ctx.strokeStyle = `rgba(${pr},${pg},${pb},0.06)`
    ctx.lineWidth = 1
    for (let x = 0; x <= CARD_W; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CARD_H); ctx.stroke()
    }
    for (let y = 0; y <= CARD_H; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CARD_W, y); ctx.stroke()
    }

    // ── Glow orb top-right ────────────────────────────────────────
    const orbGrad = ctx.createRadialGradient(CARD_W - 80, 80, 0, CARD_W - 80, 80, 300)
    orbGrad.addColorStop(0, `rgba(${pr},${pg},${pb},0.18)`)
    orbGrad.addColorStop(1, 'transparent')
    ctx.fillStyle = orbGrad
    ctx.fillRect(0, 0, CARD_W, CARD_H)

    // ── Corner HUD brackets ───────────────────────────────────────
    ctx.strokeStyle = `rgba(${pr},${pg},${pb},0.5)`
    ctx.lineWidth = 2
    const bSize = 20, bPad = 16
    const corners = [[bPad, bPad], [CARD_W - bPad, bPad], [bPad, CARD_H - bPad], [CARD_W - bPad, CARD_H - bPad]] as [number,number][]
    corners.forEach(([cx, cy], i) => {
      const dx = i % 2 === 1 ? -1 : 1
      const dy = i >= 2 ? -1 : 1
      ctx.beginPath()
      ctx.moveTo(cx, cy + dy * bSize); ctx.lineTo(cx, cy); ctx.lineTo(cx + dx * bSize, cy)
      ctx.stroke()
    })

    // ── ZENITH logo text ──────────────────────────────────────────
    ctx.fillStyle = primary
    ctx.font = 'bold 42px monospace'
    ctx.letterSpacing = '6px'
    ctx.fillText('ZENITH', 50, 80)

    // Glow effect on logo text
    ctx.shadowColor = primary
    ctx.shadowBlur  = 20
    ctx.fillStyle   = primary
    ctx.fillText('ZENITH', 50, 80)
    ctx.shadowBlur  = 0

    // ── Tagline ───────────────────────────────────────────────────
    ctx.fillStyle = `rgba(255,255,255,0.35)`
    ctx.font = '14px monospace'
    ctx.letterSpacing = '3px'
    ctx.fillText('DAILY PERFORMANCE REPORT', 50, 108)

    // ── Date ─────────────────────────────────────────────────────
    ctx.fillStyle = `rgba(${pr},${pg},${pb},0.7)`
    ctx.font = '13px monospace'
    ctx.letterSpacing = '1px'
    ctx.fillText(format(new Date(), 'EEEE, MMMM d yyyy').toUpperCase(), CARD_W - 50 - ctx.measureText(format(new Date(), 'EEEE, MMMM d yyyy').toUpperCase()).width, 80)

    // ── Divider line ──────────────────────────────────────────────
    const divGrad = ctx.createLinearGradient(50, 0, CARD_W - 50, 0)
    divGrad.addColorStop(0, `rgba(${pr},${pg},${pb},0.8)`)
    divGrad.addColorStop(1, 'transparent')
    ctx.strokeStyle = divGrad
    ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(50, 130); ctx.lineTo(CARD_W - 50, 130); ctx.stroke()

    // ── User info block ───────────────────────────────────────────
    ctx.fillStyle = `rgba(255,255,255,0.9)`
    ctx.font = 'bold 28px monospace'
    ctx.letterSpacing = '1px'
    const displayName = user?.username ?? 'ZENITH USER'
    ctx.fillText(displayName.toUpperCase(), 50, 178)

    // Level badge
    const levelBadge = `${progress.current.badge} ${progress.current.name.toUpperCase()}`
    drawRoundedRect(ctx, 50, 192, 140, 28, 6)
    ctx.fillStyle = `rgba(${pr},${pg},${pb},0.15)`
    ctx.fill()
    ctx.strokeStyle = `rgba(${pr},${pg},${pb},0.6)`
    ctx.lineWidth = 1
    ctx.stroke()
    ctx.fillStyle = primary
    ctx.font = 'bold 13px monospace'
    ctx.letterSpacing = '1px'
    ctx.fillText(levelBadge, 58, 211)

    // ── Stats grid (2 rows × 3 cols) ─────────────────────────────
    const stats = [
      { icon: '⚡', label: 'XP',        value: xp.toLocaleString() },
      { icon: '🔥', label: 'STREAK',    value: `${streak} DAYS` },
      { icon: '🛡️', label: 'SHIELDS',   value: `${monthlyShieldsRemaining}/3` },
      { icon: '📊', label: 'LEVEL',     value: `${progress.progressPct}%` },
      { icon: '👤', label: 'PLAN',      value: (user?.plan ?? 'FREE').toUpperCase() },
      { icon: '🎯', label: 'THEME',     value: theme.name.toUpperCase() },
    ]

    const colW = (CARD_W - 100) / 3
    const startY = 260

    stats.forEach(({ icon, label, value }, i) => {
      const col  = i % 3
      const row  = Math.floor(i / 3)
      const sx   = 50 + col * colW
      const sy   = startY + row * 95

      // Card background
      drawRoundedRect(ctx, sx, sy, colW - 20, 78, 8)
      ctx.fillStyle = `rgba(255,255,255,0.04)`
      ctx.fill()
      ctx.strokeStyle = `rgba(${pr},${pg},${pb},0.2)`
      ctx.lineWidth = 1
      ctx.stroke()

      // Icon
      ctx.font = '22px sans-serif'
      ctx.fillText(icon, sx + 12, sy + 34)

      // Value
      ctx.fillStyle = primary
      ctx.shadowColor = primary; ctx.shadowBlur = 8
      ctx.font = 'bold 20px monospace'
      ctx.letterSpacing = '1px'
      ctx.fillText(value, sx + 12, sy + 58)
      ctx.shadowBlur = 0

      // Label
      ctx.fillStyle = `rgba(255,255,255,0.35)`
      ctx.font = '11px monospace'
      ctx.letterSpacing = '2px'
      ctx.fillText(label, sx + 12, sy + 72)
    })

    // ── Bottom bar ────────────────────────────────────────────────
    ctx.fillStyle = `rgba(${pr},${pg},${pb},0.06)`
    ctx.fillRect(0, CARD_H - 44, CARD_W, 44)
    ctx.strokeStyle = `rgba(${pr},${pg},${pb},0.25)`
    ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(0, CARD_H - 44); ctx.lineTo(CARD_W, CARD_H - 44); ctx.stroke()

    ctx.fillStyle = `rgba(255,255,255,0.25)`
    ctx.font = '11px monospace'
    ctx.letterSpacing = '2px'
    ctx.fillText('ZENITH — BUILD THE BEST VERSION OF YOURSELF', 50, CARD_H - 18)
    ctx.fillStyle = `rgba(${pr},${pg},${pb},0.7)`
    ctx.fillText('zenith.app', CARD_W - 140, CARD_H - 18)

    // ── Export ────────────────────────────────────────────────────
    const dataURL = canvas.toDataURL('image/png')
    setPreview(dataURL)
    setGenerating(false)
  }, [user, xp, streak, monthlyShieldsRemaining, activeTheme, theme, progress])

  const handleDownload = () => {
    if (!preview) return
    const a = document.createElement('a')
    a.href     = preview
    a.download = `zenith-${format(new Date(), 'yyyy-MM-dd')}.png`
    a.click()
  }

  const handleShare = async () => {
    if (!preview) return
    // Convert data URL to blob for Web Share API
    const res   = await fetch(preview)
    const blob  = await res.blob()
    const file  = new File([blob], 'zenith-report.png', { type: 'image/png' })

    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: 'My ZENITH Daily Report' })
    } else {
      handleDownload()  // fallback
    }
  }

  return (
    <div className="px-4 pt-4 pb-2">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <ImageIcon size={14} style={{ color: 'var(--color-primary)' }} />
          <span className="font-display font-bold text-xs tracking-widest"
            style={{ color: 'var(--color-text-muted)' }}>
            SHARE CARD
          </span>
        </div>
        <span className="text-2xs text-zenith-faint">Exports as PNG</span>
      </div>

      {/* Hidden canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Preview */}
      <AnimatePresence>
        {preview && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="mb-3 rounded-2xl overflow-hidden"
            style={{ border: '1px solid var(--color-border-glow)', boxShadow: 'var(--glow-sm)' }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Share card" className="w-full h-auto" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Buttons */}
      <div className="flex gap-2">
        <button
          onClick={generateCard}
          disabled={generating}
          className="btn-primary flex-1 flex items-center justify-center gap-2 py-3"
        >
          {generating
            ? <><Loader2 size={15} className="animate-spin" /> Generating...</>
            : <><ImageIcon size={15} /> {preview ? 'Regenerate' : 'Generate Card'}</>
          }
        </button>
        {preview && (
          <>
            <button
              onClick={handleDownload}
              className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl font-semibold text-sm transition-all active:scale-95"
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border-glow)', color: 'var(--color-primary)' }}
            >
              <Download size={15} />
            </button>
            <button
              onClick={handleShare}
              className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl font-semibold text-sm transition-all active:scale-95"
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border-glow)', color: 'var(--color-primary)' }}
            >
              <Share2 size={15} />
            </button>
          </>
        )}
      </div>
    </div>
  )
}
