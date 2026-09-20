import { useEffect, useState } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  Briefcase,
  Building2,
  Check,
  ChevronRight,
  Gauge,
  MessageSquareText,
  Mic,
  Loader2,
  RefreshCw,
  Sparkles,
  Target,
  WifiOff,
} from 'lucide-react'
import { fetchProfile, getRecommendedInterviewSkills } from '../../services/api'
import { isOnline, subscribeNetworkStatus } from '../../services/networkStatus'

const LEVELS = ['Beginner', 'Intermediate', 'Advanced']

// One step of the progress indicator.
function StepPill({ index, label, state }) {
  return (
    <span
      className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors ${
        state === 'current'
          ? 'bg-white text-slate-900 shadow-sm'
          : state === 'done'
          ? 'bg-teal-400/20 text-teal-200'
          : 'bg-white/5 text-slate-400'
      }`}
    >
      <span
        className={`flex h-4 w-4 items-center justify-center rounded-full text-[9px] ${
          state === 'current'
            ? 'bg-indigo-600 text-white'
            : state === 'done'
            ? 'bg-teal-400 text-slate-900'
            : 'bg-slate-600 text-slate-300'
        }`}
      >
        {state === 'done' ? <Check size={10} strokeWidth={3} /> : index}
      </span>
      {label}
    </span>
  )
}

export default function InterviewSetup({ onStart }) {
  const [step, setStep] = useState(1)
  const [role, setRole] = useState('')
  const [company, setCompany] = useState('')
  const [level, setLevel] = useState('Intermediate')
  const [recommendedSkills, setRecommendedSkills] = useState([])
  const [recsSource, setRecsSource] = useState('unavailable')
  const [recsFailed, setRecsFailed] = useState(false)
  const [selected, setSelected] = useState(new Set())
  const [loadingSkills, setLoadingSkills] = useState(false)
  const [skillsError, setSkillsError] = useState('')
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState('')
  const [isOffline, setIsOffline] = useState(!isOnline())

  useEffect(() => {
    const unsub = subscribeNetworkStatus((online) => {
      setIsOffline(!online)
    })
    return unsub
  }, [])

  // Pre-fill from the existing InternSetu profile — the candidate never
  // re-enters information already stored.
  useEffect(() => {
    let cancelled = false
    fetchProfile().then((data) => {
      if (cancelled || !data?.profile) return
      const targetRole = data.profile.careerTarget?.targetJobRole
      if (targetRole && !role) setRole(targetRole)
    })
    return () => { cancelled = true }
  }, [])

  async function loadRecommendations() {
    setLoadingSkills(true)
    setSkillsError('')
    setRecsFailed(false)
    try {
      // Role + company + level drive the recommendations; the profile is only
      // backend context. Nothing is auto-selected — the candidate decides.
      const data = await getRecommendedInterviewSkills({
        role: role.trim(),
        company: company.trim(),
        level,
      })
      if (data === null) {
        // Request itself failed (network / auth / 5xx) — distinct from
        // "genuinely zero recommendations", and retryable.
        setRecommendedSkills([])
        setSelected(new Set())
        setRecsFailed(true)
        setSkillsError("Couldn't generate recommendations. Check your connection and try again.")
      } else {
        setRecommendedSkills(data.skills)
        setSelected(new Set())
        setRecsSource(data.source)
        if (data.skills.length === 0) {
          setSkillsError('No skill recommendations are available right now. You can still start — AI will choose the interview focus.')
        } else {
          setSkillsError('')
        }
      }
    } finally {
      setLoadingSkills(false)
    }
  }

  async function handleStep1Next(e) {
    e.preventDefault()
    if (!role.trim()) {
      setError('Please enter your target role.')
      return
    }
    setError('')
    setStep(2)
    loadRecommendations()
  }

  function toggleSkill(skill) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(skill)) next.delete(skill)
      else next.add(skill)
      return next
    })
  }

  async function handleStart() {
    if (!isOnline()) {
      setError('Internet connection required for live AI voice interview.')
      return
    }
    // Skills are OPTIONAL: zero selected = AI decides the interview focus.
    setError('')
    setStarting(true)
    try {
      await onStart({
        role: role.trim(),
        company: company.trim(),
        level,
        selectedSkills: [...selected],
      })
    } catch (err) {
      setError(err.message || 'Could not start the interview.')
      setStarting(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5 pb-12">
      {/* Offline Alert Banner */}
      {isOffline && (
        <div className="flex items-center gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-medium text-amber-800">
          <WifiOff size={16} className="text-amber-600 shrink-0" />
          <span>
            <strong>Internet Connection Required:</strong> Live AI voice interview requires an active network connection. You can still inspect previously completed interview sessions via the <em>Previous Interviews</em> button at bottom right.
          </span>
        </div>
      )}

      {/* Hero — compact, keeps the InternSetu gradient identity */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-teal-900 via-slate-900 to-indigo-950 p-5 text-white shadow-md sm:p-6">
        <div className="pointer-events-none absolute -right-8 -top-10 h-40 w-40 rounded-full bg-teal-400/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-14 right-24 h-32 w-32 rounded-full bg-indigo-400/10 blur-2xl" />
        <div className="relative">
          <div className="flex items-center gap-2 text-teal-400">
            <Sparkles size={16} />
            <span className="text-[11px] font-semibold uppercase tracking-wider">AI Interviewer</span>
          </div>
          <h1 className="mt-1.5 text-xl font-extrabold tracking-tight sm:text-2xl">Practice Interview</h1>
          <p className="mt-1 max-w-lg text-xs leading-relaxed text-slate-300 sm:text-sm">
            A voice-based mock interview that adapts to your answers and gives you an evidence-based skill report.
          </p>

          {/* Progress indicator: Interview Target → Skills → Interview */}
          <div className="mt-4 flex items-center gap-1.5">
            <StepPill index={1} label="Interview Target" state={step === 1 ? 'current' : 'done'} />
            <ChevronRight size={13} className="shrink-0 text-slate-500" />
            <StepPill index={2} label="Skills" state={step === 2 ? 'current' : step === 1 ? 'upcoming' : 'done'} />
            <ChevronRight size={13} className="shrink-0 text-slate-500" />
            <StepPill index={3} label="Interview" state="upcoming" />
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      )}

      {step === 1 ? (
        <form onSubmit={handleStep1Next} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-slate-700">
              <Briefcase size={14} className="text-slate-400" /> Target Role
            </label>
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. Full Stack Developer"
              className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
            <p className="mt-1 text-[11px] text-slate-400">Pre-filled from your profile — edit if needed.</p>
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-slate-700">
              <Building2 size={14} className="text-slate-400" /> Target Company <span className="text-slate-400">(optional)</span>
            </label>
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="e.g. Google"
              className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-slate-700">
              <Gauge size={14} className="text-slate-400" /> Self-Assessed Level
            </label>
            <div className="mt-1.5 grid grid-cols-3 gap-2">
              {LEVELS.map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setLevel(lvl)}
                  className={`rounded-xl border py-2.5 text-xs font-semibold transition-all ${
                    level === lvl
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-500'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-[11px] text-slate-400">
              Questions will be pitched slightly easier than this level and adapt as you answer.
            </p>
          </div>

          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-500"
          >
            Continue <ArrowRight size={15} />
          </button>
        </form>
      ) : (
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div>
            <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <Target size={15} className="text-indigo-600" /> Choose your interview focus
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Recommended based on your target role, company, level, and profile context. Only skills actually tested
              will receive scores.
            </p>
          </div>

          {loadingSkills ? (
            <div className="flex items-center justify-center gap-2 py-10 text-xs text-slate-400">
              <Loader2 size={16} className="animate-spin" /> Generating recommendations…
            </div>
          ) : recommendedSkills.length === 0 ? (
            recsFailed ? (
              /* D — API/Gemini failure: retryable, never blocks starting */
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-start gap-2 text-xs font-semibold text-amber-800">
                  <AlertTriangle size={15} className="mt-0.5 shrink-0" />
                  {skillsError || "Couldn't generate recommendations."}
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={loadRecommendations}
                    className="flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-amber-500"
                  >
                    <RefreshCw size={12} /> Retry
                  </button>
                  <button
                    type="button"
                    onClick={handleStart}
                    disabled={starting}
                    className="flex items-center gap-1.5 rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-[11px] font-semibold text-amber-700 hover:bg-amber-50"
                  >
                    <Bot size={12} /> Or continue — let AI choose the focus
                  </button>
                </div>
              </div>
            ) : (
              /* C — success with genuinely zero skills */
              <div className="flex items-center justify-center gap-2 rounded-xl bg-slate-50 py-6 px-4 text-center text-xs text-slate-500">
                <Bot size={15} className="shrink-0 text-indigo-500" />
                {skillsError || 'No recommendations right now — AI will choose the interview focus automatically.'}
              </div>
            )
          ) : (
            /* B — skill cards */
            <div>
              <div className="flex flex-wrap gap-2">
                {recommendedSkills.map((skill) => {
                  const isSelected = selected.has(skill)
                  return (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => toggleSkill(skill)}
                      aria-pressed={isSelected}
                      className={`flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-indigo-300 hover:bg-indigo-50'
                      }`}
                    >
                      {isSelected ? <Check size={12} strokeWidth={3} /> : null}
                      {skill}
                    </button>
                  )
                })}
              </div>
              <p className="mt-3 flex items-start gap-1.5 text-[11px] text-slate-400">
                <Sparkles size={12} className="mt-0.5 shrink-0 text-indigo-400" />
                Don&apos;t want to choose? AI can automatically select the interview focus based on your target role
                and company.
              </p>
            </div>
          )}

          {/* Interview summary */}
          <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-3.5 text-[11px] sm:grid-cols-4">
            <div>
              <p className="text-slate-400">Role</p>
              <p className="mt-0.5 truncate font-semibold text-slate-700">{role || '—'}</p>
            </div>
            <div>
              <p className="text-slate-400">Company</p>
              <p className="mt-0.5 truncate font-semibold text-slate-700">{company || 'Any'}</p>
            </div>
            <div>
              <p className="text-slate-400">Level</p>
              <p className="mt-0.5 font-semibold text-slate-700">{level}</p>
            </div>
            <div>
              <p className="text-slate-400">Skills</p>
              <p className="mt-0.5 font-semibold text-slate-700">
                {selected.size > 0 ? `${selected.size} selected` : 'AI-selected focus'}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={() => { setStep(1); setError('') }}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleStart}
              disabled={starting || loadingSkills}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-500 disabled:opacity-50"
            >
              {starting ? <Loader2 size={15} className="animate-spin" /> : <Mic size={15} />}
              {starting ? 'Preparing interview…' : 'Start AI Interview'}
            </button>
          </div>
        </div>
      )}

      {/* Reassurance strip — what happens during the interview */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { icon: Mic, title: 'Speak your answers', text: 'Real-time voice transcription by Deepgram.' },
          { icon: MessageSquareText, title: 'Adaptive questions', text: 'Follow-ups adjust to how you answer.' },
          { icon: Sparkles, title: 'Honest skill report', text: 'Only skills actually tested receive scores.' },
        ].map(({ icon: Icon, title, text }) => (
          <div key={title} className="rounded-xl border border-slate-100 bg-white p-3.5 shadow-sm">
            <Icon size={16} className="text-indigo-500" />
            <p className="mt-2 text-xs font-bold text-slate-800">{title}</p>
            <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500">{text}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
