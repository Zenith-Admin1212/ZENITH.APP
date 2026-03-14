'use client'

import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { supabase }      from '@/lib/supabase/client'
import { useUserStore }  from '@/stores/userStore'
import { useXPStore }    from '@/stores/xpStore'
import { useStreakStore } from '@/stores/streakStore'
import { format, subDays } from 'date-fns'

// ═══════════════════════════════════════════════════════════════
//  StatsGrid — 6-cell stats grid for the profile page
// ═══════════════════════════════════════════════════════════════

interface StatCellProps {
  icon:     string
  label:    string
  value:    string | number
  sub?:     string
  glow?:    boolean
  index:    number
}

function StatCell({ icon, label, value, sub, glow, index }: StatCellProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.4 }}
      className="flex flex-col items-center gap-1.5 py-4 px-3 rounded-2xl relative overflow-hidden"
      style={{
        background: 'var(--color-surface)',
        border: `1px solid ${glow ? 'var(--color-border-glow)' : 'var(--color-border)'}`,
        boxShadow: glow ? 'var(--glow-sm)' : 'none',
      }}
    >
      {glow && (
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ background: 'radial-gradient(circle at 50% 0%, var(--color-primary), transparent 70%)' }} />
      )}
      <span className="text-2xl z-10">{icon}</span>
      <span className="font-display font-black text-xl text-glow leading-none z-10">
        {value}
      </span>
      {sub && (
        <span className="text-2xs text-zenith-faint z-10" style={{ fontSize: '9px' }}>
          {sub}
        </span>
      )}
      <span className="text-2xs text-zenith-muted font-display tracking-wider z-10"
        style={{ fontSize: '9px', letterSpacing: '0.1em' }}>
        {label.toUpperCase()}
      </span>
    </motion.div>
  )
}

export function StatsGrid() {
  const { user }    = useUserStore()
  const { xp }      = useXPStore()
  const { streak, longestStreak, monthlyShieldsRemaining } = useStreakStore()

  const today     = format(new Date(), 'yyyy-MM-dd')
  const last30    = format(subDays(new Date(), 30), 'yyyy-MM-dd')

  // Fetch habits completed total
  const { data: statsData } = useQuery({
    queryKey: ['profile-stats', user?.id],
    queryFn: async () => {
      const [
        { count: totalHabits },
        { count: pomodoroCount },
        { data: recentLogs },
        { data: activeHabits },
      ] = await Promise.all([
        supabase.from('habit_logs')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user!.id)
          .eq('completed', true),
        supabase.from('pomodoro_sessions')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user!.id)
          .eq('completed', true),
        supabase.from('habit_logs')
          .select('date, completed')
          .eq('user_id', user!.id)
          .gte('date', last30)
          .lte('date', today),
        supabase.from('habits')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user!.id)
          .eq('active', true),
      ])

      // Discipline: % of days in last 30 where at least 1 habit was completed
      const completedDates = new Set(
        (recentLogs ?? [])
          .filter((l: { completed: boolean }) => l.completed)
          .map((l: { date: string }) => l.date)
      )
      const discipline = Math.round((completedDates.size / 30) * 100)

      return {
        totalHabits: totalHabits ?? 0,
        pomodoro: pomodoroCount ?? 0,
        activeHabits: 0, // from count query
        discipline,
      }
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  })

  const cells = [
    { icon: '🔥', label: 'Streak',    value: streak,                       sub: `Best: ${longestStreak}d`, glow: streak > 0 },
    { icon: '🛡️', label: 'Shields',   value: monthlyShieldsRemaining,      sub: 'this month',              glow: false },
    { icon: '✅', label: 'Habits',    value: statsData?.totalHabits ?? '—', sub: 'total completed',         glow: false },
    { icon: '📊', label: 'Discipline',value: `${statsData?.discipline ?? 0}%`, sub: '30-day rate',          glow: (statsData?.discipline ?? 0) >= 80 },
    { icon: '⚡', label: 'Total XP',  value: xp.toLocaleString(),           sub: 'lifetime earned',         glow: true },
    { icon: '⏱️', label: 'Pomodoros', value: statsData?.pomodoro ?? '—',    sub: 'sessions done',           glow: false },
  ]

  return (
    <div className="px-4 pt-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="font-display font-bold text-xs tracking-widest"
          style={{ color: 'var(--color-text-muted)' }}>
          YOUR STATS
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2.5">
        {cells.map((cell, i) => (
          <StatCell key={cell.label} {...cell} index={i} />
        ))}
      </div>
    </div>
  )
}
