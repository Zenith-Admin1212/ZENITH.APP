'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BarChart2, Download, Crown, Loader2, RefreshCw } from 'lucide-react'
import { useAnalyticsData }   from '../hooks/useAnalyticsData'
import { DisciplineRing }     from './DisciplineRing'
import { HabitHeatmap }       from './HabitHeatmap'
import { TrendChart, type TrendMetric } from './TrendChart'
import { downloadAnalyticsReport }      from '../utils/exportReport'
import { useUserStore }   from '@/stores/userStore'
import { useTheme }       from '@/lib/themes/theme-provider'
import { THEMES }         from '@/lib/themes/theme-config'
import { usePremium }     from '@/features/premium/hooks/usePremium'
import { UpgradeModal }   from '@/features/premium/components/UpgradeModal'

// ═══════════════════════════════════════════════════════════════
//  AnalyticsDashboard — Phase 8 analytics page
// ═══════════════════════════════════════════════════════════════

const TREND_TABS: { id: TrendMetric; label: string; icon: string }[] = [
  { id: 'completionPct',    label: 'Habits',  icon: '✅' },
  { id: 'pomodoroSessions', label: 'Focus',   icon: '⏱️' },
  { id: 'moodScore',        label: 'Mood',    icon: '😊' },
  { id: 'sleepScore',       label: 'Sleep',   icon: '😴' },
  { id: 'waterMl',          label: 'Water',   icon: '💧' },
]

