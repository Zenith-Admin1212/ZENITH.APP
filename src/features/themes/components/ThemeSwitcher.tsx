'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, CheckCircle2, Loader2, Crown, Sparkles } from 'lucide-react'
import { useTheme }        from '@/lib/themes/theme-provider'
import { useUserStore }    from '@/stores/userStore'
import { usePremium }       from '@/features/premium/hooks/usePremium'
import { UpgradeModal }     from '@/features/premium/components/UpgradeModal'
import { THEMES, THEME_ORDER } from '@/lib/themes/theme-config'
import { updateUserTheme } from '../services/themeService'
import type { ThemeId }    from '@/types'

// ═══════════════════════════════════════════════════════════════
//  ThemeSwitcher
//
//  Rules:
//  - Free users: dark-cyber only; premium themes blurred + locked
//  - Premium users: all 5 themes selectable
//  - 1200ms cooldown between switches (enforced in ThemeProvider)
//  - DB sync fires after successful local switch
// ═══════════════════════════════════════════════════════════════

interface ThemeSwitcherProps {
  compact?: boolean   // compact mode for sidebar embed
}

export function ThemeSwitcher({ compact = false }: ThemeSwitcherProps) {
  const { activeTheme, switchTheme, isTransitioning } = useTheme()
  const { user, updateUser }                          = useUserStore()
  const [saving, setSaving]   = useState<ThemeId | null>(null)
  const [justSet, setJustSet] = useState<ThemeId | null>(null)

  const { isPremium } = usePremium()

  const [showUpgrade, setShowUpgrade] = useState(false)

  const handleSelect = async (themeId: ThemeId) => {
    const theme = THEMES[themeId]

    // Free users can't pick premium themes — open upgrade modal
    if (theme.tier === 'premium' && !isPremium) {
      setShowUpgrade(true)
      return
    }
    if (themeId === activeTheme || isTransitioning || saving) return

    setSaving(themeId)

    // 1. Instant local switch
    switchTheme(themeId)

    // 2. DB sync (optimistic — won't block UI)
    try {
      if (user?.id) {
        await updateUserTheme(user.id, themeId)
        updateUser({ active_theme: themeId })
      }
    } catch (err) {
      console.warn('[ThemeSwitcher] DB sync failed, local switch preserved:', err)
    }

    setJustSet(themeId)
    setSaving(null)
    setTimeout(() => setJustSet(null), 2000)
  }

  return (
    <>
    <div className="flex flex-col gap-3">
      {/* Section header */}
      {!compact && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={14} style={{ color: 'var(--color-primary)' }} />
            <span className="font-display font-bold text-xs tracking-widest"
              style={{ color: 'var(--color-text-muted)' }}>
              THEMES
            </span>
          </div>
          {!isPremium && (
            <span className="flex items-center gap-1 text-2xs px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b',
                       border: '1px solid rgba(245,158,11,0.3)', fontSize: '9px' }}>
              <Crown size={9} /> UPGRADE FOR MORE
            </span>
          )}
        </div>
      )}

      {/* Theme cards */}
      <div className={`grid gap-3 ${compact ? 'grid-cols-5' : 'grid-cols-1'}`}>
        {THEME_ORDER.map(themeId => {
          const theme     = THEMES[themeId]
          const isActive  = activeTheme === themeId
          const isLocked  = theme.tier === 'premium' && !isPremium
          const isSaving  = saving === themeId
          const wasJustSet = justSet === themeId

          if (compact) {
            // Compact mode: dot buttons only
            return (
              <motion.button
                key={themeId}
                whileTap={!isLocked ? { scale: 0.85 } : {}}
                onClick={() => handleSelect(themeId)}
                className="relative flex items-center justify-center"
                title={theme.name}
              >
                <div
                  className="w-9 h-9 rounded-xl transition-all duration-200"
                  style={{
                    background: `linear-gradient(135deg, ${theme.gradientFrom}, ${theme.gradientTo})`,
                    border:  `2px solid ${isActive ? 'white' : 'transparent'}`,
                    boxShadow: isActive ? `0 0 14px ${theme.previewColor}80` : 'none',
                    filter: isLocked ? 'grayscale(0.7) brightness(0.5)' : 'none',
                    opacity: isLocked ? 0.6 : 1,
                  }}
                />
                {isLocked && (
                  <Lock size={10} className="absolute"
                    style={{ color: '#94a3b8' }} />
                )}
                {isActive && (
                  <motion.div
                    layoutId="active-dot"
                    className="absolute -bottom-1.5 w-1 h-1 rounded-full"
                    style={{ background: theme.previewColor }}
                  />
                )}
              </motion.button>
            )
          }

          // Full card mode
          return (
            <motion.button
              key={themeId}
              layout
              whileTap={!isLocked ? { scale: 0.985 } : {}}
              onClick={() => handleSelect(themeId)}
              className="relative w-full flex items-center gap-4 p-4 rounded-2xl text-left overflow-hidden transition-all"
              style={{
                background:  isActive
                  ? `linear-gradient(135deg, ${theme.gradientFrom}20 0%, ${theme.gradientTo}10 100%)`
                  : 'var(--color-surface)',
                border:      `1px solid ${isActive ? theme.previewColor + '60' : 'var(--color-border)'}`,
                boxShadow:   isActive ? `0 0 20px ${theme.previewColor}25` : 'none',
                cursor:      isLocked ? 'default' : 'pointer',
              }}
            >
              {/* Blur overlay for locked premium themes */}
              {isLocked && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-2xl"
                  style={{ backdropFilter: 'blur(3px)', background: 'rgba(0,0,0,0.45)' }}>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full"
                    style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.4)' }}>
                    <Crown size={12} style={{ color: '#f59e0b' }} />
                    <span className="text-xs font-bold" style={{ color: '#f59e0b' }}>PREMIUM</span>
                  </div>
                </div>
              )}

              {/* Color swatch */}
              <div
                className="w-12 h-12 rounded-xl flex-shrink-0 relative overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, ${theme.gradientFrom}, ${theme.gradientTo})`,
                  boxShadow: isActive ? `0 0 16px ${theme.previewColor}60` : 'none',
                }}
              >
                {/* Mini particle preview */}
                <div className="absolute inset-0 opacity-30">
                  {theme.particleType === 'grid' && (
                    <div style={{
                      backgroundImage: `linear-gradient(${theme.previewColor}40 1px, transparent 1px),
                                        linear-gradient(90deg, ${theme.previewColor}40 1px, transparent 1px)`,
                      backgroundSize: '6px 6px',
                      width: '100%', height: '100%',
                    }} />
                  )}
                  {theme.particleType === 'stars' && (
                    <div className="w-full h-full" style={{
                      backgroundImage: `radial-gradient(circle, white 1px, transparent 1px)`,
                      backgroundSize: '8px 8px',
                    }} />
                  )}
                  {theme.particleType === 'scanline' && (
                    <div className="w-full h-full" style={{
                      backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 3px, ${theme.previewColor}50 3px, ${theme.previewColor}50 4px)`,
                    }} />
                  )}
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-display font-bold text-sm" style={{
                    color: isActive ? theme.previewColor : 'var(--color-text)',
                  }}>
                    {theme.name}
                  </p>
                  {theme.tier === 'free' && (
                    <span className="text-2xs px-1.5 py-0.5 rounded"
                      style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e',
                               border: '1px solid rgba(34,197,94,0.3)', fontSize: '9px' }}>
                      FREE
                    </span>
                  )}
                </div>
                <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--color-text-faint)' }}>
                  {theme.description}
                </p>
                <p className="text-2xs mt-1" style={{ color: 'var(--color-text-faint)', fontSize: '9px', letterSpacing: '0.1em' }}>
                  {theme.layout.cardStyle.toUpperCase()} · {theme.layout.animationStyle.toUpperCase()}
                </p>
              </div>

              {/* Status */}
              <div className="flex-shrink-0">
                {isSaving ? (
                  <Loader2 size={16} className="animate-spin" style={{ color: theme.previewColor }} />
                ) : wasJustSet ? (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                    <CheckCircle2 size={18} style={{ color: '#22c55e' }} />
                  </motion.div>
                ) : isActive ? (
                  <motion.div
                    className="w-4 h-4 rounded-full"
                    animate={{ boxShadow: [`0 0 6px ${theme.previewColor}`, `0 0 12px ${theme.previewColor}`, `0 0 6px ${theme.previewColor}`] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    style={{ background: theme.previewColor }}
                  />
                ) : null}
              </div>
            </motion.button>
          )
        })}
      </div>

      {/* Transition indicator */}
      <AnimatePresence>
        {isTransitioning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center gap-2 py-2"
          >
            <Loader2 size={12} className="animate-spin" style={{ color: 'var(--color-primary)' }} />
            <span className="text-xs text-zenith-faint font-display">Applying theme...</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    {/* Upgrade modal for locked themes */}
    <AnimatePresence>
      {showUpgrade && (
        <UpgradeModal
          triggerFeature="Premium Themes"
          onClose={() => setShowUpgrade(false)}
        />
      )}
    </AnimatePresence>
    </>
  )
}