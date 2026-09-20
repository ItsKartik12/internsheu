import { useState, useEffect, useCallback } from 'react'
import { Wifi, WifiOff, RefreshCw, CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react'
import { isOnline, subscribeNetworkStatus } from '../services/networkStatus'
import { subscribeSyncStatus, syncNow } from '../services/syncManager'
import { hasPendingSync, getPendingOperations } from '../services/offlineDb'

export default function OfflineSyncBadge({ userId, onSyncComplete, className = '' }) {
  const [networkOnline, setNetworkOnline] = useState(() => isOnline())
  const [syncState, setSyncState] = useState({
    status: 'idle',
    isSyncing: false,
    lastError: null,
  })
  const [hasPending, setHasPending] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)

  // Check pending operations count
  const refreshPendingCount = useCallback(async () => {
    if (!userId) return
    try {
      const pending = await getPendingOperations(userId)
      setHasPending(pending.length > 0)
      setPendingCount(pending.length)
    } catch {
      setHasPending(false)
      setPendingCount(0)
    }
  }, [userId])

  useEffect(() => {
    refreshPendingCount()
  }, [refreshPendingCount])

  // Subscribe to network events
  useEffect(() => {
    const unsubscribeNetwork = subscribeNetworkStatus((online) => {
      setNetworkOnline(online)
      refreshPendingCount()
    })
    return () => unsubscribeNetwork()
  }, [refreshPendingCount])

  // Subscribe to sync manager events
  useEffect(() => {
    const unsubscribeSync = subscribeSyncStatus((state) => {
      setSyncState(state)
      refreshPendingCount()
      if (state.status === 'synced' && state.syncedProfile && onSyncComplete) {
        onSyncComplete(state.syncedProfile)
      }
    })
    return () => unsubscribeSync()
  }, [onSyncComplete, refreshPendingCount])

  const handleManualSync = async () => {
    if (syncState.isSyncing) return
    await syncNow(userId)
    await refreshPendingCount()
  }

  // Determine badge visuals
  if (!networkOnline) {
    return (
      <div className={`inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-medium text-rose-700 shadow-sm ${className}`}>
        <span className="relative flex h-2 w-2">
          <span className="h-2 w-2 rounded-full bg-rose-500" />
        </span>
        <WifiOff size={13} className="text-rose-500" />
        <span>{hasPending ? 'Offline · Pending Sync' : 'Offline'}</span>
        {hasPending && pendingCount > 0 && (
          <span className="ml-0.5 rounded bg-rose-200 px-1 py-0.2 text-[10px] font-semibold text-rose-800">
            {pendingCount}
          </span>
        )}
      </div>
    )
  }

  if (syncState.isSyncing) {
    return (
      <div className={`inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 shadow-sm ${className}`}>
        <RefreshCw size={13} className="animate-spin text-amber-600" />
        <span>Syncing...</span>
      </div>
    )
  }

  if (hasPending) {
    return (
      <div className={`inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800 shadow-sm ${className}`}>
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
        </span>
        <AlertTriangle size={13} className="text-amber-600" />
        <span>Sync Pending ({pendingCount})</span>
        <button
          type="button"
          onClick={handleManualSync}
          className="ml-1 inline-flex items-center gap-1 rounded bg-amber-200 px-1.5 py-0.5 text-[11px] font-semibold text-amber-900 transition hover:bg-amber-300"
        >
          <RefreshCw size={11} /> Sync Now
        </button>
      </div>
    )
  }

  if (syncState.status === 'failed' && syncState.lastError) {
    return (
      <div className={`inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-medium text-red-700 shadow-sm ${className}`}>
        <AlertCircle size={13} className="text-red-500" />
        <span>Sync Failed</span>
        <button
          type="button"
          onClick={handleManualSync}
          className="ml-1 inline-flex items-center gap-1 rounded bg-red-200 px-1.5 py-0.5 text-[11px] font-semibold text-red-900 transition hover:bg-red-300"
        >
          Retry
        </button>
      </div>
    )
  }

  // Default: Online and Synced
  return (
    <div className={`inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 shadow-sm ${className}`}>
      <span className="relative flex h-2 w-2">
        <span className="h-2 w-2 rounded-full bg-emerald-500" />
      </span>
      <Wifi size={13} className="text-emerald-600" />
      <CheckCircle2 size={13} className="text-emerald-600" />
      <span>Online · Synced</span>
    </div>
  )
}