export function AnalyticsDashboard() {
  const { user }              = useUserStore()
  const { activeTheme }       = useTheme()
  const { summary, disciplineResult, days, isLoading, isError, refetch } = useAnalyticsData()
  const [activeTrend, setActiveTrend] = useState<TrendMetric>('completionPct')
  const [exporting, setExporting]     = useState(false)

  const { isPremium } = usePremium()
  const [showUpgrade, setShowUpgrade] = useState(false)
  const theme      = THEMES[activeTheme]

  // 30-day summary stats for the top bar
  const topStats = summary
    ? [
        { icon: '✅', label: 'Avg Complete', value: `${summary.avgCompletionPct}%` },
        { icon: '⭐', label: 'Perfect Days', value: summary.perfectDays },
        { icon: '🍅', label: 'Pomodoros',    value: summary.totalPomodoroSessions },
        { icon: '🔥', label: 'Active Days',  value: summary.activeDays },
      ]
    : []

  const handleExport = async () => {
    if (!isPremium) { setShowUpgrade(true); return }
    if (!summary || !disciplineResult || exporting) return
    setExporting(true)
    try {
      // Resolve theme primary color
      const primary = getComputedStyle(document.documentElement)
        .getPropertyValue('--color-primary').trim() || theme.previewColor

      await downloadAnalyticsReport(
        summary,
        disciplineResult,
        user?.username ?? 'Zenith User',
        primary,
        theme.shareCardBg,
      )
    } catch (err) {
      console.error('Export failed:', err)
    } finally {
      setExporting(false)
    }
  }

  return (
    <>
    <div className="flex flex-col pb-10 max-w-lg mx-auto gap-5 px-4 py-4">

      {/* ── Page header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart2 size={17} style={{ color: 'var(--color-primary)' }} />
          <h1 className="font-display font-black text-base tracking-widest text-glow">
            ANALYTICS
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all active:scale-90"
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
          >
            <RefreshCw size={13} style={{ color: 'var(--color-text-faint)' }} />
          </button>

          {/* Export button — premium gated */}
          <button
            onClick={handleExport}
            disabled={!isPremium || exporting || isLoading}
            title={isPremium ? 'Export analytics report' : 'Premium feature'}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold font-display tracking-wide transition-all active:scale-95 disabled:opacity-50"
            style={{
              background: isPremium ? 'var(--color-surface-active)' : 'var(--color-surface)',
              border:     `1px solid ${isPremium ? 'var(--color-border-glow)' : 'var(--color-border)'}`,
              color:      isPremium ? 'var(--color-primary)' : 'var(--color-text-faint)',
            }}
          >
            {exporting
              ? <Loader2 size={12} className="animate-spin" />
              : isPremium
                ? <Download size={12} />
                : <Crown size={12} style={{ color: '#f59e0b' }} />
            }
            <span>{isPremium ? 'Export' : 'Premium'}</span>
          </button>
        </div>
      </div>

      {/* ── Error state ── */}
      {isError && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)' }}>
          <span className="text-sm">⚠️</span>
          <p className="text-sm" style={{ color: '#fca5a5' }}>
            Failed to load analytics. Tap refresh to retry.
          </p>
        </div>
      )}

      {/* ── 30-day summary bar ── */}
      {(isLoading || topStats.length > 0) && (
        <div className="grid grid-cols-4 gap-2">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-16 rounded-xl animate-pulse"
                  style={{ background: 'var(--color-surface)' }} />
              ))
            : topStats.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="flex flex-col items-center py-3 rounded-xl gap-1"
                  style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
                >
                  <span className="text-base">{stat.icon}</span>
                  <span className="font-display font-black text-sm text-glow leading-none">
                    {stat.value}
                  </span>
                  <span className="text-2xs text-zenith-faint text-center"
                    style={{ fontSize: '8px', letterSpacing: '0.08em' }}>
                    {stat.label.toUpperCase()}
                  </span>
                </motion.div>
              ))
          }
        </div>
      )}

      {/* ── Discipline ring (hero) ── */}
      <DisciplineRing result={disciplineResult} isLoading={isLoading} />

      {/* ── 30-day heatmap ── */}
      <HabitHeatmap days={days} isLoading={isLoading} />

      {/* ── Trend charts ── */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="font-display font-bold text-xs tracking-widest"
            style={{ color: 'var(--color-text-muted)' }}>
            TREND ANALYSIS
          </span>
        </div>

        {/* Chart metric tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 custom-scroll">
          {TREND_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTrend(tab.id)}
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold font-display tracking-wide transition-all"
              style={{
                background: activeTrend === tab.id ? 'var(--color-surface-active)' : 'var(--color-surface)',
                border:     `1px solid ${activeTrend === tab.id ? 'var(--color-primary)' : 'var(--color-border)'}`,
                color:      activeTrend === tab.id ? 'var(--color-primary)' : 'var(--color-text-muted)',
                boxShadow:  activeTrend === tab.id ? 'var(--glow-sm)' : 'none',
              }}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Active chart */}
        <TrendChart
          key={activeTrend}
          days={days}
          metric={activeTrend}
          isLoading={isLoading}
        />

        {/* All-charts mode — show all 5 when scrolling down */}
        {!isLoading && days.length > 0 && (
          <div className="flex flex-col gap-3 mt-1">
            {TREND_TABS.filter(t => t.id !== activeTrend).map(tab => (
              <TrendChart
                key={tab.id}
                days={days}
                metric={tab.id}
                isLoading={false}
              />
            ))}
          </div>
        )}
      </div>

      {/* Premium export CTA for free users */}
      {!isPremium && !isLoading && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 px-4 py-3 rounded-2xl"
          style={{
            background: 'linear-gradient(135deg, rgba(245,158,11,0.08), transparent)',
            border:     '1px solid rgba(245,158,11,0.25)',
          }}
        >
          <Crown size={18} style={{ color: '#f59e0b', flexShrink: 0 }} />
          <div className="flex-1">
            <p className="font-display font-bold text-xs tracking-wide" style={{ color: '#fde68a' }}>
              Export your analytics
            </p>
            <p className="text-xs text-zenith-faint mt-0.5">
              Download a full report image with all your stats. Premium feature.
            </p>
          </div>
          <button className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold font-display tracking-wide transition-all"
            style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.4)', color: '#f59e0b' }}>
            Upgrade
          </button>
        </motion.div>
      )}
    </div>
    {/* Upgrade modal */}
    <AnimatePresence>
      {showUpgrade && (
        <UpgradeModal
          triggerFeature="Analytics Export"
          onClose={() => setShowUpgrade(false)}
        />
      )}
    </AnimatePresence>
    </>
  )
}