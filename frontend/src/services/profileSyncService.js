/**
 * profileSyncService.js
 * 
 * Production-grade synchronization coordinator for the Student Profile flow.
 * Manages the offline-first load strategy and safe saving flow between React,
 * browser IndexedDB, and the existing Express/MongoDB backend.
 */

import {
  getLocalProfile,
  saveLocalProfile,
  addToSyncQueue,
  getPendingOperations,
  hasPendingSync,
} from './offlineDb.js'
import { isOnline } from './networkStatus.js'
import { fetchProfile, updateProfileApi, request } from './api.js'
import { syncPendingOperations } from './syncManager.js'

/**
 * Load profile with offline-first synchronization strategy:
 * 1. Checks IndexedDB for local pending changes.
 * 2. If pending offline changes exist -> returns the local IndexedDB state!
 *    (Ensures browser refresh preserves offline changes and never reverts to old MongoDB data).
 * 3. If online and no pending changes -> fetches latest from MongoDB and caches in IndexedDB.
 * 4. If offline -> loads cached profile from IndexedDB.
 * 
 * @param {string} userId
 * @returns {Promise<{ profile: object, completionPercentage: number, isPendingSync: boolean, source: string }>}
 */
export async function loadProfileWithSync(userId) {
  const safeUserId = userId ? String(userId) : null
  let localRecord = null

  if (safeUserId) {
    try {
      localRecord = await getLocalProfile(safeUserId)
    } catch (err) {
      console.warn('[OfflineSync] Could not read local profile from IndexedDB:', err)
    }
  }

  // Check if there are pending sync operations waiting for this user
  let hasPending = false
  if (safeUserId) {
    try {
      hasPending = await hasPendingSync(safeUserId)
    } catch (err) {
      console.warn('[OfflineSync] Could not check pending sync in IndexedDB:', err)
    }
  }

  // CRITICAL REFRESH REQUIREMENT:
  // If there are pending offline modifications in IndexedDB, ALWAYS load the local state!
  if (hasPending && localRecord && localRecord.profile) {
    console.log('[OfflineSync] Loading locally saved profile with pending sync changes from IndexedDB.')
    return {
      profile: localRecord.profile,
      completionPercentage: localRecord.completionPercentage || 0,
      isPendingSync: true,
      source: 'indexeddb_pending',
    }
  }

  // If OFFLINE, load the cached local profile from IndexedDB
  if (!isOnline()) {
    console.log('[OfflineSync] Device is offline. Loading cached profile from IndexedDB.')
    if (localRecord && localRecord.profile) {
      return {
        profile: localRecord.profile,
        completionPercentage: localRecord.completionPercentage || 0,
        isPendingSync: Boolean(localRecord.isPendingSync),
        source: 'indexeddb_cache',
      }
    }
  }

  // If ONLINE and no pending offline changes, fetch the canonical profile from MongoDB
  try {
    const serverResponse = await fetchProfile()
    if (serverResponse && serverResponse.profile) {
      // Update IndexedDB cache with fresh server state
      if (safeUserId) {
        try {
          await saveLocalProfile(
            safeUserId,
            serverResponse.profile,
            false, // isPendingSync = false
            serverResponse.completionPercentage || 0
          )
        } catch (cacheErr) {
          console.warn('[OfflineSync] Failed to cache server profile in IndexedDB:', cacheErr)
        }
      }

      return {
        profile: serverResponse.profile,
        completionPercentage: serverResponse.completionPercentage || 0,
        isPendingSync: false,
        source: 'server',
      }
    }
  } catch (apiErr) {
    console.warn('[OfflineSync] Server fetch failed, falling back to IndexedDB:', apiErr.message)
  }

  // Fallback to local record if server fetch failed
  if (localRecord && localRecord.profile) {
    return {
      profile: localRecord.profile,
      completionPercentage: localRecord.completionPercentage || 0,
      isPendingSync: Boolean(localRecord.isPendingSync),
      source: 'indexeddb_fallback',
    }
  }

  return {
    profile: null,
    completionPercentage: 0,
    isPendingSync: false,
    source: 'none',
  }
}

/**
 * Save profile with offline sync resilience:
 * - If OFFLINE: saves to IndexedDB + queues in syncQueue. UI status = "Saved Offline — Pending Sync".
 * - If ONLINE: attempts real PUT /api/profile. If network drops mid-request, gracefully falls back to IndexedDB + queue.
 * 
 * @param {object} profileData
 * @param {string} userId
 * @returns {Promise<{ profile: object, message: string, isOffline: boolean, isPendingSync: boolean, completionPercentage?: number }>}
 */
export async function saveProfileWithSync(profileData, userId) {
  const safeUserId = userId ? String(userId) : 'default_student'

  // CASE 1: OFFLINE SAVE
  if (!isOnline()) {
    console.log('[OfflineSync] Network OFFLINE')
    console.log('[OfflineSync] Profile update saved locally')

    // 1. Save profile state locally in IndexedDB
    await saveLocalProfile(safeUserId, profileData, true, 80)

    // 2. Add operation to persistent Sync Queue
    const op = await addToSyncQueue(safeUserId, 'UPDATE_PROFILE', profileData)

    return {
      profile: profileData,
      message: 'Saved Offline — Pending Sync',
      isOffline: true,
      isPendingSync: true,
      operationId: op.operationId,
    }
  }

  // CASE 2: ONLINE SAVE
  try {
    // Attempt real authenticated PUT /api/profile
    const result = await request('/api/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    })

    // Update local IndexedDB cache with canonical server response
    await saveLocalProfile(
      safeUserId,
      result.profile || profileData,
      false,
      result.completionPercentage || 0
    )

    console.log('[OfflineSync] Profile saved to server and updated in IndexedDB')

    return {
      profile: result.profile || profileData,
      completionPercentage: result.completionPercentage,
      message: result.message || 'Profile saved successfully',
      isOffline: false,
      isPendingSync: false,
    }
  } catch (err) {
    // If validation error (400), throw to let form show validation error
    if (err.status === 400) {
      throw err
    }

    // If network failure / connection timeout / 5xx error, gracefully save offline!
    console.warn('[OfflineSync] Online request failed due to network or server error. Falling back to offline queue:', err.message)
    console.log('[OfflineSync] Profile update saved locally')

    await saveLocalProfile(safeUserId, profileData, true, 80)
    const op = await addToSyncQueue(safeUserId, 'UPDATE_PROFILE', profileData)

    return {
      profile: profileData,
      message: 'Saved Offline — Pending Sync',
      isOffline: true,
      isPendingSync: true,
      operationId: op.operationId,
    }
  }
}
