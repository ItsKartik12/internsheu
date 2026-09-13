import { useState, useEffect } from 'react'
import {
  Building2,
  Briefcase,
  Plus,
  Pencil,
  Trash2,
  Users,
  CheckCircle2,
  MapPin,
  IndianRupee,
  X,
  FileText,
} from 'lucide-react'
import {
  fetchInternships,
  createInternshipApi,
  deleteInternshipApi,
  fetchJobs,
  createJobApi,
  deleteJobApi,
} from '../services/api'
import { useAuth } from '../context/AuthContext'

export default function IndustryDashboard() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('internships') // 'internships' | 'jobs'
  const [internships, setInternships] = useState([])
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  // Modal State
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({
    title: '',
    company: user?.name || '',
    location: 'Remote',
    type: 'Remote',
    stipend: '₹20,000 / month',
    duration: '3 Months',
    experienceLevel: 'Entry Level',
    salary: '₹8 - 12 LPA',
    skills: '',
    description: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    const [internshipRes, jobRes] = await Promise.all([
      fetchInternships({ industryId: user?._id }),
      fetchJobs({ industryId: user?._id }),
    ])
    setInternships(internshipRes?.internships || [])
    setJobs(jobRes?.jobs || [])
    setLoading(false)
  }

  function openCreateModal() {
    setForm({
      title: '',
      company: user?.name || 'Nexus Tech',
      location: 'Remote',
      type: 'Remote',
      stipend: '₹20,000 / month',
      duration: '3 Months',
      experienceLevel: 'Entry Level',
      salary: '₹8 - 12 LPA',
      skills: '',
      description: '',
    })
    setShowModal(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.title.trim() || !form.description.trim()) return

    setIsSubmitting(true)
    try {
      if (activeTab === 'internships') {
        await createInternshipApi({
          title: form.title.trim(),
          company: form.company.trim(),
          location: form.location.trim(),
          type: form.type,
          stipend: form.stipend.trim(),
          duration: form.duration.trim(),
          skills: form.skills.split(',').map((s) => s.trim()).filter(Boolean),
          description: form.description.trim(),
        })
        setMessage('Internship opening published!')
      } else {
        await createJobApi({
          title: form.title.trim(),
          company: form.company.trim(),
          location: form.location.trim(),
          type: form.type,
          experienceLevel: form.experienceLevel,
          salary: form.salary.trim(),
          skills: form.skills.split(',').map((s) => s.trim()).filter(Boolean),
          description: form.description.trim(),
        })
        setMessage('Job vacancy published!')
      }

      setShowModal(false)
      loadData()
      setTimeout(() => setMessage(''), 3500)
    } catch (err) {
      alert(err.message || 'Failed to submit')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDeleteInternship(id) {
    if (!window.confirm('Delete this internship posting?')) return
    try {
      await deleteInternshipApi(id)
      setInternships((prev) => prev.filter((i) => i._id !== id))
      setMessage('Internship posting removed.')
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      alert(err.message || 'Delete failed')
    }
  }

  async function handleDeleteJob(id) {
    if (!window.confirm('Delete this job posting?')) return
    try {
      await deleteJobApi(id)
      setJobs((prev) => prev.filter((j) => j._id !== id))
      setMessage('Job posting removed.')
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      alert(err.message || 'Delete failed')
    }
  }

  const totalApplicants =
    internships.reduce((acc, i) => acc + (i.applicantsCount || 0), 0) +
    jobs.reduce((acc, j) => acc + (j.applicantsCount || 0), 0)

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-12">
      {/* Top Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-indigo-600">
              <Building2 size={20} />
              <span className="text-xs font-bold uppercase tracking-wider">Recruiter Workspace</span>
            </div>
            <h1 className="mt-1 text-2xl font-extrabold text-slate-900">
              Industry Talent Management
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              Post verified internship & job vacancies and review applications from evaluated students.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow hover:bg-indigo-500"
          >
            <Plus size={16} />
            {activeTab === 'internships' ? 'Post Internship' : 'Post Career Job'}
          </button>
        </div>

        {/* Quick Stats */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <span className="text-xs text-slate-500">Internship Openings</span>
            <p className="mt-1 text-2xl font-bold text-slate-900">{internships.length}</p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <span className="text-xs text-slate-500">Job Openings</span>
            <p className="mt-1 text-2xl font-bold text-slate-900">{jobs.length}</p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <span className="text-xs text-slate-500">Total Applicants</span>
            <p className="mt-1 text-2xl font-bold text-indigo-600">{totalApplicants}</p>
          </div>
        </div>
      </div>

      {message && (
        <div className="flex items-center gap-2 rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm font-medium text-teal-800 shadow-sm">
          <CheckCircle2 size={18} className="text-teal-600" />
          {message}
        </div>
      )}

      {/* Tabs */}
      <div className="flex rounded-xl bg-slate-100 p-1 w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('internships')}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
            activeTab === 'internships'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Briefcase size={14} />
          Internships ({internships.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('jobs')}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
            activeTab === 'jobs'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText size={14} />
          Full-Time Jobs ({jobs.length})
        </button>
      </div>

      {/* Main Content Area */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading postings…</div>
        ) : activeTab === 'internships' ? (
          internships.length === 0 ? (
            <div className="py-12 text-center">
              <Briefcase size={36} className="mx-auto text-slate-300" />
              <p className="mt-2 text-sm font-semibold text-slate-700">No internship postings yet</p>
              <p className="text-xs text-slate-400">Click "Post Internship" to recruit student interns.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {internships.map((item) => (
                <div key={item._id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                        {item.type}
                      </span>
                      <span className="text-[11px] text-slate-400">{item.location}</span>
                      <span className="text-[11px] font-semibold text-teal-700">• {item.stipend}</span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900">{item.title}</h3>
                    <p className="text-xs text-slate-500 line-clamp-1">{item.description}</p>
                    <div className="flex items-center gap-4 text-xs text-slate-400 pt-1">
                      <span className="flex items-center gap-1 font-semibold text-indigo-600">
                        <Users size={12} />
                        {item.applicantsCount || 0} applicants
                      </span>
                      <span>Duration: {item.duration}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleDeleteInternship(item._id)}
                      className="flex items-center gap-1 rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50"
                    >
                      <Trash2 size={13} />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : jobs.length === 0 ? (
          <div className="py-12 text-center">
            <FileText size={36} className="mx-auto text-slate-300" />
            <p className="mt-2 text-sm font-semibold text-slate-700">No full-time job openings yet</p>
            <p className="text-xs text-slate-400">Click "Post Career Job" to list vacancies.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {jobs.map((job) => (
              <div key={job._id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-purple-700">
                      {job.experienceLevel}
                    </span>
                    <span className="text-[11px] text-slate-400">{job.location}</span>
                    <span className="text-[11px] font-semibold text-emerald-700">• {job.salary}</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">{job.title}</h3>
                  <p className="text-xs text-slate-500 line-clamp-1">{job.description}</p>
                  <div className="flex items-center gap-4 text-xs text-slate-400 pt-1">
                    <span className="flex items-center gap-1 font-semibold text-indigo-600">
                      <Users size={12} />
                      {job.applicantsCount || 0} applicants
                    </span>
                    <span>Type: {job.type}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleDeleteJob(job._id)}
                    className="flex items-center gap-1 rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50"
                  >
                    <Trash2 size={13} />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900">
                {activeTab === 'internships' ? 'Post Internship Opening' : 'Post Full-Time Job'}
              </h2>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-700">Role Title</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Associate Backend Engineer"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium text-slate-700">Company Name</label>
                  <input
                    type="text"
                    required
                    value={form.company}
                    onChange={(e) => setForm({ ...form, company: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700">Location</label>
                  <input
                    type="text"
                    required
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {activeTab === 'internships' ? (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-medium text-slate-700">Stipend</label>
                    <input
                      type="text"
                      value={form.stipend}
                      onChange={(e) => setForm({ ...form, stipend: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-700">Duration</label>
                    <input
                      type="text"
                      value={form.duration}
                      onChange={(e) => setForm({ ...form, duration: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-medium text-slate-700">Experience Level</label>
                    <select
                      value={form.experienceLevel}
                      onChange={(e) => setForm({ ...form, experienceLevel: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-xs outline-none focus:border-indigo-500"
                    >
                      <option value="Entry Level">Entry Level</option>
                      <option value="Mid Level">Mid Level</option>
                      <option value="Senior Level">Senior Level</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-700">Salary Package</label>
                    <input
                      type="text"
                      value={form.salary}
                      onChange={(e) => setForm({ ...form, salary: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs font-medium text-slate-700">Skills (comma separated)</label>
                <input
                  type="text"
                  value={form.skills}
                  onChange={(e) => setForm({ ...form, skills: e.target.value })}
                  placeholder="React, TypeScript, Node.js"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700">Description</label>
                <textarea
                  rows={3}
                  required
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Detail role requirements and benefits..."
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
                >
                  {isSubmitting ? 'Posting…' : 'Publish Opportunity'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
