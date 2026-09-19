import { useState, useEffect } from 'react'
import {
  Award,
  Sparkles,
  TrendingUp,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  BookOpen,
  Briefcase,
  Layers,
  MessageSquareText,
} from 'lucide-react'
import { fetchMySkillResults, fetchMyAssessmentAttempts, fetchMyInterviewSkillResults } from '../services/api'
import { useNavigate } from 'react-router-dom'

function levelBadgeColor(level) {
  switch (level) {
    case 'Excellent':
      return 'bg-emerald-100 text-emerald-800 border-emerald-300'
    case 'Strong':
      return 'bg-blue-100 text-blue-800 border-blue-300'
    case 'Intermediate':
      return 'bg-indigo-100 text-indigo-800 border-indigo-300'
    case 'Beginner':
      return 'bg-amber-100 text-amber-800 border-amber-300'
    default:
      return 'bg-rose-100 text-rose-800 border-rose-300'
  }
}

export default function SkillResultsPage() {
  const navigate = useNavigate()
  const [skillResult, setSkillResult] = useState(null)
  const [attempts, setAttempts] = useState([])
  const [interviewSkills, setInterviewSkills] = useState([])
  const [interviewsCompleted, setInterviewsCompleted] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadResults()
  }, [])

  async function loadResults() {
    setLoading(true)
    const [skillsRes, attemptsRes, interviewRes] = await Promise.all([
      fetchMySkillResults(),
      fetchMyAssessmentAttempts(),
      fetchMyInterviewSkillResults(),
    ])
    setSkillResult(skillsRes?.result || null)
    setAttempts(attemptsRes?.attempts || [])
    setInterviewSkills(interviewRes?.skills || [])
    setInterviewsCompleted(interviewRes?.interviewsCompleted || 0)
    setLoading(false)
  }

  const skills = skillResult?.skills || []
  const overallScore = skillResult?.overallScore || 0
  const overallLevel = skillResult?.overallLevel || 'Beginner'

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col gap-4 rounded-2xl bg-gradient-to-r from-indigo-900 via-slate-900 to-teal-950 p-6 text-white shadow-md sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <div>
          <div className="flex items-center gap-2 text-indigo-400">
            <Sparkles size={20} />
            <span className="text-xs font-semibold uppercase tracking-wider">Candidate Verification</span>
          </div>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">
            Verified Skill Profile & Proficiency Matrix
          </h1>
          <p className="mt-1 max-w-xl text-sm text-slate-300">
            Objective assessment metrics based on standardized evaluations. Employers use these scores for priority shortlist matching.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/assessment')}
          className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-400"
        >
          <RotateCcw size={16} />
          Take Another Assessment
        </button>
      </div>

      {/* Overview Metric Row */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Overall Skill Index
          </span>
          <div className="mt-3 flex items-baseline gap-3">
            <span className="text-4xl font-extrabold text-slate-900">{overallScore}%</span>
            <span
              className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${levelBadgeColor(
                overallLevel
              )}`}
            >
              {overallLevel}
            </span>
          </div>
          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full bg-indigo-600 rounded-full transition-all duration-500"
              style={{ width: `${overallScore}%` }}
            />
          </div>
          <p className="mt-2 text-[11px] text-slate-400">Average across all tested competencies</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Verified Competencies
          </span>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-teal-600">{skills.length}</span>
            <span className="text-xs text-slate-500">tested topics</span>
          </div>
          <p className="mt-4 text-xs text-slate-600">
            {skills.filter((s) => s.percentage >= 60).length} of {skills.length} competencies certified with passing grade.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Total Evaluations Completed
          </span>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-indigo-600">{attempts.length}</span>
            <span className="text-xs text-slate-500">attempts</span>
          </div>
          <p className="mt-4 text-xs text-slate-600">
            Keep practicing to increase your percentile ranking for top recruiter pipelines.
          </p>
        </div>
      </div>

      {/* Skills Matrix Cards */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">Assessed Skill Breakdown</h2>
            <p className="text-xs text-slate-500">Individual performance metrics per technical domain</p>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading skill matrix…</div>
        ) : skills.length === 0 ? (
          <div className="py-12 text-center">
            <Award size={40} className="mx-auto text-slate-300" />
            <p className="mt-2 text-sm font-semibold text-slate-800">No skill assessments recorded yet</p>
            <p className="mt-1 text-xs text-slate-400">
              Take your first assessment to unlock verified badges on your profile.
            </p>
            <button
              type="button"
              onClick={() => navigate('/assessment')}
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-indigo-500"
            >
              Explore Assessments
              <ArrowRight size={14} />
            </button>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {skills.map((skill, idx) => (
              <div
                key={idx}
                className="flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/50 p-5 transition-all hover:bg-white hover:shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="rounded bg-slate-200/80 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                      {skill.category}
                    </span>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${levelBadgeColor(
                        skill.level
                      )}`}
                    >
                      {skill.level}
                    </span>
                  </div>

                  <h3 className="mt-3 text-sm font-bold text-slate-900">{skill.topic || skill.topicName}</h3>

                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-500">Proficiency</span>
                      <span className="text-slate-900">{skill.percentage}%</span>
                    </div>
                    <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="h-full bg-indigo-600 rounded-full"
                        style={{ width: `${skill.percentage}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-5 border-t border-slate-200/60 pt-3 flex items-center justify-between text-[11px] text-slate-400">
                  <span>{skill.attemptsCount || 1} attempts</span>
                  <button
                    type="button"
                    onClick={() => navigate('/courses')}
                    className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-semibold"
                  >
                    Bridge Skill Gap
                    <ArrowRight size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Interview Assessed Skill Breakdown — separate from traditional assessments.
          Uses ONLY AI interview data; scores never mix into SkillResult. */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">Interview Assessed Skill Breakdown</h2>
            <p className="text-xs text-slate-500">
              Average AI interview performance per skill — from {interviewsCompleted} completed interview{interviewsCompleted === 1 ? '' : 's'}. Only skills actually tested are scored.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/interview')}
            className="flex shrink-0 items-center gap-1.5 rounded-xl bg-teal-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-teal-500"
          >
            <Sparkles size={13} />
            Take an Interview
          </button>
        </div>

        {interviewSkills.length === 0 ? (
          <div className="py-10 text-center">
            <MessageSquareText size={36} className="mx-auto text-slate-300" />
            <p className="mt-2 text-sm font-semibold text-slate-800">No interview skills recorded yet</p>
            <p className="mt-1 text-xs text-slate-400">
              Complete an AI Mock Interview to see interview-based skill scores here.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {interviewSkills.map((skill) => (
              <div
                key={skill.skill}
                className="flex flex-col justify-between rounded-xl border border-teal-100 bg-teal-50/30 p-5 transition-all hover:bg-white hover:shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="rounded bg-teal-100 px-2 py-0.5 text-[10px] font-bold text-teal-700">
                      Interview
                    </span>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${levelBadgeColor(skill.level)}`}
                    >
                      {skill.level}
                    </span>
                  </div>

                  <h3 className="mt-3 text-sm font-bold text-slate-900">{skill.skill}</h3>

                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-500">Avg interview score</span>
                      <span className="text-slate-900">{skill.averageScore}%</span>
                    </div>
                    <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="h-full bg-teal-600 rounded-full"
                        style={{ width: `${skill.averageScore}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-5 border-t border-slate-200/60 pt-3 flex items-center justify-between text-[11px] text-slate-400">
                  <span>from {skill.interviewsCount} interview{skill.interviewsCount === 1 ? '' : 's'}</span>
                  <button
                    type="button"
                    onClick={() => navigate('/interview')}
                    className="flex items-center gap-1 font-semibold text-teal-700 hover:text-teal-900"
                  >
                    Practice Again
                    <ArrowRight size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Past Evaluation Attempts Table */}
      {attempts.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100">
            Recent Assessment History
          </h2>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 text-slate-400">
                <tr>
                  <th className="pb-2 font-semibold">Topic</th>
                  <th className="pb-2 font-semibold">Score</th>
                  <th className="pb-2 font-semibold">Result</th>
                  <th className="pb-2 font-semibold">Time</th>
                  <th className="pb-2 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {attempts.map((att) => (
                  <tr key={att._id} className="text-slate-700">
                    <td className="py-3 font-semibold text-slate-900">{att.topicId?.name || 'Topic'}</td>
                    <td className="py-3 font-mono">{att.score} / {att.totalMarks} ({att.percentage}%)</td>
                    <td className="py-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-bold ${
                          att.passed ? 'bg-teal-50 text-teal-700' : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {att.passed ? 'Passed ✓' : 'Failed'}
                      </span>
                    </td>
                    <td className="py-3 text-slate-400">{att.timeTakenSeconds || 0}s</td>
                    <td className="py-3 text-slate-400">{new Date(att.completedAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
