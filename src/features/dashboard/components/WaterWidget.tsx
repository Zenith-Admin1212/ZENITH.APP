'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Minus, Droplets } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useUserStore } from '@/stores/userStore'
import { format } from 'date-fns'

// ═══════════════════════════════════════════════════════════════
//  WaterWidget — Embedded water tracker
//  Tap +/- to log water intake. Shows fill animation.
// ═══════════════════════════════════════════════════════════════

const QUICK_ADD = [150, 250, 350, 500]

export function WaterWidget() {
  const { user } = useUserStore()
  const goal = user?.water_goal_ml ?? 2000
  const [current, setCurrent] = useState(0)
  const [saving, setSaving] = useState(false)
  const today = format(new Date(), 'yyyy-MM-dd')

  // Load today's water log
  useEffect(() => {
    if (!user?.id) return
    supabase
      .from('water_logs')
      .select('amount_ml')
      .eq('user_id', user.id)
      .eq('date', today)
      .single()
      .then(({ data }) => {
        if (data) setCurrent(data.amount_ml)
      })
  }, [user?.id, today])

  const pct = Math.min(Math.round((current / goal) * 100), 100)

  const logWater = async (delta: number) => {
    if (!user?.id || saving) return
    const newAmount = Math.max(0, Math.min(current + delta, goal * 1.5))
    setCurrent(newAmount)
    setSaving(true)
    try {
      await supabase.from('water_logs').upsert(
        {
          user_id: user.id,
          date: today,
          amount_ml: newAmount,
          entries: [{ time: new Date().toISOString(), amount_ml: delta }],
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,date' }
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="card flex flex-col gap-3"
      style={{ background: 'linear-gradient(135deg, rgba(96,165,250,0.06) 0%, var(--color-surface) 100%)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Droplets size={16} style={{ color: '#60a5fa' }} />
          <span className="font-display font-bold text-sm tracking-wider" style={{ color: '#60a5fa' }}>
            HYDRATION
          </span>
        </div>
        <span className="font-display font-black text-sm" style={{ color: pct >= 100 ? '#22c55e' : '#60a5fa' }}>
          {pct}%
        </span>
      </div>

      {/* Fill bar */}
      <div
        className="relative h-6 rounded-full overflow-hidden"
        style={{ background: 'var(--color-surface-active)' }}
      >
        <motion.div
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            background: 'linear-gradient(90deg, #3b82f6, #60a5fa)',
            boxShadow: '0 0 12px rgba(96,165,250,0.5)',
          }}
        />
        {/* Water ripple effect */}
        <motion.div
          animate={{ x: ['0%', '100%', '0%'] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute inset-y-0"
          style={{
            width: '20%',
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)',
            left: 0,
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className="font-display font-bold text-xs"
            style={{ color: pct > 40 ? 'white' : '#60a5fa', mixBlendMode: 'normal' }}
          >
            {current}ml / {goal}ml
          </span>
        </div>
      </div>

      {/* Quick add buttons */}
      <div className="flex items-center gap-1.5">
        {QUICK_ADD.map(amount => (
          <button
            key={amount}
            onClick={() => logWater(amount)}
            disabled={saving}
            className="flex-1 py-1.5 rounded-lg text-xs font-bold font-display transition-all active:scale-90 disabled:opacity-50"
            style={{
              background: 'rgba(96,165,250,0.12)',
              border: '1px solid rgba(96,165,250,0.25)',
              color: '#60a5fa',
            }}
          >
            +{amount}
          </button>
        ))}
        <button
          onClick={() => logWater(-150)}
          disabled={saving || current === 0}
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-all active:scale-90 disabled:opacity-30"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        >
          <Minus size={12} style={{ color: 'var(--color-text-muted)' }} />
        </button>
      </div>
    </div>
  )
}
