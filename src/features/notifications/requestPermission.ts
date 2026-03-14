// ═══════════════════════════════════════════════════════════════
//  requestPermission.ts — Push notification permission utilities
// ═══════════════════════════════════════════════════════════════

const PREF_KEY = 'zenith-push-pref'

export type PushPermissionState =
  | 'granted'
  | 'denied'
  | 'default'
  | 'unsupported'

// ── Check current state ──────────────────────────────────────────
export function getPushPermissionState(): PushPermissionState {
  if (typeof window === 'undefined')    return 'unsupported'
  if (!('Notification' in window))      return 'unsupported'
  if (!('serviceWorker' in navigator))  return 'unsupported'
  if (!('PushManager' in window))       return 'unsupported'
  return Notification.permission as PushPermissionState
}

export function isServiceWorkerSupported(): boolean {
  return typeof navigator !== 'undefined' && 'serviceWorker' in navigator
}

// ── Register service worker ──────────────────────────────────────
// FIX (CRITICAL-7): Explicitly register SW before any SW-dependent ops.
// navigator.serviceWorker.ready hangs indefinitely if the SW was never
// registered. This function registers it and adds a timeout guard.
export async function ensureServiceWorkerRegistered(): Promise<ServiceWorkerRegistration | null> {
  if (!isServiceWorkerSupported()) return null
  try {
    const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
    return reg
  } catch (err) {
    console.warn('[ZENITH] SW registration failed:', err)
    return null
  }
}

// ── Get SW registration with timeout ────────────────────────────
async function getSwRegistration(timeoutMs = 5000): Promise<ServiceWorkerRegistration | null> {
  if (!isServiceWorkerSupported()) return null
  try {
    const readyPromise = navigator.serviceWorker.ready
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('SW ready timeout')), timeoutMs)
    )
    return await Promise.race([readyPromise, timeoutPromise])
  } catch {
    return null
  }
}

// ── Request permission ───────────────────────────────────────────
export async function requestPushPermission(): Promise<PushPermissionState> {
  const state = getPushPermissionState()
  if (state === 'unsupported') return 'unsupported'
  if (state === 'granted')     return 'granted'
  if (state === 'denied')      return 'denied'

  try {
    const result = await Notification.requestPermission()
    try { localStorage.setItem(PREF_KEY, result) } catch { /* */ }
    return result as PushPermissionState
  } catch {
    return 'denied'
  }
}

// ── Get push subscription ────────────────────────────────────────
export async function getPushSubscription(
  vapidPublicKey?: string
): Promise<PushSubscription | null> {
  if (!isServiceWorkerSupported())            return null
  if (getPushPermissionState() !== 'granted') return null

  const reg = await getSwRegistration()
  if (!reg) return null

  try {
    const existing = await reg.pushManager.getSubscription()
    if (existing) return existing
    if (!vapidPublicKey) return null

    return await reg.pushManager.subscribe({
      userVisibleOnly:      true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource,
    })
  } catch {
    return null
  }
}

// ── User preference helpers ──────────────────────────────────────
export function getStoredPushPref(): PushPermissionState | null {
  try { return localStorage.getItem(PREF_KEY) as PushPermissionState | null } catch { return null }
}
export function clearStoredPushPref(): void {
  try { localStorage.removeItem(PREF_KEY) } catch { /* */ }
}

// ── VAPID key converter ──────────────────────────────────────────
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding   = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64    = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData   = window.atob(base64)
  const outputArr: Uint8Array = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) outputArr[i] = rawData.charCodeAt(i)
  return outputArr
}

// ── Supabase persistence ─────────────────────────────────────────
import { supabase } from '@/lib/supabase/client'

export async function savePushPreferenceToDb(userId: string, enabled: boolean): Promise<void> {
  try {
    await supabase
      .from('user_preferences')
      .upsert(
        { user_id: userId, key: 'push_notifications', value: { enabled } },
        { onConflict: 'user_id,key' }
      )
  } catch { /* Non-critical */ }
}

export async function loadPushPreferenceFromDb(userId: string): Promise<boolean | null> {
  try {
    const { data } = await supabase
      .from('user_preferences')
      .select('value')
      .eq('user_id', userId)
      .eq('key', 'push_notifications')
      .maybeSingle()
    return data ? (data.value as { enabled: boolean }).enabled : null
  } catch { return null }
}

export async function enablePushNotifications(
  userId:   string,
  vapidKey?: string
): Promise<PushPermissionState> {
  const state   = await requestPushPermission()
  const granted = state === 'granted'
  if (granted && vapidKey) await getPushSubscription(vapidKey)
  await savePushPreferenceToDb(userId, granted)
  return state
}

export async function disablePushNotifications(userId: string): Promise<void> {
  try {
    const reg = await getSwRegistration(3000)
    if (reg) {
      const sub = await reg.pushManager.getSubscription()
      if (sub) await sub.unsubscribe()
    }
  } catch { /* */ }
  clearStoredPushPref()
  await savePushPreferenceToDb(userId, false)
}
