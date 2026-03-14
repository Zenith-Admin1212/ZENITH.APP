'use client'

// ═══════════════════════════════════════════════════════════════
//  CrystalZAnimation  —  Phase 14 (reference-accurate rebuild)
//
//  Geometry traced directly from the ZENITH logo reference image.
//
//  The logo Z is formed from THREE crystal shards:
//
//   Crystal A — Top lance
//     A long narrow blade oriented NE-SW (upper-right to lower-left).
//     Its sharp tip at the top-right is the primary starburst glow.
//     Dimensions: ~4× taller than wide — the most dramatic piece.
//     Scatter origin: flies in from upper-right.
//
//   Crystal B — Center diagonal bar
//     The widest and most massive shard. Forms the Z's diagonal stroke.
//     Glows at both elbows (upper-right junction, lower-left junction).
//     Acts as the animation anchor — fades in first.
//
//   Crystal C — Bottom lance
//     A shorter blade pointing roughly EAST (rightward).
//     Its right tip has a secondary starburst glow.
//     Scatter origin: flies in from lower-right.
//
//  Glow burst positions (matched to reference image):
//    1. Crystal A tip: upper-right starburst        (140,  8)
//    2. A↔B junction:  right elbow glow             (183, 118)
//    3. B↔C junction:  left elbow glow              ( 16, 176)
//    4. Crystal C tip: right-side secondary burst   (185, 175)
//
//  Canvas: 200×240 viewBox
//
//  Animation timeline (total < 1.8s to first visible transition):
//    0ms    — Crystal B fades in as anchor (no position change)
//    40ms   — Crystal A assembles from upper-right scatter
//    80ms   — Crystal C assembles from lower-right scatter
//    700ms  — Glow bloom pulses across all crystals
//    1100ms — Shimmer sweep left → right
//    SplashScreen holds 380ms then triggers exit
//
//  Performance:
//    • Pure SVG + Framer Motion — no canvas, no 3D, no images
//    • aria-hidden — screen readers skip entirely
//    • All colours via CSS variables — works across all 5 themes
// ═══════════════════════════════════════════════════════════════

import { motion, useAnimation, type Variants } from 'framer-motion'
import { useEffect }                            from 'react'

interface CrystalZAnimationProps {
  /** Rendered width in px. Height auto-scales from 200×240 viewBox ratio. */
  size?:       number
  /** true = play entrance, false = trigger exit */
  playing:     boolean
  /** Fired when the entrance animation sequence fully resolves */
  onComplete?: () => void
}

// ── SVG Geometry — 200×240 viewBox ───────────────────────────
//
// Each crystal is a closed 4-vertex polygon.
// "outer"  = the full crystal body (dark glass fill + bright stroke)
// "lit"    = the bright lit face (inset slightly from outer, right/top side)
// "shadow" = the dark shadow face (inset from outer, left/bottom side)
// "spine"  = thin bright line from tip to base (the crystal ridge)
//
// Derived from reference image: 1024×1024 → 200×240 SVG

const GEO = {

  // ── Crystal A: top lance (elongated, tip upper-right) ────────
  //
  //  Tip:         (140,  8)  ← primary starburst glow
  //  Right-wide:  (184, 50)  ← widest right edge of crystal
  //  Lower-R:     (166,116)  ← where A's base meets center bar
  //  Left-wide:   (114, 55)  ← widest left edge of crystal
  //
  A: {
    outer:    'M 140,7   L 184,50  L 166,116  L 114,55  Z',
    lit:      'M 145,18  L 180,51  L 163,107  L 124,60  Z',
    shadow:   'M 138,12  L 142,54  L 126,105  L 116,58  Z',
    spine:    { x1: 140, y1: 10,  x2: 152, y2: 110 },
    tip:      { cx: 140, cy: 8,   r: 3.5  },
    scatter:  { x: 38, y: -50, rotate: 24 },
    origin:   '150px 62px',
  },

  // ── Crystal B: center bar (wide diagonal parallelogram) ──────
  //
  //  Upper-R:  (166, 103)  ← top-right corner (connects to A)
  //  Far-R:    (184, 118)  ← rightmost elbow point (glow here)
  //  Lower-L:  ( 36, 193)  ← bottom-left corner (connects to C)
  //  Far-L:    ( 16, 176)  ← leftmost elbow point (glow here)
  //
  B: {
    outer:    'M 16,176  L 166,103  L 184,118  L 36,193  Z',
    lit:      'M 24,177  L 163,107  L 179,119  L 42,191  Z',
    shadow:   'M 16,178  L 46,196  L 58,190  L 20,180  Z',
    elbowR:   { cx: 184, cy: 118, r: 4   },
    elbowL:   { cx: 16,  cy: 176, r: 4   },
    origin:   '100px 148px',
  },

  // ── Crystal C: bottom lance (shorter, pointing right/east) ───
  //
  //  Left-junc: ( 35, 184)  ← connects to center bar (left)
  //  Upper:     (118, 154)  ← upper edge mid-point
  //  Tip:       (185, 174)  ← rightmost point, secondary glow
  //  Lower:     (150, 222)  ← bottom point of this shard
  //
  C: {
    outer:    'M 35,184  L 118,154  L 185,174  L 150,222  Z',
    lit:      'M 44,185  L 116,158  L 178,175  L 145,216  Z',
    shadow:   'M 35,186  L 56,198  L 60,188  L 40,186  Z',
    spine:    { x1: 42, y1: 186, x2: 180, y2: 173 },
    tip:      { cx: 185, cy: 174, r: 3.5 },
    scatter:  { x: 32, y: 40, rotate: -20 },
    origin:   '110px 188px',
  },

} as const

