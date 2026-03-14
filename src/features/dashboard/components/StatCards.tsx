'use client'

import { motion } from 'framer-motion'
import { Flame, Shield, Zap, Target } from 'lucide-react'
import { useStreakStore } from '@/stores/streakStore'
import { useXPStore } from '@/stores/xpStore'

// ═══════════════════════════════════════════════════════════════
//  StatCards — 4 glowing HUD stat panels
// ═══════════════════════════════════════════════════════════════

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: string | number
  sub?: string
  color?: string
  delay?: number
  pulse?: boolean
}

function StatCard({ icon, label, value, sub, color, delay = 0, pulse }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
      className="flex-1 rounded-xl p-3 flex flex-col gap-1 relative overflow-hidden"
      style={{
        background: 'var(--color-surface)',
        border: `1px solid ${color ? `${color}40` : 'var(--color-border)'}`,
        boxShadow: color ? `0 0 16px ${color}15, inset 0 1px 0 ${color}20` : 'none',
        minWidth: 0,
      }}
    >
      {/* Corner accent */}
      <div
        className="absolute top-0 right-0 w-6 h-6"
        style={{
          background: `linear-gradient(135deg, transparent 50%, ${color || 'var(--color-primary)'}25 100%)`,
        }}
      />

      {/* Icon */}
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center"
        style={{ background: `${color || 'var(--color-primary)'}18` }}
      >
        {icon}
      </div>

      {/* Value */}
      <p
        className="font-display font-black text-xl leading-none mt-0.5"
        style={{
          color: color || 'var(--color-primary)',
          textShadow: color ? `0 0 12px ${color}60` : 'var(--glow-sm)',
        }}
      >
        {value}
        {pulse && (
          <motion.span
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            style={{ color: color || 'var(--color-primary)' }}
          > ·</motion.span>
        )}
      </p>

      {/* Label */}
      <p
        className="font-display font-semibold leading-none"
        style={{ fontSize: '9px', color: 'var(--color-text-muted)', letterSpacing: '0.12em' }}
      >
        {label.toUpperCase()}
      </p>

      {/* Sub */}
      {sub && (
        <p className="text-2xs text-zenith-faint truncate">{sub}</p>
      )}
    </motion.div>
  )
}

// ── Shield dots ───────────────────────────────────────────────────
function ShieldDots({ count, max = 3 }: { count: number; max?: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5 + i * 0.1, type: 'spring', stiffness: 300 }}
          className="w-2.5 h-2.5 rounded-full"
          style={{
            background: i < count ? '#60a5fa' : 'var(--color-surface-active)',
            boxShadow: i < count ? '0 0 6px #60a5fa80' : 'none',
          }}
        />
      ))}
    </div>
  )
}

export function StatCards({ disciplinePct = 0 }: { disciplinePct?: number }) {
  const { streak, monthlyShieldsRemaining } = useStreakStore()
  const { weeklyXP } = useXPStore()

  return (
    <div className="flex gap-2.5">
      <StatCard
        icon={<Flame size={15} color="#f97316" />}
        label="Streak"
        value={streak}
        sub={streak === 1 ? '1 day' : `${streak} days`}
        color="#f97316"
        delay={0}
      />

      <StatCard
        icon={<Shield size={15} color="#60a5fa" />}
        label="Shields"
        value={monthlyShieldsRemaining}
        sub="this month"
        color="#60a5fa"
        delay={0.08}
      />

      <StatCard
        icon={<Zap size={15} color="#a78bfa" />}
        label="Week XP"
        value={weeklyXP}
        color="#a78bfa"
        delay={0.16}
      />

      <StatCard
        icon={<Target size={15} color="#22c55e" />}
        label="Discipline"
        value={`${disciplinePct}%`}
        color="#22c55e"
        delay={0.24}
      />
    </div>
  )
}
