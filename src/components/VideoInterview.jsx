import { useState } from 'react'
import { Mic, MicOff, Video, VideoOff, PhoneOff, Bot, UserRound, MessageSquareText } from 'lucide-react'

const MOCK_TRANSCRIPT = [
  { id: 't1', speaker: 'ai', text: "Welcome, Vishal. Let's start with something simple — walk me through a project where you used database modeling." },
  { id: 't2', speaker: 'user', text: 'Sure — I built a clustering system for anime content recommendations, where I designed the schema for user preference vectors and metadata tables.' },
  { id: 't3', speaker: 'ai', text: 'Good. How did you decide on normalization vs. denormalization for the metadata tables?' },
  { id: 't4', speaker: 'user', text: 'I normalized the core entity tables but denormalized precomputed similarity scores for read performance...' },
]

export default function VideoInterview() {
  const [isMicOn, setIsMicOn] = useState(true)
  const [isCameraOn, setIsCameraOn] = useState(true)
  const [hasEnded, setHasEnded] = useState(false)

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">AI Mock Interview</h1>
          <p className="mt-1 text-sm text-slate-500">
            Practice round · Cloud & Full-Stack Engineer track
          </p>
        </div>
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">
          <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
          {hasEnded ? 'Session ended' : 'Live session'}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Video stage */}
        <div className="lg:col-span-2">
          <div className="relative aspect-video overflow-hidden rounded-xl bg-slate-900 shadow-card">
            {/* AI interviewer feed placeholder */}
            <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-slate-400">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/5">
                <Bot size={28} className="text-teal-400" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-slate-200">DeepSeek AI Interviewer</p>
                <p className="text-xs text-slate-500">Video feed will render here</p>
              </div>
            </div>

            {/* User webcam corner */}
            <div className="absolute bottom-4 right-4 flex h-28 w-40 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-slate-800 sm:h-32 sm:w-48">
              {isCameraOn ? (
                <div className="flex flex-col items-center gap-1.5 text-slate-400">
                  <UserRound size={22} />
                  <p className="text-[11px]">Your camera</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1.5 text-slate-500">
                  <VideoOff size={18} />
                  <p className="text-[11px]">Camera off</p>
                </div>
              )}
            </div>
          </div>

          {/* Call controls */}
          <div className="mt-4 flex items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-card">
            <button
              type="button"
              onClick={() => setIsMicOn((prev) => !prev)}
              aria-label={isMicOn ? 'Mute microphone' : 'Unmute microphone'}
              className={[
                'flex h-11 w-11 items-center justify-center rounded-full transition-colors',
                isMicOn ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-red-50 text-red-600 hover:bg-red-100',
              ].join(' ')}
            >
              {isMicOn ? <Mic size={18} /> : <MicOff size={18} />}
            </button>
            <button
              type="button"
              onClick={() => setIsCameraOn((prev) => !prev)}
              aria-label={isCameraOn ? 'Turn camera off' : 'Turn camera on'}
              className={[
                'flex h-11 w-11 items-center justify-center rounded-full transition-colors',
                isCameraOn ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-red-50 text-red-600 hover:bg-red-100',
              ].join(' ')}
            >
              {isCameraOn ? <Video size={18} /> : <VideoOff size={18} />}
            </button>
            <button
              type="button"
              onClick={() => setHasEnded(true)}
              aria-label="End call"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-red-600 text-white transition-colors hover:bg-red-500"
            >
              <PhoneOff size={18} />
            </button>
          </div>
        </div>

        {/* Live transcript panel */}
        <div className="flex flex-col rounded-xl border border-slate-200 bg-white shadow-card">
          <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3.5">
            <MessageSquareText size={16} className="text-indigo-600" />
            <h2 className="text-sm font-semibold text-slate-900">Live transcript</h2>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {MOCK_TRANSCRIPT.map((line) => (
              <div key={line.id}>
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                  {line.speaker === 'ai' ? 'AI Interviewer' : 'You'}
                </p>
                <p className="mt-0.5 text-sm leading-relaxed text-slate-700">{line.text}</p>
              </div>
            ))}
            {!hasEnded && (
              <p className="text-xs italic text-slate-400">Transcribing live audio…</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
