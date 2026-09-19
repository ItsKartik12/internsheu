import { useEffect, useState } from 'react'
import { Briefcase, Building2, ChevronRight, Gauge, Loader2, Sparkles } from 'lucide-react'
import { fetchProfile, getRecommendedInterviewSkills } from '../../services/api'

const LEVELS = ['Beginner', 'Intermediate', 'Advanced']

export default function InterviewSetup({ onStart }) {
  const [step, setStep] = useState(1)
  const [role, setRole] = useState('')
  const [company, setCompany] = useState('')
  const [level, setLevel] = useState('Intermediate')
  const [recommendedSkills, setRecommendedSkills] = useState([])
  const [selected, setSelected] = useState(new Set())
  const [loadingSkills, setLoadingSkills] = useState(false)
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState('')

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

  async function handleStep1Next(e) {
    e.preventDefault()
    if (!role.trim()) {
      setError('Please enter your target role.')
      return
    }
    setError('')
    setStep(2)
    setLoadingSkills(true)
    try {
      const data = await getRecommendedInterviewSkills(role.trim())
      const skills = data?.recommendedSkills || []
      setRecommendedSkills(skills)
      // Pre-select top skills so confirming is one click, but allow deselect.
      setSelected(new Set(skills.slice(0, Math.min(4, skills.length))))
    } catch {
      setRecommendedSkills([])
    } finally {
      setLoadingSkills(false)
    }
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
    if (selected.size === 0) {
      setError('Select at least one skill to be assessed.')
      return
    }
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
    <div className="mx-auto max-w-3xl space-y-6 pb-12">
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-r from-teal-900 via-slate-900 to-indigo-950 p-6 text-white shadow-md sm:p-8">
        <div className="flex items-center gap-2 text-teal-400">
          <Sparkles size={20} />
          <span className="text-xs font-semibold uppercase tracking-wider">AI Interviewer</span>
        </div>
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">
          Practice Interview
        </h1>
        <p className="mt-1 max-w-xl text-sm text-slate-300">
          A voice-based mock interview that adapts to your answers and gives you an
          evidence-based skill report. Your profile provides the background — just
          confirm what to focus on.
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 px-1 text-xs font-semibold">
        <span className={step === 1 ? 'text-indigo-600' : 'text-teal-600'}>1. Interview Target</span>
        <ChevronRight size={14} className="text-slate-300" />
        <span className={step === 2 ? 'text-indigo-600' : step > 2 ? 'text-teal-600' : 'text-slate-400'}>
          2. Skills
        </span>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      )}

      {step === 1 ? (
        <form onSubmit={handleStep1Next} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-slate-700">
              <Briefcase size={14} className="text-slate-400" /> Target Role
            </label>
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. Frontend Engineer"
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
            Continue <ChevronRight size={15} />
          </button>
        </form>
      ) : (
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Confirm skills for this interview</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Recommended from your InternSetu profile for <span className="font-semibold">{role}</span>.
              Only the skills actually tested will receive scores.
            </p>
          </div>

          {loadingSkills ? (
            <div className="flex items-center justify-center gap-2 py-10 text-xs text-slate-400">
              <Loader2 size={16} className="animate-spin" /> Loading your skills…
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {recommendedSkills.map((skill) => {
                const isSelected = selected.has(skill)
                return (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => toggleSkill(skill)}
                    className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-indigo-300 hover:bg-indigo-50'
                    }`}
                  >
                    {skill}
                  </button>
                )
              })}
            </div>
          )}

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
              {starting ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
              {starting ? 'Preparing interview…' : 'Start Interview'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