// ── Framer Motion Variants ────────────────────────────────────

// Crystal B: anchor — no translation, just opacity + scale
const bV: Variants = {
  hidden:  { opacity: 0, scale: 0.90 },
  visible: {
    opacity: 1, scale: 1,
    transition: { delay: 0.0, duration: 0.48, ease: [0.25, 0.46, 0.45, 0.94] },
  },
  exit: { opacity: 0, scale: 0.96, transition: { duration: 0.22 } },
}

// Crystal A: assembles from upper-right scatter
const aV: Variants = {
  hidden:  { x: GEO.A.scatter.x, y: GEO.A.scatter.y, rotate: GEO.A.scatter.rotate, opacity: 0 },
  visible: {
    x: 0, y: 0, rotate: 0, opacity: 1,
    transition: { delay: 0.04, duration: 0.54, ease: [0.22, 1.0, 0.36, 1.0] },
  },
  exit: { opacity: 0, x: 8, y: -12, transition: { duration: 0.20 } },
}

// Crystal C: assembles from lower-right scatter
const cV: Variants = {
  hidden:  { x: GEO.C.scatter.x, y: GEO.C.scatter.y, rotate: GEO.C.scatter.rotate, opacity: 0 },
  visible: {
    x: 0, y: 0, rotate: 0, opacity: 1,
    transition: { delay: 0.08, duration: 0.54, ease: [0.22, 1.0, 0.36, 1.0] },
  },
  exit: { opacity: 0, x: 8, y: 10, transition: { duration: 0.20 } },
}

// Glow bloom: radial background pulse after crystals settle
const glowV: Variants = {
  hidden: { opacity: 0, scale: 0.75 },
  pulse: {
    opacity: [0, 1, 0.55, 1, 0],
    scale:   [0.75, 1.15, 0.98, 1.08, 0.92],
    transition: {
      delay: 0.68,
      duration: 0.82,
      times: [0, 0.18, 0.45, 0.72, 1.0],
      ease: 'easeInOut',
    },
  },
}

// Shimmer sweep: bright diagonal stripe crossing the Z
const shimV: Variants = {
  hidden: { x: -260, opacity: 0 },
  sweep: {
    x: 260,
    opacity: [0, 0.7, 0.7, 0],
    transition: { delay: 1.08, duration: 0.44, ease: 'easeInOut' },
  },
}

// ZENITH wordmark: fades in after crystals assemble
const wV: Variants = {
  hidden:  { opacity: 0, y: 8 },
  visible: {
    opacity: 1, y: 0,
    transition: { delay: 0.62, duration: 0.36, ease: 'easeOut' },
  },
  exit: { opacity: 0, y: -4, transition: { duration: 0.18 } },
}

// ── Component ─────────────────────────────────────────────────

