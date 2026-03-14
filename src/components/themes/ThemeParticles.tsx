'use client'

import { useEffect, useRef, memo } from 'react'
import { useTheme } from '@/lib/themes/theme-provider'

// ═══════════════════════════════════════════════════════════════
//  Theme Particle System
//  Each theme has its own canvas-drawn particle effect.
//  Runs on a single requestAnimationFrame loop.
//  Pauses when tab is hidden (Page Visibility API).
// ═══════════════════════════════════════════════════════════════

interface Particle {
  x: number; y: number; vx: number; vy: number
  alpha: number; size: number; life: number; maxLife: number
  hue?: number; angle?: number
}

function useDPR() {
  if (typeof window === 'undefined') return 1
  return Math.min(window.devicePixelRatio || 1, 2)
}

// ── Dark Cyber: floating grid lines ─────────────────────────────
function CyberGridCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    let raf: number
    let paused = false

    function resize() {
      canvas.width  = window.innerWidth  * dpr
      canvas.height = window.innerHeight * dpr
      canvas.style.width  = window.innerWidth  + 'px'
      canvas.style.height = window.innerHeight + 'px'
      ctx.scale(dpr, dpr)
    }
    resize()
    window.addEventListener('resize', resize)

    // Floating horizontal + vertical scan lines
    const lines: { pos: number; dir: 'h' | 'v'; speed: number; alpha: number }[] = []
    for (let i = 0; i < 6; i++) {
      lines.push({
        pos: Math.random() * window.innerHeight,
        dir: 'h',
        speed: 0.15 + Math.random() * 0.2,
        alpha: 0.04 + Math.random() * 0.06,
      })
    }
    for (let i = 0; i < 4; i++) {
      lines.push({
        pos: Math.random() * window.innerWidth,
        dir: 'v',
        speed: 0.1 + Math.random() * 0.15,
        alpha: 0.03 + Math.random() * 0.04,
      })
    }

    function draw() {
      if (paused) { raf = requestAnimationFrame(draw); return }
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)

      lines.forEach(line => {
        ctx.beginPath()
        ctx.strokeStyle = `rgba(0,245,255,${line.alpha})`
        ctx.lineWidth = 1
        if (line.dir === 'h') {
          ctx.moveTo(0, line.pos)
          ctx.lineTo(window.innerWidth, line.pos)
          line.pos += line.speed
          if (line.pos > window.innerHeight) line.pos = -2
        } else {
          ctx.moveTo(line.pos, 0)
          ctx.lineTo(line.pos, window.innerHeight)
          line.pos += line.speed
          if (line.pos > window.innerWidth) line.pos = -2
        }
        ctx.stroke()
      })

      raf = requestAnimationFrame(draw)
    }

    draw()
    const onVis = () => { paused = document.hidden }
    document.addEventListener('visibilitychange', onVis)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [])

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" />
}

