import { useCallback, useEffect, useState } from 'react'
import { ChevronDown, ChevronUp, History, Loader2 } from 'lucide-react'
import { fetchMyInterviews, fetchInterviewById } from '../services/api'

// Compact "Previous Interviews" panel — fixed bottom-right, stacked ABOVE
// the existing AI Career Mentor chatbot (which occupies bottom-6 right-6 and
// opens at bottom-24). Opens the full interview detail on the /interview
// page via a custom window event (VideoInterview.jsx listens for it).

export default function PreviousInterviews() {
  const [open, setOpen] = useState(false)
  const [interviews, setInterviews] = useState([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchMyInterviews()
      setInterviews(data?.interviews || [])
    } catch {
      setInterviews([])
    } finally {
      setLoading(false)
    }
  }, [])

  // Lazy-load: fetch only when the panel is first opened.
  useEffect(() => {
    if (open && interviews.length === 0 && !loading) load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  function handleOpenInterview(sessionId) {
    window.dispatchEvent(new CustomEvent('internsetu:open-interview', { detail: { sessionId } }))
    window.dispatchEvent(new CustomEvent('internsetu:navigate-interview'))
    setOpen(false)
  }

  function statusBadge(interview) {
    if (interview.status === 'Done') {
      return (
        <span className="rounded bg-teal-50 px-1.5 py-0.5 text-[10px] font-bold text-teal-700">
          {interview.evaluation?.overallScore != null ? `${interview.evaluation.overallScore}%` : 'Done'}
        </span>
      )
    }
    if (interview.status === 'InProgress') {
      return <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">In progress</span>
    }
    return <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-500">Prepared</span>
  }

  return (
    <div className="fixed bottom-40 right-6 z-40 hidden sm:block">
      {open && (
        <div className="mb-2 max-h-[320px] w-[300px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-md">
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-900 px-4 py-3">
            <div className="flex items-center gap-2">
              <History size={14} className="text-teal-400" />
              <p className="text-sm font-medium text-white">Previous Interviews</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close previous interviews"
              className="flex h-6 w-6 items-center justify-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-white"
            >
              <ChevronDown size={14} />
            </button>
          </div>

          <div className="max-h-[264px] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-8 text-xs text-slate-400">
                <Loader2 size={14} className="animate-spin" /> Loading…
              </div>
            ) : interviews.length === 0 ? (
              <p className="px-4 py-8 text-center text-xs text-slate-400">
                No interviews yet. Start one from the AI Mock Interview page.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {interviews.map((interview) => (
                  <li key={interview._id}>
                    <button
                      type="button"
                      onClick={() => handleOpenInterview(interview._id)}
                      className="w-full px-4 py-2.5 text-left transition-colors hover:bg-slate-50"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-xs font-semibold text-slate-800">
                          {interview.title || `${interview.role} interview`}
                        </p>
                        {statusBadge(interview)}
                      </div>
                      <p className="mt-0.5 truncate text-[11px] text-slate-400">
                        {interview.role}
                        {interview.company ? ` · ${interview.company}` : ''} ·{' '}
                        {new Date(interview.createdAt).toLocaleDateString()}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label={open ? 'Close previous interviews' : 'Open previous interviews'}
        className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-md transition-colors hover:bg-slate-50"
      >
        {open ? <ChevronDown size={18} /> : <History size={18} />}
      </button>
    </div>
  )
}
