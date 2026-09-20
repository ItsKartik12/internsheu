/**
 * syncManager.js
 * 
 * Production-grade Synchronization Manager for InternSetu Offline Sync.
 * Orchestrates sending pending offline updates from IndexedDB to the real Express
 * backend, updating MongoDB, and ensuring operations are marked completed only
 * upon real backend success.
 */

import {
  getPendingOperations,
  updateQueueItem,
  saveLocalProfile,
  hasPendingSync,
  getLocalProfile,
  saveAssessmentAttempt,
  saveCachedAssessmentResults,
} from './offlineDb.js'
import { isOnline, subscribeNetworkStatus } from './networkStatus.js'
import { request } from './api.js'

let isSyncing = false
let lastSyncStatus = 'idle' // 'idle' | 'syncing' | 'synced' | 'failed'
let lastError = null
const syncListeners = new Set()

/**
 * Notify all subscribed UI components and listeners of sync progress/status changes.
 */
function notifySyncListeners(state) {
  for (const listener of syncListeners) {
    try {
      listener(state)
    } catch (err) {
      console.error('[OfflineSync] Error in sync listener:', err)
    }
  }
}

/**
 * Subscribe to sync events.
 * @param {(state: { status: string, isSyncing: boolean, lastError: string|null, syncedProfile?: object, syncedAssessment?: object }) => void} callback
 * @returns {() => void} unsubscribe function
 */
export function subscribeSyncStatus(callback) {
  syncListeners.add(callback)
  // Send current state
  try {
    callback({
      status: lastSyncStatus,
      isSyncing,
      lastError,
    })
  } catch (err) {
    console.error('[OfflineSync] Error calling initial sync listener:', err)
  }

  return () => {
    syncListeners.delete(callback)
  }
}

/**
 * Get current sync status snapshot.
 */
export function getSyncStatus() {
  return {
    status: lastSyncStatus,
    isSyncing,
    lastError,
  }
}

/**
 * Synchronize all pending operations for a user (or all users) with the backend.
 * @param {string} [userId]
 * @returns {Promise<{ success: boolean, syncedCount: number, error: string|null, syncedProfile: object|null, syncedAssessment: object|null }>}
 */
