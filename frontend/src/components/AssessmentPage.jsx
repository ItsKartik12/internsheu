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
  WifiOff,
  RefreshCw,
} from 'lucide-react'
import {
  fetchAssessmentTopics,
  startAssessmentApi,
  submitAssessmentApi,
} from '../services/api'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  getCachedTopics,
  saveCachedTopics,
  getCachedQuestions,
  saveCachedQuestions,
  getAssessmentAttempt,
  saveAssessmentAttempt,
  clearAssessmentAttempt,
  addToSyncQueue,
  saveCachedAssessmentResults,
} from '../services/offlineDb'
import { isOnline, subscribeNetworkStatus } from '../services/networkStatus'
import { subscribeSyncStatus, syncPendingOperations } from '../services/syncManager'

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
  const { user } = useAuth()
  const userId = user?._id || user?.id || 'guest_student'

  const [topics, setTopics] = useState([])
  const [loading, setLoading] = useState(true)
  const [isOffline, setIsOffline] = useState(!isOnline())

  // Quiz State
  const [activeSession, setActiveSession] = useState(null)
  // activeSession: { topic, questions }
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState({}) // { questionId: selectedOptionIndex }
  const [timeLeft, setTimeLeft] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [result, setResult] = useState(null)
  const [pendingSubmission, setPendingSubmission] = useState(null)
  const [syncNotice, setSyncNotice] = useState('')

  useEffect(() => {
    loadTopics()
  }, [])

  // Restore in-progress quiz if user refreshed the browser while taking an assessment
  useEffect(() => {
    async function restoreActiveQuiz() {
      try {
        const activeTopicId = localStorage.getItem('active_quiz_topicId')
        if (activeTopicId && userId) {
          const attempt = await getAssessmentAttempt(`${userId}_${activeTopicId}`)
          if (attempt && attempt.status === 'in_progress' && attempt.questions?.length > 0) {
            setActiveSession({
              topic: attempt.topic,
              questions: attempt.questions,
            })
            setAnswers(attempt.answers || {})
            setCurrentIndex(attempt.currentIndex || 0)
            setTimeLeft(attempt.timeLeft || (attempt.topic.timeLimitMinutes || 15) * 60)
          }
        }
      } catch (err) {
        console.warn('Could not restore in-progress quiz:', err)
      }
    }
    restoreActiveQuiz()
  }, [userId])

  // Listen to network status and automatic sync updates
  useEffect(() => {
    const unsubSync = subscribeSyncStatus((syncState) => {
      if (syncState.syncedAssessment) {
        setResult(syncState.syncedAssessment)
        setPendingSubmission(null)
        setSyncNotice('Official assessment evaluated and synced with server!')
        setTimeout(() => setSyncNotice(''), 5000)
      }
    })

    const unsubNet = subscribeNetworkStatus((online) => {
      setIsOffline(!online)
      if (online) {
        syncPendingOperations(userId)
        loadTopics()
      }
    })

    return () => {
      unsubSync()
      unsubNet()
    }
  }, [userId])

  // Timer effect during active quiz
  useEffect(() => {
    if (!activeSession || result || pendingSubmission) return

    if (timeLeft <= 0) {
      handleFinalSubmit()
      return
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        const nextTime = prev - 1
        // Periodically update remaining time in IndexedDB
        if (activeSession && nextTime % 10 === 0) {
          saveAssessmentAttempt({
            attemptKey: `${userId}_${activeSession.topic._id}`,
            userId,
            topicId: activeSession.topic._id,
            topic: activeSession.topic,
            questions: activeSession.questions,
            answers,
            currentIndex,
            timeLeft: nextTime,
            status: 'in_progress',
          }).catch(() => {})
        }
        return nextTime
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [activeSession, timeLeft, result, pendingSubmission, answers, currentIndex, userId])

  async function loadTopics() {
    setLoading(true)
    try {
      const cached = await getCachedTopics()
      if (cached && cached.length > 0) {
        setTopics(cached)
        setLoading(false)
      }

      if (isOnline()) {
        const data = await fetchAssessmentTopics()
        if (data?.topics) {
          setTopics(data.topics)
          await saveCachedTopics(data.topics)
          // Pre-cache questions for available topics so assessment can start offline seamlessly
          for (const top of data.topics.slice(0, 3)) {
            try {
              const qData = await startAssessmentApi(top._id)
              if (qData?.questions?.length > 0) {
                await saveCachedQuestions(top._id, qData.topic, qData.questions)
              }
            } catch {}
          }
        }
      } else {
        setIsOffline(true)
      }
    } catch (err) {
      console.warn('Could not fetch assessment topics:', err.message)
      const cached = await getCachedTopics()
      if (cached && cached.length > 0) {
        setTopics(cached)
      }
      setIsOffline(true)
    } finally {
      setLoading(false)
    }
  }

  async function handleStartQuiz(topic) {
    try {
      // 1. Check if user already had an in-progress attempt for this topic
      const savedAttempt = await getAssessmentAttempt(`${userId}_${topic._id}`)
      if (savedAttempt && savedAttempt.status === 'in_progress' && savedAttempt.questions?.length > 0) {
        setActiveSession({
          topic: savedAttempt.topic,
          questions: savedAttempt.questions,
        })
        setCurrentIndex(savedAttempt.currentIndex || 0)
        setAnswers(savedAttempt.answers || {})
        setTimeLeft(savedAttempt.timeLeft || (savedAttempt.topic.timeLimitMinutes || 15) * 60)
        localStorage.setItem('active_quiz_topicId', topic._id)
        setResult(null)
        setPendingSubmission(null)
        return
      }

      // 2. If online: fetch fresh questions from API and cache in IndexedDB
      if (isOnline()) {
        const data = await startAssessmentApi(topic._id)
        if (!data?.questions || data.questions.length === 0) {
          alert('No questions configured for this topic yet.')
          return
        }

        await saveCachedQuestions(topic._id, data.topic, data.questions)

        setActiveSession({
          topic: data.topic,
          questions: data.questions,
        })
        setCurrentIndex(0)
        setAnswers({})
        setResult(null)
        setPendingSubmission(null)
        const initialTime = (data.topic.timeLimitMinutes || 15) * 60
        setTimeLeft(initialTime)
        localStorage.setItem('active_quiz_topicId', topic._id)

        await saveAssessmentAttempt({
          attemptKey: `${userId}_${topic._id}`,
          userId,
          topicId: topic._id,
          topic: data.topic,
          questions: data.questions,
          answers: {},
          currentIndex: 0,
          timeLeft: initialTime,
          status: 'in_progress',
        })
        return
      }

      // 3. If offline: start assessment from cached questions in IndexedDB
      const cachedQ = await getCachedQuestions(topic._id)
      if (cachedQ && cachedQ.questions?.length > 0) {
        const qTopic = cachedQ.topic || topic
        setActiveSession({
          topic: qTopic,
          questions: cachedQ.questions,
        })
        setCurrentIndex(0)
        setAnswers({})
        setResult(null)
        setPendingSubmission(null)
        const initialTime = (qTopic.timeLimitMinutes || 15) * 60
        setTimeLeft(initialTime)
        localStorage.setItem('active_quiz_topicId', topic._id)

        await saveAssessmentAttempt({
          attemptKey: `${userId}_${topic._id}`,
          userId,
          topicId: topic._id,
          topic: qTopic,
          questions: cachedQ.questions,
          answers: {},
          currentIndex: 0,
          timeLeft: initialTime,
          status: 'in_progress',
        })
      } else {
        alert('This assessment has not been cached on this device yet. Please connect to the internet once to download questions.')
      }
    } catch (err) {
      alert(err.message || 'Could not start assessment')
    }
  }

  async function handleSelectOption(questionId, optionIndex) {
    const newAnswers = {
      ...answers,
      [questionId]: optionIndex,
    }
    setAnswers(newAnswers)

    // Answers survive browser refresh: persist in IndexedDB
    if (activeSession) {
      await saveAssessmentAttempt({
        attemptKey: `${userId}_${activeSession.topic._id}`,
        userId,
        topicId: activeSession.topic._id,
        topic: activeSession.topic,
        questions: activeSession.questions,
        answers: newAnswers,
        currentIndex,
        timeLeft,
        status: 'in_progress',
      }).catch((err) => console.warn('Failed to persist draft answers:', err))
    }
  }

  async function handleFinalSubmit() {
    if (isSubmitting || !activeSession) return
    setIsSubmitting(true)

    const answersPayload = activeSession.questions.map((q) => ({
      questionId: q._id,
      selectedAnswer: answers[q._id] !== undefined ? answers[q._id] : -1,
    }))

    const timeTakenSeconds =
      (activeSession.topic.timeLimitMinutes || 15) * 60 - Math.max(0, timeLeft)

    const attemptKey = `${userId}_${activeSession.topic._id}`

    if (isOnline()) {
      try {
        const response = await submitAssessmentApi({
          topicId: activeSession.topic._id,
          answers: answersPayload,
          timeTakenSeconds,
        })

        localStorage.removeItem('active_quiz_topicId')
        await clearAssessmentAttempt(attemptKey)
        await saveCachedAssessmentResults(userId, {
          latestAttempt: response,
          topicId: activeSession.topic._id,
          syncedAt: Date.now(),
        })

        setResult(response)
        return
      } catch (err) {
        console.warn('Online submission failed, falling back to offline queue:', err.message)
      } finally {
        setIsSubmitting(false)
      }
    }

    // Offline submission path:
    // 1. Mark attempt in IndexedDB as pending_sync
    await saveAssessmentAttempt({
      attemptKey,
      userId,
      topicId: activeSession.topic._id,
      topic: activeSession.topic,
      answersPayload,
      timeTakenSeconds,
      status: 'pending_sync',
    })

    // 2. Enqueue into persistent syncQueue
    await addToSyncQueue(userId, 'SUBMIT_ASSESSMENT', {
      topicId: activeSession.topic._id,
      answers: answersPayload,
      timeTakenSeconds,
    })

    localStorage.removeItem('active_quiz_topicId')
    setIsSubmitting(false)
    setPendingSubmission({
      topic: activeSession.topic,
      answersCount: Object.keys(answers).length,
      totalQuestions: activeSession.questions.length,
      submittedAt: Date.now(),
    })
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

  // If in Pending Offline Submission state
  if (pendingSubmission && !result) {
    return (
      <div className="mx-auto max-w-2xl space-y-6 pb-12">
        <div className="rounded-2xl border border-amber-200 bg-white p-8 shadow-sm text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50">
            <Clock className="text-amber-600 animate-pulse" size={32} />
          </div>

          <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
            <WifiOff size={12} />
            Offline · Pending Synchronization
          </span>

          <h2 className="mt-3 text-2xl font-extrabold text-slate-900">
            Assessment Submitted Offline
          </h2>

          <p className="mt-2 text-sm text-slate-600 leading-relaxed">
            Your responses for <span className="font-semibold text-slate-900">{pendingSubmission.topic?.name}</span> have been saved securely in your device storage.
          </p>

          <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50 p-4 text-left text-xs space-y-2.5">
            <div className="flex items-center justify-between text-slate-600">
              <span>Assessment Topic:</span>
              <span className="font-semibold text-slate-900">{pendingSubmission.topic?.name}</span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span>Evaluation Status:</span>
              <span className="font-semibold text-amber-700">Pending Server Verification</span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span>Answers Recorded:</span>
              <span className="font-semibold text-slate-900">
                {pendingSubmission.answersCount} of {pendingSubmission.totalQuestions} questions
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span>Submission Time:</span>
              <span className="text-slate-500">Saved Locally (Offline)</span>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50/70 p-3.5 text-xs text-amber-900 text-left">
            <div className="flex items-start gap-2">
              <AlertCircle size={15} className="shrink-0 text-amber-600 mt-0.5" />
              <span>
                To protect assessment integrity and verification standards, official scoring is performed only by the central server. Once internet connectivity is restored, this assessment will automatically synchronize and your certified score will be displayed.
              </span>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => syncPendingOperations(userId)}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow hover:bg-indigo-500"
            >
              <RefreshCw size={13} />
              Check Connection & Sync Now
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveSession(null)
                setPendingSubmission(null)
              }}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Back to Topics
            </button>
            <button
              type="button"
              onClick={() => navigate('/assessment/results')}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              View Skill Matrix
            </button>
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

      {isOffline && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs font-medium text-amber-800">
          <WifiOff size={15} className="shrink-0 text-amber-600" />
          <span>Offline · Showing cached assessments. You can start cached quizzes and answers will be saved locally.</span>
        </div>
      )}

      {syncNotice && (
        <div className="flex items-center gap-2 rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm font-medium text-teal-800 shadow-sm">
          <CheckCircle2 size={18} className="text-teal-600 shrink-0" />
          <span>{syncNotice}</span>
        </div>
      )}

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
