'use client'

import { useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase }        from '@/lib/supabase/client'
import { useUserStore }    from '@/stores/userStore'
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
} from '../services/notificationService'
import type { Notification } from '@/types'

// ═══════════════════════════════════════════════════════════════
//  useNotifications
//  Fetches user inbox + Realtime subscription for new arrivals.
//  Optimistic mark-as-read with rollback.
// ═══════════════════════════════════════════════════════════════

const NOTIF_KEY = (userId: string) => ['notifications', userId]

export function useNotifications() {
  const { user } = useUserStore()
  const qc       = useQueryClient()

  const invalidate = useCallback(() => {
    if (user?.id) qc.invalidateQueries({ queryKey: NOTIF_KEY(user.id) })
  }, [user?.id, qc])

  // ── Fetch query ───────────────────────────────────────────────
  const query = useQuery({
    queryKey:  NOTIF_KEY(user?.id ?? ''),
    queryFn:   () => fetchNotifications(user!.id),
    enabled:   !!user?.id,
    staleTime: 30 * 1000,
  })

  // ── Realtime subscription ─────────────────────────────────────
  useEffect(() => {
    if (!user?.id) return

    const channel = supabase
      .channel(`notifications-${user.id}`)
      .on(
        'postgres_changes',
        {
          event:  'INSERT',
          schema: 'public',
          table:  'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        () => invalidate()
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user?.id, invalidate])

  // ── Mark single read (optimistic) ────────────────────────────
  const markReadMutation = useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onMutate:   async (id) => {
      const key  = NOTIF_KEY(user!.id)
      await qc.cancelQueries({ queryKey: key })
      const prev = qc.getQueryData<Notification[]>(key)
      qc.setQueryData<Notification[]>(key, old =>
        (old ?? []).map(n => n.id === id ? { ...n, read: true } : n)
      )
      return { prev }
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(NOTIF_KEY(user!.id), ctx.prev)
    },
  })

  // ── Mark all read ─────────────────────────────────────────────
  const markAllReadMutation = useMutation({
    mutationFn: () => markAllNotificationsRead(user!.id),
    onMutate:   async () => {
      const key  = NOTIF_KEY(user!.id)
      await qc.cancelQueries({ queryKey: key })
      const prev = qc.getQueryData<Notification[]>(key)
      qc.setQueryData<Notification[]>(key, old =>
        (old ?? []).map(n => ({ ...n, read: true }))
      )
      return { prev }
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(NOTIF_KEY(user!.id), ctx.prev)
    },
  })

  // ── Delete ────────────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteNotification(id),
    onSuccess:  invalidate,
  })

  const notifications = query.data ?? []
  const unreadCount   = notifications.filter(n => !n.read).length

  return {
    notifications,
    unreadCount,
    isLoading:    query.isLoading,
    markRead:     markReadMutation.mutate,
    markAllRead:  markAllReadMutation.mutate,
    deleteNotif:  deleteMutation.mutate,
  }
}
