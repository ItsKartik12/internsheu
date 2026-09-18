import { useState, useEffect } from 'react'
import {
  ClipboardCheck,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  HelpCircle,
  Users,
  Award,
  X,
  Pencil,
  BarChart2,
} from 'lucide-react'
import {
  fetchIndustryAssessments,
  createIndustryAssessmentApi,
  updateIndustryAssessmentApi,
  deleteIndustryAssessmentApi,
  fetchAssessmentResultsApi,
} from '../../services/api'

export default function IndustryAssessmentsTab() {
  const [assessments, setAssessments] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  // Create / Edit Assessment Modal
  const [showModal, setShowModal] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [form, setForm] = useState({
    title: '',
    role: 'Software Engineer',
    description: '',
    durationMinutes: 30,
    passingScore: 60,
    maxAttempts: 1,
    eligibility: 'Open to all students',
    status: 'Draft',
    questions: [],
  })

  // Results / Stats Modal
  const [resultsModal, setResultsModal] = useState(null)
  const [resultsData, setResultsData] = useState({ attempts: [], questionStats: [] })
  const [loadingResults, setLoadingResults] = useState(false)

  useEffect(() => {
    loadAssessments()
  }, [])

  async function loadAssessments() {
    setLoading(true)
    const res = await fetchIndustryAssessments()
    setAssessments(res?.assessments || [])
    setLoading(false)
  }

  function handleOpenCreate() {
    setIsEditing(false)
    setEditingId(null)
    setErrorMessage('')
    setForm({
      title: '',
      role: 'Software Engineer',
      description: '',
      durationMinutes: 30,
      passingScore: 60,
      maxAttempts: 1,
      eligibility: 'Open to all students',
      status: 'Published',
      questions: [
        {
          question: 'What is the average time complexity of searching in a Hash Table?',
          options: ['O(1)', 'O(n)', 'O(log n)', 'O(n^2)'],
          correctAnswer: 0,
          marks: 2,
          negativeMarks: 0.5,
          topic: 'Data Structures',
          difficulty: 'Easy',
          explanation: 'Hash tables offer O(1) average lookup assuming a uniform hashing distribution.',
        },
      ],
    })
    setShowModal(true)
  }

  function handleOpenEdit(assessment) {
    setIsEditing(true)
    setEditingId(assessment._id)
    setErrorMessage('')
    setForm({
      title: assessment.title,
      role: assessment.role,
      description: assessment.description || '',
      durationMinutes: assessment.durationMinutes || 30,
      passingScore: assessment.passingScore || 60,
      maxAttempts: assessment.maxAttempts || 1,
      eligibility: assessment.eligibility || 'Open to all students',
      status: assessment.status || 'Draft',
      questions: assessment.questions || [],
    })
    setShowModal(true)
  }

  function handleAddQuestion() {
    setForm((prev) => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          question: '',
          options: ['', '', '', ''],
          correctAnswer: 0,
          marks: 2,
          negativeMarks: 0,
          topic: 'Technical Aptitude',
          difficulty: 'Medium',
          explanation: '',
        },
      ],
    }))
  }

  function handleRemoveQuestion(idx) {
    setForm((prev) => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== idx),
    }))
  }

  function handleQuestionChange(idx, field, val) {
    setForm((prev) => {
      const updated = [...prev.questions]
      updated[idx] = { ...updated[idx], [field]: val }
      return { ...prev, questions: updated }
    })
  }

  function handleOptionChange(qIdx, optIdx, val) {
    setForm((prev) => {
      const updatedQ = [...prev.questions]
      const options = [...updatedQ[qIdx].options]
      options[optIdx] = val
      updatedQ[qIdx] = { ...updatedQ[qIdx], options }
      return { ...prev, questions: updatedQ }
    })
  }

  async function handleSaveAssessment(e) {
    e.preventDefault()
    if (!form.title.trim()) {
      setErrorMessage('Assessment title is required.')
      return
    }
    if (form.questions.length === 0) {
      setErrorMessage('Please add at least one question.')
      return
    }

    // Validate each question
    for (let i = 0; i < form.questions.length; i++) {
      const q = form.questions[i]
      if (!q.question.trim()) {
        setErrorMessage(`Question ${i + 1} text cannot be blank.`)
        return
      }
      if (q.options.some((o) => !o.trim())) {
        setErrorMessage(`Question ${i + 1} has empty options.`)
        return
      }
    }

    setIsSubmitting(true)
    setErrorMessage('')

    try {
      if (isEditing) {
        await updateIndustryAssessmentApi(editingId, form)
        setMessage('Assessment updated successfully.')
      } else {
        await createIndustryAssessmentApi(form)
        setMessage('Industry assessment published successfully!')
      }

      setShowModal(false)
      setTimeout(() => setMessage(''), 3500)
      loadAssessments()
    } catch (err) {
      setErrorMessage(err.message || 'Failed to save assessment.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Are you sure you want to delete this assessment?')) return
    try {
      await deleteIndustryAssessmentApi(id)
      setMessage('Assessment deleted.')
      setTimeout(() => setMessage(''), 3000)
      loadAssessments()
    } catch (err) {
      alert(err.message || 'Failed to delete assessment.')
    }
  }

  async function handleViewResults(assessment) {
    setResultsModal(assessment)
    setLoadingResults(true)
    try {
      const res = await fetchAssessmentResultsApi(assessment._id)
      setResultsData({
        attempts: res?.attempts || [],
        questionStats: res?.questionStats || [],
      })
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingResults(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Industry Pre-Screening Assessments (MCQ)</h2>
          <p className="text-xs text-slate-500">
            Create domain & aptitude screening tests with custom negative marking and question topics.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow hover:bg-blue-500"
        >
          <Plus size={16} /> Create Assessment
        </button>
      </div>

      {message && (
        <div className="flex items-center gap-2 rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm font-medium text-teal-800">
          <CheckCircle2 size={18} className="text-teal-600" />
          {message}
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400">Loading assessments...</div>
      ) : assessments.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <ClipboardCheck size={36} className="mx-auto text-slate-300" />
          <h3 className="mt-3 text-sm font-bold text-slate-700">No industry assessments configured</h3>
          <p className="mt-1 text-xs text-slate-400">
            Click "Create Assessment" to build an MCQ screening test for student applicants.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          {assessments.map((a) => (
            <div key={a._id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                      a.status === 'Published'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    • {a.status}
                  </span>
                  <span className="text-xs text-slate-400">Role: {a.role}</span>
                </div>

                <h3 className="text-sm font-bold text-slate-900">{a.title}</h3>
                {a.description && <p className="text-xs text-slate-500 line-clamp-1">{a.description}</p>}

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
                  <span className="flex items-center gap-1">
                    <Clock size={13} /> {a.durationMinutes} mins
                  </span>
                  <span className="flex items-center gap-1">
                    <HelpCircle size={13} /> {a.questions?.length || 0} Questions
                  </span>
                  <span className="flex items-center gap-1">
                    <Users size={13} /> {a.attemptsCount || 0} Attempts
                  </span>
                  <span className="flex items-center gap-1">
                    <Award size={13} /> Pass: {a.passingScore}%
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleViewResults(a)}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <BarChart2 size={13} /> Results & Stats
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenEdit(a)}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  <Pencil size={13} /> Edit
                </button>

                <button
                  type="button"
                  onClick={() => handleDelete(a._id)}
                  className="rounded-lg border border-rose-200 px-2.5 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE / EDIT ASSESSMENT MODAL */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
          onClick={() => setShowModal(false)}
        >
          <div
            className="flex h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {isEditing ? 'Edit Industry Assessment' : 'Create Industry Assessment (MCQ)'}
                </h3>
                <p className="text-xs text-slate-400">Configure questions, options, marks, and passing criteria.</p>
              </div>
              <button type="button" onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            {errorMessage && (
              <div className="mx-6 mt-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-700">
                <AlertCircle size={16} />
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSaveAssessment} className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* General Settings */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">General Information</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className="text-xs font-medium text-slate-700">Assessment Name *</label>
                      <input
                        type="text"
                        required
                        value={form.title}
                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                        placeholder="e.g. Frontend Engineering Aptitude & React Screening"
                        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-700">Target Role</label>
                      <input
                        type="text"
                        value={form.role}
                        onChange={(e) => setForm({ ...form, role: e.target.value })}
                        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-700">Duration (Minutes)</label>
                      <input
                        type="number"
                        value={form.durationMinutes}
                        onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })}
                        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-700">Passing Score (%)</label>
                      <input
                        type="number"
                        value={form.passingScore}
                        onChange={(e) => setForm({ ...form, passingScore: e.target.value })}
                        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-700">Status</label>
                      <select
                        value={form.status}
                        onChange={(e) => setForm({ ...form, status: e.target.value })}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-blue-500"
                      >
                        <option value="Published">Published (Students can attempt)</option>
                        <option value="Draft">Draft</option>
                        <option value="Paused">Paused</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Questions Builder */}
                <div className="space-y-4 border-t border-slate-100 pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Assessment Questions ({form.questions.length})
                      </h4>
                      <p className="text-[11px] text-slate-400">Add multiple choice questions with correct answer indicator.</p>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddQuestion}
                      className="flex items-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 border border-indigo-200 hover:bg-indigo-100"
                    >
                      <Plus size={14} /> Add Question
                    </button>
                  </div>

                  <div className="space-y-4">
                    {form.questions.map((q, qIdx) => (
                      <div key={qIdx} className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-700">Question {qIdx + 1}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveQuestion(qIdx)}
                            className="text-slate-400 hover:text-rose-600"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>

                        <div>
                          <input
                            type="text"
                            required
                            value={q.question}
                            onChange={(e) => handleQuestionChange(qIdx, 'question', e.target.value)}
                            placeholder="Enter the question text..."
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-blue-500"
                          />
                        </div>

                        {/* Options */}
                        <div className="grid grid-cols-2 gap-2">
                          {q.options.map((opt, optIdx) => (
                            <div key={optIdx} className="flex items-center gap-2">
                              <input
                                type="radio"
                                name={`correct-${qIdx}`}
                                checked={q.correctAnswer === optIdx}
                                onChange={() => handleQuestionChange(qIdx, 'correctAnswer', optIdx)}
                                title="Mark as correct answer"
                              />
                              <input
                                type="text"
                                required
                                value={opt}
                                onChange={(e) => handleOptionChange(qIdx, optIdx, e.target.value)}
                                placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                                className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-blue-500"
                              />
                            </div>
                          ))}
                        </div>

                        {/* Marks & Topic */}
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div>
                            <label className="text-[10px] text-slate-400">Marks</label>
                            <input
                              type="number"
                              value={q.marks}
                              onChange={(e) => handleQuestionChange(qIdx, 'marks', Number(e.target.value))}
                              className="mt-0.5 w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-400">Negative Marks</label>
                            <input
                              type="number"
                              step="0.25"
                              value={q.negativeMarks}
                              onChange={(e) => handleQuestionChange(qIdx, 'negativeMarks', Number(e.target.value))}
                              className="mt-0.5 w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-400">Difficulty</label>
                            <select
                              value={q.difficulty}
                              onChange={(e) => handleQuestionChange(qIdx, 'difficulty', e.target.value)}
                              className="mt-0.5 w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs"
                            >
                              <option value="Easy">Easy</option>
                              <option value="Medium">Medium</option>
                              <option value="Hard">Hard</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <input
                            type="text"
                            value={q.explanation}
                            onChange={(e) => handleQuestionChange(qIdx, 'explanation', e.target.value)}
                            placeholder="Explanation (revealed to student after submission)..."
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-500 outline-none"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-6 py-4 bg-slate-50">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white shadow hover:bg-blue-500"
                >
                  {isSubmitting ? 'Saving...' : isEditing ? 'Update Assessment' : 'Save & Publish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESULTS / QUESTION STATS MODAL */}
      {resultsModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
          onClick={() => setResultsModal(null)}
        >
          <div
            className="flex h-[80vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">{resultsModal.title} · Results</h3>
                <p className="text-xs text-slate-400">Candidate attempts and question accuracy analysis.</p>
              </div>
              <button type="button" onClick={() => setResultsModal(null)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {loadingResults ? (
                <div className="py-12 text-center text-xs text-slate-400">Loading screening results...</div>
              ) : (
                <>
                  {/* Participant attempts table */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Participant Attempts ({resultsData.attempts.length})
                    </h4>
                    {resultsData.attempts.length === 0 ? (
                      <p className="text-xs text-slate-400 italic py-3">No student attempts recorded yet.</p>
                    ) : (
                      <table className="w-full text-left text-xs">
                        <thead className="border-b border-slate-100 text-slate-400 font-semibold">
                          <tr>
                            <th className="py-2.5">Candidate</th>
                            <th className="py-2.5">Score</th>
                            <th className="py-2.5">Percentage</th>
                            <th className="py-2.5">Status</th>
                            <th className="py-2.5">Completed</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {resultsData.attempts.map((att) => (
                            <tr key={att._id} className="hover:bg-slate-50/50">
                              <td className="py-3 font-semibold text-slate-800">{att.studentId?.name || 'Student'}</td>
                              <td className="py-3 font-bold text-slate-900">{att.score} / {att.totalMarks}</td>
                              <td className="py-3 font-bold text-indigo-600">{att.percentage}%</td>
                              <td className="py-3">
                                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${att.passed ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                                  {att.passed ? 'Passed' : 'Attempted'}
                                </span>
                              </td>
                              <td className="py-3 text-slate-400">{new Date(att.completedAt).toLocaleDateString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>

                  {/* Question Accuracy breakdown */}
                  {resultsData.questionStats.length > 0 && (
                    <div className="space-y-3 border-t border-slate-100 pt-5">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Question Accuracy Analysis
                      </h4>
                      <div className="space-y-2">
                        {resultsData.questionStats.map((qs) => (
                          <div key={qs.questionIndex} className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs flex justify-between items-center">
                            <div>
                              <p className="font-bold text-slate-800">Q{qs.questionIndex}. {qs.questionText}</p>
                              <p className="text-[11px] text-slate-400">{qs.topic} · {qs.difficulty}</p>
                            </div>
                            <div className="text-right">
                              <span className="font-bold text-indigo-600">{qs.accuracyPercentage}% Accuracy</span>
                              <p className="text-[10px] text-slate-400">{qs.correctCount} of {qs.totalAnswers} correct</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
