import { useEffect, useMemo, useState } from 'react'
import {
  Users,
  TrendingUp,
  Briefcase,
  Building2,
  ArrowUpRight,
  ArrowRight,
  LayoutGrid,
  Video,
  FileText,
  Plus,
  Pencil,
  Trash2,
  X,
  PlayCircle,
  MapPin,
  ExternalLink,
  Award,
  Loader2,
  CheckCircle,
  AlertCircle,
} from 'lucide-react'
import AdminAssessmentManager from './AdminAssessmentManager'
import {
  fetchVideos,
  createVideoApi,
  updateVideoApi,
  deleteVideoApi,
  fetchJobLinks,
  createJobLinkApi,
  updateJobLinkApi,
  deleteJobLinkApi,
  fetchAdminStats,
  fetchAdminIndustryOverview,
  fetchProblems,
  createProblemApi,
  updateProblemApi,
  deleteProblemApi,
} from '../services/api'

const POPULAR_SKILLS = [
  'React',
  'Node.js',
  'JavaScript',
  'TypeScript',
  'Python',
  'Java',
  'SQL',
  'MongoDB',
  'Docker',
  'AWS',
  'Cloud Architecture',
  'System Design',
]

const TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutGrid },
  { id: 'videos', label: 'Manage Learning Videos', icon: Video },
  { id: 'jobs', label: 'Manage Job Opportunities', icon: FileText },
  { id: 'assessments', label: 'Assessment & Skill Rankings', icon: Award },
  { id: 'problems', label: 'Problem Library', icon: Building2 },
  { id: 'industry', label: 'Industry Oversight', icon: Users },
]

function extractYoutubeId(input) {
  if (!input) return ''
  const trimmed = input.trim()
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([\w-]{11})/,
    /(?:youtu\.be\/)([\w-]{11})/,
    /(?:youtube\.com\/embed\/)([\w-]{11})/,
  ]
  for (const pattern of patterns) {
    const match = trimmed.match(pattern)
    if (match) return match[1]
  }
  return /^[\w-]{11}$/.test(trimmed) ? trimmed : ''
}

function statusBadgeClass(status) {
  if (status === 'Published' || status === 'Active' || status === true) return 'bg-teal-50 text-teal-700'
  if (status === 'Draft' || status === false) return 'bg-amber-50 text-amber-700'
  return 'bg-slate-100 text-slate-500'
}

