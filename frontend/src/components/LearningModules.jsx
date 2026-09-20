import { useEffect, useState } from 'react'
import { Play, Clock3, X, BookOpen, Loader2, AlertCircle, Video, WifiOff } from 'lucide-react'
import { fetchVideos } from '../services/api'
import { isOnline, subscribeNetworkStatus } from '../services/networkStatus'
import { getCachedLearningModules, saveCachedLearningModules } from '../services/offlineDb'

function extractYoutubeId(input) {
  if (!input) return ''
  const trimmed = input.trim()
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([\w-]{11})/,
    /(?:youtu\.be\/)([\w-]{11})/,
    /(?:youtube\.com\/embed\/)([\w-]{11})/,
  ]
  for (const pattern of patterns) {
    const match = trimmed.match(pattern)
    if (match) return match[1]
  }
  return /^[\w-]{11}$/.test(trimmed) ? trimmed : ''
}

function getThumbnail(module) {
  if (module.thumbnail && module.thumbnail.trim()) {
    return module.thumbnail.trim()
  }
  const ytId = module.youtubeId || extractYoutubeId(module.videoUrl)
  if (ytId) {
    return `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`
  }
  return ''
}

function VideoModal({ module, onClose }) {
  const offline = !isOnline()

  useEffect(() => {
    function handleEscape(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onClose])

  const ytId = module.youtubeId || extractYoutubeId(module.videoUrl)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl overflow-hidden rounded-xl bg-white shadow-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">{module.title}</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              {module.publisher} · {module.duration}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close video"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={18} />
          </button>
        </div>
        <div className="aspect-video w-full bg-slate-900">
          {offline ? (
            <div className="flex h-full w-full flex-col items-center justify-center p-6 text-white text-center">
              <WifiOff size={32} className="text-amber-400 mb-3" />
              <p className="text-sm font-semibold">Internet Connection Required</p>
              <p className="mt-1 text-xs text-slate-300 max-w-sm">
                Video streaming requires an active internet connection. Module metadata is available offline from cache.
              </p>
            </div>
          ) : ytId ? (
            <iframe
              className="h-full w-full"
              src={`https://www.youtube.com/embed/${ytId}?autoplay=1`}
              title={module.title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : module.videoUrl ? (
            <div className="flex h-full w-full flex-col items-center justify-center p-6 text-white text-center">
              <p className="text-sm">This video is hosted externally:</p>
              <a
                href={module.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500"
              >
                Open External Video ↗
              </a>
            </div>
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
              Video stream unavailable
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ModuleCard({ module, onOpen }) {
  const thumbnail = getThumbnail(module)
  const categoryLabel =
    (module.tags && module.tags[0]) ||
    (module.fieldMarks && module.fieldMarks[0]) ||
    'Learning Module'

  return (
    <button
      type="button"
      onClick={() => onOpen(module)}
      className="group text-left rounded-xl border border-slate-200 bg-white shadow-card transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-video overflow-hidden rounded-t-xl bg-slate-900">
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={module.title ? `${module.title} preview thumbnail` : 'Learning module preview thumbnail'}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover opacity-80 transition-opacity group-hover:opacity-60"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-slate-800 text-slate-400">
            <Video size={32} />
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-indigo-600 shadow-md transition-transform group-hover:scale-105">
            <Play size={18} fill="currentColor" />
          </div>
        </div>
        <span className="absolute bottom-2 right-2 rounded-md bg-slate-900/80 px-1.5 py-0.5 text-[11px] font-medium text-white">
          {module.duration}
        </span>
      </div>
      <div className="p-4">
        <p className="text-[11px] font-medium uppercase tracking-wide text-indigo-600">
          {categoryLabel}
        </p>
        <h3 className="mt-1 text-sm font-semibold leading-snug text-slate-900 line-clamp-2">
          {module.title}
        </h3>
        <p className="mt-1.5 text-xs text-slate-500">{module.publisher}</p>
      </div>
    </button>
  )
}

export default function LearningModules() {
  const [modules, setModules] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeModule, setActiveModule] = useState(null)
  const [isOffline, setIsOffline] = useState(!isOnline())

  async function loadVideos() {
    setLoading(true)
    setError(null)
    try {
      // 1. Load cached learning modules immediately
      const cached = await getCachedLearningModules()
      if (cached && cached.length > 0) {
        setModules(cached)
      }

      // 2. Fetch fresh data if online
      if (isOnline()) {
        const res = await fetchVideos({ status: 'Published' })
        const list = (res?.videos || []).filter((v) => v.status !== 'Draft')
        setModules(list)
        if (list.length > 0) {
          await saveCachedLearningModules(list)
        }
      }
    } catch (err) {
      console.warn('[LearningCenter] Failed to fetch online videos, keeping cached list:', err.message)
      const cached = await getCachedLearningModules()
      if (cached && cached.length > 0) {
        setModules(cached)
      } else {
        setError(err.message || 'Failed to load learning videos')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const unsub = subscribeNetworkStatus((online) => {
      setIsOffline(!online)
      if (online) {
        loadVideos()
      }
    })
    loadVideos()
    return unsub
  }, [])

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Offline Alert Banner */}
      {isOffline && (
        <div className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-medium text-amber-800">
          <div className="flex items-center gap-2">
            <WifiOff size={16} className="text-amber-600 shrink-0" />
            <span>
              <strong>Offline Mode Active:</strong> Showing cached learning modules. Video streaming requires an active internet connection.
            </span>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-card">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
            <BookOpen size={17} />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-900">Learning Center</h1>
            <p className="text-sm text-slate-500">
              Curated by partner companies and administrators to close your skill gaps.
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          <p className="mt-3 text-xs">Loading learning modules from database...</p>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-red-500" />
          <p className="mt-2 text-sm font-medium text-red-800">{error}</p>
          <button
            type="button"
            onClick={loadVideos}
            className="mt-3 rounded-lg bg-red-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-red-500"
          >
            Retry
          </button>
        </div>
      ) : modules.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center shadow-sm">
          <Video className="h-10 w-10 text-slate-300" />
          <h3 className="mt-3 text-base font-semibold text-slate-800">
            No learning videos available yet
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Check back soon as administrators add new learning content.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((module) => (
            <ModuleCard key={module._id} module={module} onOpen={setActiveModule} />
          ))}
        </div>
      )}

      {activeModule && (
        <VideoModal module={activeModule} onClose={() => setActiveModule(null)} />
      )}

      {!loading && !error && modules.length > 0 && (
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <Clock3 size={12} />
          Total videos available: {modules.length} modules
        </div>
      )}
    </div>
  )
}