export async function syncPendingOperations(userId = null) {
  // Prevent concurrent synchronization runs
  if (isSyncing) {
    console.log('[OfflineSync] Sync already in progress, skipping duplicate call.')
    return { success: false, syncedCount: 0, error: 'Sync already in progress', syncedProfile: null, syncedAssessment: null }
  }

  if (!isOnline()) {
    console.log('[OfflineSync] Cannot sync while offline.')
    return { success: false, syncedCount: 0, error: 'Network is offline', syncedProfile: null, syncedAssessment: null }
  }

  const pending = await getPendingOperations(userId)
  if (!pending || pending.length === 0) {
    lastSyncStatus = 'synced'
    notifySyncListeners({ status: 'synced', isSyncing: false, lastError: null })
    return { success: true, syncedCount: 0, error: null, syncedProfile: null, syncedAssessment: null }
  }

  isSyncing = true
  lastSyncStatus = 'syncing'
  lastError = null

  console.log(`[OfflineSync] Sync started for ${pending.length} pending operation(s)`)
  notifySyncListeners({
    status: 'syncing',
    isSyncing: true,
    lastError: null,
    pendingCount: pending.length,
  })

  let syncedCount = 0
  let lastSyncedProfile = null
  let lastSyncedAssessment = null

  for (const operation of pending) {
    console.log(`[OfflineSync] Syncing operation: ${operation.operationId} (type: ${operation.type})`)

    // Mark status in IndexedDB as syncing
    await updateQueueItem(operation.operationId, {
      status: 'syncing',
    })

    try {
      // Branch 1: Assessment submission
      if (operation.type === 'SUBMIT_ASSESSMENT') {
        const response = await request('/api/assessment/submit', {
          method: 'POST',
          body: JSON.stringify(operation.payload),
        })

        if (!response) {
          throw new Error('Invalid assessment response from server during sync')
        }

        await updateQueueItem(operation.operationId, {
          status: 'completed',
          error: null,
        })

        console.log(`[OfflineSync] Sync successful for assessment operation: ${operation.operationId}`)
        console.log('[OfflineSync] Assessment operation completed')

        const attemptKey = `${operation.userId}_${operation.payload.topicId}`
        await saveAssessmentAttempt({
          attemptKey,
          userId: operation.userId,
          topicId: operation.payload.topicId,
          status: 'completed',
          result: response,
        })

        await saveCachedAssessmentResults(operation.userId, {
          latestAttempt: response,
          topicId: operation.payload.topicId,
          syncedAt: Date.now(),
        })

        syncedCount++
        lastSyncedAssessment = response

        notifySyncListeners({
          status: 'syncing',
          isSyncing: true,
          lastError: null,
          pendingCount: pending.length - syncedCount,
          syncedAssessment: response,
        })
        continue
      }

      // Branch 2: Industry Assessment submission
      if (operation.type === 'SUBMIT_INDUSTRY_ASSESSMENT') {
        const { assessmentId, answers, timeTakenSeconds } = operation.payload
        const response = await request(`/api/student/industry-assessments/${assessmentId}/submit`, {
          method: 'POST',
          body: JSON.stringify({ answers, timeTakenSeconds }),
        })

        if (!response) {
          throw new Error('Invalid response from server during industry assessment sync')
        }

        await updateQueueItem(operation.operationId, {
          status: 'completed',
          error: null,
        })

        console.log(`[OfflineSync] Sync successful for industry assessment: ${operation.operationId}`)

        syncedCount++
        notifySyncListeners({
          status: 'syncing',
          isSyncing: true,
          lastError: null,
          pendingCount: pending.length - syncedCount,
          syncedIndustryAssessment: response,
        })
        continue
      }

      // Branch 3: Profile update (preserved exact flow)
      const payloadToSend = {
        ...operation.payload,
        operationId: operation.operationId,
      }

      const response = await request('/api/profile', {
        method: 'PUT',
        body: JSON.stringify(payloadToSend),
      })

      if (!response || !response.profile) {
        throw new Error(response?.error || 'Invalid response from server during sync')
      }

      // 1. Mark queue operation completed in IndexedDB
      await updateQueueItem(operation.operationId, {
        status: 'completed',
        error: null,
      })

      console.log(`[OfflineSync] Sync successful for operation: ${operation.operationId}`)
      console.log('[OfflineSync] Operation completed')

      // 2. Update local IndexedDB profile cache to match MongoDB
      const targetUserId = operation.userId || response.profile.userId
      if (targetUserId) {
        await saveLocalProfile(
          targetUserId,
          response.profile,
          false, // isPendingSync = false now that it's synced!
          response.completionPercentage || 0
        )
      }

      syncedCount++
      lastSyncedProfile = response.profile

      notifySyncListeners({
        status: 'syncing',
        isSyncing: true,
        lastError: null,
        pendingCount: pending.length - syncedCount,
        syncedProfile: response.profile,
        completionPercentage: response.completionPercentage,
      })
    } catch (err) {
      console.error(`[OfflineSync] Sync failed for operation: ${operation.operationId}:`, err.message)
      console.log('[OfflineSync] Sync failed')

      const isValidationError = err.status === 400
      const newRetryCount = (operation.retryCount || 0) + 1

      // Do NOT delete the operation!
      await updateQueueItem(operation.operationId, {
        status: isValidationError ? 'failed' : 'pending', // retryable
        error: err.message,
        retryCount: newRetryCount,
      })

      console.log('[OfflineSync] Retry scheduled')
      lastError = err.message
      lastSyncStatus = 'failed'

      notifySyncListeners({
        status: 'failed',
        isSyncing: false,
        lastError: err.message,
        pendingCount: pending.length - syncedCount,
      })

      isSyncing = false
      return {
        success: false,
        syncedCount,
        error: err.message,
        syncedProfile: lastSyncedProfile,
      }
    }
  }

  isSyncing = false
  lastSyncStatus = 'synced'
  lastError = null

  console.log(`[OfflineSync] All ${syncedCount} operation(s) synchronized successfully with MongoDB.`)
  notifySyncListeners({
    status: 'synced',
    isSyncing: false,
    lastError: null,
    pendingCount: 0,
    syncedProfile: lastSyncedProfile,
  })

  return {
    success: true,
    syncedCount,
    error: null,
    syncedProfile: lastSyncedProfile,
    syncedAssessment: lastSyncedAssessment,
  }
}

/**
 * Manually trigger synchronization.
 * Can be called by a UI "Sync Now" button or user action.
 */
export async function syncNow(userId = null) {
  return syncPendingOperations(userId)
}

// ── Automatic Background Listener ─────────────────────────────────────────
// When network transitions OFFLINE -> ONLINE, automatically trigger sync!
subscribeNetworkStatus(async (networkIsOnline) => {
  if (networkIsOnline) {
    console.log('[OfflineSync] Detected network reconnection. Triggering automatic sync...')
    // Small debounce to allow socket stabilization
    setTimeout(() => {
      syncPendingOperations()
    }, 500)
  }
})
