'use client'

import { useState }   from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useUserStore }  from '@/stores/userStore'
import {
  fetchPlatformStats, fetchAdminUsers, grantPremium, revokePremium,
  blockUser, unblockUser, resetUserStreak,
  adminDeletePost, fetchAdminCommunityPosts,
  adminDisableChallenge, adminEnableChallenge, fetchChallengeStats,
  fetchFeedback, updateFeedbackStatus,
  sendBroadcast, fetchBroadcastHistory,
  fetchMaintenanceStatus, setMaintenanceMode,
  fetchAdminLogs,
} from '../services/adminService'

// ═══════════════════════════════════════════════════════════════
//  useAdmin  — monolithic admin hook
//  Returns query results + mutation functions for all 9 tabs.
//  Each tab's data is independently cached and only fetched
//  when the tab is opened (enabled: activeTab === 'X').
// ═══════════════════════════════════════════════════════════════

export type AdminTab =
  | 'dashboard' | 'users' | 'premium' | 'community'
  | 'challenges' | 'feedback' | 'broadcast' | 'maintenance' | 'logs'

export function useAdmin() {
  const { user }     = useUserStore()
  const qc           = useQueryClient()
  const adminId      = user?.id ?? ''
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard')
  const [userSearch, setUserSearch] = useState('')

  // ── Dashboard stats ───────────────────────────────────────
  const statsQuery = useQuery({
    queryKey:  ['admin-stats'],
    queryFn:   fetchPlatformStats,
    staleTime: 60 * 1000,
    enabled:   activeTab === 'dashboard',
  })

  // ── Users ─────────────────────────────────────────────────
  const usersQuery = useQuery({
    queryKey:  ['admin-users', userSearch],
    queryFn:   () => fetchAdminUsers(userSearch),
    staleTime: 30 * 1000,
    enabled:   activeTab === 'users' || activeTab === 'premium',
  })

  const grantPremiumMut = useMutation({
    mutationFn: (uid: string) => grantPremium(adminId, uid),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  })
  const revokePremiumMut = useMutation({
    mutationFn: (uid: string) => revokePremium(adminId, uid),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  })
  const blockMut = useMutation({
    mutationFn: ({ uid, reason }: { uid: string; reason: string }) =>
      blockUser(adminId, uid, reason),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  })
  const unblockMut = useMutation({
    mutationFn: (uid: string) => unblockUser(adminId, uid),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  })
  const resetStreakMut = useMutation({
    mutationFn: (uid: string) => resetUserStreak(adminId, uid),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  })

  // ── Community ─────────────────────────────────────────────
  const communityQuery = useQuery({
    queryKey:  ['admin-community'],
    queryFn:   () => fetchAdminCommunityPosts(),
    staleTime: 30 * 1000,
    enabled:   activeTab === 'community',
  })
  const deletePostMut = useMutation({
    mutationFn: (postId: string) => adminDeletePost(adminId, postId),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['admin-community'] }),
  })

  // ── Challenges ────────────────────────────────────────────
  const challengesQuery = useQuery({
    queryKey:  ['admin-challenges'],
    queryFn:   fetchChallengeStats,
    staleTime: 60 * 1000,
    enabled:   activeTab === 'challenges',
  })
  const disableChallengeMut = useMutation({
    mutationFn: (cid: string) => adminDisableChallenge(adminId, cid),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['admin-challenges'] }),
  })
  const enableChallengeMut = useMutation({
    mutationFn: (cid: string) => adminEnableChallenge(adminId, cid),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['admin-challenges'] }),
  })

  // ── Feedback ──────────────────────────────────────────────
  const feedbackQuery = useQuery({
    queryKey:  ['admin-feedback'],
    queryFn:   () => fetchFeedback(),
    staleTime: 60 * 1000,
    enabled:   activeTab === 'feedback',
  })
  const feedbackStatusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'open' | 'reviewed' | 'resolved' }) =>
      updateFeedbackStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-feedback'] }),
  })

  // ── Broadcast ─────────────────────────────────────────────
  const broadcastHistoryQuery = useQuery({
    queryKey:  ['admin-broadcast'],
    queryFn:   fetchBroadcastHistory,
    staleTime: 60 * 1000,
    enabled:   activeTab === 'broadcast',
  })
  const broadcastMut = useMutation({
    mutationFn: ({ title, message }: { title: string; message: string }) =>
      sendBroadcast(adminId, title, message),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-broadcast'] }),
  })

  // ── Maintenance ───────────────────────────────────────────
  const maintenanceQuery = useQuery({
    queryKey:  ['admin-maintenance'],
    queryFn:   fetchMaintenanceStatus,
    staleTime: 30 * 1000,
    enabled:   activeTab === 'maintenance',
  })
  const maintenanceMut = useMutation({
    mutationFn: ({ enabled, message }: { enabled: boolean; message?: string }) =>
      setMaintenanceMode(adminId, enabled, message),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-maintenance'] }),
  })

  // ── Logs ──────────────────────────────────────────────────
  const logsQuery = useQuery({
    queryKey:  ['admin-logs'],
    queryFn:   () => fetchAdminLogs(),
    staleTime: 30 * 1000,
    enabled:   activeTab === 'logs',
  })

  return {
    // Tab state
    activeTab, setActiveTab,
    // Users
    users:        usersQuery.data ?? [],
    usersLoading: usersQuery.isLoading,
    userSearch, setUserSearch,
    grantPremium:  grantPremiumMut.mutate,
    revokePremium: revokePremiumMut.mutate,
    blockUser:     blockMut.mutate,
    unblockUser:   unblockMut.mutate,
    resetStreak:   resetStreakMut.mutate,
    isActingOnUser: grantPremiumMut.isPending || revokePremiumMut.isPending ||
                    blockMut.isPending || unblockMut.isPending || resetStreakMut.isPending,
    // Stats
    stats:        statsQuery.data ?? null,
    statsLoading: statsQuery.isLoading,
    refetchStats: () => qc.invalidateQueries({ queryKey: ['admin-stats'] }),
    // Community
    posts:        communityQuery.data ?? [],
    postsLoading: communityQuery.isLoading,
    deletePost:   deletePostMut.mutate,
    // Challenges
    challengeStats:    challengesQuery.data ?? [],
    challengesLoading: challengesQuery.isLoading,
    disableChallenge:  disableChallengeMut.mutate,
    enableChallenge:   enableChallengeMut.mutate,
    // Feedback
    feedback:        feedbackQuery.data ?? [],
    feedbackLoading: feedbackQuery.isLoading,
    updateFeedback:  feedbackStatusMut.mutate,
    // Broadcast
    broadcastHistory:        broadcastHistoryQuery.data ?? [],
    broadcastHistoryLoading: broadcastHistoryQuery.isLoading,
    sendBroadcast:           broadcastMut.mutate,
    isBroadcasting:          broadcastMut.isPending,
    // Maintenance
    maintenanceStatus:  maintenanceQuery.data ?? null,
    maintenanceLoading: maintenanceQuery.isLoading,
    setMaintenance:     maintenanceMut.mutate,
    // Logs
    logs:        logsQuery.data ?? [],
    logsLoading: logsQuery.isLoading,
  }
}
