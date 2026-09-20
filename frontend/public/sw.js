/**
 * sw.js - InternSetu Service Worker
 * 
 * Minimal, reliable App Shell caching for offline presentation.
 * STRICT POLICY:
 *  - Caches App Shell (HTML, CSS, JS bundles, icons, manifests, static assets).
 *  - NEVER caches /api/* routes (application data is managed exclusively via IndexedDB).
 */

const CACHE_NAME = 'internsetu-shell-v1'

const APP_SHELL_ASSETS = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/site.webmanifest',
  '/assets/state-emblem-india.png',
]

// ── Install: Pre-cache App Shell ───────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Pre-caching App Shell...')
      return cache.addAll(APP_SHELL_ASSETS).catch((err) => {
        console.warn('[SW] Some assets could not be pre-cached:', err)
      })
    })
  )
  self.skipWaiting()
})

// ── Activate: Clean old caches ────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Removing old cache:', key)
            return caches.delete(key)
          }
        })
      )
    })
  )
  self.clients.claim()
})

// ── Fetch Handler: App Shell & Assets Caching (No API caching) ────────────
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // 1. STRICTLY BYPASS API REQUESTS - IndexedDB handles all data!
  if (url.pathname.startsWith('/api/')) {
    return
  }

  // 2. Navigation Requests (HTML pages)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy))
          }
          return response
        })
        .catch(async () => {
          // Offline fallback for navigation: return cached index.html or root
          const cachedPage = await caches.match(event.request)
          if (cachedPage) return cachedPage
          const cachedShell = await caches.match('/index.html')
          if (cachedShell) return cachedShell
          return caches.match('/')
        })
    )
    return
  }

  // 3. Static Assets: JS, CSS, images, icons, fonts
  const isStaticAsset =
    url.pathname.startsWith('/assets/') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.woff2') ||
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com')

  if (isStaticAsset) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          // Revalidate in background if online
          fetch(event.request)
            .then((fresh) => {
              if (fresh && fresh.status === 200) {
                caches.open(CACHE_NAME).then((cache) => cache.put(event.request, fresh))
              }
            })
            .catch(() => {})
          return cachedResponse
        }

        return fetch(event.request)
          .then((response) => {
            if (response && response.status === 200) {
              const copy = response.clone()
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy))
            }
            return response
          })
          .catch(() => caches.match(event.request))
      })
    )
  }
})
