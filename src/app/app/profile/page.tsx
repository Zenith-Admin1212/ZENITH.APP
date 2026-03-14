'use client'
import { useState } from 'react'
import { motion }   from 'framer-motion'
import { User, Palette, Share2, Trophy } from 'lucide-react'
import { ProfileHeader }      from '@/features/profile/components/ProfileHeader'
import { StatsGrid }          from '@/features/profile/components/StatsGrid'
import { ThemeSwitcher }      from '@/features/themes/components/ThemeSwitcher'
import { ShareCardGenerator } from '@/features/profile/components/ShareCardGenerator'
import { useAchievements }    from '@/features/xp/hooks/useAchievements'
import { AchievementCard }    from '@/features/xp/components/AchievementCard'

// ═══════════════════════════════════════════════════════════════
//  Profile Page — identity, stats, themes, share
// ═══════════════════════════════════════════════════════════════

type ProfileTab = 'stats' | 'themes' | 'achievements' | 'share'

const TABS: { id: ProfileTab; icon: typeof User; label: string }[] = [
  { id: 'stats',        icon: User,    label: 'Stats'    },
  { id: 'themes',       icon: Palette, label: 'Themes'   },
  { id: 'achievements', icon: Trophy,  label: 'Awards'   },
  { id: 'share',        icon: Share2,  label: 'Share'    },
]

function TabBar({ active, onChange }: { active: ProfileTab; onChange: (t: ProfileTab) => void }) {
  return (
    <div className="flex px-4 gap-1 pt-3 pb-1"
      style={{ borderBottom: '1px solid var(--color-border)' }}>
      {TABS.map(tab => {
        const Icon = tab.icon
        const isActive = active === tab.id
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className="flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl transition-all relative"
            style={{
              background: isActive ? 'var(--color-surface-active)' : 'transparent',
              color:      isActive ? 'var(--color-primary)' : 'var(--color-text-faint)',
            }}
          >
            <Icon size={16} />
            <span className="font-display font-bold tracking-wider" style={{ fontSize: '9px', letterSpacing: '0.1em' }}>
              {tab.label.toUpperCase()}
            </span>
            {isActive && (
              <motion.div
                layoutId="profile-tab-indicator"
                className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full"
                style={{ background: 'var(--color-primary)', boxShadow: 'var(--glow-sm)' }}
              />
            )}
          </button>
        )
      })}
    </div>
  )
}

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<ProfileTab>('stats')
  const { unlocked } = useAchievements()

  return (
    <div className="flex flex-col pb-8 max-w-lg mx-auto">
      {/* Sticky header with avatar and XP bar */}
      <ProfileHeader />

      {/* Tab navigation */}
      <TabBar active={activeTab} onChange={setActiveTab} />

      {/* Tab content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        {activeTab === 'stats' && (
          <div className="pb-4">
            <StatsGrid />
          </div>
        )}

        {activeTab === 'themes' && (
          <div className="px-4 py-4">
            <ThemeSwitcher />
          </div>
        )}

        {activeTab === 'achievements' && (
          <div className="px-4 py-4">
            <div className="flex items-center gap-2 mb-3">
              <Trophy size={14} style={{ color: 'var(--color-primary)' }} />
              <span className="font-display font-bold text-xs tracking-widest"
                style={{ color: 'var(--color-text-muted)' }}>
                RECENT ACHIEVEMENTS
              </span>
              <span className="ml-auto text-xs text-zenith-faint">{unlocked.length} unlocked</span>
            </div>
            {unlocked.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-10 text-center rounded-2xl"
                style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                <Trophy size={28} style={{ color: 'var(--color-text-faint)' }} />
                <p className="text-xs text-zenith-faint">Complete habits to earn achievements</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {unlocked.slice(0, 9).map((a, i) => (
                  <AchievementCard key={a.id} achievement={a} index={i} />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'share' && (
          <div className="py-2">
            <ShareCardGenerator />
          </div>
        )}
      </motion.div>
    </div>
  )
}
