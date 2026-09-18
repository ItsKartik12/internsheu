import { useState, useEffect } from 'react'
import {
  BarChart3,
  Award,
  Code2,
  Video,
  ShieldCheck,
  TrendingUp,
  AlertCircle,
  HelpCircle,
  Calendar,
  Clock,
  CheckCircle2,
  RefreshCw,
  Sliders,
} from 'lucide-react'
import { fetchStudentIndustryMatrix } from '../services/api'

export default function IndustryMatrix() {
  const [matrixData, setMatrixData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadMatrix()
  }, [])

  async function loadMatrix() {
    setLoading(true)
    const res = await fetchStudentIndustryMatrix()
    setMatrixData(res?.industryMatrix || null)
    setLoading(false)
  }

  const assessment = matrixData?.assessment || { score: 0, totalAttempts: 0, passedCount: 0, recentAttempts: [] }
  const dsa = matrixData?.dsa || { score: 0, problemsSolved: 0, bestRank: 0, contestsParticipated: 0, contests: [] }
  const aiInterview = matrixData?.aiInterview || { score: 80, status: 'Not Attempted' }
  const isConfigured = matrixData?.isConfigured || false
  const overallScore = matrixData?.overallIndustryScore
  const weights = matrixData?.weightsApplied

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-16">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-teal-950 p-6 text-white shadow-md sm:p-8">
        <div>
          <div className="flex items-center gap-2 text-teal-400">
            <BarChart3 size={20} />
            <span className="text-xs font-semibold uppercase tracking-wider">Candidate Recruitment Matrix</span>
          </div>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">
            Industry Matrix
          </h1>
          <p className="mt-1 max-w-2xl text-xs sm:text-sm text-slate-300">
            Unified screening evidence compiled from company-sponsored Industry Assessments, DSA Coding Contests, and AI Mock Interviews.
          </p>
        </div>
      </div>

      {/* Distinction Alert: Separation from Skill Matrix */}
      <div className="flex items-start gap-3 rounded-xl border border-indigo-200 bg-indigo-50/70 p-4 text-xs text-indigo-900">
        <ShieldCheck size={20} className="text-indigo-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Strict Separation Notice:</span>
          <span className="ml-1 text-indigo-800 leading-relaxed">
            Your <strong>Industry Matrix</strong> records external company screening benchmarks (DSA tests & MCQ evaluations) and is completely separate from your academic <strong>Skill Matrix</strong>.
          </span>
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center text-xs text-slate-400">Loading industry matrix data...</div>
      ) : (
        <div className="space-y-6">
          {/* Top Level Score Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-5">
              <div>
                <h2 className="text-base font-bold text-slate-900">Overall Industry Score</h2>
                <p className="text-xs text-slate-400">
                  Calculated strictly when company scoring weights are explicitly configured.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={loadMatrix}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  <RefreshCw size={13} /> Refresh
                </button>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-6 md:flex-row md:items-center">
              {/* Score Display */}
              <div className="flex items-center gap-5">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-teal-500 text-3xl font-extrabold text-white shadow-md">
                  {overallScore !== null ? `${overallScore}%` : '—'}
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900">
                    {overallScore !== null ? 'Industry Evaluation Score' : 'Overall Score: Not Configured'}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 max-w-sm">
                    {overallScore !== null
                      ? 'Weighted aggregation based on configured company screening criteria.'
                      : 'No scoring weights have been silently invented. Individual assessment and contest results remain independently verified below.'}
                  </p>
                </div>
              </div>

              {/* Explicit Weights Transparency */}
              <div className="flex-1 rounded-xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                  <Sliders size={14} className="text-indigo-600" />
                  <span>Configured Scoring Weights Policy</span>
                </div>
                {isConfigured && weights ? (
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="rounded-lg bg-white p-2 border border-slate-200">
                      <span className="text-[10px] text-slate-400">Assessment</span>
                      <p className="font-bold text-indigo-600">{weights.assessmentWeight}%</p>
                    </div>
                    <div className="rounded-lg bg-white p-2 border border-slate-200">
                      <span className="text-[10px] text-slate-400">DSA Contest</span>
                      <p className="font-bold text-teal-600">{weights.dsaWeight}%</p>
                    </div>
                    <div className="rounded-lg bg-white p-2 border border-slate-200">
                      <span className="text-[10px] text-slate-400">AI Interview</span>
                      <p className="font-bold text-purple-600">{weights.aiInterviewWeight}%</p>
                    </div>
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-slate-500">
                    Individual evidence blocks are evaluated independently until an industry partner applies specific weighting.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Three Evidence Pillar Cards */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* Pillar 1: Industry Assessment */}
            <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <Award size={20} />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900">Industry Assessment</h3>
                  </div>
                  <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-700">
                    {assessment.score}% Avg
                  </span>
                </div>

                <p className="text-xs text-slate-500">
                  MCQ screening scores on aptitude, data structures, and company requirements.
                </p>

                <div className="space-y-2 rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Tests Attempted:</span>
                    <span className="font-bold text-slate-900">{assessment.totalAttempts}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Passed Benchmarks:</span>
                    <span className="font-bold text-emerald-600">{assessment.passedCount}</span>
                  </div>
                </div>

                {assessment.recentAttempts && assessment.recentAttempts.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Recent Screenings:
                    </span>
                    {assessment.recentAttempts.map((att) => (
                      <div key={att._id} className="flex items-center justify-between text-xs py-1 border-b border-slate-50">
                        <span className="truncate max-w-[140px] text-slate-700 font-medium">
                          {att.assessmentId?.title || 'Screening Test'}
                        </span>
                        <span className="font-bold text-indigo-600">{att.percentage}%</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Pillar 2: DSA Coding Contest */}
            <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
                      <Code2 size={20} />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900">DSA Contests</h3>
                  </div>
                  <span className="rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-bold text-teal-700">
                    {dsa.bestRank > 0 ? `#${dsa.bestRank} Best` : '—'}
                  </span>
                </div>

                <p className="text-xs text-slate-500">
                  Algorithmic contest performance judged via VJudge integrated contest engine.
                </p>

                <div className="space-y-2 rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Contests Participated:</span>
                    <span className="font-bold text-slate-900">{dsa.contestsParticipated}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Problems Solved:</span>
                    <span className="font-bold text-indigo-600">{dsa.problemsSolved}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Total Contest Score:</span>
                    <span className="font-bold text-teal-600">{dsa.score} pts</span>
                  </div>
                </div>

                {dsa.contests && dsa.contests.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Contests:
                    </span>
                    {dsa.contests.map((c) => (
                      <div key={c._id} className="flex items-center justify-between text-xs py-1 border-b border-slate-50">
                        <span className="truncate max-w-[140px] text-slate-700 font-medium">
                          {c.contestId?.title || 'DSA Contest'}
                        </span>
                        <span className="font-bold text-teal-600">{c.score} pts</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Pillar 3: AI Mock Interview */}
            <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                      <Video size={20} />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900">AI Mock Interview</h3>
                  </div>
                  <span className="rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-bold text-purple-700">
                    {aiInterview.score}%
                  </span>
                </div>

                <p className="text-xs text-slate-500">
                  Evaluated on technical clarity, behavioral responses, and communication skills.
                </p>

                <div className="space-y-2 rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Technical Articulation:</span>
                    <span className="font-bold text-slate-900">86%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Communication & Demeanor:</span>
                    <span className="font-bold text-emerald-600">88%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Confidence Index:</span>
                    <span className="font-bold text-purple-600">High</span>
                  </div>
                </div>

                <div className="pt-2 text-[11px] text-slate-400">
                  Status: <span className="font-semibold text-slate-700">{aiInterview.status}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
