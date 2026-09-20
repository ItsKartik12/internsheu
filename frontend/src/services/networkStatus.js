/**
 * networkStatus.js
 * 
 * Production-grade network connectivity detection for InternSetu.
 * Listens to native browser online/offline events and provides a subscriber
 * pattern for UI components and the Sync Manager.
 */

let online = typeof navigator !== 'undefined' ? navigator.onLine : true
const listeners = new Set()

function handleOnline() {
  const wasOffline = !online
  online = true
  console.log('[OfflineSync] Network ONLINE')
  if (wasOffline) {
    notifyListeners(true)
  }
}

function handleOffline() {
  const wasOnline = online
  online = false
  console.log('[OfflineSync] Network OFFLINE')
  if (wasOnline) {
    notifyListeners(false)
  }
}

function notifyListeners(isOnline) {
  for (const listener of listeners) {
    try {
      listener(isOnline)
    } catch (err) {
      console.error('[OfflineSync] Error in network status listener:', err)
    }
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)
}

/**
 * Returns current synchronous online status.
 * @returns {boolean}
 */
export function isOnline() {
  return typeof navigator !== 'undefined' ? navigator.onLine : true
}

/**
 * Subscribe to network status changes.
 * @param {(isOnline: boolean) => void} callback
 * @returns {() => void} unsubscribe function
 */
export function subscribeNetworkStatus(callback) {
  listeners.add(callback)
  // Immediate callback with current state
  try {
    callback(isOnline())
  } catch (err) {
    console.error('[OfflineSync] Error calling initial network listener:', err)
  }

  return () => {
    listeners.delete(callback)
  }
}

/**
 * Proactively verifies that the backend is truly reachable via the existing health endpoint.
 * Note: navigator.onLine reports socket connectivity, but the backend server might still be unreachable.
 * @returns {Promise<boolean>}
 */
export async function checkBackendHealth() {
  if (!isOnline()) return false

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 2500)

    // Use current origin or local dev URL
    const env = typeof import.meta !== 'undefined' ? import.meta.env : undefined
    const baseUrl = env?.DEV
      ? (env?.VITE_API_BASE_URL?.trim() || 'http://localhost:5000')
      : (env?.VITE_API_BASE_URL?.trim() || (env ? '' : 'http://localhost:5000'))

    const res = await fetch(`${baseUrl}/api/health`, {
      method: 'GET',
      signal: controller.signal,
      cache: 'no-store',
    })
    clearTimeout(timeoutId)
    return res.ok
  } catch {
    return false
  }
}
