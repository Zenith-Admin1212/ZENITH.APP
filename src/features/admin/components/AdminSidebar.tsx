'use client'

import { ZenithLogo }   from '@/components/ui/ZenithLogo'
import { A }            from './AdminUI'
import type { AdminTab } from '../hooks/useAdmin'
import {
  LayoutDashboard, Users, Crown, MessageSquare,
  Trophy, MessageCircle, Radio, Wrench, ScrollText, LogOut,
} from 'lucide-react'

// ═══════════════════════════════════════════════════════════════
//  AdminSidebar — desktop left rail + mobile bottom bar
// ═══════════════════════════════════════════════════════════════

interface NavItem {
  id:    AdminTab
  icon:  React.ReactNode
  label: string
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard',   icon: <LayoutDashboard size={16} />, label: 'Dashboard'    },
  { id: 'users',       icon: <Users           size={16} />, label: 'Users'        },
  { id: 'premium',     icon: <Crown           size={16} />, label: 'Premium'      },
  { id: 'community',   icon: <MessageSquare   size={16} />, label: 'Community'    },
  { id: 'challenges',  icon: <Trophy          size={16} />, label: 'Challenges'   },
  { id: 'feedback',    icon: <MessageCircle   size={16} />, label: 'Feedback'     },
  { id: 'broadcast',   icon: <Radio           size={16} />, label: 'Broadcast'    },
  { id: 'maintenance', icon: <Wrench          size={16} />, label: 'Maintenance'  },
  { id: 'logs',        icon: <ScrollText      size={16} />, label: 'System Logs'  },
]

interface AdminSidebarProps {
  activeTab:    AdminTab
  setActiveTab: (tab: AdminTab) => void
}

export function AdminSidebar({ activeTab, setActiveTab }: AdminSidebarProps) {
  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside
        className="hidden md:flex flex-col w-56 flex-shrink-0 h-screen sticky top-0"
        style={{
          background:  A.surface,
          borderRight: `1px solid ${A.border}`,
        }}
      >
        {/* Logo */}
        <div className="px-4 py-5 flex items-center gap-3"
          style={{ borderBottom: `1px solid ${A.border}` }}>
          <ZenithLogo variant="icon" size="sm" />
          <div>
            <p className="font-black text-xs tracking-widest"
              style={{ color: A.cyan, fontFamily: 'var(--font-display)' }}>
              ZENITH
            </p>
            <p className="text-2xs" style={{ color: A.faint, fontSize: '10px' }}>
              ADMIN PANEL
            </p>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-2 py-3 flex flex-col gap-0.5 overflow-y-auto">
          {NAV_ITEMS.map(item => {
            const isActive = activeTab === item.id
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-left w-full transition-all"
                style={{
                  background: isActive ? `rgba(0,245,255,0.1)` : 'transparent',
                  border:     `1px solid ${isActive ? A.borderHi : 'transparent'}`,
                  color:      isActive ? A.cyan : A.muted,
                }}
              >
                <span style={{ opacity: isActive ? 1 : 0.6 }}>{item.icon}</span>
                <span className="text-sm font-semibold">{item.label}</span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full"
                    style={{ background: A.cyan, boxShadow: `0 0 6px ${A.cyan}` }} />
                )}
              </button>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="px-3 py-4" style={{ borderTop: `1px solid ${A.border}` }}>
          <a href="/app/today"
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl w-full transition-all"
            style={{ color: A.faint }}>
            <LogOut size={14} />
            <span className="text-sm">Back to App</span>
          </a>
        </div>
      </aside>

      {/* ── Mobile bottom tab bar ── */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-40 flex items-center justify-around px-1 py-2"
        style={{
          background:  A.surface,
          borderTop:   `1px solid ${A.border}`,
          backdropFilter: 'blur(12px)',
        }}
      >
        {NAV_ITEMS.slice(0, 7).map(item => {
          const isActive = activeTab === item.id
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className="flex flex-col items-center gap-0.5 px-1.5 py-1.5 rounded-lg min-w-[38px]"
              style={{ color: isActive ? A.cyan : A.faint }}
            >
              {item.icon}
              <span style={{ fontSize: '8px', fontWeight: 600 }}>
                {item.label.split(' ')[0]}
              </span>
            </button>
          )
        })}
      </nav>
    </>
  )
}