function Modal({ title, description, onClose, children }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
            {description && <p className="mt-0.5 text-xs text-slate-500">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={18} />
          </button>
        </div>
        <div className="max-h-[75vh] overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────
// Tab 1 — Overview (Live MongoDB Data)
// ────────────────────────────────────────────────────────────────────────

function MetricCard({ label, value, subtext, icon: Icon, accent }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
      <div className="flex items-start justify-between">
        <p className="text-sm text-slate-500">{label}</p>
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${accent}`}>
          <Icon size={16} />
        </div>
      </div>
      <p className="mt-3 text-2xl font-semibold text-slate-900">{value}</p>
      {subtext && (
        <p className="mt-1 flex items-center gap-1 text-xs font-medium text-slate-500">
          {subtext}
        </p>
      )}
    </div>
  )
}

function OverviewTab() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadStats() {
      setLoading(true)
      const data = await fetchAdminStats()
      setStats(data)
      setLoading(false)
    }
    loadStats()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  const deptList = stats?.departmentBreakdown || []
  const maxStudents = deptList.length > 0 ? Math.max(...deptList.map((d) => d.students)) : 1
  const recentActivities = stats?.recentActivity || []

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Total registered students"
          value={(stats?.totalStudents ?? 0).toLocaleString('en-IN')}
          subtext="Verified student accounts"
          icon={Users}
          accent="bg-indigo-50 text-indigo-600"
        />
        <MetricCard
          label="Placement rate"
          value={stats?.placementRate ? `${stats.placementRate}%` : 'N/A'}
          subtext={stats?.placementRate ? 'Overall placement rate' : 'No placement records yet'}
          icon={TrendingUp}
          accent="bg-teal-50 text-teal-600"
        />
        <MetricCard
          label="Active internships"
          value={(stats?.activeInternships ?? 0).toLocaleString('en-IN')}
          subtext="Live industry opportunities"
          icon={Briefcase}
          accent="bg-slate-100 text-slate-600"
        />
        <MetricCard
          label="Partner companies"
          value={(stats?.partnerCompanies ?? 0).toLocaleString('en-IN')}
          subtext="Registered industry partners"
          icon={Building2}
          accent="bg-indigo-50 text-indigo-600"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-card lg:col-span-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Students by Department</h2>
            <span className="text-xs text-slate-400">Database Breakdown</span>
          </div>
          {deptList.length > 0 ? (
            <div className="mt-5 space-y-5">
              {deptList.map((dept) => (
                <div key={dept.department}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-800">{dept.department}</span>
                    <span className="text-slate-500">
                      {dept.students.toLocaleString('en-IN')} students
                    </span>
                  </div>
                  <div className="relative mt-2 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="absolute inset-y-0 left-0 rounded-full bg-indigo-500"
                      style={{ width: `${Math.min(100, (dept.students / maxStudents) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-sm text-slate-400">
              No department student records found in database yet.
            </div>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-card lg:col-span-2">
          <h2 className="text-sm font-semibold text-slate-900">Recent Student Assessments</h2>
          {recentActivities.length > 0 ? (
            <ul className="mt-4 divide-y divide-slate-100">
              {recentActivities.map((act) => (
                <li key={act.id} className="py-3.5 first:pt-0 last:pb-0">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{act.studentName}</p>
                      <p className="text-xs text-slate-500">{act.role} · {act.company}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusBadgeClass(act.status === 'Offer accepted')}`}>
                      {act.status}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="py-12 text-center text-sm text-slate-400">
              No recent assessment activity recorded yet.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────
// Tab 2 — Manage Learning Videos (Connected to MongoDB /api/videos)
// ────────────────────────────────────────────────────────────────────────

const EMPTY_VIDEO_FORM = {
  title: '',
  publisher: '',
  youtubeUrl: '',
  duration: '',
  description: '',
  status: 'Published',
}

function VideoForm({ initialValues, onCancel, onSubmit, submitting }) {
  const [form, setForm] = useState(initialValues ?? EMPTY_VIDEO_FORM)

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.title.trim() || !form.publisher.trim() || !form.duration.trim()) return
    onSubmit(form)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium text-slate-700">Video title *</label>
        <input
          type="text"
          value={form.title}
          onChange={(e) => updateField('title', e.target.value)}
          required
          placeholder="e.g. Intro to Kubernetes for Interns"
          className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
        />
      </div>

      <div>
        <label className="text-sm font-medium text-slate-700">Publisher *</label>
        <input
          type="text"
          value={form.publisher}
          onChange={(e) => updateField('publisher', e.target.value)}
          required
          placeholder="e.g. Zenith Cloud Labs"
          className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
        />
      </div>

      <div>
        <label className="text-sm font-medium text-slate-700">YouTube or Video URL *</label>
        <input
          type="text"
          value={form.youtubeUrl}
          onChange={(e) => updateField('youtubeUrl', e.target.value)}
          required
          placeholder="https://www.youtube.com/watch?v=…"
          className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
        />
        <p className="mt-1 text-[11px] text-slate-400">Full YouTube URL or 11-character video ID</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium text-slate-700">Duration *</label>
          <input
            type="text"
            value={form.duration}
            onChange={(e) => updateField('duration', e.target.value)}
            required
            placeholder="e.g. 18 min"
            className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Status</label>
          <select
            value={form.status}
            onChange={(e) => updateField('status', e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="Published">Published</option>
            <option value="Draft">Draft</option>
          </select>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-slate-700">Short Description (Optional)</label>
        <textarea
          rows={2}
          value={form.description}
          onChange={(e) => updateField('description', e.target.value)}
          placeholder="Brief description of video contents..."
          className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-900 outline-none transition-colors focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
        >
          {submitting && <Loader2 size={14} className="animate-spin" />}
          {initialValues ? 'Save changes' : 'Add video'}
        </button>
      </div>
    </form>
  )
}

function ManageVideosTab() {
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [modalMode, setModalMode] = useState(null)
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadVideos()
  }, [])

  async function loadVideos() {
    setLoading(true)
    const data = await fetchVideos()
    setVideos(data?.videos || [])
    setLoading(false)
  }

  async function handleAddSubmit(form) {
    setSubmitting(true)
    try {
      await createVideoApi(form)
      setModalMode(null)
      await loadVideos()
      setMessage('Learning video added to MongoDB!')
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      alert(err.message || 'Failed to add video')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleEditSubmit(form) {
    setSubmitting(true)
    try {
      await updateVideoApi(modalMode.video._id, form)
      setModalMode(null)
      await loadVideos()
      setMessage('Video updated in MongoDB!')
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      alert(err.message || 'Failed to update video')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this video from MongoDB?')) return
    try {
      await deleteVideoApi(id)
      await loadVideos()
      setMessage('Video removed from MongoDB.')
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      alert(err.message || 'Failed to delete video')
    }
  }

  return (
    <div className="space-y-6">
      {message && (
        <div className="flex items-center gap-2 rounded-xl bg-teal-50 border border-teal-200 px-4 py-3 text-sm text-teal-800">
          <CheckCircle size={16} className="text-teal-600 shrink-0" />
          {message}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Learning Video Catalog</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            {videos.length} videos stored in MongoDB · visible to students
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModalMode('add')}
          className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
        >
          <Plus size={15} />
          Add new video
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
          </div>
        ) : (
          <div className="max-h-[440px] overflow-y-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="sticky top-0 z-10 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-medium">Video</th>
                  <th className="px-5 py-3 font-medium">Publisher</th>
                  <th className="px-5 py-3 font-medium">Duration</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {videos.map((video) => {
                  const ytId = video.youtubeId || extractYoutubeId(video.videoUrl)
                  const thumb = video.thumbnail || (ytId ? `https://img.youtube.com/vi/${ytId}/default.jpg` : '')

                  return (
                    <tr key={video._id} className="odd:bg-white even:bg-slate-50/60 hover:bg-indigo-50/40">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="relative flex h-10 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-900">
                            {thumb ? (
                              <img
                                src={thumb}
                                alt={video.title ? `${video.title} thumbnail` : 'Video thumbnail'}
                                className="h-full w-full object-cover opacity-80"
                              />
                            ) : (
                              <Video size={16} className="text-white/60" />
                            )}
                            <PlayCircle size={16} className="absolute text-white/90" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{video.title}</p>
                            {video.description && (
                              <p className="line-clamp-1 text-xs text-slate-400">{video.description}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">{video.publisher}</td>
                      <td className="px-5 py-3.5 text-slate-600">{video.duration}</td>
                      <td className="px-5 py-3.5">
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusBadgeClass(video.status)}`}>
                          {video.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setModalMode({ mode: 'edit', video })}
                            aria-label={`Edit ${video.title}`}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-indigo-50 hover:text-indigo-600"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(video._id)}
                            aria-label={`Delete ${video.title}`}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {videos.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center text-sm text-slate-400">
                      No learning videos available yet. Click &quot;Add new video&quot; to create one.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalMode === 'add' && (
        <Modal
          title="Add New Learning Video"
          description="Saves directly to MongoDB and publishes to student learning feeds."
          onClose={() => setModalMode(null)}
        >
          <VideoForm
            onCancel={() => setModalMode(null)}
            onSubmit={handleAddSubmit}
            submitting={submitting}
          />
        </Modal>
      )}

      {modalMode?.mode === 'edit' && (
        <Modal
          title="Edit Video"
          description="Updates the existing MongoDB record."
          onClose={() => setModalMode(null)}
        >
          <VideoForm
            initialValues={{
              title: modalMode.video.title,
              publisher: modalMode.video.publisher,
              youtubeUrl: modalMode.video.videoUrl || modalMode.video.youtubeId,
              duration: modalMode.video.duration,
              description: modalMode.video.description || '',
              status: modalMode.video.status || 'Published',
            }}
            onCancel={() => setModalMode(null)}
            onSubmit={handleEditSubmit}
            submitting={submitting}
          />
        </Modal>
      )}
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────
// Tab 3 — Manage Job Opportunities (External Job Links via /api/job-links)
// ────────────────────────────────────────────────────────────────────────

const EMPTY_JOB_FORM = {
  title: '',
  company: '',
  location: 'Remote',
  workMode: 'Remote',
  jobType: 'Full-time',
  jobUrl: '',
  companyWebsite: '',
  skills: [],
  description: '',
}

function JobForm({ initialValues, onCancel, onSubmit, submitting }) {
  const [form, setForm] = useState(initialValues ?? EMPTY_JOB_FORM)
  const [skillInput, setSkillInput] = useState('')

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function toggleSkill(skill) {
    setForm((prev) => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter((s) => s !== skill)
        : [...prev.skills, skill],
    }))
  }

  function addCustomSkill(e) {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (skillInput.trim() && !form.skills.includes(skillInput.trim())) {
        setForm((prev) => ({ ...prev, skills: [...prev.skills, skillInput.trim()] }))
        setSkillInput('')
      }
    }
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.title.trim() || !form.company.trim() || !form.jobUrl.trim()) {
      alert('Job Title, Company, and Job URL are required.')
      return
    }
    if (!/^https?:\/\/.+/i.test(form.jobUrl.trim())) {
      alert('Job URL must be a valid link starting with http:// or https://')
      return
    }
    onSubmit(form)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium text-slate-700">Job title *</label>
        <input
          type="text"
          value={form.title}
          onChange={(e) => updateField('title', e.target.value)}
          required
          placeholder="e.g. Cloud Security Analyst"
          className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-slate-700">Company name *</label>
          <input
            type="text"
            value={form.company}
            onChange={(e) => updateField('company', e.target.value)}
            required
            placeholder="e.g. Acme Corp"
            className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Location</label>
          <input
            type="text"
            value={form.location}
            onChange={(e) => updateField('location', e.target.value)}
            placeholder="e.g. Bengaluru, KA / Remote"
            className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium text-slate-700">Work mode</label>
          <select
            value={form.workMode}
            onChange={(e) => updateField('workMode', e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="Remote">Remote</option>
            <option value="Hybrid">Hybrid</option>
            <option value="On-site">On-site</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Job type</label>
          <input
            type="text"
            value={form.jobType}
            onChange={(e) => updateField('jobType', e.target.value)}
            placeholder="e.g. Full-time / Internship"
            className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-slate-700">External Job URL *</label>
        <input
          type="url"
          value={form.jobUrl}
          onChange={(e) => updateField('jobUrl', e.target.value)}
          required
          placeholder="https://company.com/careers/job-123"
          className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
        />
        <p className="mt-1 text-[11px] text-slate-400">
          Students will be redirected to this external portal via &quot;Visit Job &amp; Apply ↗&quot;
        </p>
      </div>

      <div>
        <label className="text-sm font-medium text-slate-700">Company Website (Optional)</label>
        <input
          type="url"
          value={form.companyWebsite}
          onChange={(e) => updateField('companyWebsite', e.target.value)}
          placeholder="https://company.com"
          className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-900 outline-none transition-colors focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
        />
      </div>

      <div>
        <label className="text-sm font-medium text-slate-700">Required skills</label>
        <div className="mt-2 flex flex-wrap gap-1.5 rounded-xl border border-slate-200 p-3">
          {POPULAR_SKILLS.map((skill) => {
            const selected = form.skills.includes(skill)
            return (
              <button
                type="button"
                key={skill}
                onClick={() => toggleSkill(skill)}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                  selected
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {skill}
              </button>
            )
          })}
        </div>
        <div className="mt-2 flex gap-2">
          <input
            type="text"
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            onKeyDown={addCustomSkill}
            placeholder="Type custom skill and press Enter"
            className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs text-slate-900 outline-none focus:border-indigo-400"
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-slate-700">Short Description (Optional)</label>
        <textarea
          rows={2}
          value={form.description}
          onChange={(e) => updateField('description', e.target.value)}
          placeholder="Overview of the opportunity..."
          className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-900 outline-none transition-colors focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
        >
          {submitting && <Loader2 size={14} className="animate-spin" />}
          {initialValues ? 'Save changes' : 'Add Job Link'}
        </button>
      </div>
    </form>
  )
}

function ManageJobsTab() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [modalMode, setModalMode] = useState(null)
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadJobs()
  }, [])

  async function loadJobs() {
    setLoading(true)
    const data = await fetchJobLinks()
    setJobs(data?.jobLinks || [])
    setLoading(false)
  }

  async function handleAddSubmit(form) {
    setSubmitting(true)
    try {
      await createJobLinkApi(form)
      setModalMode(null)
      await loadJobs()
      setMessage('Job link saved directly to MongoDB!')
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      alert(err.message || 'Failed to add job link')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleEditSubmit(form) {
    setSubmitting(true)
    try {
      await updateJobLinkApi(modalMode.job._id, form)
      setModalMode(null)
      await loadJobs()
      setMessage('Job link updated in MongoDB!')
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      alert(err.message || 'Failed to update job link')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this job link from MongoDB?')) return
    try {
      await deleteJobLinkApi(id)
      await loadJobs()
      setMessage('Job link deleted from MongoDB.')
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      alert(err.message || 'Failed to delete job link')
    }
  }

  async function toggleStatus(job) {
    try {
      await updateJobLinkApi(job._id, { isActive: !job.isActive })
      await loadJobs()
    } catch (err) {
      alert(err.message || 'Failed to update status')
    }
  }

  return (
    <div className="space-y-6">
      {message && (
        <div className="flex items-center gap-2 rounded-xl bg-teal-50 border border-teal-200 px-4 py-3 text-sm text-teal-800">
          <CheckCircle size={16} className="text-teal-600 shrink-0" />
          {message}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">External Job Opportunities</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            {jobs.length} external job postings in MongoDB · directs students to official job portals
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModalMode('add')}
          className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
        >
          <Plus size={15} />
          Add Job Link
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
          </div>
        ) : (
          <div className="max-h-[440px] overflow-y-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="sticky top-0 z-10 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-medium">Role & Company</th>
                  <th className="px-5 py-3 font-medium">Location & Mode</th>
                  <th className="px-5 py-3 font-medium">External URL</th>
                  <th className="px-5 py-3 font-medium">Required Skills</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {jobs.map((job) => (
                  <tr key={job._id} className="odd:bg-white even:bg-slate-50/60 hover:bg-indigo-50/40">
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-slate-900">{job.title}</p>
                      <p className="text-xs text-slate-500">{job.company}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="flex items-center gap-1 text-xs text-slate-600">
                        <MapPin size={12} /> {job.location || 'Remote'}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {job.workMode || 'Remote'} · {job.jobType || 'Full-time'}
                      </p>
                    </td>
                    <td className="px-5 py-3.5">
                      {job.jobUrl ? (
                        <a
                          href={job.jobUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-100 transition-colors"
                        >
                          Visit Job
                          <ExternalLink size={11} />
                        </a>
                      ) : (
                        <span className="text-xs text-slate-400">Unavailable</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-wrap gap-1">
                        {(job.skills || []).slice(0, 3).map((skill, idx) => (
                          <span key={idx} className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-600">
                            {skill}
                          </span>
                        ))}
                        {(job.skills || []).length > 3 && (
                          <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-500">
                            +{(job.skills || []).length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <button
                        type="button"
                        onClick={() => toggleStatus(job)}
                        className={`rounded-full px-2 py-0.5 text-[11px] font-semibold transition-opacity hover:opacity-80 ${statusBadgeClass(job.isActive !== false)}`}
                      >
                        {job.isActive !== false ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setModalMode({ mode: 'edit', job })}
                          aria-label={`Edit ${job.title}`}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-indigo-50 hover:text-indigo-600"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(job._id)}
                          aria-label={`Delete ${job.title}`}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {jobs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-sm text-slate-400">
                      No job opportunities available yet. Click &quot;Add Job Link&quot; to publish one.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalMode === 'add' && (
        <Modal
          title="Add Job Link"
          description="Saves directly to MongoDB and publishes external opportunity for students."
          onClose={() => setModalMode(null)}
        >
          <JobForm
            onCancel={() => setModalMode(null)}
            onSubmit={handleAddSubmit}
            submitting={submitting}
          />
        </Modal>
      )}

      {modalMode?.mode === 'edit' && (
        <Modal
          title="Edit Job Link"
          description="Updates the opportunity in MongoDB."
          onClose={() => setModalMode(null)}
        >
          <JobForm
            initialValues={{
              title: modalMode.job.title,
              company: modalMode.job.company,
              location: modalMode.job.location || 'Remote',
              workMode: modalMode.job.workMode || 'Remote',
              jobType: modalMode.job.jobType || 'Full-time',
              jobUrl: modalMode.job.jobUrl || '',
              companyWebsite: modalMode.job.companyWebsite || '',
              skills: modalMode.job.skills || [],
              description: modalMode.job.description || '',
            }}
            onCancel={() => setModalMode(null)}
            onSubmit={handleEditSubmit}
            submitting={submitting}
          />
        </Modal>
      )}
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────
// Root component
// ────────────────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview')

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-card">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Institution console</p>
        <h1 className="mt-1 text-xl font-semibold text-slate-900">Admin Dashboard</h1>
        <p className="mt-1.5 text-sm text-slate-500">
          Monitor placement performance and manage database-backed content seen across the platform.
        </p>

        <div className="mt-5 flex gap-1.5 overflow-x-auto rounded-xl bg-slate-100 p-1">
          {TABS.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={[
                  'flex shrink-0 items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-medium transition-colors',
                  isActive ? 'bg-white text-slate-900 shadow-card' : 'text-slate-500 hover:text-slate-700',
                ].join(' ')}
              >
                <Icon size={14} className={isActive ? 'text-indigo-600' : 'text-slate-400'} />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {activeTab === 'overview' && <OverviewTab />}
      {activeTab === 'videos' && <ManageVideosTab />}
      {activeTab === 'jobs' && <ManageJobsTab />}
      {activeTab === 'assessments' && <AdminAssessmentManager />}
      {activeTab === 'problems' && <ProblemLibraryTab />}
      {activeTab === 'industry' && <IndustryOversightTab />}
    </div>
  )
}

function ProblemLibraryTab() {
  const [problems, setProblems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [msg, setMsg] = useState('')
  const [form, setForm] = useState({ title: '', topic: '', difficulty: 'Medium', description: '', tags: '', externalProblemId: '', externalProvider: 'vjudge', status: 'active' })

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const res = await fetchProblems().catch(() => ({ problems: [] }))
    setProblems(res?.problems || [])
    setLoading(false)
  }

  function openCreate() {
    setIsEditing(false); setEditingId(null)
    setForm({ title: '', topic: '', difficulty: 'Medium', description: '', tags: '', externalProblemId: '', externalProvider: 'vjudge', status: 'active' })
    setShowModal(true)
  }

  function openEdit(p) {
    setIsEditing(true); setEditingId(p._id)
    setForm({ title: p.title || '', topic: p.topic || '', difficulty: p.difficulty || 'Medium', description: p.description || '', tags: Array.isArray(p.tags) ? p.tags.join(', ') : '', externalProblemId: p.externalProblemId || '', externalProvider: p.externalProvider || 'vjudge', status: p.status || 'active' })
    setShowModal(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.title.trim()) return
    setSubmitting(true)
    try {
      const payload = { ...form, tags: form.tags.split(',').map(t => t.trim()).filter(Boolean) }
      if (isEditing) { await updateProblemApi(editingId, payload); setMsg('Problem updated!') }
      else { await createProblemApi(payload); setMsg('Problem added to library!') }
      setShowModal(false); load()
      setTimeout(() => setMsg(''), 3000)
    } catch (err) { alert(err.message || 'Save failed') }
    setSubmitting(false)
  }

  async function handleDelete(id) {
    if (!window.confirm('Remove this problem?')) return
    try { await deleteProblemApi(id); load() } catch (err) { alert(err.message) }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900">Problem Library</h2>
          <p className="text-xs text-slate-500 mt-0.5">Manage DSA problems mapped to VJudge. Problems here are selectable by Industry for contests.</p>
        </div>
        <button type="button" onClick={openCreate} className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500"><Plus size={14} /> Add Problem</button>
      </div>
      {msg && <div className="rounded-xl bg-teal-50 px-4 py-2.5 text-xs font-medium text-teal-800">{msg}</div>}
      {loading ? (
        <div className="py-10 text-center text-xs text-slate-400"><Loader2 className="animate-spin inline mr-2" size={14} />Loading library…</div>
      ) : problems.length === 0 ? (
        <div className="py-12 text-center">
          <Building2 size={36} className="mx-auto text-slate-300" />
          <p className="mt-2 text-sm font-semibold text-slate-700">No problems yet</p>
          <p className="text-xs text-slate-400">Add DSA problems mapped to VJudge so Industry can use them in contests.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="py-3 px-4 text-left font-semibold text-slate-500">Title</th>
                <th className="py-3 px-4 text-left font-semibold text-slate-500">Topic</th>
                <th className="py-3 px-4 text-center font-semibold text-slate-500">Difficulty</th>
                <th className="py-3 px-4 text-center font-semibold text-slate-500">VJudge ID</th>
                <th className="py-3 px-4 text-center font-semibold text-slate-500">Status</th>
                <th className="py-3 px-4 text-center font-semibold text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {problems.map(p => (
                <tr key={p._id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-medium text-slate-800">{p.title}</td>
                  <td className="py-3 px-4 text-slate-500">{p.topic}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                      p.difficulty === 'Easy' ? 'bg-green-50 text-green-700' :
                      p.difficulty === 'Hard' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'
                    }`}>{p.difficulty}</span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    {p.externalProblemId ? (
                      <a href={`https://vjudge.net/problem/${p.externalProblemId}`} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline flex items-center gap-1 justify-center">
                        {p.externalProblemId} <ExternalLink size={10} />
                      </a>
                    ) : <span className="text-slate-300">—</span>}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${p.status === 'active' ? 'bg-teal-50 text-teal-700' : 'bg-slate-100 text-slate-500'}`}>{p.status}</span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center gap-2 justify-center">
                      <button type="button" onClick={() => openEdit(p)} className="rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"><Pencil size={11} /></button>
                      <button type="button" onClick={() => handleDelete(p._id)} className="rounded-lg border border-red-100 px-2 py-1 text-xs text-red-600 hover:bg-red-50"><Trash2 size={11} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">{isEditing ? 'Edit Problem' : 'Add Problem'}</h3>
              <button type="button" onClick={() => setShowModal(false)} className="rounded-lg p-1.5 hover:bg-slate-100"><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-700">Title *</label>
                <input type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="e.g. Two Sum" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-indigo-500" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium text-slate-700">Topic</label>
                  <input type="text" value={form.topic} onChange={e => setForm({...form, topic: e.target.value})} placeholder="e.g. Arrays, DP" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700">Difficulty</label>
                  <select value={form.difficulty} onChange={e => setForm({...form, difficulty: e.target.value})} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-xs outline-none focus:border-indigo-500">
                    <option>Easy</option><option>Medium</option><option>Hard</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700">Description / Problem Statement</label>
                <textarea rows={3} value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Brief problem description or constraints..." className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700">Tags (comma-separated)</label>
                <input type="text" value={form.tags} onChange={e => setForm({...form, tags: e.target.value})} placeholder="e.g. hash-map, two-pointers" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-indigo-500" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium text-slate-700">VJudge Problem ID</label>
                  <input type="text" value={form.externalProblemId} onChange={e => setForm({...form, externalProblemId: e.target.value})} placeholder="e.g. LeetCode-1" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700">Status</label>
                  <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-xs outline-none focus:border-indigo-500">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={submitting} className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-50">{submitting ? 'Saving…' : isEditing ? 'Update Problem' : 'Add to Library'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function IndustryOversightTab() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAdminIndustryOverview().then(res => {
      setData(res)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  if (loading) return <div className="py-10 text-center text-xs text-slate-400"><Loader2 className="animate-spin inline mr-2" size={14} />Loading industry data…</div>

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-bold text-slate-900">Industry Contests &amp; Assessments Oversight</h2>
        <p className="text-xs text-slate-500 mt-0.5">Platform-wide view of all industry contests, assessments, and screening activity.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Contests', value: data?.totalContests ?? 0 },
          { label: 'Total Assessments', value: data?.totalIndustryAssessments ?? 0 },
          { label: 'Problems in Library', value: data?.totalProblems ?? 0 },
          { label: 'Candidates Shortlisted', value: data?.totalShortlisted ?? 0 },
        ].map(s => (
          <div key={s.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500">{s.label}</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{s.value}</p>
          </div>
        ))}
      </div>

      {(data?.contests || []).length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Recent DSA Contests</h3>
          <div className="divide-y divide-slate-100">
            {(data.contests || []).slice(0, 10).map((c, i) => (
              <div key={c._id || i} className="py-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-slate-800">{c.title}</p>
                  <p className="text-[11px] text-slate-400">{c.company || ''} · {c.problems?.length || 0} problems</p>
                </div>
                <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                  c.status === 'Live' ? 'bg-green-50 text-green-700' :
                  c.status === 'Ended' ? 'bg-slate-100 text-slate-500' : 'bg-amber-50 text-amber-700'
                }`}>{c.status || 'Draft'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {(data?.assessments || []).length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Recent MCQ Assessments</h3>
          <div className="divide-y divide-slate-100">
            {(data.assessments || []).slice(0, 10).map((a, i) => (
              <div key={a._id || i} className="py-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-slate-800">{a.title}</p>
                  <p className="text-[11px] text-slate-400">{a.company || ''} · {a.questions?.length || 0} questions · {a.durationMinutes}min</p>
                </div>
                <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                  a.status === 'Published' ? 'bg-green-50 text-green-700' :
                  a.status === 'Paused' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-500'
                }`}>{a.status || 'Draft'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {(!data?.contests?.length && !data?.assessments?.length) && (
        <div className="py-12 text-center rounded-2xl border border-slate-200 bg-white">
          <Building2 size={36} className="mx-auto text-slate-300" />
          <p className="mt-2 text-sm font-semibold text-slate-700">No industry activity yet</p>
          <p className="text-xs text-slate-400">Industry partners haven't created any contests or assessments yet.</p>
        </div>
      )}
    </div>
  )
}
