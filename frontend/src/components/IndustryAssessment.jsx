import { useState, useEffect } from 'react'
import {
  ClipboardCheck,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  Award,
  RefreshCw,
  Search,
} from 'lucide-react'
import {
  fetchStudentIndustryAssessments,
  startStudentAssessmentApi,
  submitStudentAssessmentApi,
} from '../services/api'

export default function IndustryAssessment() {
  const [assessments, setAssessments] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  // Active Assessment State
  const [activeAssessment, setActiveAssessment] = useState(null)
  const [assessmentInfo, setAssessmentInfo] = useState(null)
  const [questions, setQuestions] = useState([])
  const [currentQIndex, setCurrentQIndex] = useState(0)
  const [userAnswers, setUserAnswers] = useState({}) // { questionId: selectedIndex }
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // Completed Attempt Result View
  const [attemptResult, setAttemptResult] = useState(null)
  const [questionReview, setQuestionReview] = useState([])

  useEffect(() => {
    loadAssessments()
  }, [])

  // Timer countdown hook during active assessment
  useEffect(() => {
    if (!activeAssessment || timeRemaining <= 0 || attemptResult) return

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          handleAutoSubmit()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [activeAssessment, timeRemaining, attemptResult])

  async function loadAssessments() {
    setLoading(true)
    const res = await fetchStudentIndustryAssessments()
    setAssessments(res?.assessments || [])
    setLoading(false)
  }

  async function handleStartAssessment(assessment) {
    setErrorMsg('')
    setLoading(true)
    try {
      const res = await startStudentAssessmentApi(assessment._id)
      setAssessmentInfo(res.assessment)
      setQuestions(res.questions || [])
      setCurrentQIndex(0)
      setUserAnswers({})
      setTimeRemaining((res.assessment.durationMinutes || 30) * 60)
      setActiveAssessment(assessment)
      setAttemptResult(null)
      setQuestionReview([])
    } catch (err) {
      setErrorMsg(err.message || 'Failed to start assessment.')
    } finally {
      setLoading(false)
    }
  }

  function handleSelectOption(qId, optIndex) {
    setUserAnswers((prev) => ({
      ...prev,
      [qId]: optIndex,
    }))
  }

  function handleClearOption(qId) {
    setUserAnswers((prev) => {
      const next = { ...prev }
      delete next[qId]
      return next
    })
  }

  function handleAutoSubmit() {
    handleSubmitAssessment()
  }

  async function handleSubmitAssessment() {
    if (isSubmitting) return
    setIsSubmitting(true)
    setErrorMsg('')

    try {
      const answersPayload = Object.entries(userAnswers).map(([questionId, selectedAnswer]) => ({
        questionId,
        selectedAnswer,
      }))

      const timeTakenSeconds = (assessmentInfo.durationMinutes * 60) - timeRemaining

      const res = await submitStudentAssessmentApi(activeAssessment._id, {
        answers: answersPayload,
        timeTakenSeconds,
      })

      setAttemptResult(res.attempt)
      setQuestionReview(res.questionReview || [])
      loadAssessments() // refresh list attempt counts
    } catch (err) {
      setErrorMsg(err.message || 'Failed to submit assessment answers.')
    } finally {
      setIsSubmitting(false)
    }
  }

  function formatTime(secs) {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const filteredAssessments = assessments.filter((a) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      a.title?.toLowerCase().includes(q) ||
      a.company?.toLowerCase().includes(q) ||
      a.role?.toLowerCase().includes(q)
    )
  })

  // ────────────────────────────────────────────────────────
  // ACTIVE ASSESSMENT SCREEN
  // ────────────────────────────────────────────────────────
  if (activeAssessment && !attemptResult && questions.length > 0) {
    const currentQ = questions[currentQIndex]
    const answeredCount = Object.keys(userAnswers).length

    return (
      <div className="mx-auto max-w-5xl space-y-6 pb-16">
        {/* Top bar with timer & progress */}
        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
              {assessmentInfo.company} · {assessmentInfo.role}
            </span>
            <h2 className="text-base font-bold text-slate-900">{assessmentInfo.title}</h2>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-1.5 text-xs font-bold text-amber-800">
              <Clock size={16} className="text-amber-600" />
              <span>{formatTime(timeRemaining)}</span>
            </div>

            <button
              type="button"
              onClick={handleSubmitAssessment}
              disabled={isSubmitting}
              className="rounded-xl bg-teal-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-teal-500"
            >
              {isSubmitting ? 'Submitting...' : 'Finish & Submit'}
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-700">
            <AlertCircle size={16} />
            {errorMsg}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Question Display */}
          <div className="space-y-4 lg:col-span-8">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Question {currentQIndex + 1} of {questions.length}
                </span>
                <div className="flex items-center gap-2 text-[11px] font-medium text-slate-500">
                  <span className="rounded bg-slate-100 px-2 py-0.5">+{currentQ.marks} Marks</span>
                  {currentQ.negativeMarks > 0 && (
                    <span className="rounded bg-rose-50 text-rose-700 px-2 py-0.5">-{currentQ.negativeMarks} Negative</span>
                  )}
                  <span className="rounded bg-blue-50 text-blue-700 px-2 py-0.5">{currentQ.difficulty}</span>
                </div>
              </div>

              <div className="mt-4">
                <h3 className="text-sm font-semibold text-slate-900 leading-relaxed">
                  {currentQ.question}
                </h3>
              </div>

              {/* Options */}
              <div className="mt-6 space-y-2.5">
                {currentQ.options.map((option, optIdx) => {
                  const isSelected = userAnswers[currentQ._id] === optIdx
                  return (
                    <div
                      key={optIdx}
                      onClick={() => handleSelectOption(currentQ._id, optIdx)}
                      className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 text-xs font-medium transition ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/50 text-indigo-950 font-semibold shadow-sm'
                          : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <div
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-600 text-white font-bold'
                            : 'border-slate-300 text-slate-500'
                        }`}
                      >
                        {String.fromCharCode(65 + optIdx)}
                      </div>
                      <span className="flex-1">{option}</span>
                    </div>
                  )
                })}
              </div>

              {/* Action buttons */}
              <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-4">
                <button
                  type="button"
                  disabled={currentQIndex === 0}
                  onClick={() => setCurrentQIndex((prev) => prev - 1)}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 disabled:opacity-40 hover:bg-slate-50"
                >
                  <ArrowLeft size={14} /> Previous
                </button>

                {userAnswers[currentQ._id] !== undefined && (
                  <button
                    type="button"
                    onClick={() => handleClearOption(currentQ._id)}
                    className="text-xs text-slate-400 hover:text-slate-600 underline"
                  >
                    Clear Choice
                  </button>
                )}

                <button
                  type="button"
                  disabled={currentQIndex === questions.length - 1}
                  onClick={() => setCurrentQIndex((prev) => prev + 1)}
                  className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-40 hover:bg-indigo-500"
                >
                  Next <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* Question Palette Column */}
          <div className="space-y-4 lg:col-span-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Question Navigator</h4>
              <p className="mt-1 text-[11px] text-slate-400">
                Answered: <span className="font-semibold text-slate-700">{answeredCount}</span> / {questions.length}
              </p>

              <div className="mt-4 grid grid-cols-5 gap-2">
                {questions.map((q, idx) => {
                  const isCurrent = idx === currentQIndex
                  const isAnswered = userAnswers[q._id] !== undefined
                  return (
                    <button
                      key={q._id}
                      type="button"
                      onClick={() => setCurrentQIndex(idx)}
                      className={`flex h-9 w-9 items-center justify-center rounded-lg text-xs font-bold transition ${
                        isCurrent
                          ? 'border-2 border-indigo-600 bg-indigo-600 text-white shadow-sm'
                          : isAnswered
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  )
                })}
              </div>

              <div className="mt-6 space-y-1.5 border-t border-slate-100 pt-3 text-[11px] text-slate-500">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded bg-emerald-100 border border-emerald-300" />
                  <span>Answered</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded bg-slate-100" />
                  <span>Unanswered</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded bg-indigo-600 text-white" />
                  <span>Current Question</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ────────────────────────────────────────────────────────
  // ATTEMPT COMPLETED RESULT SCREEN
  // ────────────────────────────────────────────────────────
  if (attemptResult) {
    return (
      <div className="mx-auto max-w-4xl space-y-6 pb-16">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div
            className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${
              attemptResult.passed ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
            }`}
          >
            {attemptResult.passed ? <CheckCircle2 size={36} /> : <XCircle size={36} />}
          </div>

          <h2 className="mt-4 text-2xl font-extrabold text-slate-900">
            {attemptResult.passed ? 'Assessment Passed!' : 'Assessment Completed'}
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Your results have been synchronized to your Industry Matrix and submitted to the company recruiter.
          </p>

          {/* Quick Metrics */}
          <div className="mx-auto mt-6 grid max-w-lg grid-cols-3 gap-3">
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
              <span className="text-[11px] text-slate-400">Score</span>
              <p className="mt-1 text-xl font-bold text-slate-900">
                {attemptResult.score} / {attemptResult.totalMarks}
              </p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
              <span className="text-[11px] text-slate-400">Percentage</span>
              <p className="mt-1 text-xl font-bold text-indigo-600">{attemptResult.percentage}%</p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
              <span className="text-[11px] text-slate-400">Status</span>
              <p
                className={`mt-1 text-sm font-bold ${
                  attemptResult.passed ? 'text-emerald-600' : 'text-slate-600'
                }`}
              >
                {attemptResult.passed ? 'Passed' : 'Needs Review'}
              </p>
            </div>
          </div>

          <div className="mt-8 flex justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                setActiveAssessment(null)
                setAttemptResult(null)
              }}
              className="rounded-xl bg-slate-900 px-6 py-2.5 text-xs font-bold text-white hover:bg-slate-800"
            >
              Back to Industry Assessments
            </button>
          </div>
        </div>

        {/* Detailed Question Review */}
        {questionReview.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Detailed Question Review
            </h3>
            {questionReview.map((q, idx) => (
              <div key={q._id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-bold text-slate-900">
                    Q{idx + 1}. {q.question}
                  </span>
                  {q.isCorrect ? (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 shrink-0">
                      <CheckCircle2 size={14} /> Correct
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-rose-600 shrink-0">
                      <XCircle size={14} /> Incorrect
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {q.options.map((opt, oIdx) => {
                    const isUserChoice = q.selectedAnswer === oIdx
                    const isCorrectAnswer = q.correctAnswer === oIdx
                    return (
                      <div
                        key={oIdx}
                        className={`rounded-lg border p-2.5 ${
                          isCorrectAnswer
                            ? 'border-emerald-300 bg-emerald-50 text-emerald-950 font-semibold'
                            : isUserChoice
                            ? 'border-rose-300 bg-rose-50 text-rose-950'
                            : 'border-slate-100 bg-slate-50 text-slate-600'
                        }`}
                      >
                        <span className="font-bold mr-1.5">{String.fromCharCode(65 + oIdx)}.</span>
                        {opt}
                        {isCorrectAnswer && <span className="ml-1 text-[10px] text-emerald-700 font-bold">(Correct)</span>}
                        {isUserChoice && !isCorrectAnswer && <span className="ml-1 text-[10px] text-rose-700 font-bold">(Your Answer)</span>}
                      </div>
                    )
                  })}
                </div>

                {q.explanation && (
                  <p className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="font-semibold">Explanation:</span> {q.explanation}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  // ────────────────────────────────────────────────────────
  // ASSESSMENTS LIST SCREEN
  // ────────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-16">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 rounded-2xl bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 p-6 text-white shadow-md sm:p-8">
        <div>
          <div className="flex items-center gap-2 text-blue-400">
            <ClipboardCheck size={20} />
            <span className="text-xs font-semibold uppercase tracking-wider">Company Pre-Screening</span>
          </div>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">
            Industry Assessments (MCQ Screening)
          </h1>
          <p className="mt-1 max-w-2xl text-xs sm:text-sm text-slate-300">
            Aptitude, domain knowledge, and role-specific screening tests tailored by hiring partners. Results directly feed into your Industry Matrix.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-medium text-rose-700">
          <AlertCircle size={16} />
          {errorMsg}
        </div>
      )}

      {/* Filter and search bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="text-xs text-slate-500 font-medium">
          Available Tests: <span className="font-bold text-slate-800">{filteredAssessments.length}</span>
        </div>

        <div className="relative min-w-[240px]">
          <Search size={14} className="absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search assessments by company or role..."
            className="w-full rounded-lg border border-slate-200 pl-8 pr-3 py-2 text-xs outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Assessment Cards */}
      {loading ? (
        <div className="py-16 text-center text-xs text-slate-400">Loading industry assessments...</div>
      ) : filteredAssessments.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <ClipboardCheck size={36} className="mx-auto text-slate-300" />
          <h3 className="mt-3 text-sm font-bold text-slate-700">No industry assessments found</h3>
          <p className="mt-1 text-xs text-slate-400">
            Recruitment screening assessments will appear here when published by partner companies.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredAssessments.map((a) => (
            <div
              key={a._id}
              className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="rounded bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700">
                    {a.company}
                  </span>
                  {a.attemptsCount > 0 ? (
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        a.passed
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      Score: {a.latestPercentage}% ({a.passed ? 'Passed' : 'Attempted'})
                    </span>
                  ) : (
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-semibold text-slate-600">
                      Not Attempted
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900">{a.title}</h3>
                  <p className="text-xs text-slate-500 mt-0.5 font-medium">Role: {a.role}</p>
                  {a.description && (
                    <p className="mt-1 text-xs text-slate-400 line-clamp-2">{a.description}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 rounded-xl border border-slate-100 bg-slate-50 p-2.5 text-[11px] text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <Clock size={13} className="text-indigo-500" />
                    <span>{a.durationMinutes} Mins</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <HelpCircle size={13} className="text-teal-500" />
                    <span>{a.questionCount} Questions</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Award size={13} className="text-amber-500" />
                    <span>Pass: {a.passingScore}%</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <span>Attempts: {a.attemptsCount}/{a.maxAttempts}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">{a.eligibility}</span>
                <button
                  type="button"
                  disabled={!a.canAttempt}
                  onClick={() => handleStartAssessment(a)}
                  className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition ${
                    a.canAttempt
                      ? 'bg-blue-600 text-white hover:bg-blue-500 shadow-sm'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {a.attemptsCount > 0 ? (a.canAttempt ? 'Re-attempt' : 'Completed') : 'Start Assessment'}{' '}
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
