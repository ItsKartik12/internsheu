import { useState, useEffect } from 'react'
import {
  Award,
  Plus,
  Pencil,
  Trash2,
  Users,
  CheckCircle2,
  HelpCircle,
  X,
  BookOpen,
  Filter,
} from 'lucide-react'
import {
  fetchAssessmentTopics,
  createAssessmentTopicApi,
  deleteAssessmentTopicApi,
  fetchAssessmentQuestions,
  createAssessmentQuestionApi,
  deleteAssessmentQuestionApi,
  fetchAllStudentResults,
} from '../services/api'

export default function AdminAssessmentManager() {
  const [activeSubTab, setActiveSubTab] = useState('topics') // 'topics' | 'questions' | 'students'
  const [topics, setTopics] = useState([])
  const [selectedTopicId, setSelectedTopicId] = useState('')
  const [questions, setQuestions] = useState([])
  const [studentResults, setStudentResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  // Modal states
  const [showTopicModal, setShowTopicModal] = useState(false)
  const [topicName, setTopicName] = useState('')
  const [topicCategory, setTopicCategory] = useState('Core CS')
  const [topicDesc, setTopicDesc] = useState('')
  const [topicTime, setTopicTime] = useState(15)

  const [showQuestionModal, setShowQuestionModal] = useState(false)
  const [qTopicId, setQTopicId] = useState('')
  const [qText, setQText] = useState('')
  const [qOptions, setQOptions] = useState(['', '', '', ''])
  const [qCorrect, setQCorrect] = useState(0)
  const [qExplanation, setQExplanation] = useState('')
  const [qDifficulty, setQDifficulty] = useState('Medium')
  const [qMarks, setQMarks] = useState(1)

  useEffect(() => {
    loadTopics()
  }, [])

  useEffect(() => {
    if (activeSubTab === 'questions' && selectedTopicId) {
      loadQuestions(selectedTopicId)
    } else if (activeSubTab === 'students') {
      loadStudentResults()
    }
  }, [activeSubTab, selectedTopicId])

  async function loadTopics() {
    setLoading(true)
    const data = await fetchAssessmentTopics()
    const list = data?.topics || []
    setTopics(list)
    if (list.length > 0 && !selectedTopicId) {
      setSelectedTopicId(list[0]._id)
      setQTopicId(list[0]._id)
    }
    setLoading(false)
  }

  async function loadQuestions(topicId) {
    setLoading(true)
    const data = await fetchAssessmentQuestions(topicId)
    setQuestions(data?.questions || [])
    setLoading(false)
  }

  async function loadStudentResults() {
    setLoading(true)
    const data = await fetchAllStudentResults()
    setStudentResults(data?.results || [])
    setLoading(false)
  }

  async function handleCreateTopic(e) {
    e.preventDefault()
    if (!topicName.trim()) return

    try {
      await createAssessmentTopicApi({
        name: topicName.trim(),
        category: topicCategory,
        description: topicDesc.trim(),
        timeLimitMinutes: Number(topicTime) || 15,
      })
      setShowTopicModal(false)
      setTopicName('')
      setTopicDesc('')
      loadTopics()
      setMessage('Assessment topic created successfully!')
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      alert(err.message || 'Failed to create topic')
    }
  }

  async function handleDeleteTopic(id) {
    if (!window.confirm('Delete this topic and all its questions?')) return
    try {
      await deleteAssessmentTopicApi(id)
      loadTopics()
      setMessage('Topic deleted.')
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      alert(err.message || 'Failed to delete topic')
    }
  }

  async function handleCreateQuestion(e) {
    e.preventDefault()
    if (!qText.trim() || qOptions.some((opt) => !opt.trim())) {
      alert('Please fill out question text and all 4 options.')
      return
    }

    try {
      await createAssessmentQuestionApi({
        topicId: qTopicId || selectedTopicId,
        question: qText.trim(),
        options: qOptions.map((o) => o.trim()),
        correctAnswer: Number(qCorrect),
        explanation: qExplanation.trim(),
        difficulty: qDifficulty,
        marks: Number(qMarks) || 1,
      })
      setShowQuestionModal(false)
      setQText('')
      setQOptions(['', '', '', ''])
      setQExplanation('')
      loadQuestions(selectedTopicId)
      setMessage('Question added to assessment bank!')
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      alert(err.message || 'Failed to add question')
    }
  }

  async function handleDeleteQuestion(id) {
    if (!window.confirm('Delete this question?')) return
    try {
      await deleteAssessmentQuestionApi(id)
      setQuestions((prev) => prev.filter((q) => q._id !== id))
      setMessage('Question removed.')
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      alert(err.message || 'Failed to delete question')
    }
  }

  return (
    <div className="space-y-6">
      {/* Sub tabs */}
      <div className="flex items-center justify-between">
        <div className="flex rounded-xl bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setActiveSubTab('topics')}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
              activeSubTab === 'topics' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Assessment Topics ({topics.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('questions')}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
              activeSubTab === 'questions' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Question Bank
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('students')}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
              activeSubTab === 'students' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Student Skill Rankings ({studentResults.length})
          </button>
        </div>

        {activeSubTab === 'topics' && (
          <button
            type="button"
            onClick={() => setShowTopicModal(true)}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow hover:bg-indigo-500"
          >
            <Plus size={15} />
            Add Topic
          </button>
        )}

        {activeSubTab === 'questions' && (
          <button
            type="button"
            onClick={() => {
              setQTopicId(selectedTopicId)
              setShowQuestionModal(true)
            }}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow hover:bg-indigo-500"
          >
            <Plus size={15} />
            Add Question
          </button>
        )}
      </div>

      {message && (
        <div className="flex items-center gap-2 rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm font-medium text-teal-800 shadow-sm">
          <CheckCircle2 size={18} className="text-teal-600" />
          {message}
        </div>
      )}

      {/* Subtab 1: Topics Table */}
      {activeSubTab === 'topics' && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-100 bg-slate-50 text-slate-500 font-semibold">
              <tr>
                <th className="px-5 py-3.5">Topic Name</th>
                <th className="px-5 py-3.5">Category</th>
                <th className="px-5 py-3.5">Questions</th>
                <th className="px-5 py-3.5">Time Limit</th>
                <th className="px-5 py-3.5">Pass %</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {topics.map((t) => (
                <tr key={t._id} className="hover:bg-slate-50/60">
                  <td className="px-5 py-3.5 font-bold text-slate-900">{t.name}</td>
                  <td className="px-5 py-3.5">{t.category}</td>
                  <td className="px-5 py-3.5 font-semibold text-indigo-600">{t.questionCount || 0}</td>
                  <td className="px-5 py-3.5">{t.timeLimitMinutes || 15} mins</td>
                  <td className="px-5 py-3.5">{t.passPercentage || 60}%</td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTopicId(t._id)
                        setActiveSubTab('questions')
                      }}
                      className="mr-3 font-semibold text-indigo-600 hover:text-indigo-800"
                    >
                      View Questions
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteTopic(t._id)}
                      className="font-semibold text-rose-600 hover:text-rose-800"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Subtab 2: Questions Manager */}
      {activeSubTab === 'questions' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            <Filter size={15} className="text-slate-400" />
            <span className="text-xs font-semibold text-slate-700">Select Topic:</span>
            <select
              value={selectedTopicId}
              onChange={(e) => {
                setSelectedTopicId(e.target.value)
                setQTopicId(e.target.value)
              }}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 outline-none focus:border-indigo-500"
            >
              {topics.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name} ({t.questionCount || 0} questions)
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            {loading ? (
              <div className="py-8 text-center text-xs text-slate-400">Loading questions…</div>
            ) : questions.length === 0 ? (
              <div className="py-8 text-center">
                <HelpCircle size={32} className="mx-auto text-slate-300" />
                <p className="mt-2 text-sm font-semibold text-slate-700">No questions in this topic yet</p>
                <p className="text-xs text-slate-400">Click "Add Question" above to build the question pool.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 space-y-4">
                {questions.map((q, idx) => (
                  <div key={q._id} className="pt-4 first:pt-0 space-y-2">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="rounded bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700">
                            {q.difficulty}
                          </span>
                          <span className="text-[10px] text-slate-400">{q.marks || 1} mark</span>
                        </div>
                        <h4 className="mt-1 text-sm font-bold text-slate-900">
                          {idx + 1}. {q.question}
                        </h4>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteQuestion(q._id)}
                        className="text-rose-500 hover:text-rose-700 p-1"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 pt-1 text-xs">
                      {(q.options || []).map((opt, oIdx) => {
                        const isCorrect = q.correctAnswer === oIdx
                        return (
                          <div
                            key={oIdx}
                            className={`rounded-lg border p-2 flex items-center gap-2 ${
                              isCorrect
                                ? 'border-teal-300 bg-teal-50 text-teal-800 font-semibold'
                                : 'border-slate-100 bg-slate-50 text-slate-600'
                            }`}
                          >
                            <span className="font-bold">{String.fromCharCode(65 + oIdx)}.</span>
                            <span>{opt}</span>
                            {isCorrect && <CheckCircle2 size={13} className="ml-auto text-teal-600" />}
                          </div>
                        )
                      })}
                    </div>

                    {q.explanation && (
                      <p className="text-[11px] text-slate-500 italic bg-slate-50/50 p-2 rounded-lg">
                        Explanation: {q.explanation}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Subtab 3: Student Skill Rankings */}
      {activeSubTab === 'students' && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-100 bg-slate-50 text-slate-500 font-semibold">
              <tr>
                <th className="px-5 py-3.5">Student Name</th>
                <th className="px-5 py-3.5">Enrollment No</th>
                <th className="px-5 py-3.5">Discipline</th>
                <th className="px-5 py-3.5">Overall Score</th>
                <th className="px-5 py-3.5">Proficiency Level</th>
                <th className="px-5 py-3.5">Tested Skills</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {studentResults.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No student assessment submissions recorded yet.
                  </td>
                </tr>
              ) : (
                studentResults.map((sr) => (
                  <tr key={sr._id} className="hover:bg-slate-50/60">
                    <td className="px-5 py-3.5 font-bold text-slate-900">
                      {sr.studentId?.name || 'Student'}
                      <span className="block text-[10px] font-normal text-slate-400">{sr.studentId?.email}</span>
                    </td>
                    <td className="px-5 py-3.5 font-mono">{sr.studentId?.enrollmentNo || 'N/A'}</td>
                    <td className="px-5 py-3.5">{sr.studentId?.fieldMark || 'Computer Science'}</td>
                    <td className="px-5 py-3.5 font-bold text-indigo-600">{sr.overallScore}%</td>
                    <td className="px-5 py-3.5">
                      <span className="rounded-full bg-teal-50 px-2.5 py-0.5 text-[10px] font-bold text-teal-700">
                        {sr.overallLevel}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {(sr.skills || []).map((s, idx) => (
                          <span key={idx} className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px]">
                            {s.topicName}: {s.percentage}%
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Topic Modal */}
      {showTopicModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4"
          onClick={() => setShowTopicModal(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900">Create Assessment Topic</h2>
              <button
                type="button"
                onClick={() => setShowTopicModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateTopic} className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-700">Topic Title</label>
                <input
                  type="text"
                  required
                  value={topicName}
                  onChange={(e) => setTopicName(e.target.value)}
                  placeholder="e.g. Cloud Security Foundations"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium text-slate-700">Category</label>
                  <select
                    value={topicCategory}
                    onChange={(e) => setTopicCategory(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-xs outline-none focus:border-indigo-500"
                  >
                    <option value="Web Development">Web Development</option>
                    <option value="Backend Development">Backend</option>
                    <option value="Core CS">Core CS</option>
                    <option value="Databases">Databases</option>
                    <option value="Programming">Programming</option>
                    <option value="Cloud & DevOps">Cloud & DevOps</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700">Time (mins)</label>
                  <input
                    type="number"
                    value={topicTime}
                    onChange={(e) => setTopicTime(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700">Description</label>
                <textarea
                  rows={2}
                  value={topicDesc}
                  onChange={(e) => setTopicDesc(e.target.value)}
                  placeholder="Brief description of assessed domain..."
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTopicModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500"
                >
                  Create Topic
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Question Modal */}
      {showQuestionModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4"
          onClick={() => setShowQuestionModal(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900">Add MCQ Question</h2>
              <button
                type="button"
                onClick={() => setShowQuestionModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateQuestion} className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-700">Target Topic</label>
                <select
                  value={qTopicId}
                  onChange={(e) => setQTopicId(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-xs outline-none focus:border-indigo-500"
                >
                  {topics.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700">Question Text</label>
                <textarea
                  rows={2}
                  required
                  value={qText}
                  onChange={(e) => setQText(e.target.value)}
                  placeholder="Enter clear, unambiguous question statement..."
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700">Options & Correct Answer</label>
                <p className="text-[10px] text-slate-400 mb-1.5">Select the radio button next to the correct choice.</p>
                <div className="space-y-2">
                  {qOptions.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="correctAnswer"
                        checked={qCorrect === idx}
                        onChange={() => setQCorrect(idx)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                      <input
                        type="text"
                        required
                        value={opt}
                        onChange={(e) => {
                          const next = [...qOptions]
                          next[idx] = e.target.value
                          setQOptions(next)
                        }}
                        placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                        className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs outline-none focus:border-indigo-500"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium text-slate-700">Difficulty</label>
                  <select
                    value={qDifficulty}
                    onChange={(e) => setQDifficulty(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-indigo-500"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700">Marks</label>
                  <input
                    type="number"
                    value={qMarks}
                    onChange={(e) => setQMarks(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700">Explanation</label>
                <textarea
                  rows={2}
                  value={qExplanation}
                  onChange={(e) => setQExplanation(e.target.value)}
                  placeholder="Explain why the correct answer is right..."
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowQuestionModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500"
                >
                  Save Question
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
