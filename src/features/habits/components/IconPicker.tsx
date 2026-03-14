'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Search } from 'lucide-react'

// ═══════════════════════════════════════════════════════════════
//  IconPicker — Searchable emoji grid for habit icons
// ═══════════════════════════════════════════════════════════════

const ICON_GROUPS = {
  'Health': ['💪','🏃','🧘','🚴','🏋️','🤸','🥗','💊','🩺','❤️','🫁','🦷','🚿','😴','🧠'],
  'Mind':   ['📚','✍️','🎯','🧩','💡','🔬','🎓','📖','🗒️','💭','🎧','🖊️','📝','🔭','🧪'],
  'Faith':  ['🤲','🌙','⭐','📿','🕌','☪️','✨','🙏','☀️','🌟','💫','🕯️','📖','🌺','🌸'],
  'Focus':  ['⏰','⚡','🎯','🔥','💎','⚔️','🛡️','🏆','👑','🚀','🌊','🏔️','🦁','🐺','🦅'],
  'Life':   ['🌱','💧','🌿','🍎','🥤','☕','🌅','🌙','🏠','👨‍👩‍👧','💰','🎵','🎨','📷','🌍'],
  'Custom': ['⭐','💫','✨','🌟','❤️','🧡','💛','💚','💙','💜','🖤','🤍','🎭','🃏','🎲'],
}

const ALL_ICONS = Object.values(ICON_GROUPS).flat()

interface IconPickerProps {
  value: string
  onChange: (icon: string) => void
}

export function IconPicker({ value, onChange }: IconPickerProps) {
  const [search, setSearch] = useState('')
  const [activeGroup, setActiveGroup] = useState<string | 'all'>('all')

  const displayIcons = search
    ? ALL_ICONS  // search doesn't filter by name (emojis), shows all
    : activeGroup === 'all'
      ? ALL_ICONS
      : ICON_GROUPS[activeGroup as keyof typeof ICON_GROUPS] ?? ALL_ICONS

  return (
    <div className="flex flex-col gap-3">
      {/* Selected preview */}
      <div className="flex items-center gap-3">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
          style={{
            background: 'var(--color-surface-active)',
            border: '2px solid var(--color-border-glow)',
            boxShadow: 'var(--glow-sm)',
          }}
        >
          {value || '⚡'}
        </div>
        <p className="text-sm text-zenith-muted">Selected icon</p>
      </div>

      {/* Category tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 custom-scroll">
        {(['all', ...Object.keys(ICON_GROUPS)] as string[]).map(g => (
          <button
            key={g}
            onClick={() => setActiveGroup(g)}
            className="flex-shrink-0 px-3 py-1 rounded-lg text-xs font-semibold font-display tracking-wide transition-all"
            style={{
              background: activeGroup === g ? 'var(--color-surface-active)' : 'var(--color-surface)',
              border: `1px solid ${activeGroup === g ? 'var(--color-primary)' : 'var(--color-border)'}`,
              color: activeGroup === g ? 'var(--color-primary)' : 'var(--color-text-muted)',
              boxShadow: activeGroup === g ? 'var(--glow-sm)' : 'none',
            }}
          >
            {g === 'all' ? 'All' : g}
          </button>
        ))}
      </div>

      {/* Icon grid */}
      <div
        className="grid gap-1.5 max-h-40 overflow-y-auto custom-scroll p-1"
        style={{ gridTemplateColumns: 'repeat(10, minmax(0, 1fr))' }}
      >
        {displayIcons.map((icon, i) => (
          <motion.button
            key={`${icon}-${i}`}
            whileTap={{ scale: 0.85 }}
            onClick={() => onChange(icon)}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-xl transition-all duration-100"
            style={{
              background: value === icon ? 'var(--color-surface-active)' : 'var(--color-surface)',
              border: `1px solid ${value === icon ? 'var(--color-primary)' : 'var(--color-border)'}`,
              boxShadow: value === icon ? 'var(--glow-sm)' : 'none',
              transform: value === icon ? 'scale(1.15)' : 'scale(1)',
            }}
          >
            {icon}
          </motion.button>
        ))}
      </div>
    </div>
  )
}
