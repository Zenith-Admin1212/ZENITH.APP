'use client'

import { useUserStore }  from '@/stores/userStore'
import { useAdmin }      from '../hooks/useAdmin'
import { AdminSidebar }  from './AdminSidebar'
import { DashboardTab }  from './DashboardTab'
import { UsersTab }      from './UsersTab'
import {
  CommunityTab, ChallengesTab, FeedbackTab,
} from './ContentTabs'
import {
  BroadcastTab, MaintenanceTab, LogsTab,
} from './OperationsTabs'
import { A } from './AdminUI'

// ═══════════════════════════════════════════════════════════════
//  AdminPanel  — root component for /admin
//
//  Renders the sidebar + active tab content.
//  Each tab's data is fetched only when the tab is opened.
//  All state lives in useAdmin() hook.
// ═══════════════════════════════════════════════════════════════

export function AdminPanel() {
  const { user } = useUserStore()
  const admin    = useAdmin()

  // Double-check role client-side (middleware already enforced server-side)
  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: A.bg }}>
        <div className="text-center flex flex-col gap-3">
          <p className="text-4xl">🚫</p>
          <p className="font-bold text-lg" style={{ color: A.danger }}>Access Denied</p>
          <p className="text-sm" style={{ color: A.muted }}>Admin role required.</p>
          <a href="/app/today" className="text-sm underline" style={{ color: A.cyan }}>
            Return to app
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex" style={{ background: A.bg }}>

      {/* ── Sidebar ── */}
      <AdminSidebar
        activeTab={admin.activeTab}
        setActiveTab={admin.setActiveTab}
      />

      {/* ── Main content ── */}
      <main className="flex-1 min-w-0 flex flex-col">

        {/* Top bar */}
        <header className="flex items-center justify-between px-6 py-4 flex-shrink-0"
          style={{
            background:   A.surface,
            borderBottom: `1px solid ${A.border}`,
          }}>
          <div>
            <h1 className="font-bold text-sm" style={{ color: A.text }}>
              {admin.activeTab.charAt(0).toUpperCase() + admin.activeTab.slice(1)}
            </h1>
            <p className="text-xs mt-0.5" style={{ color: A.faint }}>
              ZENITH Admin · {user.username ?? user.email}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Live indicator */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
              style={{ background: A.surface2, border: `1px solid ${A.border}` }}>
              <div className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ background: A.success }} />
              <span className="text-xs font-mono" style={{ color: A.success }}>
                LIVE
              </span>
            </div>
            <a href="/app/today"
              className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
              style={{
                background: A.surface2,
                border:     `1px solid ${A.border}`,
                color:      A.muted,
              }}>
              ← App
            </a>
          </div>
        </header>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 pb-24 md:pb-6">
          {admin.activeTab === 'dashboard' && (
            <DashboardTab
              stats={admin.stats}
              isLoading={admin.statsLoading}
              onRefresh={admin.refetchStats}
            />
          )}

          {admin.activeTab === 'users' && (
            <UsersTab
              users={admin.users}
              isLoading={admin.usersLoading}
              userSearch={admin.userSearch}
              setSearch={admin.setUserSearch}
              onGrant={admin.grantPremium}
              onRevoke={admin.revokePremium}
              onBlock={(uid, reason) => admin.blockUser({ uid, reason })}
              onUnblock={admin.unblockUser}
              onReset={admin.resetStreak}
              isActing={admin.isActingOnUser}
            />
          )}

          {admin.activeTab === 'premium' && (
            <UsersTab
              users={admin.users}
              isLoading={admin.usersLoading}
              userSearch={admin.userSearch}
              setSearch={admin.setUserSearch}
              onGrant={admin.grantPremium}
              onRevoke={admin.revokePremium}
              onBlock={(uid, reason) => admin.blockUser({ uid, reason })}
              onUnblock={admin.unblockUser}
              onReset={admin.resetStreak}
              isActing={admin.isActingOnUser}
              premiumOnly
            />
          )}

          {admin.activeTab === 'community' && (
            <CommunityTab
              posts={admin.posts}
              isLoading={admin.postsLoading}
              onDelete={admin.deletePost}
              onBlockUser={(uid, reason) => admin.blockUser({ uid, reason })}
            />
          )}

          {admin.activeTab === 'challenges' && (
            <ChallengesTab
              challenges={admin.challengeStats}
              isLoading={admin.challengesLoading}
              onDisable={admin.disableChallenge}
              onEnable={admin.enableChallenge}
            />
          )}

          {admin.activeTab === 'feedback' && (
            <FeedbackTab
              feedback={admin.feedback}
              isLoading={admin.feedbackLoading}
              onUpdate={admin.updateFeedback}
            />
          )}

          {admin.activeTab === 'broadcast' && (
            <BroadcastTab
              history={admin.broadcastHistory}
              isLoading={admin.broadcastHistoryLoading}
              isSending={admin.isBroadcasting}
              onSend={admin.sendBroadcast}
            />
          )}

          {admin.activeTab === 'maintenance' && (
            <MaintenanceTab
              status={admin.maintenanceStatus}
              isLoading={admin.maintenanceLoading}
              onToggle={admin.setMaintenance}
            />
          )}

          {admin.activeTab === 'logs' && (
            <LogsTab
              logs={admin.logs}
              isLoading={admin.logsLoading}
            />
          )}
        </div>
      </main>
    </div>
  )
}
