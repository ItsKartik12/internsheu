import { useEffect, useState } from 'react'
import { Play, Clock3, X, BookOpen } from 'lucide-react'

// Mock catalog — swap youtubeId for real content, or add a `videoUrl` field
// and branch the player src in VideoModal if you move to a custom CDN.
const LEARNING_MODULES = [
  {
    id: 'LM-01',
    title: 'Cloud Architecture Fundamentals: AWS vs Azure',
    publisher: 'Zenith Cloud Labs',
    duration: '18 min',
    category: 'Cloud & DevOps',
    youtubeId: 'M7lc1UVf-VE',
  },
  {
    id: 'LM-02',
    title: 'System Design Interviews: Scaling a REST API',
    publisher: 'Nexora Analytics',
    duration: '24 min',
    category: 'Core CS',
    youtubeId: 'UzLMhqg3_Wc',
  },
  {
    id: 'LM-03',
    title: 'Containers 101: Docker & CI/CD Pipelines',
    publisher: 'Zenith Cloud Labs',
    duration: '15 min',
    category: 'Cloud & DevOps',
    youtubeId: '3c-iBn73dDE',
  },
  {
    id: 'LM-04',
    title: 'Advanced Database Modeling for Production Systems',
    publisher: 'Bharat FinTech Works',
    duration: '21 min',
    category: 'Data',
    youtubeId: 'ztHopE5Wnpc',
  },
  {
    id: 'LM-05',
    title: 'Data Structures & Algorithms: Graph Traversal Patterns',
    publisher: 'Kavach Systems',
    duration: '27 min',
    category: 'Core CS',
    youtubeId: 'tWVWeAqZ0WU',
  },
  {
    id: 'LM-06',
    title: 'Cracking the Technical Interview: Communication Skills',
    publisher: 'Orbit Mobility',
    duration: '12 min',
    category: 'Career Readiness',
    youtubeId: 'HG68Ymazo18',
  },
]

function VideoModal({ module, onClose }) {
  useEffect(() => {
    function handleEscape(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onClose])

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
            <p className="mt-0.5 text-xs text-slate-500">{module.publisher} · {module.duration}</p>
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
          <iframe
            className="h-full w-full"
            src={`https://www.youtube.com/embed/${module.youtubeId}?autoplay=1`}
            title={module.title}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  )
}

function ModuleCard({ module, onOpen }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(module)}
      className="group text-left rounded-xl border border-slate-200 bg-white shadow-card transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-video overflow-hidden rounded-t-xl bg-slate-900">
        <img
          src={`https://img.youtube.com/vi/${module.youtubeId}/hqdefault.jpg`}
          alt=""
          className="h-full w-full object-cover opacity-80 transition-opacity group-hover:opacity-60"
        />
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
        <p className="text-[11px] font-medium uppercase tracking-wide text-indigo-600">{module.category}</p>
        <h3 className="mt-1 text-sm font-semibold leading-snug text-slate-900">{module.title}</h3>
        <p className="mt-1.5 text-xs text-slate-500">{module.publisher}</p>
      </div>
    </button>
  )
}

export default function LearningModules() {
  const [activeModule, setActiveModule] = useState(null)

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-card">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
            <BookOpen size={17} />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-900">Learning Center</h1>
            <p className="text-sm text-slate-500">Curated by partner companies to close your skill gaps.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {LEARNING_MODULES.map((module) => (
          <ModuleCard key={module.id} module={module} onOpen={setActiveModule} />
        ))}
      </div>

      {activeModule && (
        <VideoModal module={activeModule} onClose={() => setActiveModule(null)} />
      )}

      <div className="flex items-center gap-1.5 text-xs text-slate-400">
        <Clock3 size={12} />
        Total watch time in catalog: {LEARNING_MODULES.length} modules
      </div>
    </div>
  )
}
