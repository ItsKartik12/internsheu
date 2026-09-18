import { useState, useEffect } from 'react'
import {
  Code2,
  Trophy,
  Calendar,
  Clock,
  ExternalLink,
  ChevronRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Play,
  FileCode,
  Users,
  Search,
  RefreshCw,
} from 'lucide-react'
import {
  fetchStudentIndustryTests,
  fetchStudentContestDetails,
  submitContestSolutionApi,
  fetchContestStandings,
} from '../services/api'

export default function IndustryTest() {
  const [contests, setContests] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // 'all' | 'live' | 'upcoming' | 'completed'
  const [search, setSearch] = useState('')

  // Selected Contest View
  const [activeContest, setActiveContest] = useState(null)
  const [contestDetails, setContestDetails] = useState(null)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [contestTab, setContestTab] = useState('problems') // 'problems' | 'standings'
  const [standings, setStandings] = useState([])

  // Selected Problem for Coding
  const [selectedProblem, setSelectedProblem] = useState(null)
  const [language, setLanguage] = useState('C++')
  const [code, setCode] = useState(
    '#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write your solution here\n    return 0;\n}'
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submissionFeedback, setSubmissionFeedback] = useState(null)
  const [myResult, setMyResult] = useState(null)

  useEffect(() => {
    loadContests()
  }, [])

  async function loadContests() {
    setLoading(true)
    const res = await fetchStudentIndustryTests()
    setContests(res?.contests || [])
    setLoading(false)
  }

  async function openContest(contest) {
    setActiveContest(contest)
    setLoadingDetails(true)
    setSelectedProblem(null)
    setSubmissionFeedback(null)
    setContestTab('problems')

    try {
      const res = await fetchStudentContestDetails(contest._id)
      setContestDetails(res?.contest || contest)
      setMyResult(res?.myResult || null)
      if (res?.contest?.problems && res.contest.problems.length > 0) {
        setSelectedProblem(res.contest.problems[0])
      }
    } catch (err) {
      console.error('Failed to load contest details:', err)
    } finally {
      setLoadingDetails(false)
    }
  }

  async function loadStandings(contestId) {
    const res = await fetchContestStandings(contestId)
    setStandings(res?.standings || [])
  }

  function handleTabChange(tab) {
    setContestTab(tab)
    if (tab === 'standings' && activeContest) {
      loadStandings(activeContest._id)
    }
  }

  function handleLanguageChange(newLang) {
    setLanguage(newLang)
    if (newLang === 'Python') {
      setCode('# Write your solution here\ndef main():\n    pass\n\nif __name__ == "__main__":\n    main()')
    } else if (newLang === 'Java') {
      setCode('import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        // Write your solution here\n    }\n}')
    } else if (newLang === 'JavaScript') {
      setCode('// Write your solution here\nfunction solve() {\n    \n}\nsolve();')
    } else {
      setCode('#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write your solution here\n    return 0;\n}')
    }
  }

  async function handleSubmitSolution(e) {
    e.preventDefault()
    if (!selectedProblem || !activeContest) return
    setIsSubmitting(true)
    setSubmissionFeedback(null)

    try {
      const res = await submitContestSolutionApi(activeContest._id, {
        problemId: selectedProblem._id,
        language,
        code,
      })

      setSubmissionFeedback({
        type: 'success',
        message: res.message || 'Solution submitted successfully!',
        submission: res.submission,
      })

      // Refresh contest details to update results
      const updated = await fetchStudentContestDetails(activeContest._id)
      setMyResult(updated?.myResult || null)
    } catch (err) {
      setSubmissionFeedback({
        type: 'error',
        message: err.message || 'Failed to submit solution.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Filtered contests
  const filteredContests = contests.filter((c) => {
    const status = c.computedStatus || c.status
    if (filter === 'live' && status !== 'Live') return false
    if (filter === 'upcoming' && status !== 'Scheduled') return false
    if (filter === 'completed' && status !== 'Ended' && status !== 'Results Available') return false

    if (search.trim()) {
      const q = search.toLowerCase()
      const titleMatch = c.title?.toLowerCase().includes(q)
      const companyMatch = c.company?.toLowerCase().includes(q)
      const roleMatch = c.role?.toLowerCase().includes(q)
      return titleMatch || companyMatch || roleMatch
    }
    return true
  })

  // ────────────────────────────────────────────────────────
  // RENDER CONTEST SOLVER / DETAILS
  // ────────────────────────────────────────────────────────
  if (activeContest && contestDetails) {
    const isLive = contestDetails.computedStatus === 'Live'

    return (
      <div className="mx-auto max-w-7xl space-y-6 pb-16">
        {/* Navigation back bar */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setActiveContest(null)}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft size={16} /> Back to Industry Tests
          </button>
          <div className="flex items-center gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold ${
                isLive
                  ? 'bg-emerald-500/15 text-emerald-700 animate-pulse'
                  : contestDetails.computedStatus === 'Scheduled'
                  ? 'bg-amber-500/15 text-amber-700'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              • {contestDetails.computedStatus}
            </span>
          </div>
        </div>

        {/* Contest Header Banner */}
        <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white shadow-md">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
                <Code2 size={16} />
                <span>{contestDetails.company} · {contestDetails.role}</span>
              </div>
              <h1 className="mt-1 text-2xl font-bold tracking-tight">{contestDetails.title}</h1>
              {contestDetails.description && (
                <p className="mt-1 max-w-2xl text-xs text-slate-300">{contestDetails.description}</p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300">
              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-2">
                <span className="text-slate-400">Duration:</span>
                <p className="font-semibold text-white">{contestDetails.durationMinutes} Mins</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-2">
                <span className="text-slate-400">Problems:</span>
                <p className="font-semibold text-white">{contestDetails.problems?.length || 0}</p>
              </div>
              {myResult && (
                <div className="rounded-xl border border-teal-500/30 bg-teal-500/10 px-4 py-2 text-teal-300">
                  <span>Your Score:</span>
                  <p className="font-bold text-teal-200">{myResult.score} pts ({myResult.problemsSolved} solved)</p>
                </div>
              )}
            </div>
          </div>

          {/* Subtabs: Problems vs Leaderboard */}
          <div className="mt-6 flex gap-2 border-t border-white/10 pt-4">
            <button
              type="button"
              onClick={() => handleTabChange('problems')}
              className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${
                contestTab === 'problems' ? 'bg-white/15 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Problems ({contestDetails.problems?.length || 0})
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('standings')}
              className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${
                contestTab === 'standings' ? 'bg-white/15 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Contest Leaderboard
            </button>
          </div>
        </div>

        {/* Tab 1: Problems & Solver */}
        {contestTab === 'problems' && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Left problem list column */}
            <div className="space-y-3 lg:col-span-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">Contest Problems</h2>
              {(!contestDetails.problems || contestDetails.problems.length === 0) ? (
                <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-xs text-slate-400">
                  No problems added to this contest yet.
                </div>
              ) : (
                contestDetails.problems.map((p, idx) => {
                  const isSelected = selectedProblem?._id === p._id
                  const isSolved = myResult?.submissions?.some(
                    (s) => s.problemId.toString() === p._id.toString() && (s.verdict === 'Accepted' || s.score > 0)
                  )

                  return (
                    <div
                      key={p._id}
                      onClick={() => {
                        setSelectedProblem(p)
                        setSubmissionFeedback(null)
                      }}
                      className={`cursor-pointer rounded-xl border p-4 transition ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/50 shadow-sm'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-100 text-xs font-bold text-slate-700">
                            {String.fromCharCode(65 + idx)}
                          </span>
                          <span className="text-sm font-semibold text-slate-900">{p.title}</span>
                        </div>
                        {isSolved && (
                          <CheckCircle2 size={16} className="text-teal-600" />
                        )}
                      </div>
                      <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-500">
                        <span className="rounded bg-slate-100 px-2 py-0.5 font-medium">{p.difficulty}</span>
                        <span>•</span>
                        <span>{p.topic}</span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Right Problem Solver Area */}
            <div className="space-y-4 lg:col-span-8">
              {selectedProblem ? (
                <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  {/* Problem statement header */}
                  <div className="flex flex-col gap-2 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-slate-900">{selectedProblem.title}</h3>
                        <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                          {selectedProblem.difficulty}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-slate-400">
                        Topic: {selectedProblem.topic} · VJudge Ref: {selectedProblem.externalProblemId}
                      </p>
                    </div>

                    {/* VJudge Testing link button */}
                    <a
                      href={selectedProblem.externalUrl || `https://vjudge.net/problem/${selectedProblem.externalProblemId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3.5 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
                    >
                      <ExternalLink size={14} />
                      Test on VJudge Judge
                    </a>
                  </div>

                  {/* Problem Statement */}
                  <div className="prose prose-sm max-w-none text-xs text-slate-700 whitespace-pre-line leading-relaxed">
                    {selectedProblem.description}
                  </div>

                  {/* Sample Test Cases */}
                  {selectedProblem.sampleCases && selectedProblem.sampleCases.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Sample Test Cases</h4>
                      {selectedProblem.sampleCases.map((sc, i) => (
                        <div key={i} className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs space-y-1.5">
                          {sc.input && (
                            <div>
                              <span className="font-semibold text-slate-500">Input:</span>
                              <pre className="mt-0.5 overflow-x-auto rounded bg-white p-2 font-mono text-slate-800 border border-slate-200">
                                {sc.input}
                              </pre>
                            </div>
                          )}
                          {sc.output && (
                            <div>
                              <span className="font-semibold text-slate-500">Output:</span>
                              <pre className="mt-0.5 overflow-x-auto rounded bg-white p-2 font-mono text-slate-800 border border-slate-200">
                                {sc.output}
                              </pre>
                            </div>
                          )}
                          {sc.explanation && (
                            <p className="text-[11px] text-slate-500">
                              <span className="font-semibold">Explanation:</span> {sc.explanation}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Code Editor & Submission Form */}
                  <form onSubmit={handleSubmitSolution} className="space-y-3 border-t border-slate-100 pt-4">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <FileCode size={16} className="text-indigo-600" />
                        Solution Code
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400">Language:</span>
                        <select
                          value={language}
                          onChange={(e) => handleLanguageChange(e.target.value)}
                          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-500"
                        >
                          {(contestDetails.allowedLanguages || ['C++', 'Java', 'Python', 'JavaScript']).map((l) => (
                            <option key={l} value={l}>
                              {l}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <textarea
                      rows={12}
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      required
                      placeholder="Write your solution code here..."
                      className="w-full rounded-xl border border-slate-200 bg-slate-900 p-4 font-mono text-xs text-emerald-400 outline-none focus:border-indigo-500"
                      spellCheck="false"
                    />

                    <div className="flex justify-end pt-1">
                      {/* [Submit Solution] button */}
                      <button
                        type="submit"
                        id="btn-submit-solution"
                        disabled={isSubmitting || !isLive}
                        className={`flex items-center justify-center gap-2 rounded-xl px-6 py-2.5 text-xs font-bold text-white shadow-md transition ${
                          !isLive
                            ? 'bg-slate-400 cursor-not-allowed'
                            : isSubmitting
                            ? 'bg-indigo-400'
                            : 'bg-indigo-600 hover:bg-indigo-500'
                        }`}
                      >
                        {isSubmitting ? (
                          <>
                            <RefreshCw size={14} className="animate-spin" /> Submitting...
                          </>
                        ) : !isLive ? (
                          'Contest not Live'
                        ) : (
                          <>
                            <Play size={14} /> Submit Solution
                          </>
                        )}
                      </button>
                    </div>
                  </form>


                  {/* Submission Feedback */}
                  {submissionFeedback && (
                    <div
                      className={`flex items-center gap-2.5 rounded-xl border p-4 text-xs font-medium ${
                        submissionFeedback.type === 'success'
                          ? 'border-teal-200 bg-teal-50 text-teal-900'
                          : 'border-rose-200 bg-rose-50 text-rose-900'
                      }`}
                    >
                      {submissionFeedback.type === 'success' ? (
                        <CheckCircle2 size={18} className="text-teal-600 shrink-0" />
                      ) : (
                        <AlertCircle size={18} className="text-rose-600 shrink-0" />
                      )}
                      <div>
                        <p className="font-semibold">{submissionFeedback.message}</p>
                        {submissionFeedback.submission && (
                          <p className="text-[11px] text-slate-600 mt-0.5">
                            Status: <span className="font-bold">{submissionFeedback.submission.verdict}</span> · Language: {submissionFeedback.submission.language}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white p-8 text-center text-xs text-slate-400">
                  Select a problem from the left to view the statement and start coding.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Standings / Leaderboard */}
        {contestTab === 'standings' && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Official Contest Standings</h3>
                <p className="text-xs text-slate-400">
                  Real-time rank calculated from problems solved, contest score, and penalty.
                </p>
              </div>
              <button
                type="button"
                onClick={() => loadStandings(activeContest._id)}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                <RefreshCw size={13} /> Refresh
              </button>
            </div>

            {standings.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                No participant submissions recorded in this contest yet.
              </div>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-100 text-slate-400">
                    <tr>
                      <th className="py-2.5 font-semibold">Rank</th>
                      <th className="py-2.5 font-semibold">Candidate</th>
                      <th className="py-2.5 font-semibold">Problems Solved</th>
                      <th className="py-2.5 font-semibold">Score</th>
                      <th className="py-2.5 font-semibold">Sync Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {standings.map((r, i) => (
                      <tr key={r._id || i} className="hover:bg-slate-50/50">
                        <td className="py-3 font-bold text-slate-900">#{r.rank || i + 1}</td>
                        <td className="py-3 font-semibold text-slate-800">
                          {r.studentId?.name || 'Student Candidate'}
                        </td>
                        <td className="py-3 text-slate-600 font-medium">
                          {r.problemsSolved} / {r.totalProblems || contestDetails.problems?.length || 0}
                        </td>
                        <td className="py-3 font-bold text-indigo-600">{r.score} pts</td>
                        <td className="py-3">
                          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-600">
                            {r.syncStatus || 'Result Sync Pending'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  // ────────────────────────────────────────────────────────
  // RENDER CONTESTS LIST
  // ────────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-16">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 rounded-2xl bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 p-6 text-white shadow-md sm:p-8">
        <div>
          <div className="flex items-center gap-2 text-indigo-400">
            <Code2 size={20} />
            <span className="text-xs font-semibold uppercase tracking-wider">Recruitment Coding Contests</span>
          </div>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">
            Industry Tests (DSA Contests)
          </h1>
          <p className="mt-1 max-w-2xl text-xs sm:text-sm text-slate-300">
            Participate in real company-sponsored DSA screening contests. Contest performance synchronizes directly to your Industry Matrix.
          </p>
        </div>
      </div>

      {/* Filter and search bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1 rounded-lg bg-slate-100 p-1">
          {['all', 'live', 'upcoming', 'completed'].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setFilter(tab)}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold capitalize transition ${
                filter === tab ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab === 'all' ? 'All Contests' : tab}
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <Search size={14} className="absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search contests by title or role..."
            className="w-full rounded-lg border border-slate-200 pl-8 pr-3 py-2 text-xs outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Contests Grid */}
      {loading ? (
        <div className="py-16 text-center text-xs text-slate-400">Loading contests...</div>
      ) : filteredContests.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <Trophy size={36} className="mx-auto text-slate-300" />
          <h3 className="mt-3 text-sm font-bold text-slate-700">No coding contests found</h3>
          <p className="mt-1 text-xs text-slate-400">
            Check back soon for new company coding challenges and DSA screening tests.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredContests.map((c) => {
            const status = c.computedStatus || c.status
            const isLive = status === 'Live'

            return (
              <div
                key={c._id}
                className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="rounded bg-indigo-50 px-2.5 py-1 text-[11px] font-bold text-indigo-700">
                      {c.company}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        isLive
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : status === 'Scheduled'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      • {status}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{c.title}</h3>
                    <p className="text-xs text-slate-500 mt-0.5 font-medium">Role: {c.role}</p>
                    {c.description && (
                      <p className="mt-1 text-xs text-slate-400 line-clamp-2">{c.description}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 rounded-xl border border-slate-100 bg-slate-50 p-2.5 text-[11px] text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <Clock size={13} className="text-indigo-500" />
                      <span>{c.durationMinutes} Mins</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <FileCode size={13} className="text-teal-500" />
                      <span>{c.problems?.length || 0} Problems</span>
                    </div>
                    <div className="col-span-2 flex items-center gap-1.5 text-slate-400 pt-0.5">
                      <Calendar size={13} />
                      <span>Starts: {new Date(c.startDate).toLocaleDateString()} {new Date(c.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-[11px] text-slate-400">
                    Eligible: <span className="font-semibold text-slate-600">{c.eligibility}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => openContest(c)}
                    className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition ${
                      isLive
                        ? 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-sm'
                        : 'bg-indigo-600 text-white hover:bg-indigo-500'
                    }`}
                  >
                    {isLive ? 'Enter Contest' : 'View Contest'} <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
