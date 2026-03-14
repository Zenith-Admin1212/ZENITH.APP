import { supabase } from '@/lib/supabase/client'
import type { Notification } from '@/types'

// ═══════════════════════════════════════════════════════════════
//  Notifications Service
//  CRUD for the user's notification inbox.
// ═══════════════════════════════════════════════════════════════

export async function fetchNotifications(userId: string): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) throw error
  return (data ?? []) as Notification[]
}

export async function markNotificationRead(id: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', id)

  if (error) throw error
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId)
    .eq('read', false)

  if (error) throw error
}

export async function deleteNotification(id: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', id)

  if (error) throw error
}

/** Create a notification — called internally by other services. */
export async function pushNotification(
  userId:  string,
  type:    Notification['type'],
  title:   string,
  message: string,
  data:    Record<string, unknown> = {}
): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .insert({ user_id: userId, type, title, message, data, read: false })

  if (error) console.warn('[pushNotification] failed:', error.message)
}
