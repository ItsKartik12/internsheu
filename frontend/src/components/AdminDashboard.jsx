import { useMemo, useState } from 'react'
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
  IndianRupee,
  Award,
} from 'lucide-react'
import AdminAssessmentManager from './AdminAssessmentManager'
import {
  adminOverview,
  departmentBreakdown,
  recentPlacementActivity,
  skills as skillCatalog,
} from '../data/mockDatabase'

// ────────────────────────────────────────────────────────────────────────
// Seed data — the admin's own working copies. In production these would be
// fetched from /api/admin/videos and /api/admin/jobs; kept local to this
// component with useState so Add/Edit/Delete are fully functional for the
// demo without a backend.
// ────────────────────────────────────────────────────────────────────────

const INITIAL_VIDEOS = [
  {
    id: 'LM-01',
    title: 'Cloud Architecture Fundamentals: AWS vs Azure',
    publisher: 'Zenith Cloud Labs',
    duration: '18 min',
    youtubeId: 'M7lc1UVf-VE',
    status: 'Published',
  },
  {
    id: 'LM-02',
    title: 'System Design Interviews: Scaling a REST API',
    publisher: 'Nexora Analytics',
    duration: '24 min',
    youtubeId: 'UzLMhqg3_Wc',
    status: 'Published',
  },
  {
    id: 'LM-03',
    title: 'Containers 101: Docker & CI/CD Pipelines',
    publisher: 'Zenith Cloud Labs',
    duration: '15 min',
    youtubeId: '3c-iBn73dDE',
    status: 'Published',
  },
  {
    id: 'LM-04',
    title: 'Advanced Database Modeling for Production Systems',
    publisher: 'Bharat FinTech Works',
    duration: '21 min',
    youtubeId: 'ztHopE5Wnpc',
    status: 'Draft',
  },
]

const INITIAL_JOBS = [
  {
    id: 'OPP-101',
    title: 'Backend Engineering Intern',
    company: 'Bharat FinTech Works',
    location: 'Gurugram, HR (Hybrid)',
    stipend: '₹35,000/mo',
    requiredSkillIds: ['SK-01', 'SK-03', 'SK-04'],
    status: 'Active',
  },
  {
    id: 'OPP-102',
    title: 'Data Systems Intern',
    company: 'Nexora Analytics',
    location: 'Remote',
    stipend: '₹28,000/mo',
    requiredSkillIds: ['SK-02', 'SK-03', 'SK-09'],
    status: 'Active',
  },
  {
    id: 'OPP-103',
    title: 'Cloud Infrastructure Intern',
    company: 'Zenith Cloud Labs',
    location: 'Bengaluru, KA (On-site)',
    stipend: '₹40,000/mo',
    requiredSkillIds: ['SK-05', 'SK-07', 'SK-06'],
    status: 'Active',
  },
  {
    id: 'OPP-104',
    title: 'Software Development Intern',
    company: 'Orbit Mobility',
    location: 'Noida, UP (On-site)',
    stipend: '₹25,000/mo',
    requiredSkillIds: ['SK-01', 'SK-04', 'SK-02'],
    status: 'Closed',
  },
]

const TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutGrid },
  { id: 'videos', label: 'Manage Learning Videos', icon: Video },
  { id: 'jobs', label: 'Manage Job Opportunities', icon: FileText },
  { id: 'assessments', label: 'Assessment & Skill Rankings', icon: Award },
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
  // Assume the admin pasted a bare video ID
  return /^[\w-]{11}$/.test(trimmed) ? trimmed : trimmed
}

function statusBadgeClass(status) {
  if (status === 'Published' || status === 'Active') return 'bg-teal-50 text-teal-700'
  if (status === 'Draft') return 'bg-amber-50 text-amber-700'
  return 'bg-slate-100 text-slate-500'
}

// ────────────────────────────────────────────────────────────────────────
// Shared modal shell
// ────────────────────────────────────────────────────────────────────────

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
        <div className="max-h-[70vh] overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────
// Tab 1 — Overview
// ────────────────────────────────────────────────────────────────────────

