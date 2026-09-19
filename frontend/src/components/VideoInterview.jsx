import { useCallback, useEffect, useState } from 'react'
import InterviewSetup from './interview/InterviewSetup'
import LiveInterview from './interview/LiveInterview'
import InterviewResult from './interview/InterviewResult'
import { createInterviewApi, fetchInterviewById, finishInterviewApi } from '../services/api'

// Phase router for the AI Mock Interview page (/interview).
// setup → live → result. Session state is recoverable: if a refresh happens
// mid-interview, the setup screen lets the user start again (the backend
// preserves the stored session), and finished interviews are viewable from
// the Previous Interviews panel.

export default function VideoInterview() {
  const [phase, setPhase] = useState('setup')
  const [session, setSession] = useState(null)
  const [result, setResult] = useState(null)
  const [finishError, setFinishError] = useState('')

  const handleStart = useCallback(async (config) => {
    const data = await createInterviewApi(config)
    setSession({ id: data.sessionId, role: data.role, company: data.company, level: data.level })
    setPhase('live')
  }, [])

  const handleFinished = useCallback(async (sessionId) => {
    setFinishError('')
    try {
      const data = await finishInterviewApi(sessionId)
      const interview = data?.session || null
      if (interview) {
        setResult(interview)
        setPhase('result')
      }
      return interview
    } catch (err) {
      setFinishError(err.message || 'Could not generate your results.')
      throw err
    }
  }, [])

  const handleRetake = useCallback(() => {
    setSession(null)
    setResult(null)
    setFinishError('')
    setPhase('setup')
  }, [])

  // Expose a detail-viewer so the Previous Interviews panel can open a past
  // interview in-place without navigation. Listens for a custom event.
  const [detailInterview, setDetailInterview] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function openDetail(e) {
      const sessionId = e.detail?.sessionId
      if (!sessionId) return
      try {
        const data = await fetchInterviewById(sessionId)
        if (!cancelled && data?.interview) {
          setDetailInterview(data.interview)
        }
      } catch {
        // Ownership/network errors silently ignored; the panel shows its own state.
      }
    }
    window.addEventListener('internsetu:open-interview', openDetail)
    return () => {
      cancelled = true
      window.removeEventListener('internsetu:open-interview', openDetail)
    }
  }, [])

  if (detailInterview) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => setDetailInterview(null)}
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
        >
          ← Back to interviews
        </button>
        <InterviewResult interview={detailInterview} onRetake={handleRetake} />
      </div>
    )
  }

  if (phase === 'result' && result) {
    return (
      <div className="space-y-4">
        {finishError && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{finishError}</div>
        )}
        <InterviewResult interview={result} onRetake={handleRetake} />
      </div>
    )
  }

  if (phase === 'live' && session) {
    return <LiveInterview session={session} onFinished={handleFinished} onExit={handleRetake} />
  }

  return <InterviewSetup onStart={handleStart} />
}
