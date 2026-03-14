'use client'

import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter }        from 'next/navigation'
import { useUserStore }     from '@/stores/userStore'
import {
  saveProfileSettings,
  fetchNotificationPrefs, saveNotificationPrefs,
  fetchAppPrefs, saveAppPrefs,
  signOut, deleteAccount, exportUserData,
  type NotificationPreferences, type AppPreferences,
} from '../services/settingsService'

// ═══════════════════════════════════════════════════════════════
//  useSettings
//  All settings sections in one hook.
//  Each section auto-saves on change (debounced via isSaving state).
//  Profile changes sync back to userStore immediately.
// ═══════════════════════════════════════════════════════════════

export type SettingsSection =
  | 'profile' | 'notifications' | 'theme' | 'preferences' | 'account'

export function useSettings() {
  const { user, updateUser, clearUser } = useUserStore()
  const qc     = useQueryClient()
  const router = useRouter()

  const [activeSection, setActiveSection] = useState<SettingsSection>('profile')
  const [saveStatus, setSaveStatus]       = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  // ── Notification prefs ────────────────────────────────────────
  const notifQuery = useQuery({
    queryKey:  ['settings-notif', user?.id],
    queryFn:   () => fetchNotificationPrefs(user!.id),
    enabled:   !!user?.id && activeSection === 'notifications',
    staleTime: 5 * 60 * 1000,
  })

  // ── App prefs ────────────────────────────────────────────────
  const appPrefsQuery = useQuery({
    queryKey:  ['settings-app-prefs', user?.id],
    queryFn:   () => fetchAppPrefs(user!.id),
    enabled:   !!user?.id && activeSection === 'preferences',
    staleTime: 5 * 60 * 1000,
  })

  // ── Profile save ─────────────────────────────────────────────
  const profileMut = useMutation({
    mutationFn: (updates: Parameters<typeof saveProfileSettings>[1]) =>
      saveProfileSettings(user!.id, updates),
    onMutate: async (updates) => {
      setSaveStatus('saving')
      // Optimistic update to store
      updateUser(updates as any)
    },
    onSuccess: (saved) => {
      updateUser(saved)
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2000)
    },
    onError: () => {
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 3000)
    },
  })

  // ── Notification prefs save ───────────────────────────────────
  const notifMut = useMutation({
    mutationFn: (prefs: NotificationPreferences) =>
      saveNotificationPrefs(user!.id, prefs),
    onMutate: async (prefs) => {
      setSaveStatus('saving')
      qc.setQueryData(['settings-notif', user?.id], prefs)
    },
    onSuccess: () => {
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2000)
    },
    onError: () => {
      setSaveStatus('error')
      qc.invalidateQueries({ queryKey: ['settings-notif', user?.id] })
      setTimeout(() => setSaveStatus('idle'), 3000)
    },
  })

  // ── App prefs save ────────────────────────────────────────────
  const appPrefsMut = useMutation({
    mutationFn: (prefs: AppPreferences) => saveAppPrefs(user!.id, prefs),
    onMutate: async (prefs) => {
      setSaveStatus('saving')
      qc.setQueryData(['settings-app-prefs', user?.id], prefs)
    },
    onSuccess: () => {
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2000)
    },
    onError: () => {
      setSaveStatus('error')
      qc.invalidateQueries({ queryKey: ['settings-app-prefs', user?.id] })
    },
  })

  // ── Sign out ──────────────────────────────────────────────────
  const signOutMut = useMutation({
    mutationFn: signOut,
    onSuccess: () => {
      clearUser()
      router.replace('/login')
    },
  })

  // ── Delete account ────────────────────────────────────────────
  const deleteAccountMut = useMutation({
    mutationFn: () => deleteAccount(user!.id),
    onSuccess: () => {
      clearUser()
      router.replace('/login')
    },
  })

  // ── Data export ───────────────────────────────────────────────
  const handleExportData = useCallback(async () => {
    if (!user?.id) return
    try {
      const blob = await exportUserData(user.id)
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `zenith-data-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Export failed:', err)
    }
  }, [user?.id])

  return {
    user,
    activeSection, setActiveSection,
    saveStatus,

    // Notification prefs
    notifPrefs:       notifQuery.data ?? null,
    notifLoading:     notifQuery.isLoading,
    saveNotifPrefs:   notifMut.mutate,

    // App prefs
    appPrefs:         appPrefsQuery.data ?? null,
    appPrefsLoading:  appPrefsQuery.isLoading,
    saveAppPrefs:     appPrefsMut.mutate,

    // Profile
    saveProfile:      profileMut.mutate,
    isSavingProfile:  profileMut.isPending,

    // Account
    signOut:          signOutMut.mutate,
    isSigningOut:     signOutMut.isPending,
    deleteAccount:    deleteAccountMut.mutate,
    isDeletingAccount:deleteAccountMut.isPending,

    // Data
    exportData:       handleExportData,
  }
}
