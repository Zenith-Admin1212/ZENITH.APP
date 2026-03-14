'use client'

import { motion } from 'framer-motion'
import { Crown }  from 'lucide-react'

// ═══════════════════════════════════════════════════════════════
//  PremiumBadge
//  Reusable crown badge: inline label, pill, or icon-only modes.
// ═══════════════════════════════════════════════════════════════

interface PremiumBadgeProps {
  variant?: 'pill' | 'icon' | 'inline' | 'banner'
  size?:    'xs' | 'sm' | 'md'
  pulse?:   boolean
  className?: string
}

const SIZE_CONFIG = {
  xs: { icon: 10, text: '9px', px: 'px-1.5 py-0.5', gap: 'gap-1'   },
  sm: { icon: 12, text: '10px', px: 'px-2 py-1',     gap: 'gap-1.5' },
  md: { icon: 14, text: '11px', px: 'px-3 py-1.5',   gap: 'gap-2'   },
}

export function PremiumBadge({
  variant = 'pill',
  size    = 'sm',
  pulse   = false,
  className = '',
}: PremiumBadgeProps) {
  const s = SIZE_CONFIG[size]

  if (variant === 'icon') {
    return (
      <Crown
        size={s.icon}
        style={{ color: '#f59e0b' }}
        className={className}
      />
    )
  }

  if (variant === 'inline') {
    return (
      <span
        className={`inline-flex items-center ${s.gap} font-display font-bold tracking-wider ${className}`}
        style={{ color: '#f59e0b', fontSize: s.text }}
      >
        <Crown size={s.icon} />
        PREMIUM
      </span>
    )
  }

  if (variant === 'banner') {
    return (
      <div
        className={`flex items-center justify-center gap-2 w-full py-2 rounded-xl ${className}`}
        style={{
          background: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(245,158,11,0.05))',
          border:     '1px solid rgba(245,158,11,0.35)',
        }}
      >
        <Crown size={14} style={{ color: '#f59e0b' }} />
        <span className="font-display font-black text-xs tracking-widest"
          style={{ color: '#fde68a' }}>
          ZENITH PREMIUM
        </span>
        <Crown size={14} style={{ color: '#f59e0b' }} />
      </div>
    )
  }

  // Default: pill
  return (
    <motion.span
      animate={pulse ? { boxShadow: ['0 0 0px rgba(245,158,11,0)', '0 0 8px rgba(245,158,11,0.6)', '0 0 0px rgba(245,158,11,0)'] } : {}}
      transition={{ duration: 2, repeat: Infinity }}
      className={`inline-flex items-center ${s.gap} ${s.px} rounded-full font-display font-bold tracking-wider ${className}`}
      style={{
        background: 'rgba(245,158,11,0.12)',
        border:     '1px solid rgba(245,158,11,0.4)',
        color:      '#f59e0b',
        fontSize:   s.text,
      }}
    >
      <Crown size={s.icon} />
      PREMIUM
    </motion.span>
  )
}