// ── Cosmic: twinkling stars ──────────────────────────────────────
function CosmicStarsCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    let raf: number
    let paused = false

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width  = window.innerWidth  * dpr
      canvas.height = window.innerHeight * dpr
      canvas.style.width  = window.innerWidth  + 'px'
      canvas.style.height = window.innerHeight + 'px'
      ctx.scale(dpr, dpr)
    }
    resize()
    window.addEventListener('resize', resize)

    const stars: { x: number; y: number; r: number; phase: number; speed: number }[] = []
    for (let i = 0; i < 120; i++) {
      stars.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        r: 0.5 + Math.random() * 1.5,
        phase: Math.random() * Math.PI * 2,
        speed: 0.003 + Math.random() * 0.008,
      })
    }

    let t = 0
    function draw() {
      if (paused) { raf = requestAnimationFrame(draw); return }
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)
      t += 0.016

      stars.forEach(s => {
        const alpha = 0.15 + 0.55 * (0.5 + 0.5 * Math.sin(s.phase + t * s.speed * 60))
        ctx.beginPath()
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(147,197,253,${alpha})`
        ctx.fill()
      })

      raf = requestAnimationFrame(draw)
    }

    draw()
    const onVis = () => { paused = document.hidden }
    document.addEventListener('visibilitychange', onVis)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [])

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" />
}

// ── Inferno: rising fire embers ──────────────────────────────────
function InfernoCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    let raf: number
    let paused = false
    let w = window.innerWidth, h = window.innerHeight

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = window.innerWidth; h = window.innerHeight
      canvas.width  = w * dpr
      canvas.height = h * dpr
      canvas.style.width  = w + 'px'
      canvas.style.height = h + 'px'
      ctx.scale(dpr, dpr)
    }
    resize()
    window.addEventListener('resize', resize)

    const embers: Particle[] = []
    function spawnEmber() {
      embers.push({
        x: Math.random() * w,
        y: h + 10,
        vx: (Math.random() - 0.5) * 0.6,
        vy: -(0.5 + Math.random() * 1.2),
        alpha: 0.5 + Math.random() * 0.5,
        size: 1 + Math.random() * 2.5,
        life: 0,
        maxLife: 120 + Math.random() * 120,
        hue: 15 + Math.random() * 30,
      })
    }

    function draw() {
      if (paused) { raf = requestAnimationFrame(draw); return }
      ctx.clearRect(0, 0, w, h)

      if (Math.random() < 0.4) spawnEmber()

      for (let i = embers.length - 1; i >= 0; i--) {
        const e = embers[i]
        e.x  += e.vx + Math.sin(e.life * 0.05) * 0.3
        e.y  += e.vy
        e.life++
        const progress = e.life / e.maxLife
        const alpha = e.alpha * (1 - progress)

        if (progress >= 1) { embers.splice(i, 1); continue }

        ctx.beginPath()
        ctx.arc(e.x, e.y, e.size * (1 - progress * 0.5), 0, Math.PI * 2)
        ctx.fillStyle = `hsla(${e.hue},100%,60%,${alpha})`
        ctx.fill()
      }

      raf = requestAnimationFrame(draw)
    }

    draw()
    const onVis = () => { paused = document.hidden }
    document.addEventListener('visibilitychange', onVis)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [])

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" />
}

// ── Tactician: horizontal scan-line pulse ────────────────────────
function TacticianCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    let raf: number
    let paused = false

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width  = window.innerWidth  * dpr
      canvas.height = window.innerHeight * dpr
      canvas.style.width  = window.innerWidth  + 'px'
      canvas.style.height = window.innerHeight + 'px'
      ctx.scale(dpr, dpr)
    }
    resize()
    window.addEventListener('resize', resize)

    let scanY = -20
    const scanSpeed = 1.2

    function draw() {
      if (paused) { raf = requestAnimationFrame(draw); return }
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)

      // Scanline gradient
      const grad = ctx.createLinearGradient(0, scanY - 40, 0, scanY + 40)
      grad.addColorStop(0,   'rgba(34,211,238,0)')
      grad.addColorStop(0.4, 'rgba(34,211,238,0.04)')
      grad.addColorStop(0.5, 'rgba(34,211,238,0.10)')
      grad.addColorStop(0.6, 'rgba(34,211,238,0.04)')
      grad.addColorStop(1,   'rgba(34,211,238,0)')

      ctx.fillStyle = grad
      ctx.fillRect(0, scanY - 40, window.innerWidth, 80)

      // Bright leading edge
      ctx.beginPath()
      ctx.moveTo(0, scanY)
      ctx.lineTo(window.innerWidth, scanY)
      ctx.strokeStyle = 'rgba(34,211,238,0.25)'
      ctx.lineWidth = 1
      ctx.stroke()

      scanY += scanSpeed
      if (scanY > window.innerHeight + 40) scanY = -40

      raf = requestAnimationFrame(draw)
    }

    draw()
    const onVis = () => { paused = document.hidden }
    document.addEventListener('visibilitychange', onVis)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [])

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" />
}

// ── Gold Luxe: drifting golden dust ──────────────────────────────
function GoldDustCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    let raf: number
    let paused = false
    let w = window.innerWidth, h = window.innerHeight

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = window.innerWidth; h = window.innerHeight
      canvas.width  = w * dpr
      canvas.height = h * dpr
      canvas.style.width  = w + 'px'
      canvas.style.height = h + 'px'
      ctx.scale(dpr, dpr)
    }
    resize()
    window.addEventListener('resize', resize)

    const motes: Particle[] = []
    for (let i = 0; i < 60; i++) {
      motes.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.2,
        vy: -(0.1 + Math.random() * 0.3),
        alpha: 0.1 + Math.random() * 0.5,
        size: 0.5 + Math.random() * 1.5,
        life: Math.random() * 200,
        maxLife: 200 + Math.random() * 200,
      })
    }

    function draw() {
      if (paused) { raf = requestAnimationFrame(draw); return }
      ctx.clearRect(0, 0, w, h)

      motes.forEach(m => {
        m.x += m.vx + Math.sin(m.life * 0.02) * 0.15
        m.y += m.vy
        m.life++

        if (m.y < -5 || m.life > m.maxLife) {
          m.x = Math.random() * w
          m.y = h + 5
          m.life = 0
        }

        const flicker = 0.6 + 0.4 * Math.sin(m.life * 0.08)
        ctx.beginPath()
        ctx.arc(m.x, m.y, m.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(245,158,11,${m.alpha * flicker})`
        ctx.fill()
      })

      raf = requestAnimationFrame(draw)
    }

    draw()
    const onVis = () => { paused = document.hidden }
    document.addEventListener('visibilitychange', onVis)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [])

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" />
}

// ── Theme Particles — routes to correct canvas ───────────────────
export const ThemeParticles = memo(function ThemeParticles() {
  const { activeTheme } = useTheme()

  switch (activeTheme) {
    case 'dark-cyber':  return <CyberGridCanvas />
    case 'cosmic':      return <CosmicStarsCanvas />
    case 'inferno':     return <InfernoCanvas />
    case 'tactician':   return <TacticianCanvas />
    case 'gold-luxe':   return <GoldDustCanvas />
    default:            return null
  }
})
