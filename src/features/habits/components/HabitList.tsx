'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, ChevronDown } from 'lucide-react'
import { HabitRow } from './HabitRow'
import { AddHabitModal } from './AddHabitModal'
import { EditHabitModal } from './EditHabitModal'
import { useHabits } from '../hooks/useHabits'
import { useHabitStore } from '@/stores/habitStore'
import { softDeleteHabit } from '../services/habitService'
import { useUserStore } from '@/stores/userStore'
import type { HabitWithLog } from '@/types'

// ═══════════════════════════════════════════════════════════════
//  HabitList — Categorised habit list with animated rows
// ═══════════════════════════════════════════════════════════════

const CATEGORY_META: Record<string, { label: string; icon: string; order: number }> = {
  morning:  { label: 'Morning',  icon: '🌅', order: 0 },
  prayers:  { label: 'Prayers',  icon: '🤲', order: 1 },
  health:   { label: 'Health',   icon: '💪', order: 2 },
  learning: { label: 'Learning', icon: '📚', order: 3 },
  evening:  { label: 'Evening',  icon: '🌙', order: 4 },
  custom:   { label: 'Custom',   icon: '⭐', order: 5 },
}

function HabitCategorySection({
  category, habits, onToggle, onDelete, onEdit
}: {
  category: string
  habits: HabitWithLog[]
  onToggle: (id: string, completed: boolean) => void
  onDelete: (id: string) => void
  onEdit?: (habit: HabitWithLog) => void
}) {
  const [collapsed, setCollapsed] = useState(false)
  const meta = CATEGORY_META[category] || { label: category, icon: '📌', order: 99 }
  const doneCount = habits.filter(h => h.completed_today).length

  return (
    <div>
      {/* Category header */}
      <button
        onClick={() => setCollapsed(c => !c)}
        className="flex items-center gap-2 w-full py-2 px-1 mb-2 group"
      >
        <span className="text-base">{meta.icon}</span>
        <span
          className="font-display font-bold text-xs tracking-[0.15em] flex-1 text-left"
          style={{ color: 'var(--color-text-muted)' }}
        >
          {meta.label.toUpperCase()}
        </span>
        <span
          className="text-xs font-mono"
          style={{ color: doneCount === habits.length ? '#22c55e' : 'var(--color-text-faint)' }}
        >
          {doneCount}/{habits.length}
        </span>
        <motion.div
          animate={{ rotate: collapsed ? -90 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown
            size={14}
            style={{ color: 'var(--color-text-faint)' }}
          />
        </motion.div>
      </button>

      {/* Habit rows */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-2 mb-4">
              {habits.map((habit, i) => (
                <motion.div
                  key={habit.id}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.3 }}
                >
                  <HabitRow
                    habit={habit}
                    onToggle={onToggle}
                    onDelete={onDelete}
                    onEdit={onEdit}
                    isToday={true}
                  />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function HabitList({ onAddHabit }: { onAddHabit?: () => void }) {
  const { user } = useUserStore()
  const { habits, isLoading, toggle } = useHabits()
  const { removeHabit } = useHabitStore()
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingHabit, setEditingHabit] = useState<HabitWithLog | null>(null)

  const openAdd = () => { onAddHabit ? onAddHabit() : setShowAddModal(true) }

  // Group habits by category
  const grouped = habits.reduce<Record<string, HabitWithLog[]>>((acc, h) => {
    const cat = h.category || 'custom'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(h)
    return acc
  }, {})

  const sortedCategories = Object.keys(grouped).sort((a, b) => {
    const orderA = CATEGORY_META[a]?.order ?? 99
    const orderB = CATEGORY_META[b]?.order ?? 99
    return orderA - orderB
  })

  const handleDelete = async (habitId: string) => {
    if (!user?.id) return
    removeHabit(habitId)
    await softDeleteHabit(user.id, habitId)
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-14 rounded-xl animate-pulse"
            style={{ background: 'var(--color-surface)' }} />
        ))}
      </div>
    )
  }

  if (habits.length === 0) {
    return (
      <>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4 py-10 text-center">
          <span className="text-4xl">⚡</span>
          <div>
            <p className="font-display font-bold text-sm text-glow">No habits yet</p>
            <p className="text-zenith-muted text-xs mt-1">Add your first habit to get started</p>
          </div>
          <button onClick={openAdd} className="btn-primary px-6 py-2.5 text-sm">
            Add Habit
          </button>
        </motion.div>
        <AnimatePresence>
          {showAddModal && (
            <AddHabitModal onClose={() => setShowAddModal(false)} />
          )}
        </AnimatePresence>
      </>
    )
  }

  return (
    <>
      <div className="flex flex-col">
        {sortedCategories.map(cat => (
          <HabitCategorySection
            key={cat}
            category={cat}
            habits={grouped[cat]}
            onToggle={toggle}
            onDelete={handleDelete}
            onEdit={setEditingHabit}
          />
        ))}

        {/* Add habit button */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-3 rounded-xl mt-1 transition-all duration-200 active:scale-98"
          style={{ background: 'transparent', border: '1px dashed var(--color-border)', color: 'var(--color-text-faint)' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-border-glow)'; e.currentTarget.style.color = 'var(--color-primary)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-text-faint)' }}
        >
          <Plus size={15} />
          <span className="text-sm font-semibold font-display tracking-wide">Add Habit</span>
        </motion.button>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showAddModal && (
          <AddHabitModal onClose={() => setShowAddModal(false)} />
        )}
        {editingHabit && (
          <EditHabitModal
            habit={editingHabit}
            onClose={() => setEditingHabit(null)}
          />
        )}
      </AnimatePresence>
    </>
  )
}
