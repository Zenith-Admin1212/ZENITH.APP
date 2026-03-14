// ═══════════════════════════════════════════════════════════════
//  ZENITH Service Worker — PWA offline support
//  Strategy: Cache-first for static assets, network-first for API
// ═══════════════════════════════════════════════════════════════

const CACHE_NAME       = 'zenith-v1'
const OFFLINE_URL      = '/offline'

const PRECACHE_URLS = [
  '/',
  '/offline',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
]

// ── Install: pre-cache shell ─────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  )
  self.skipWaiting()
})

// ── Activate: clean old caches ───────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  )
  self.clients.claim()
})

// ── Fetch: network-first with offline fallback ───────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event

  // Skip non-GET and cross-origin requests
  if (request.method !== 'GET') return
  if (!request.url.startsWith(self.location.origin)) return

  // Skip Supabase API calls — never cache auth/DB requests
  if (request.url.includes('supabase.co')) return

  // Navigation requests: serve offline page on failure
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match(OFFLINE_URL).then(
          (cached) => cached || new Response('Offline', { status: 503 })
        )
      )
    )
    return
  }

  // Static assets: cache-first
  if (
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'image' ||
    request.destination === 'font'
  ) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response && response.status === 200) {
              const clone = response.clone()
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
            }
            return response
          })
      )
    )
    return
  }

  // Everything else: network-first, no cache
  event.respondWith(fetch(request))
})

// ── Push notifications ───────────────────────────────────────────
self.addEventListener('push', (event) => {
  if (!event.data) return
  try {
    const data = event.data.json()
    event.waitUntil(
      self.registration.showNotification(data.title || 'ZENITH', {
        body:  data.body || '',
        icon:  '/icons/icon-192x192.png',
        badge: '/icons/icon-192x192.png',
        data:  data.url ? { url: data.url } : {},
      })
    )
  } catch (_) {
    // Non-JSON push — ignore
  }
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/'
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      for (const client of clients) {
        if (client.url === url && 'focus' in client) return client.focus()
      }
      if (self.clients.openWindow) return self.clients.openWindow(url)
    })
  )
})