function MetricCard({ label, value, growth, icon: Icon, accent }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
      <div className="flex items-start justify-between">
        <p className="text-sm text-slate-500">{label}</p>
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${accent}`}>
          <Icon size={16} />
        </div>
      </div>
      <p className="mt-3 text-2xl font-semibold text-slate-900">{value}</p>
      <p className="mt-1 flex items-center gap-1 text-xs font-medium text-teal-600">
        <ArrowUpRight size={12} />
        {growth}
      </p>
    </div>
  )
}

function OverviewTab() {
  const maxStudents = Math.max(...departmentBreakdown.map((d) => d.students))

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Total students"
          value={adminOverview.totalStudents.toLocaleString('en-IN')}
          growth={adminOverview.studentGrowth}
          icon={Users}
          accent="bg-indigo-50 text-indigo-600"
        />
        <MetricCard
          label="Placement rate"
          value={`${adminOverview.placementRate}%`}
          growth={adminOverview.placementGrowth}
          icon={TrendingUp}
          accent="bg-teal-50 text-teal-600"
        />
        <MetricCard
          label="Active internships"
          value={adminOverview.activeInternships}
          growth={adminOverview.internshipGrowth}
          icon={Briefcase}
          accent="bg-slate-100 text-slate-600"
        />
        <MetricCard
          label="Partner companies"
          value={adminOverview.partnerCompanies}
          growth={adminOverview.partnerGrowth}
          icon={Building2}
          accent="bg-indigo-50 text-indigo-600"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-card lg:col-span-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Placement by department</h2>
            <button type="button" className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-500">
              Full report
              <ArrowRight size={12} />
            </button>
          </div>
          <div className="mt-5 space-y-5">
            {departmentBreakdown.map((dept) => (
              <div key={dept.department}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-800">{dept.department}</span>
                  <span className="text-slate-500">{dept.students.toLocaleString('en-IN')} students · {dept.placementRate}%</span>
                </div>
                <div className="relative mt-2 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full bg-slate-300"
                    style={{ width: `${(dept.students / maxStudents) * 100}%` }}
                  />
                  <div
                    className="absolute inset-y-0 left-0 rounded-full bg-indigo-500"
                    style={{ width: `${(dept.students / maxStudents) * (dept.placementRate / 100) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-[11px] text-slate-400">
            Bar length reflects student headcount; the indigo fill shows the placed share within it.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-card lg:col-span-2">
          <h2 className="text-sm font-semibold text-slate-900">Recent placement activity</h2>
          <ul className="mt-4 divide-y divide-slate-100">
            {recentPlacementActivity.map((activity) => (
              <li key={activity.id} className="py-3.5 first:pt-0 last:pb-0">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{activity.studentName}</p>
                    <p className="text-xs text-slate-500">{activity.role} · {activity.company}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusBadgeClass(activity.status === 'Offer accepted' ? 'Active' : activity.status === 'Application submitted' ? 'Closed' : 'Draft')}`}>
                    {activity.status}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────
// Tab 2 — Manage Learning Videos
// ────────────────────────────────────────────────────────────────────────

const EMPTY_VIDEO_FORM = { title: '', publisher: '', youtubeUrl: '', duration: '' }

function VideoForm({ initialValues, onCancel, onSubmit }) {
  const [form, setForm] = useState(initialValues ?? EMPTY_VIDEO_FORM)

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.title.trim() || !form.publisher.trim() || !form.youtubeUrl.trim() || !form.duration.trim()) return
    onSubmit(form)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium text-slate-700">Video title</label>
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
        <label className="text-sm font-medium text-slate-700">Publisher</label>
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
        <label className="text-sm font-medium text-slate-700">YouTube URL</label>
        <input
          type="text"
          value={form.youtubeUrl}
          onChange={(e) => updateField('youtubeUrl', e.target.value)}
          required
          placeholder="https://www.youtube.com/watch?v=…"
          className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
        />
        <p className="mt-1 text-[11px] text-slate-400">Paste the full link — the video ID is extracted automatically.</p>
      </div>

      <div>
        <label className="text-sm font-medium text-slate-700">Duration</label>
        <input
          type="text"
          value={form.duration}
          onChange={(e) => updateField('duration', e.target.value)}
          required
          placeholder="e.g. 18 min"
          className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
        >
          {initialValues ? 'Save changes' : 'Add video'}
        </button>
      </div>
    </form>
  )
}

function ManageVideosTab({ videos, onAdd, onUpdate, onDelete }) {
  const [modalMode, setModalMode] = useState(null) // null | 'add' | { mode: 'edit', video }

  function handleAddSubmit(form) {
    onAdd({
      id: `LM-${Date.now()}`,
      title: form.title.trim(),
      publisher: form.publisher.trim(),
      youtubeId: extractYoutubeId(form.youtubeUrl),
      duration: form.duration.trim(),
      status: 'Published',
    })
    setModalMode(null)
  }

  function handleEditSubmit(form) {
    onUpdate(modalMode.video.id, {
      title: form.title.trim(),
      publisher: form.publisher.trim(),
      youtubeId: extractYoutubeId(form.youtubeUrl),
      duration: form.duration.trim(),
    })
    setModalMode(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Learning video catalog</h2>
          <p className="mt-0.5 text-xs text-slate-500">{videos.length} videos · visible in the student Learning Center</p>
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
        <div className="max-h-[420px] overflow-y-auto">
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
              {videos.map((video) => (
                <tr key={video.id} className="odd:bg-white even:bg-slate-50/60 hover:bg-indigo-50/40">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="relative flex h-10 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-900">
                        <img
                          src={`https://img.youtube.com/vi/${video.youtubeId}/default.jpg`}
                          alt=""
                          className="h-full w-full object-cover opacity-80"
                        />
                        <PlayCircle size={16} className="absolute text-white/90" />
                      </div>
                      <p className="font-medium text-slate-900">{video.title}</p>
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
                        onClick={() => onDelete(video.id)}
                        aria-label={`Delete ${video.title}`}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {videos.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-sm text-slate-400">
                    No videos yet — add your first one to populate the Learning Center.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalMode === 'add' && (
        <Modal
          title="Add new video"
          description="This appears immediately in the student Learning Center."
          onClose={() => setModalMode(null)}
        >
          <VideoForm onCancel={() => setModalMode(null)} onSubmit={handleAddSubmit} />
        </Modal>
      )}

      {modalMode?.mode === 'edit' && (
        <Modal title="Edit video" onClose={() => setModalMode(null)}>
          <VideoForm
            initialValues={{
              title: modalMode.video.title,
              publisher: modalMode.video.publisher,
              youtubeUrl: modalMode.video.youtubeId,
              duration: modalMode.video.duration,
            }}
            onCancel={() => setModalMode(null)}
            onSubmit={handleEditSubmit}
          />
        </Modal>
      )}
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────
// Tab 3 — Manage Job Opportunities
// ────────────────────────────────────────────────────────────────────────

const EMPTY_JOB_FORM = { title: '', company: '', location: '', stipend: '', requiredSkillIds: [] }

function JobForm({ initialValues, onCancel, onSubmit }) {
  const [form, setForm] = useState(initialValues ?? EMPTY_JOB_FORM)

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function toggleSkill(skillId) {
    setForm((prev) => ({
      ...prev,
      requiredSkillIds: prev.requiredSkillIds.includes(skillId)
        ? prev.requiredSkillIds.filter((id) => id !== skillId)
        : [...prev.requiredSkillIds, skillId],
    }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.title.trim() || !form.company.trim() || !form.location.trim() || !form.stipend.trim()) return
    onSubmit(form)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium text-slate-700">Job title</label>
        <input
          type="text"
          value={form.title}
          onChange={(e) => updateField('title', e.target.value)}
          required
          placeholder="e.g. Frontend Engineering Intern"
          className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-slate-700">Company name</label>
          <input
            type="text"
            value={form.company}
            onChange={(e) => updateField('company', e.target.value)}
            required
            placeholder="e.g. Zenith Cloud Labs"
            className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Location</label>
          <input
            type="text"
            value={form.location}
            onChange={(e) => updateField('location', e.target.value)}
            required
            placeholder="e.g. Remote / Bengaluru"
            className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-slate-700">Stipend</label>
        <input
          type="text"
          value={form.stipend}
          onChange={(e) => updateField('stipend', e.target.value)}
          required
          placeholder="e.g. ₹30,000/mo"
          className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
        />
      </div>

      <div>
        <label className="text-sm font-medium text-slate-700">Required skills</label>
        <div className="mt-2 grid grid-cols-2 gap-2 rounded-xl border border-slate-200 p-3.5 sm:grid-cols-3">
          {skillCatalog.map((skill) => (
            <label key={skill.id} className="flex items-center gap-2 text-xs text-slate-600">
              <input
                type="checkbox"
                checked={form.requiredSkillIds.includes(skill.id)}
                onChange={() => toggleSkill(skill.id)}
                className="h-3.5 w-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/40"
              />
              {skill.name}
            </label>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
        >
          {initialValues ? 'Save changes' : 'Post job'}
        </button>
      </div>
    </form>
  )
}

function ManageJobsTab({ jobs, onAdd, onUpdate, onDelete }) {
  const [modalMode, setModalMode] = useState(null)
  const skillNameById = useMemo(
    () => Object.fromEntries(skillCatalog.map((s) => [s.id, s.name])),
    []
  )

  function handleAddSubmit(form) {
    onAdd({
      id: `OPP-${Date.now()}`,
      title: form.title.trim(),
      company: form.company.trim(),
      location: form.location.trim(),
      stipend: form.stipend.trim(),
      requiredSkillIds: form.requiredSkillIds,
      status: 'Active',
    })
    setModalMode(null)
  }

  function handleEditSubmit(form) {
    onUpdate(modalMode.job.id, {
      title: form.title.trim(),
      company: form.company.trim(),
      location: form.location.trim(),
      stipend: form.stipend.trim(),
      requiredSkillIds: form.requiredSkillIds,
    })
    setModalMode(null)
  }

  function toggleStatus(job) {
    onUpdate(job.id, { status: job.status === 'Active' ? 'Closed' : 'Active' })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Job & internship postings</h2>
          <p className="mt-0.5 text-xs text-slate-500">{jobs.length} postings · visible in the student Opportunity Feed</p>
        </div>
        <button
          type="button"
          onClick={() => setModalMode('add')}
          className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
        >
          <Plus size={15} />
          Post new job
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card">
        <div className="max-h-[420px] overflow-y-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="sticky top-0 z-10 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3 font-medium">Role</th>
                <th className="px-5 py-3 font-medium">Location & stipend</th>
                <th className="px-5 py-3 font-medium">Required skills</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {jobs.map((job) => (
                <tr key={job.id} className="odd:bg-white even:bg-slate-50/60 hover:bg-indigo-50/40">
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-slate-900">{job.title}</p>
                    <p className="text-xs text-slate-500">{job.company}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="flex items-center gap-1 text-xs text-slate-600"><MapPin size={12} /> {job.location}</p>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-600"><IndianRupee size={12} /> {job.stipend.replace('₹', '')}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex flex-wrap gap-1">
                      {job.requiredSkillIds.slice(0, 3).map((id) => (
                        <span key={id} className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-600">
                          {skillNameById[id] ?? id}
                        </span>
                      ))}
                      {job.requiredSkillIds.length > 3 && (
                        <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-500">
                          +{job.requiredSkillIds.length - 3}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <button
                      type="button"
                      onClick={() => toggleStatus(job)}
                      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold transition-opacity hover:opacity-80 ${statusBadgeClass(job.status)}`}
                    >
                      {job.status}
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
                        onClick={() => onDelete(job.id)}
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
                  <td colSpan={5} className="px-5 py-10 text-center text-sm text-slate-400">
                    No postings yet — post your first job to populate the Opportunity Feed.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalMode === 'add' && (
        <Modal
          title="Post new job"
          description="This appears immediately in the student Opportunity Feed."
          onClose={() => setModalMode(null)}
        >
          <JobForm onCancel={() => setModalMode(null)} onSubmit={handleAddSubmit} />
        </Modal>
      )}

      {modalMode?.mode === 'edit' && (
        <Modal title="Edit posting" onClose={() => setModalMode(null)}>
          <JobForm
            initialValues={{
              title: modalMode.job.title,
              company: modalMode.job.company,
              location: modalMode.job.location,
              stipend: modalMode.job.stipend,
              requiredSkillIds: modalMode.job.requiredSkillIds,
            }}
            onCancel={() => setModalMode(null)}
            onSubmit={handleEditSubmit}
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
  const [videos, setVideos] = useState(INITIAL_VIDEOS)
  const [jobs, setJobs] = useState(INITIAL_JOBS)

  function addVideo(video) {
    setVideos((prev) => [video, ...prev])
  }
  function updateVideo(id, changes) {
    setVideos((prev) => prev.map((v) => (v.id === id ? { ...v, ...changes } : v)))
  }
  function deleteVideo(id) {
    setVideos((prev) => prev.filter((v) => v.id !== id))
  }

  function addJob(job) {
    setJobs((prev) => [job, ...prev])
  }
  function updateJob(id, changes) {
    setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, ...changes } : j)))
  }
  function deleteJob(id) {
    setJobs((prev) => prev.filter((j) => j.id !== id))
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-card">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Institution console</p>
        <h1 className="mt-1 text-xl font-semibold text-slate-900">Admin Dashboard</h1>
        <p className="mt-1.5 text-sm text-slate-500">
          Monitor placement performance and manage the content students see across the platform.
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
      {activeTab === 'videos' && (
        <ManageVideosTab videos={videos} onAdd={addVideo} onUpdate={updateVideo} onDelete={deleteVideo} />
      )}
      {activeTab === 'jobs' && (
        <ManageJobsTab jobs={jobs} onAdd={addJob} onUpdate={updateJob} onDelete={deleteJob} />
      )}
      {activeTab === 'assessments' && <AdminAssessmentManager />}
    </div>
  )
}