export function CrystalZAnimation({
  size = 184, playing, onComplete,
}: CrystalZAnimationProps) {
  const controls = useAnimation()

  useEffect(() => {
    if (playing) {
      // Drive all crystal variants + wordmark to 'visible'
      controls.start('visible').then(() => {
        onComplete?.()
      })
      // Glow and shimmer run independently (don't gate onComplete)
      controls.start('pulse')
      setTimeout(() => controls.start('sweep'), 0)
    } else {
      controls.start('exit')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing])

  // Maintain aspect ratio: viewBox is 200×240
  const svgH = Math.round(size * (240 / 200))

  return (
    <div
      aria-hidden="true"
      className="relative flex flex-col items-center gap-4"
      style={{ width: size }}
    >
      {/* ── Crystal Z SVG ──────────────────────────────────── */}
      <div className="relative" style={{ width: size, height: svgH }}>

        {/* Radial glow bloom — the ambient teal haze from the reference */}
        <motion.div
          aria-hidden="true"
          className="absolute pointer-events-none"
          style={{
            inset:      '-20%',
            background: `radial-gradient(
              ellipse 65% 60% at 54% 48%,
              var(--color-primary-glow) 0%,
              transparent 68%
            )`,
            filter: 'blur(24px)',
          }}
          variants={glowV}
          initial="hidden"
          animate={controls}
        />

        <svg
          viewBox="0 0 200 240"
          width={size}
          height={svgH}
          style={{
            overflow: 'visible',
            // Layered drop-shadows reproduce the reference's ambient glow
            filter: [
              'drop-shadow(0 0 14px var(--color-primary-glow))',
              'drop-shadow(0 0 4px rgba(0,245,255,0.5))',
              'drop-shadow(0 2px 6px rgba(0,0,0,0.8))',
            ].join(' '),
          }}
        >
          <defs>
            {/* ── Crystal body: dark glassy fill ── */}
            <linearGradient id="czBody" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%"   stopColor="var(--color-primary)"       stopOpacity="0.14" />
              <stop offset="40%"  stopColor="var(--color-primary)"       stopOpacity="0.06" />
              <stop offset="100%" stopColor="var(--color-bg-secondary)"  stopOpacity="0.92" />
            </linearGradient>

            {/* ── Lit face: bright white-to-cyan ── */}
            <linearGradient id="czLit" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%"   stopColor="white"                stopOpacity="0.88" />
              <stop offset="35%"  stopColor="white"                stopOpacity="0.55" />
              <stop offset="70%"  stopColor="var(--color-primary)" stopOpacity="0.28" />
              <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0.06" />
            </linearGradient>

            {/* ── Shadow face: dark blue edge ── */}
            <linearGradient id="czShadow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%"   stopColor="var(--color-bg-secondary)" stopOpacity="0.95" />
              <stop offset="100%" stopColor="var(--color-bg)"           stopOpacity="0.98" />
            </linearGradient>

            {/* ── Shimmer stripe (horizontal) ── */}
            <linearGradient id="czShimmer" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%"   stopColor="white" stopOpacity="0"    />
              <stop offset="30%"  stopColor="white" stopOpacity="0.68" />
              <stop offset="70%"  stopColor="white" stopOpacity="0.68" />
              <stop offset="100%" stopColor="white" stopOpacity="0"    />
            </linearGradient>

            {/* ── Clip path: Z bounding box for shimmer ── */}
            <clipPath id="czClip">
              <polygon points="8,0 200,0 200,240 0,240" />
            </clipPath>
          </defs>

          {/* ════════════════════════════════════════════
              CRYSTAL B — center diagonal bar (ANCHOR)
              Fades in first with no positional scatter.
              ════════════════════════════════════════════ */}
          <motion.g
            variants={bV}
            initial="hidden"
            animate={controls}
            style={{ transformOrigin: GEO.B.origin }}
          >
            {/* Body */}
            <path
              d={GEO.B.outer}
              fill="url(#czBody)"
              stroke="var(--color-primary)"
              strokeWidth="1.25"
              strokeOpacity="0.85"
              strokeLinejoin="round"
            />
            {/* Lit face */}
            <path
              d={GEO.B.lit}
              fill="url(#czLit)"
              opacity="0.40"
            />

            {/* Right elbow glow burst */}
            <circle cx={GEO.B.elbowR.cx} cy={GEO.B.elbowR.cy} r={GEO.B.elbowR.r}
              fill="white" opacity="0.92" style={{ filter: 'blur(1px)' }} />
            <circle cx={GEO.B.elbowR.cx} cy={GEO.B.elbowR.cy} r={9}
              fill="var(--color-primary)" opacity="0.30" style={{ filter: 'blur(4px)' }} />

            {/* Left elbow glow burst */}
            <circle cx={GEO.B.elbowL.cx} cy={GEO.B.elbowL.cy} r={GEO.B.elbowR.r}
              fill="white" opacity="0.85" style={{ filter: 'blur(1px)' }} />
            <circle cx={GEO.B.elbowL.cx} cy={GEO.B.elbowL.cy} r={9}
              fill="var(--color-primary)" opacity="0.25" style={{ filter: 'blur(4px)' }} />
          </motion.g>

          {/* ════════════════════════════════════════════
              CRYSTAL A — top lance (long upper blade)
              Flies in from upper-right scatter.
              ════════════════════════════════════════════ */}
          <motion.g
            variants={aV}
            initial="hidden"
            animate={controls}
            style={{ transformOrigin: GEO.A.origin }}
          >
            {/* Shadow face (the dark left side of the blade) */}
            <path
              d={GEO.A.shadow}
              fill="url(#czShadow)"
              opacity="0.6"
            />
            {/* Crystal body */}
            <path
              d={GEO.A.outer}
              fill="url(#czBody)"
              stroke="var(--color-primary)"
              strokeWidth="1.25"
              strokeOpacity="0.85"
              strokeLinejoin="round"
            />
            {/* Lit face (the bright right side of the blade) */}
            <path
              d={GEO.A.lit}
              fill="url(#czLit)"
              opacity="0.52"
            />
            {/* Spine ridge line — the bright central axis of the crystal */}
            <line
              x1={GEO.A.spine.x1} y1={GEO.A.spine.y1}
              x2={GEO.A.spine.x2} y2={GEO.A.spine.y2}
              stroke="white" strokeWidth="0.85" strokeOpacity="0.65"
              strokeLinecap="round"
            />
            {/* Tip: sharp white point */}
            <circle cx={GEO.A.tip.cx} cy={GEO.A.tip.cy} r={GEO.A.tip.r}
              fill="white" opacity="0.95" style={{ filter: 'blur(1px)' }} />
            {/* Tip: primary starburst halo (the most prominent glow) */}
            <circle cx={GEO.A.tip.cx} cy={GEO.A.tip.cy} r={10}
              fill="var(--color-primary)" opacity="0.38" style={{ filter: 'blur(5px)' }} />
            <circle cx={GEO.A.tip.cx} cy={GEO.A.tip.cy} r={18}
              fill="var(--color-primary)" opacity="0.16" style={{ filter: 'blur(8px)' }} />
          </motion.g>

          {/* ════════════════════════════════════════════
              CRYSTAL C — bottom lance (rightward blade)
              Flies in from lower-right scatter.
              ════════════════════════════════════════════ */}
          <motion.g
            variants={cV}
            initial="hidden"
            animate={controls}
            style={{ transformOrigin: GEO.C.origin }}
          >
            {/* Shadow face */}
            <path
              d={GEO.C.shadow}
              fill="url(#czShadow)"
              opacity="0.6"
            />
            {/* Crystal body */}
            <path
              d={GEO.C.outer}
              fill="url(#czBody)"
              stroke="var(--color-primary)"
              strokeWidth="1.25"
              strokeOpacity="0.85"
              strokeLinejoin="round"
            />
            {/* Lit face */}
            <path
              d={GEO.C.lit}
              fill="url(#czLit)"
              opacity="0.48"
            />
            {/* Spine ridge */}
            <line
              x1={GEO.C.spine.x1} y1={GEO.C.spine.y1}
              x2={GEO.C.spine.x2} y2={GEO.C.spine.y2}
              stroke="white" strokeWidth="0.85" strokeOpacity="0.62"
              strokeLinecap="round"
            />
            {/* Right tip: secondary starburst */}
            <circle cx={GEO.C.tip.cx} cy={GEO.C.tip.cy} r={GEO.C.tip.r}
              fill="white" opacity="0.92" style={{ filter: 'blur(1px)' }} />
            <circle cx={GEO.C.tip.cx} cy={GEO.C.tip.cy} r={9}
              fill="var(--color-primary)" opacity="0.32" style={{ filter: 'blur(4px)' }} />
            <circle cx={GEO.C.tip.cx} cy={GEO.C.tip.cy} r={16}
              fill="var(--color-primary)" opacity="0.14" style={{ filter: 'blur(7px)' }} />
          </motion.g>

          {/* ════════════════════════════════════════════
              SHIMMER SWEEP — bright diagonal stripe
              Crosses the assembled Z left→right.
              ════════════════════════════════════════════ */}
          <motion.g
            clipPath="url(#czClip)"
            variants={shimV}
            initial="hidden"
            animate={controls}
          >
            <rect
              x="-55" y="-10"
              width="90" height="260"
              fill="url(#czShimmer)"
              transform="rotate(-20, 100, 120)"
            />
          </motion.g>
        </svg>
      </div>

      {/* ── ZENITH wordmark ─────────────────────────────────── */}
      <motion.div
        variants={wV}
        initial="hidden"
        animate={controls}
        className="flex flex-col items-center gap-1.5"
      >
        <p
          className="font-display font-black tracking-[0.58em] text-sm"
          style={{
            color:      'var(--color-primary)',
            textShadow: '0 0 20px var(--color-primary-glow)',
          }}
        >
          ZENITH
        </p>
        <p
          className="tracking-[0.28em] font-light"
          style={{ color: 'var(--color-text-faint)', fontSize: '9px' }}
        >
          ELITE PERFORMANCE SYSTEM
        </p>
      </motion.div>
    </div>
  )
}
