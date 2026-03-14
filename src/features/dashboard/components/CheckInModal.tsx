'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Loader2 } from 'lucide-react'
import { supabase }     from '@/lib/supabase/client'
import { useUserStore } from '@/stores/userStore'
import { useXPEngine }  from '@/features/xp/hooks/useXPEngine'
import { XP_CONFIG }    from '@/lib/utils/constants'
import { format }       from 'date-fns'

// ═══════════════════════════════════════════════════════════════
//  CheckInModal — Daily wellness check-in
//  FIX (BUG-1 + BUG-6): XP now routes through useXPEngine.
//  grantXP fetches fresh XP from DB → no stale-read race.
//  Bonus XP for sleep ≥ 8hrs and focus ≥ 8hrs.
// ═══════════════════════════════════════════════════════════════

interface CheckInModalProps {
  onClose: () => void
  onSuccess?: () => void
}

const METRICS = [
  { key: 'sleep',  label: 'Sleep',  icon: '😴', unit: 'hrs',  min: 0,  max: 12, step: 0.5, bonusAt: 8, color: '#60a5fa' },
  { key: 'focus',  label: 'Focus',  icon: '🎯', unit: 'hrs',  min: 0,  max: 12, step: 0.5, bonusAt: 8, color: '#a78bfa' },
  { key: 'mood',   label: 'Mood',   icon: '😊', unit: '/10', min: 1,  max: 10, step: 1,   bonusAt: null, color: '#f97316' },
  { key: 'energy', label: 'Energy', icon: '⚡', unit: '/10', min: 1,  max: 10, step: 1,   bonusAt: null, color: '#f59e0b' },
  { key: 'stress', label: 'Stress', icon: '😰', unit: '/10', min: 1,  max: 10, step: 1,   bonusAt: null, color: '#ef4444' },
] as const

const MOOD_LABELS: Record<number, string> = {
  1: '😞', 2: '😟', 3: '😐', 4: '🙂', 5: '😊',
  6: '😄', 7: '🤩', 8: '⚡', 9: '🔥', 10: '👑',
}

export function CheckInModal({ onClose, onSuccess }: CheckInModalProps) {
  const { user }    = useUserStore()
  const { grantXP } = useXPEngine()
  const [saving, setSaving] = useState(false)
  const [notes, setNotes]   = useState('')

  const [values, setValues] = useState<Record<string, number>>({
    sleep: 7, focus: 6, mood: 7, energy: 7, stress: 3,
  })

  const setValue = (key: string, val: number) =>
    setValues(prev => ({ ...prev, [key]: val }))

  const handleSave = async () => {
    if (!user?.id) return
    setSaving(true)
    const today = format(new Date(), 'yyyy-MM-dd')

    try {
      // 1. Upsert check-in
      await supabase.from('daily_checkins').upsert(
        {
          user_id:    user.id,
          date:       today,
          sleep:      values.sleep,
          focus:      values.focus,
          mood:       values.mood,
          energy:     values.energy,
          stress:     values.stress,
          notes:      notes.trim() || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,date' }
      )

      // 2. XP bonuses — each bonus granted separately so transactions are
      //    labelled correctly and fresh XP is fetched between calls.
      if (values.sleep >= 8) {
        await grantXP(XP_CONFIG.SLEEP_BONUS, 'sleep_bonus', 'Sleep bonus — 8+ hours')
      }
      if (values.focus >= 8) {
        await grantXP(XP_CONFIG.FOCUS_BONUS, 'focus_bonus', 'Focus bonus — 8+ hours')
      }

      onSuccess?.()
      onClose()
    } catch (err) {
      console.error('[CheckIn]', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-end justify-center px-4 pb-4"
      style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', stiffness: 380, damping: 38 }}
        className="w-full max-w-lg rounded-2xl overflow-hidden"
        style={{
          background: 'var(--color-bg-secondary)',
          border: '1px solid var(--color-border-glow)',
          boxShadow: 'var(--glow-md)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid var(--color-border)' }}>
          <div>
            <h2 className="font-display font-bold text-base text-glow tracking-wider">DAILY CHECK-IN</h2>
            <p className="text-xs text-zenith-muted mt-0.5">Log your wellness for today</p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'var(--color-surface)' }}>
            <X size={16} style={{ color: 'var(--color-text-muted)' }} />
          </button>
        </div>

        {/* Metrics */}
        <div className="px-5 py-4 flex flex-col gap-5 max-h-96 overflow-y-auto custom-scroll">
          {METRICS.map(metric => (
            <div key={metric.key}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-base">{metric.icon}</span>
                  <span className="font-display font-semibold text-sm tracking-wide">{metric.label}</span>
                  {metric.key === 'mood' && (
                    <span className="text-lg">{MOOD_LABELS[values.mood] || '😊'}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-display font-black text-base"
                    style={{ color: metric.color, textShadow: `0 0 12px ${metric.color}60` }}>
                    {values[metric.key]}{metric.unit}
                  </span>
                  {metric.bonusAt && values[metric.key] >= metric.bonusAt && (
                    <span className="text-2xs px-1.5 py-0.5 rounded font-bold font-display"
                      style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)', fontSize: '9px' }}>
                      +5 XP
                    </span>
                  )}
                </div>
              </div>
              <input
                type="range"
                min={metric.min}
                max={metric.max}
                step={metric.step}
                value={values[metric.key]}
                onChange={e => setValue(metric.key, parseFloat(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, ${metric.color} 0%, ${metric.color} ${
                    ((values[metric.key] - metric.min) / (metric.max - metric.min)) * 100
                  }%, var(--color-surface-active) ${
                    ((values[metric.key] - metric.min) / (metric.max - metric.min)) * 100
                  }%, var(--color-surface-active) 100%)`,
                  accentColor: metric.color,
                }}
              />
            </div>
          ))}

          {/* Notes */}
          <div>
            <label className="font-display font-semibold text-xs tracking-widest text-zenith-muted uppercase block mb-2">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="How was your day? Any thoughts..."
              rows={2}
              className="input-field resize-none text-sm"
              style={{ fontFamily: 'var(--font-body)' }}
              maxLength={280}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 flex gap-3" style={{ borderTop: '1px solid var(--color-border)' }}>
          <button onClick={onClose} className="btn-ghost flex-1">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">
            {saving ? <Loader2 size={16} className="animate-spin" /> : 'Save Check-In ⚡'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
