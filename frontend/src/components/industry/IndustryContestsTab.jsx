import { useState, useEffect } from 'react'
import {
  Code2,
  Plus,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Users,
  Trophy,
  RefreshCw,
  X,
  Search,
  Check,
} from 'lucide-react'
import {
  fetchIndustryContests,
  createContestApi,
  publishContestApi,
  deleteContestApi,
  fetchProblems,
  fetchContestStandings,
  syncContestResultsApi,
} from '../../services/api'

export default function IndustryContestsTab() {
  const [contests, setContests] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  // Create Contest Modal
  const [showModal, setShowModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [availableProblems, setAvailableProblems] = useState([])
  const [problemSearch, setProblemSearch] = useState('')
  const [problemTopicFilter, setProblemTopicFilter] = useState('All')
  const [problemDifficultyFilter, setProblemDifficultyFilter] = useState('All')
  const [selectedProblemIds, setSelectedProblemIds] = useState([])

  const [form, setForm] = useState({
    title: '',
    role: 'Backend Developer',
    description: '',
    startDate: '',
    startTime: '10:00',
    endDate: '',
    endTime: '12:00',
    durationMinutes: 60,
    eligibility: 'Open to all students',
    maxParticipants: 200,
    allowedLanguages: ['C++', 'Java', 'Python', 'JavaScript'],
    externalContestId: '',
  })

  // Standings Modal
  const [standingsModal, setStandingsModal] = useState(null)
  const [standings, setStandings] = useState([])
  const [loadingStandings, setLoadingStandings] = useState(false)

  useEffect(() => {
    loadContests()
    loadProblems()
  }, [])

  async function loadContests() {
    setLoading(true)
    const res = await fetchIndustryContests()
    setContests(res?.contests || [])
    setLoading(false)
  }

  async function loadProblems() {
    const res = await fetchProblems()
    setAvailableProblems(res?.problems || [])
  }

  function handleOpenModal() {
    const today = new Date().toISOString().split('T')[0]
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]

    setForm({
      title: '',
      role: 'Backend Developer',
      description: '',
      startDate: today,
      startTime: '10:00',
      endDate: tomorrow,
      endTime: '12:00',
      durationMinutes: 60,
      eligibility: 'Open to all students',
      maxParticipants: 200,
      allowedLanguages: ['C++', 'Java', 'Python', 'JavaScript'],
      externalContestId: '',
    })
    setSelectedProblemIds([])
    setErrorMessage('')
    setShowModal(true)
  }

  function toggleProblemSelect(id) {
    setSelectedProblemIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    )
  }

  function toggleLanguage(lang) {
    setForm((prev) => {
      const exists = prev.allowedLanguages.includes(lang)
      const updated = exists
        ? prev.allowedLanguages.filter((l) => l !== lang)
        : [...prev.allowedLanguages, lang]
      return { ...prev, allowedLanguages: updated.length > 0 ? updated : [lang] }
    })
  }

  async function handleCreateContest(publishNow = false) {
    if (!form.title.trim()) {
      setErrorMessage('Contest title is required.')
      return
    }
    if (selectedProblemIds.length === 0) {
      setErrorMessage('Please select at least one DSA problem from the library.')
      return
    }

    const start = new Date(`${form.startDate}T${form.startTime}:00`)
    const end = new Date(`${form.endDate}T${form.endTime}:00`)

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      setErrorMessage('Please provide valid start and end dates/times.')
      return
    }
    if (start >= end) {
      setErrorMessage('End time must be strictly after start time.')
      return
    }

    setIsSubmitting(true)
    setErrorMessage('')

    try {
      const payload = {
        title: form.title.trim(),
        role: form.role.trim(),
        description: form.description.trim(),
        problems: selectedProblemIds,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        durationMinutes: Number(form.durationMinutes) || 60,
        eligibility: form.eligibility.trim(),
        maxParticipants: Number(form.maxParticipants) || 200,
        allowedLanguages: form.allowedLanguages,
        externalContestId: form.externalContestId.trim(),
        isPublished: publishNow,
      }

      await createContestApi(payload)
      setShowModal(false)
      setMessage(publishNow ? 'Contest created and published successfully!' : 'Contest saved as draft.')
      setTimeout(() => setMessage(''), 4000)
      loadContests()
    } catch (err) {
      setErrorMessage(err.message || 'Failed to create contest.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handlePublish(id) {
    try {
      await publishContestApi(id)
      setMessage('Contest published successfully!')
      setTimeout(() => setMessage(''), 3000)
      loadContests()
    } catch (err) {
      alert(err.message || 'Failed to publish contest.')
    }
  }

  async function handleDelete(id) {
    if (!confirm('Are you sure you want to delete this contest?')) return
    try {
      await deleteContestApi(id)
      setMessage('Contest deleted.')
      setTimeout(() => setMessage(''), 3000)
      loadContests()
    } catch (err) {
      alert(err.message || 'Failed to delete contest.')
    }
  }

  async function handleViewStandings(contest) {
    setStandingsModal(contest)
    setLoadingStandings(true)
    try {
      const res = await fetchContestStandings(contest._id)
      setStandings(res?.standings || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingStandings(false)
    }
  }

  async function handleSyncResults(contestId) {
    try {
      const res = await syncContestResultsApi(contestId)
      alert(res.message || 'Result sync status updated.')
      if (standingsModal && standingsModal._id === contestId) {
        handleViewStandings(standingsModal)
      }
      loadContests()
    } catch (err) {
      alert(err.message || 'Failed to sync results.')
    }
  }

  // Filter problems for selection modal
  const filteredProblems = availableProblems.filter((p) => {
    if (problemTopicFilter !== 'All' && p.topic !== problemTopicFilter) return false
    if (problemDifficultyFilter !== 'All' && p.difficulty !== problemDifficultyFilter) return false
    if (problemSearch.trim()) {
      const q = problemSearch.toLowerCase()
      return p.title.toLowerCase().includes(q) || p.topic.toLowerCase().includes(q)
    }
    return true
  })

  const topics = ['All', ...new Set(availableProblems.map((p) => p.topic).filter(Boolean))]

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Industry DSA Coding Contests</h2>
          <p className="text-xs text-slate-500">
            Create algorithmic screening challenges judged with VJudge integration.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenModal}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow hover:bg-indigo-500"
        >
          <Plus size={16} /> Create DSA Contest
        </button>
      </div>

      {message && (
        <div className="flex items-center gap-2 rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm font-medium text-teal-800">
          <CheckCircle2 size={18} className="text-teal-600" />
          {message}
        </div>
      )}

      {/* Contests List */}
      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400">Loading contests...</div>
      ) : contests.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <Code2 size={36} className="mx-auto text-slate-300" />
          <h3 className="mt-3 text-sm font-bold text-slate-700">No DSA contests created yet</h3>
          <p className="mt-1 text-xs text-slate-400">
            Click "Create DSA Contest" to configure a coding contest from the Problem Library.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          {contests.map((c) => {
            const status = c.computedStatus || c.status
            const isLive = status === 'Live'

            return (
              <div key={c._id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
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
                    <span className="text-xs text-slate-400">Role: {c.role}</span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900">{c.title}</h3>
                  {c.description && <p className="text-xs text-slate-500 line-clamp-1">{c.description}</p>}

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
                    <span className="flex items-center gap-1">
                      <Clock size={13} /> {c.durationMinutes} mins
                    </span>
                    <span className="flex items-center gap-1">
                      <Code2 size={13} /> {c.problems?.length || 0} Problems
                    </span>
                    <span className="flex items-center gap-1">
                      <Users size={13} /> {c.participantsCount || 0} Participants
                    </span>
                    <span>Starts: {new Date(c.startDate).toLocaleDateString()} {new Date(c.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleViewStandings(c)}
                    className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <Trophy size={13} /> Leaderboard
                  </button>

                  {!c.isPublished && (
                    <button
                      type="button"
                      onClick={() => handlePublish(c._id)}
                      className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500"
                    >
                      Publish
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleDelete(c._id)}
                    className="rounded-lg border border-rose-200 px-2.5 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* CREATE CONTEST MODAL */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
          onClick={() => setShowModal(false)}
        >
          <div
            className="flex h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Create DSA Coding Contest</h3>
                <p className="text-xs text-slate-400">Configure contest settings and select problems from the Problem Library.</p>
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

            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Basic Settings */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Contest Configuration</h4>
                <div>
                  <label className="text-xs font-medium text-slate-700">Contest Name *</label>
                  <input
                    type="text"
                    required
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g. Backend Developer DSA Screening 2026"
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-700">Target Role</label>
                    <input
                      type="text"
                      value={form.role}
                      onChange={(e) => setForm({ ...form, role: e.target.value })}
                      placeholder="e.g. Software Engineer Intern"
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-700">Duration (Minutes)</label>
                    <input
                      type="number"
                      value={form.durationMinutes}
                      onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-700">Start Date & Time *</label>
                    <div className="flex gap-1.5 mt-1">
                      <input
                        type="date"
                        value={form.startDate}
                        onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                        className="w-2/3 rounded-xl border border-slate-200 px-2 py-1.5 text-xs outline-none"
                      />
                      <input
                        type="time"
                        value={form.startTime}
                        onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                        className="w-1/3 rounded-xl border border-slate-200 px-2 py-1.5 text-xs outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-700">End Date & Time *</label>
                    <div className="flex gap-1.5 mt-1">
                      <input
                        type="date"
                        value={form.endDate}
                        onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                        className="w-2/3 rounded-xl border border-slate-200 px-2 py-1.5 text-xs outline-none"
                      />
                      <input
                        type="time"
                        value={form.endTime}
                        onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                        className="w-1/3 rounded-xl border border-slate-200 px-2 py-1.5 text-xs outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-700">Eligibility</label>
                    <input
                      type="text"
                      value={form.eligibility}
                      onChange={(e) => setForm({ ...form, eligibility: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-700">Maximum Participants</label>
                    <input
                      type="number"
                      value={form.maxParticipants}
                      onChange={(e) => setForm({ ...form, maxParticipants: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700">Allowed Languages</label>
                  <div className="mt-1.5 flex flex-wrap gap-2">
                    {['C++', 'Java', 'Python', 'JavaScript'].map((lang) => {
                      const isSelected = form.allowedLanguages.includes(lang)
                      return (
                        <button
                          key={lang}
                          type="button"
                          onClick={() => toggleLanguage(lang)}
                          className={`rounded-lg px-3 py-1 text-xs font-semibold border transition ${
                            isSelected
                              ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                              : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                          }`}
                        >
                          {isSelected && '✓ '}
                          {lang}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700">External VJudge Contest ID (Optional)</label>
                  <input
                    type="text"
                    value={form.externalContestId}
                    onChange={(e) => setForm({ ...form, externalContestId: e.target.value })}
                    placeholder="e.g. 562140 (if linked to existing VJudge contest)"
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Problem Library Selection */}
              <div className="space-y-3 border-t border-slate-100 pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Problem Selection
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Selected: <span className="font-bold text-indigo-600">{selectedProblemIds.length}</span> problems
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={problemTopicFilter}
                      onChange={(e) => setProblemTopicFilter(e.target.value)}
                      className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] outline-none"
                    >
                      {topics.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>

                    <select
                      value={problemDifficultyFilter}
                      onChange={(e) => setProblemDifficultyFilter(e.target.value)}
                      className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] outline-none"
                    >
                      <option value="All">All Difficulties</option>
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                  </div>
                </div>

                <div className="max-h-52 overflow-y-auto space-y-1.5 rounded-xl border border-slate-200 p-2">
                  {filteredProblems.map((p) => {
                    const isSelected = selectedProblemIds.includes(p._id)
                    return (
                      <div
                        key={p._id}
                        onClick={() => toggleProblemSelect(p._id)}
                        className={`flex cursor-pointer items-center justify-between rounded-lg p-2.5 text-xs transition ${
                          isSelected ? 'bg-indigo-50 border border-indigo-200 text-indigo-950' : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}} // handled by parent div
                            className="rounded text-indigo-600"
                          />
                          <div>
                            <span className="font-semibold">{p.title}</span>
                            <span className="ml-2 text-[10px] text-slate-400">({p.topic})</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                            {p.difficulty}
                          </span>
                          <span className="text-[10px] text-indigo-600 font-mono">
                            {p.externalProblemId}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-6 py-4">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleCreateContest(false)}
                className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
              >
                Save Draft
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleCreateContest(true)}
                className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white shadow hover:bg-indigo-500"
              >
                {isSubmitting ? 'Creating...' : 'Publish Contest'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STANDINGS MODAL */}
      {standingsModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
          onClick={() => setStandingsModal(null)}
        >
          <div
            className="flex h-[80vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">{standingsModal.title} · Leaderboard</h3>
                <p className="text-xs text-slate-400">Contest results and normalized candidate rankings.</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSyncResults(standingsModal._id)}
                  className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  <RefreshCw size={13} /> Sync VJudge Results
                </button>
                <button type="button" onClick={() => setStandingsModal(null)} className="text-slate-400 hover:text-slate-600">
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {loadingStandings ? (
                <div className="py-12 text-center text-xs text-slate-400">Loading standings...</div>
              ) : standings.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">No student submissions recorded for this contest yet.</div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-100 text-slate-400 font-semibold">
                    <tr>
                      <th className="py-2.5">Rank</th>
                      <th className="py-2.5">Candidate</th>
                      <th className="py-2.5">Problems Solved</th>
                      <th className="py-2.5">Score</th>
                      <th className="py-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {standings.map((r, idx) => (
                      <tr key={r._id || idx} className="hover:bg-slate-50/50">
                        <td className="py-3 font-bold text-slate-900">#{r.rank || idx + 1}</td>
                        <td className="py-3 font-semibold text-slate-800">
                          {r.studentId?.name || 'Student Candidate'}
                        </td>
                        <td className="py-3 font-medium text-slate-600">
                          {r.problemsSolved} / {r.totalProblems || 0}
                        </td>
                        <td className="py-3 font-bold text-indigo-600">{r.score} pts</td>
                        <td className="py-3">
                          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-semibold text-slate-600">
                            {r.syncStatus || 'Result Sync Pending'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
