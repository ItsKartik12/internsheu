import { useState, useEffect } from 'react'
import {
  Award,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Sparkles,
  BookOpen,
  Code,
  Layers,
  Server,
  Cpu,
  Database,
  Terminal,
} from 'lucide-react'
import {
  fetchAssessmentTopics,
  startAssessmentApi,
  submitAssessmentApi,
} from '../services/api'
import { useNavigate } from 'react-router-dom'

const ICON_MAP = {
  Code,
  Layers,
  Server,
  Cpu,
  Database,
  Terminal,
  Award,
}

export default function AssessmentPage() {
  const navigate = useNavigate()
  const [topics, setTopics] = useState([])
  const [loading, setLoading] = useState(true)

  // Quiz State
  const [activeSession, setActiveSession] = useState(null)
  // activeSession: { topic, questions }
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState({}) // { questionId: selectedOptionIndex }
  const [timeLeft, setTimeLeft] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [result, setResult] = useState(null)

  useEffect(() => {
    loadTopics()
  }, [])

  // Timer effect during active quiz
  useEffect(() => {
    if (!activeSession || result) return

    if (timeLeft <= 0) {
      handleFinalSubmit()
      return
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [activeSession, timeLeft, result])

  async function loadTopics() {
    setLoading(true)
    const data = await fetchAssessmentTopics()
    setTopics(data?.topics || [])
    setLoading(false)
  }

  async function handleStartQuiz(topic) {
    try {
      const data = await startAssessmentApi(topic._id)
      if (!data?.questions || data.questions.length === 0) {
        alert('No questions configured for this topic yet.')
        return
      }

      setActiveSession({
        topic: data.topic,
        questions: data.questions,
      })
      setCurrentIndex(0)
      setAnswers({})
      setResult(null)
      setTimeLeft((data.topic.timeLimitMinutes || 15) * 60)
    } catch (err) {
      alert(err.message || 'Could not start assessment')
    }
  }

  function handleSelectOption(questionId, optionIndex) {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }))
  }

  async function handleFinalSubmit() {
    if (isSubmitting || !activeSession) return
    setIsSubmitting(true)

    try {
      const answersPayload = activeSession.questions.map((q) => ({
        questionId: q._id,
        selectedAnswer: answers[q._id] !== undefined ? answers[q._id] : -1,
      }))

      const timeTakenSeconds =
        (activeSession.topic.timeLimitMinutes || 15) * 60 - Math.max(0, timeLeft)

      const response = await submitAssessmentApi({
        topicId: activeSession.topic._id,
        answers: answersPayload,
        timeTakenSeconds,
      })

      setResult(response)
    } catch (err) {
      alert(err.message || 'Submission failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // If in active quiz mode
  if (activeSession && !result) {
    const currentQuestion = activeSession.questions[currentIndex]
    const totalQuestions = activeSession.questions.length
    const answeredCount = Object.keys(answers).length
    const progressPercent = Math.round(((currentIndex + 1) / totalQuestions) * 100)

    return (
      <div className="mx-auto max-w-4xl space-y-6 pb-12">
        {/* Quiz Top bar */}
        <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-teal-600">
              {activeSession.topic.name}
            </span>
            <h2 className="text-sm font-semibold text-slate-900">
              Question {currentIndex + 1} of {totalQuestions}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 rounded-xl bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700">
              <Clock size={15} />
              <span>{formatTime(timeLeft)}</span>
            </div>

            <button
              type="button"
              onClick={handleFinalSubmit}
              disabled={isSubmitting}
              className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-indigo-500 disabled:opacity-50"
            >
              {isSubmitting ? 'Evaluating…' : 'Finish Test'}
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full bg-indigo-600 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Question Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <h3 className="text-lg font-bold text-slate-900 leading-snug">
              {currentQuestion?.question}
            </h3>
            <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 shrink-0">
              {currentQuestion?.marks || 1} mark
            </span>
          </div>

          {/* Options */}
          <div className="mt-6 space-y-3">
            {(currentQuestion?.options || []).map((option, idx) => {
              const isSelected = answers[currentQuestion._id] === idx
              const optionLetter = String.fromCharCode(65 + idx) // A, B, C, D

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectOption(currentQuestion._id, idx)}
                  className={`flex w-full items-center gap-3.5 rounded-xl border p-4 text-left transition-all ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/70 shadow-sm ring-1 ring-indigo-500'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition-colors ${
                      isSelected
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {optionLetter}
                  </div>
                  <span className="text-sm font-medium text-slate-800">{option}</span>
                </button>
              )
            })}
          </div>

          {/* Nav Buttons */}
          <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-5">
            <button
              type="button"
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex((prev) => prev - 1)}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-30"
            >
              <ArrowLeft size={14} />
              Previous
            </button>

            <span className="text-xs text-slate-400">
              {answeredCount} of {totalQuestions} answered
            </span>

            {currentIndex < totalQuestions - 1 ? (
              <button
                type="button"
                onClick={() => setCurrentIndex((prev) => prev + 1)}
                className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
              >
                Next
                <ArrowRight size={14} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinalSubmit}
                disabled={isSubmitting}
                className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-semibold text-white hover:bg-indigo-500 shadow"
              >
                {isSubmitting ? 'Evaluating…' : 'Submit Test'}
                <CheckCircle2 size={14} />
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // If viewing Quiz Results
  if (result) {
    const isPassed = result.passed
    return (
      <div className="mx-auto max-w-4xl space-y-6 pb-12">
        {/* Result Header Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm text-center sm:p-8">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50">
            <Award className="text-indigo-600" size={32} />
          </div>

          <span className="mt-4 inline-block rounded-full bg-teal-50 px-3 py-1 text-xs font-bold text-teal-700">
            {activeSession?.topic?.name} Assessment Complete
          </span>

          <h2 className="mt-2 text-3xl font-extrabold text-slate-900">
            {result.percentage}% Score
          </h2>

          <div className="mt-2 flex items-center justify-center gap-2">
            <span
              className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-bold ${
                isPassed ? 'bg-teal-100 text-teal-800' : 'bg-rose-100 text-rose-800'
              }`}
            >
              {isPassed ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
              {isPassed ? 'Assessment Passed' : 'Needs Practice'}
            </span>
            <span className="rounded-md bg-purple-100 px-2.5 py-1 text-xs font-bold text-purple-800">
              Proficiency: {result.level}
            </span>
          </div>

          <p className="mt-3 text-xs text-slate-500">
            You scored {result.score} out of {result.totalMarks} points. Time taken: {result.timeTakenSeconds}s.
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => handleStartQuiz(activeSession.topic)}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <RotateCcw size={14} />
              Retake Assessment
            </button>
            <button
              type="button"
              onClick={() => navigate('/assessment/results')}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow hover:bg-indigo-500"
            >
              <Sparkles size={14} />
              View Skill Matrix
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveSession(null)
                setResult(null)
              }}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Back to Topics
            </button>
          </div>
        </div>

        {/* Answer Breakdown with Explanations */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100">
            Detailed Review & Explanations
          </h3>

          <div className="mt-4 space-y-6 divide-y divide-slate-100">
            {(result.detailedAnswers || []).map((ans, idx) => {
              const origQ = activeSession?.questions?.find(
                (q) => q._id.toString() === ans.questionId.toString()
              )
              return (
                <div key={idx} className="pt-4 first:pt-0 space-y-2">
                  <div className="flex items-start gap-2">
                    {ans.isCorrect ? (
                      <CheckCircle2 size={18} className="text-teal-600 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle size={18} className="text-rose-500 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        {idx + 1}. {origQ?.question}
                      </p>
                      <div className="mt-2 text-xs space-y-1">
                        <p className={ans.isCorrect ? 'text-teal-700 font-semibold' : 'text-rose-600 font-semibold'}>
                          Your choice: {origQ?.options[ans.selectedAnswer] || 'Unanswered'}
                        </p>
                        {!ans.isCorrect && (
                          <p className="text-teal-700 font-semibold">
                            Correct answer: {origQ?.options[ans.correctAnswer]}
                          </p>
                        )}
                      </div>
                      {ans.explanation && (
                        <div className="mt-2 rounded-lg bg-slate-50 p-2.5 text-xs text-slate-600 border border-slate-100">
                          <span className="font-bold text-slate-700">Explanation: </span>
                          {ans.explanation}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  // Topic Listing Mode
  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col gap-4 rounded-2xl bg-gradient-to-r from-teal-900 via-slate-900 to-indigo-950 p-6 text-white shadow-md sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <div>
          <div className="flex items-center gap-2 text-teal-400">
            <Award size={20} />
            <span className="text-xs font-semibold uppercase tracking-wider">Skill Verification</span>
          </div>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">
            Standardized Skill Assessments
          </h1>
          <p className="mt-1 max-w-xl text-sm text-slate-300">
            Test your knowledge across industry-aligned technical domains. Verified assessment scores are displayed directly to recruiters.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/assessment/results')}
          className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-teal-500 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-sm transition-all hover:bg-teal-400"
        >
          <Sparkles size={16} />
          My Verified Skills
        </button>
      </div>

      {/* Topics Grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="h-48 animate-pulse rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {topics.map((topic) => {
            const Icon = ICON_MAP[topic.icon] || Code
            return (
              <div
                key={topic._id}
                className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:border-slate-300 hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
                      <Icon size={20} />
                    </div>
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                      {topic.category}
                    </span>
                  </div>

                  <h3 className="mt-3 text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                    {topic.name}
                  </h3>

                  <p className="mt-2 text-xs leading-relaxed text-slate-500 line-clamp-2">
                    {topic.description}
                  </p>
                </div>

                <div className="mt-5 border-t border-slate-100 pt-3">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center gap-1">
                      <BookOpen size={13} className="text-slate-400" />
                      <span>{topic.questionCount || 10} Questions</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock size={13} className="text-slate-400" />
                      <span>{topic.timeLimitMinutes || 15} mins</span>
                    </div>
                    <span className="text-[11px] font-semibold text-teal-700">
                      Pass: {topic.passPercentage || 60}%
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleStartQuiz(topic)}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-indigo-500"
                  >
                    Start Assessment
                    <ArrowRight size={14} />
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
