'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Loader2, ChevronDown } from 'lucide-react'
import { IconPicker } from './IconPicker'
import { useUserStore } from '@/stores/userStore'
import { useQueryClient } from '@tanstack/react-query'
import { createHabit } from '../services/habitService'
import { useHabitStore } from '@/stores/habitStore'
import { format } from 'date-fns'
import type { HabitWithLog } from '@/types'

// ═══════════════════════════════════════════════════════════════
//  AddHabitModal — Create a new habit
// ═══════════════════════════════════════════════════════════════

const DEFAULT_CATEGORIES = [
  { id: 'morning',  label: 'Morning',  icon: '🌅' },
  { id: 'prayers',  label: 'Prayers',  icon: '🤲' },
  { id: 'health',   label: 'Health',   icon: '💪' },
  { id: 'learning', label: 'Learning', icon: '📚' },
  { id: 'evening',  label: 'Evening',  icon: '🌙' },
  { id: 'custom',   label: 'Custom',   icon: '⭐' },
]

interface AddHabitModalProps {
  onClose: () => void
  onSuccess?: () => void
}

export function AddHabitModal({ onClose, onSuccess }: AddHabitModalProps) {
  const { user } = useUserStore()
  const { habits, addHabit } = useHabitStore()
  const queryClient = useQueryClient()
  const today = format(new Date(), 'yyyy-MM-dd')

  const [name, setName] = useState('')
  const [icon, setIcon] = useState('⚡')
  const [category, setCategory] = useState('health')
  const [showIconPicker, setShowIconPicker] = useState(false)
  const [showCategoryPicker, setShowCategoryPicker] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectedCat = DEFAULT_CATEGORIES.find(c => c.id === category) || DEFAULT_CATEGORIES[2]

  const handleSave = async () => {
    if (!user?.id) return
    if (!name.trim()) { setError('Please enter a habit name'); return }
    if (name.trim().length < 2) { setError('Name must be at least 2 characters'); return }

    setError(null)
    setSaving(true)
    try {
      const newHabit = await createHabit(user.id, {
        name: name.trim(),
        icon,
        category,
        sort_order: habits.length,
      })

      // Add to Zustand store with empty log data
      const withLog: HabitWithLog = {
        ...newHabit,
        completed_today: false,
        last_7_days: Array(7).fill(false),
        current_streak: 0,
      }
      addHabit(withLog)

      // Invalidate query cache to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['habits', user.id, today] })

      onSuccess?.()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create habit')
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
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 380, damping: 38 }}
        className="w-full max-w-lg rounded-2xl overflow-hidden"
        style={{
          background: 'var(--color-bg-secondary)',
          border: '1px solid var(--color-border-glow)',
          boxShadow: 'var(--glow-md)',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 sticky top-0 z-10"
          style={{ background: 'var(--color-bg-secondary)', borderBottom: '1px solid var(--color-border)' }}>
          <div>
            <h2 className="font-display font-bold text-base text-glow tracking-wider">ADD HABIT</h2>
            <p className="text-xs text-zenith-muted mt-0.5">Create a new daily habit</p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'var(--color-surface)' }}>
            <X size={16} style={{ color: 'var(--color-text-muted)' }} />
          </button>
        </div>

        <div className="px-5 py-4 flex flex-col gap-5">
          {/* Name input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold tracking-widest text-zenith-muted uppercase font-display">
              Habit Name
            </label>
            <input
              type="text"
              value={name}
              onChange={e => { setName(e.target.value); setError(null) }}
              placeholder="e.g. Morning Walk, Read 30 mins..."
              autoFocus
              maxLength={48}
              className="input-field text-base"
            />
            <div className="flex justify-between">
              {error && <p className="text-xs" style={{ color: '#f87171' }}>{error}</p>}
              <p className="text-2xs text-zenith-faint ml-auto">{name.length}/48</p>
            </div>
          </div>

          {/* Icon row */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold tracking-widest text-zenith-muted uppercase font-display">
              Icon
            </label>
            <button
              onClick={() => setShowIconPicker(!showIconPicker)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all"
              style={{
                background: 'var(--color-surface)',
                border: `1px solid ${showIconPicker ? 'var(--color-primary)' : 'var(--color-border)'}`,
                boxShadow: showIconPicker ? 'var(--glow-sm)' : 'none',
              }}
            >
              <span className="text-2xl">{icon}</span>
              <span className="text-sm text-zenith-muted flex-1">
                {showIconPicker ? 'Choose an icon' : 'Tap to pick icon'}
              </span>
              <motion.div animate={{ rotate: showIconPicker ? 180 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronDown size={16} style={{ color: 'var(--color-text-faint)' }} />
              </motion.div>
            </button>

            <AnimatePresence>
              {showIconPicker && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div className="pt-2">
                    <IconPicker value={icon} onChange={(i) => { setIcon(i); setShowIconPicker(false) }} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Category */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold tracking-widest text-zenith-muted uppercase font-display">
              Category
            </label>
            <button
              onClick={() => setShowCategoryPicker(!showCategoryPicker)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all"
              style={{
                background: 'var(--color-surface)',
                border: `1px solid ${showCategoryPicker ? 'var(--color-primary)' : 'var(--color-border)'}`,
              }}
            >
              <span className="text-xl">{selectedCat.icon}</span>
              <span className="text-sm flex-1">{selectedCat.label}</span>
              <motion.div animate={{ rotate: showCategoryPicker ? 180 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronDown size={16} style={{ color: 'var(--color-text-faint)' }} />
              </motion.div>
            </button>

            <AnimatePresence>
              {showCategoryPicker && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    {DEFAULT_CATEGORIES.map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => { setCategory(cat.id); setShowCategoryPicker(false) }}
                        className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all"
                        style={{
                          background: category === cat.id ? 'var(--color-surface-active)' : 'var(--color-surface)',
                          border: `1px solid ${category === cat.id ? 'var(--color-primary)' : 'var(--color-border)'}`,
                          boxShadow: category === cat.id ? 'var(--glow-sm)' : 'none',
                        }}
                      >
                        <span className="text-lg">{cat.icon}</span>
                        <span className="text-sm font-semibold" style={{ color: category === cat.id ? 'var(--color-primary)' : 'var(--color-text)' }}>
                          {cat.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Preview */}
          {name.trim() && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl p-3 flex items-center gap-3"
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border-glow)' }}
            >
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-xl"
                style={{ background: 'var(--color-surface-active)', border: '2px solid var(--color-border-glow)' }}
              >
                {icon}
              </div>
              <div>
                <p className="font-semibold text-sm">{name.trim()}</p>
                <p className="text-xs text-zenith-faint">{selectedCat.icon} {selectedCat.label} · +15 XP daily</p>
              </div>
            </motion.div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 flex gap-3">
          <button onClick={onClose} className="btn-ghost flex-1">Cancel</button>
          <button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="btn-primary flex-1 flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <><Plus size={16} /> Add Habit</>}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
