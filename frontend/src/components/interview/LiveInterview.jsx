import { useCallback, useEffect, useRef, useState } from 'react'
import {
  AlertTriangle, Bot, Check, Loader2, Mic, MicOff, PhoneOff,
  RefreshCw, Send, Volume2,
} from 'lucide-react'
import useDeepgramVoice from './useDeepgramVoice'
import {
  startInterviewApi,
  respondInterviewApi,
} from '../../services/api'

// Speak a question through the browser's speech synthesis (same approach as
// the reference implementation — no extra TTS dependency).
function speak(text, onEnd) {
  if (!('speechSynthesis' in window)) {
    onEnd?.()
    return () => {}
  }
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.rate = 1.02
  utterance.onend = () => onEnd?.()
  utterance.onerror = () => onEnd?.()
  window.speechSynthesis.cancel()
  window.speechSynthesis.speak(utterance)
  // Watchdog: restore mic even if onend never fires.
  const watchdog = setTimeout(() => onEnd?.(), Math.min(60000, 3000 + text.length * 90))
  return () => {
    clearTimeout(watchdog)
    try { window.speechSynthesis.cancel() } catch {}
  }
}

export default function LiveInterview({ session, onFinished, onExit }) {
  const [phase, setPhase] = useState('starting') // starting | ai-speaking | listening | processing | error
  const [question, setQuestion] = useState('')
  const [questionType, setQuestionType] = useState('')
  const [turns, setTurns] = useState([])
  const [submitError, setSubmitError] = useState('')
  const [ending, setEnding] = useState(false)
  const cancelSpeechRef = useRef(null)
  const questionCountRef = useRef(0)

  const voice = useDeepgramVoice()

  // Register the finalized-segment callback (final transcripts append to
  // the editable draft automatically inside the hook).
  useEffect(() => {
    voice.onFinalSegment(() => {})
  }, [voice])

  const beginAiSpeaking = useCallback((text) => {
    setPhase('ai-speaking')
    voice.setMicMuted(true)
    cancelSpeechRef.current = speak(text, () => {
      cancelSpeechRef.current = null
      voice.setMicMuted(false)
      setPhase('listening')
    })
  }, [voice])

  // Start (or resume) the interview on mount.
  useEffect(() => {
    let cancelled = false
    async function begin() {
      setSubmitError('')
      try {
        const data = await startInterviewApi(session.id)
        if (cancelled) return
        setQuestion(data.question || '')
        setQuestionType(data.questionType || 'introduction')
        questionCountRef.current = 1
        setTurns([{ speaker: 'interviewer', text: data.question || '' }])
        // Resume case: backend may already have turns; show them.
        if (data.resumeTurns) setTurns(data.resumeTurns)
        beginAiSpeaking(data.question || '')
        await voice.start()
      } catch (err) {
        if (!cancelled) {
          setSubmitError(err.message || 'Could not start the interview.')
          setPhase('error')
        }
      }
    }
    begin()
    return () => {
      cancelled = true
      if (cancelSpeechRef.current) cancelSpeechRef.current()
      voice.stop()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.id])

  // Mute mic while processing to prevent the AI's own TTS / noise entering
  // the transcript stream.
  useEffect(() => {
    if (phase === 'processing') voice.setMicMuted(true)
  }, [phase, voice])

  async function handleSubmit() {
    const answer = voice.draft.trim()
    if (!answer || phase === 'processing' || phase === 'ai-speaking') return

    setSubmitError('')
    setPhase('processing')
    voice.setMicMuted(true)

    try {
      setTurns((prev) => [...prev, { speaker: 'candidate', text: answer }])
      const data = await respondInterviewApi(session.id, answer)

      voice.editDraft('')

      if (data.finished) {
        setPhase('processing')
        setEnding(true)
        await finish()
        return
      }

      setQuestion(data.message)
      setQuestionType(data.questionType || 'follow-up')
      questionCountRef.current += 1
      setTurns((prev) => [...prev, { speaker: 'interviewer', text: data.message }])
      beginAiSpeaking(data.message)
    } catch (err) {
      // Remove optimistically-added candidate turn on failure so the user
      // can retry without duplication.
      setTurns((prev) => prev.slice(0, -1))
      if (err?.data?.completed) {
        setEnding(true)
        await finish()
        return
      }
      setSubmitError(err.message || 'Could not submit your answer. Please try again.')
      setPhase('listening')
      voice.setMicMuted(false)
    }
  }

  async function finish() {
    if (cancelSpeechRef.current) cancelSpeechRef.current()
    voice.stop()
    setPhase('processing')
    try {
      const result = await onFinished(session.id)
      // onFinished switches the parent to the result view.
      return result
    } catch (err) {
      setSubmitError(err.message || 'Could not complete the interview.')
      setPhase('error')
    }
  }

  const statusLabel = {
    starting: 'Starting…',
    'ai-speaking': 'AI is speaking…',
    listening: voice.reconnecting ? 'Reconnecting…' : 'Listening — speak or type your answer',
    processing: 'Evaluating your answer…',
    error: 'Voice error',
  }[phase] || ''

  const micActive = phase === 'listening' && !voice.reconnecting

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">AI Mock Interview</h1>
          <p className="mt-1 text-sm text-slate-500">
            {session.role}{session.company ? ` · ${session.company}` : ''} · {session.level}
          </p>
        </div>
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">
          <span className={`h-1.5 w-1.5 rounded-full ${phase === 'listening' ? 'animate-pulse bg-teal-500' : 'bg-amber-500'}`} />
          {statusLabel}
        </span>
      </div>

      {submitError && (
        <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <div className="flex-1">
            {submitError}
            <button
              type="button"
              onClick={() => { setSubmitError(''); setPhase('listening'); voice.setMicMuted(false) }}
              className="ml-2 font-semibold underline"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Interviewer panel */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-card sm:p-8">
            <div className="flex flex-col items-center gap-4 py-2 text-center">
              <div className={`flex h-20 w-20 items-center justify-center rounded-full transition-all ${
                phase === 'ai-speaking'
                  ? 'bg-teal-500/15 ring-4 ring-teal-500/20'
                  : phase === 'listening'
                    ? 'bg-indigo-50 ring-4 ring-indigo-500/10'
                    : 'bg-slate-100'
              }`}>
                {phase === 'ai-speaking' ? (
                  <Volume2 size={30} className="animate-pulse text-teal-600" />
                ) : (
                  <Bot size={30} className="text-indigo-600" />
                )}
              </div>
              <div className="max-w-xl">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  AI Interviewer{questionType ? ` · ${questionType}` : ''}
                </p>
                <p className="mt-2 text-base font-medium leading-relaxed text-slate-900">
                  {phase === 'starting' ? 'Connecting to the interviewer…' : question}
                </p>
              </div>
              <button
                type="button"
                onClick={() => beginAiSpeaking(question)}
                className="mt-1 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-50"
              >
                <Volume2 size={13} /> Replay question
              </button>
            </div>
          </div>

          {/* Answer editor — transcript is editable before submission */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mic size={15} className={micActive ? 'text-teal-600' : 'text-slate-400'} />
                <h2 className="text-sm font-semibold text-slate-900">Your answer</h2>
              </div>
              <span className="text-[11px] text-slate-400">You can edit the transcript before submitting</span>
            </div>

            {voice.error && (
              <div className="mt-3 flex items-start justify-between gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                <span>{voice.error}</span>
                <button
                  type="button"
                  onClick={voice.reconnect}
                  className="flex shrink-0 items-center gap-1 font-semibold underline"
                >
                  <RefreshCw size={12} /> Reconnect Voice
                </button>
              </div>
            )}
            {voice.reconnecting && !voice.error && (
              <div className="mt-3 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                <Loader2 size={13} className="animate-spin" /> Voice connection dropped — reconnecting… Your text is saved.
              </div>
            )}

            <textarea
              value={voice.draft + (voice.interim ? ` ${voice.interim}` : '')}
              onChange={(e) => voice.editDraft(e.target.value)}
              disabled={phase !== 'listening'}
              rows={5}
              placeholder={
                micActive
                  ? 'Speak your answer — it will appear here live. Or type directly.'
                  : phase === 'ai-speaking'
                    ? 'Listen to the question first…'
                    : 'Your answer…'
              }
              className="mt-3 w-full resize-none rounded-xl border border-slate-200 px-3.5 py-3 text-sm leading-relaxed text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:bg-slate-50 disabled:text-slate-400"
            />

            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                {micActive ? (
                  <>
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-teal-500" />
                    Microphone live
                  </>
                ) : (
                  <>
                    <MicOff size={12} /> Microphone {phase === 'processing' ? 'muted while evaluating' : 'inactive'}
                  </>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={voice.reconnect}
                  disabled={phase !== 'listening'}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                >
                  <RefreshCw size={13} /> Reconnect
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={phase !== 'listening' || !voice.draft.trim()}
                  className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-500 disabled:opacity-50"
                >
                  {phase === 'processing' ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                  Submit Answer
                </button>
              </div>
            </div>
          </div>

          {/* End interview */}
          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-card">
            <p className="text-xs text-slate-500">
              Question {questionCountRef.current} · End anytime to receive your evaluation.
            </p>
            <button
              type="button"
              onClick={finish}
              disabled={ending || phase === 'starting'}
              className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-red-500 disabled:opacity-50"
            >
              {ending ? <Loader2 size={14} className="animate-spin" /> : <PhoneOff size={14} />}
              End Interview
            </button>
          </div>
        </div>

        {/* Live transcript sidebar */}
        <div className="flex max-h-[70vh] flex-col rounded-xl border border-slate-200 bg-white shadow-card">
          <div className="border-b border-slate-100 px-4 py-3.5">
            <h2 className="text-sm font-semibold text-slate-900">Live transcript</h2>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {turns.map((turn, i) => (
              <div key={i}>
                <p className={`text-[11px] font-semibold uppercase tracking-wide ${turn.speaker === 'interviewer' ? 'text-slate-400' : 'text-indigo-500'}`}>
                  {turn.speaker === 'interviewer' ? 'AI Interviewer' : 'You'}
                </p>
                <p className="mt-0.5 text-sm leading-relaxed text-slate-700">{turn.text}</p>
              </div>
            ))}
            {turns.length === 0 && (
              <p className="text-xs italic text-slate-400">The conversation will appear here…</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
