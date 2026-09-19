import { Award, Bot, CheckCircle2, MessageSquareText, MinusCircle, RotateCcw, TrendingUp, XCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

function levelBadgeColor(level) {
  switch (level) {
    case 'Advanced':
    case 'Strong':
    case 'Excellent':
      return 'bg-emerald-100 text-emerald-800 border-emerald-300'
    case 'Intermediate':
      return 'bg-indigo-100 text-indigo-800 border-indigo-300'
    case 'Beginner':
      return 'bg-amber-100 text-amber-800 border-amber-300'
    default:
      return 'bg-rose-100 text-rose-800 border-rose-300'
  }
}

function ScoreBar({ score, color = 'bg-indigo-600' }) {
  return (
    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200">
      <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${score}%` }} />
    </div>
  )
}

export default function InterviewResult({ interview, onRetake }) {
  const navigate = useNavigate()
  const evaluation = interview.evaluation || {}
  const assessed = evaluation.assessedSkills || []
  const notAssessed = evaluation.notAssessedSkills || []
  const transcript = interview.turns || []

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-12">
      {/* Header card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-8">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50">
          <Award className="text-indigo-600" size={32} />
        </div>
        <h1 className="mt-4 text-2xl font-extrabold text-slate-900">{interview.title || 'Interview Complete'}</h1>
        <p className="mt-1 text-sm text-slate-500">
          {interview.role}{interview.company ? ` · ${interview.company}` : ''} · {interview.level} ·{' '}
          {new Date(interview.completedAt || interview.createdAt).toLocaleDateString()}
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-6 py-3">
            <p className="text-3xl font-extrabold text-slate-900">{evaluation.overallScore ?? 0}<span className="text-base font-semibold text-slate-400">/100</span></p>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Overall score</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-6 py-3">
            <span className={`inline-block rounded-full border px-3 py-1 text-xs font-bold ${levelBadgeColor(evaluation.demonstratedLevel)}`}>
              {evaluation.demonstratedLevel || '—'}
            </span>
            <p className="mt-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Demonstrated level</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-6 py-3">
            <p className="text-3xl font-extrabold text-teal-600">{assessed.length}</p>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Skills assessed</p>
          </div>
        </div>

        {evaluation.summary && (
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-slate-600">{evaluation.summary}</p>
        )}

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={onRetake}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <RotateCcw size={14} /> New Interview
          </button>
          <button
            type="button"
            onClick={() => navigate('/assessment/results')}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow hover:bg-indigo-500"
          >
            <TrendingUp size={14} /> View Skill Matrix
          </button>
        </div>
      </div>

      {/* Assessed skills */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-bold text-slate-900">Assessed Skills</h2>
        <p className="text-xs text-slate-500">Only skills actually tested in this interview receive scores.</p>
        {assessed.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">No skills were assessed in this interview.</p>
        ) : (
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {assessed.map((skill, i) => (
              <div key={i} className="rounded-xl border border-slate-200 bg-slate-50/50 p-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">{skill.skill}</h3>
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${levelBadgeColor(skill.level)}`}>
                    {skill.level}
                  </span>
                </div>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-2xl font-extrabold text-slate-900">{skill.score}</span>
                  <span className="text-xs font-semibold text-slate-400">/100</span>
                </div>
                <ScoreBar score={skill.score} />
                {skill.strengths?.length > 0 && (
                  <div className="mt-3 space-y-1">
                    {skill.strengths.map((s, j) => (
                      <p key={j} className="flex items-start gap-1.5 text-[11px] text-slate-600">
                        <CheckCircle2 size={12} className="mt-0.5 shrink-0 text-teal-600" /> {s}
                      </p>
                    ))}
                  </div>
                )}
                {skill.weaknesses?.length > 0 && (
                  <div className="mt-1.5 space-y-1">
                    {skill.weaknesses.map((w, j) => (
                      <p key={j} className="flex items-start gap-1.5 text-[11px] text-slate-500">
                        <XCircle size={12} className="mt-0.5 shrink-0 text-rose-400" /> {w}
                      </p>
                    ))}
                  </div>
                )}
                {skill.evidence && (
                  <p className="mt-3 rounded-lg border border-slate-100 bg-white px-2.5 py-2 text-[11px] italic leading-relaxed text-slate-500">
                    "{skill.evidence}"
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Not assessed */}
      {notAssessed.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-bold text-slate-900">Selected But Not Assessed</h2>
          <p className="text-xs text-slate-500">These skills were in scope but were not actually tested, so no score is given.</p>
          <div className="mt-4 space-y-2">
            {notAssessed.map((item, i) => (
              <div key={i} className="flex items-start gap-2 rounded-lg border border-slate-100 bg-slate-50/50 px-3 py-2.5">
                <MinusCircle size={15} className="mt-0.5 shrink-0 text-slate-400" />
                <div>
                  <p className="text-sm font-semibold text-slate-700">{item.skill}</p>
                  <p className="text-xs text-slate-400">{item.reason}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Communication & problem solving */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {[evaluation.communication, evaluation.problemSolving].map((block, i) => (
          block && (block.assessment || block.score) ? (
            <div key={i} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-sm font-bold text-slate-900">{i === 0 ? 'Communication' : 'Problem Solving'}</h2>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-2xl font-extrabold text-slate-900">{block.score ?? 0}</span>
                <span className="text-xs font-semibold text-slate-400">/100</span>
              </div>
              <ScoreBar score={block.score ?? 0} color={i === 0 ? 'bg-teal-500' : 'bg-indigo-600'} />
              {block.assessment && <p className="mt-3 text-xs leading-relaxed text-slate-600">{block.assessment}</p>}
              {block.evidence && (
                <p className="mt-2 text-[11px] italic text-slate-400">"{block.evidence}"</p>
              )}
            </div>
          ) : null
        ))}
      </div>

      {/* Strengths & weaknesses */}
      {(evaluation.overallStrengths?.length > 0 || evaluation.overallWeaknesses?.length > 0) && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {evaluation.overallStrengths?.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-sm font-bold text-slate-900">Core Strengths</h2>
              <ul className="mt-3 space-y-2">
                {evaluation.overallStrengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
                    <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-teal-600" /> {s}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {evaluation.overallWeaknesses?.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-sm font-bold text-slate-900">Areas to Improve</h2>
              <ul className="mt-3 space-y-2">
                {evaluation.overallWeaknesses.map((w, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
                    <XCircle size={13} className="mt-0.5 shrink-0 text-rose-400" /> {w}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Full transcript */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <MessageSquareText size={16} className="text-indigo-600" />
          <h2 className="text-base font-bold text-slate-900">Full Transcript</h2>
        </div>
        <div className="mt-4 space-y-4">
          {transcript.map((turn, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                turn.speaker === 'interviewer' ? 'bg-slate-900 text-white' : 'bg-indigo-100 text-indigo-700'
              }`}>
                {turn.speaker === 'interviewer' ? <Bot size={13} /> : <span className="text-[10px] font-bold">You</span>}
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  {turn.speaker === 'interviewer' ? 'AI Interviewer' : 'You'}
                  {turn.skillTag ? ` · ${turn.skillTag}` : ''}
                </p>
                <p className="mt-0.5 text-sm leading-relaxed text-slate-700">{turn.text}</p>
              </div>
            </div>
          ))}
          {transcript.length === 0 && (
            <p className="text-sm text-slate-400">No transcript recorded.</p>
          )}
        </div>
      </div>
    </div>
  )
}
