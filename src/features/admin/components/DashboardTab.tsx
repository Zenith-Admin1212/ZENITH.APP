'use client'

import { StatCard, SectionHeader, LoadingSkeleton, A } from './AdminUI'
import type { AdminPlatformStats } from '@/types'

// ═══════════════════════════════════════════════════════════════
//  DashboardTab — platform metrics overview
// ═══════════════════════════════════════════════════════════════

interface DashboardTabProps {
  stats:     AdminPlatformStats | null
  isLoading: boolean
  onRefresh: () => void
}

export function DashboardTab({ stats, isLoading, onRefresh }: DashboardTabProps) {
  const cards = stats ? [
    { icon: '👥', label: 'Total Users',            value: stats.total_users.toLocaleString(),            color: A.cyan,    sub: `+${stats.new_users_this_week} this week` },
    { icon: '🟢', label: 'Active Today',            value: stats.active_users_today.toLocaleString(),     color: A.success  },
    { icon: '👑', label: 'Premium Users',           value: stats.premium_users.toLocaleString(),          color: A.gold     },
    { icon: '🏆', label: 'Active Challenges',       value: stats.active_challenges.toLocaleString(),      color: '#60a5fa'  },
    { icon: '💬', label: 'Community Posts',         value: stats.community_posts.toLocaleString(),        color: '#a855f7'  },
    { icon: '✅', label: 'Habits Done Today',       value: stats.habits_completed_today.toLocaleString(), color: A.success  },
    { icon: '📋', label: 'Total Active Habits',     value: stats.total_habits.toLocaleString(),           color: A.muted    },
    { icon: '🆕', label: 'New Users (7 days)',      value: stats.new_users_this_week.toLocaleString(),    color: A.warn     },
  ] : []

  return (
    <div className="flex flex-col gap-5">
      <SectionHeader
        title="Platform Overview"
        subtitle="Real-time platform health metrics"
        onRefresh={onRefresh}
      />

      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl animate-pulse"
              style={{ background: A.surface2 }} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {cards.map(c => (
            <StatCard key={c.label} {...c} />
          ))}
        </div>
      )}

      {/* Quick status row */}
      {stats && (
        <div className="flex flex-wrap gap-3 pt-2">
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl"
            style={{ background: A.surface, border: `1px solid ${A.border}` }}>
            <div className="w-2 h-2 rounded-full animate-pulse"
              style={{ background: A.success }} />
            <span className="text-xs font-semibold" style={{ color: A.success }}>
              System Online
            </span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl"
            style={{ background: A.surface, border: `1px solid ${A.border}` }}>
            <span className="text-xs" style={{ color: A.muted }}>
              Premium rate:
            </span>
            <span className="text-xs font-bold" style={{ color: A.gold }}>
              {stats.total_users > 0
                ? `${((stats.premium_users / stats.total_users) * 100).toFixed(1)}%`
                : '0%'}
            </span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl"
            style={{ background: A.surface, border: `1px solid ${A.border}` }}>
            <span className="text-xs" style={{ color: A.muted }}>
              DAU/MAU proxy:
            </span>
            <span className="text-xs font-bold" style={{ color: A.cyan }}>
              {stats.total_users > 0
                ? `${((stats.active_users_today / stats.total_users) * 100).toFixed(1)}%`
                : '0%'}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
