import { useState, useEffect } from 'react'
import {
  Building2,
  Briefcase,
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  MapPin,
  IndianRupee,
  X,
  ExternalLink,
  Link2,
  Calendar,
  AlertCircle,
} from 'lucide-react'
import {
  fetchInternships,
  createInternshipApi,
  updateInternshipApi,
  deleteInternshipApi,
  fetchJobLinks,
  createJobLinkApi,
  updateJobLinkApi,
  deleteJobLinkApi,
} from '../services/api'
import { useAuth } from '../context/AuthContext'

function isValidUrl(url) {
  if (!url || typeof url !== 'string') return false
  const trimmed = url.trim()
  if (!/^https?:\/\//i.test(trimmed)) return false
  try {
    const parsed = new URL(trimmed)
    return (parsed.protocol === 'http:' || parsed.protocol === 'https:') && Boolean(parsed.hostname)
  } catch {
    return false
  }
}

export default function IndustryDashboard() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('internships') // 'internships' | 'job_links'
  const [internships, setInternships] = useState([])
  const [jobLinks, setJobLinks] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [urlError, setUrlError] = useState('')

  // Modal State
  const [showModal, setShowModal] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Internship form state
  const [internshipForm, setInternshipForm] = useState({
    title: '',
    company: user?.name || '',
    location: 'Remote',
    type: 'Remote',
    stipend: '₹20,000 / month',
    duration: '3 Months',
    skills: '',
    description: '',
    applicationUrl: '',
  })

  // Job Link form state
  const [jobLinkForm, setJobLinkForm] = useState({
    title: '',
    company: user?.name || '',
    location: 'Remote',
    workMode: 'Remote',
    jobType: 'Full-time',
    skills: '',
    description: '',
    jobUrl: '',
    companyWebsite: '',
    deadline: '',
  })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    const [internshipRes, jobLinkRes] = await Promise.all([
      fetchInternships({ industryId: user?._id }),
      fetchJobLinks({ industryId: user?._id }),
    ])
    setInternships(internshipRes?.internships || [])
    setJobLinks(jobLinkRes?.jobLinks || [])
    setLoading(false)
  }

  function openCreateModal() {
    setIsEditing(false)
    setEditingId(null)
    setUrlError('')

    if (activeTab === 'internships') {
      setInternshipForm({
        title: '',
        company: user?.name || '',
        location: 'Remote',
        type: 'Remote',
        stipend: '₹20,000 / month',
        duration: '3 Months',
        skills: '',
        description: '',
        applicationUrl: '',
      })
    } else {
      setJobLinkForm({
        title: '',
        company: user?.name || '',
        location: 'Remote',
        workMode: 'Remote',
        jobType: 'Full-time',
        skills: '',
        description: '',
        jobUrl: '',
        companyWebsite: '',
        deadline: '',
      })
    }
    setShowModal(true)
  }

  function openEditModal(item) {
    setIsEditing(true)
    setEditingId(item._id)
    setUrlError('')

    if (activeTab === 'internships') {
      setInternshipForm({
        title: item.title || '',
        company: item.company || '',
        location: item.location || 'Remote',
        type: item.type || 'Remote',
        stipend: item.stipend || '',
        duration: item.duration || '3 Months',
        skills: Array.isArray(item.skills) ? item.skills.join(', ') : item.skills || '',
        description: item.description || '',
        applicationUrl: item.applicationUrl || '',
      })
    } else {
      setJobLinkForm({
        title: item.title || '',
        company: item.company || '',
        location: item.location || 'Remote',
        workMode: item.workMode || 'Remote',
        jobType: item.jobType || item.type || 'Full-time',
        skills: Array.isArray(item.skills) ? item.skills.join(', ') : item.skills || '',
        description: item.description || '',
        jobUrl: item.jobUrl || '',
        companyWebsite: item.companyWebsite || '',
        deadline: item.deadline ? new Date(item.deadline).toISOString().split('T')[0] : '',
      })
    }
    setShowModal(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setUrlError('')

    if (activeTab === 'internships') {
      if (!internshipForm.title.trim() || !internshipForm.description.trim() || !internshipForm.location.trim()) {
        setUrlError('Please fill in all required fields.')
        return
      }
      if (!internshipForm.applicationUrl.trim()) {
        setUrlError('Application URL * is required.')
        return
      }
      if (!isValidUrl(internshipForm.applicationUrl)) {
        setUrlError('Please enter a valid Application URL (e.g. https://company.com/careers/intern).')
        return
      }

      setIsSubmitting(true)
      try {
        const payload = {
          title: internshipForm.title.trim(),
          company: (internshipForm.company || user?.name || 'Company').trim(),
          location: internshipForm.location.trim(),
          type: internshipForm.type,
          stipend: internshipForm.stipend.trim(),
          duration: internshipForm.duration.trim(),
          skills: internshipForm.skills.split(',').map((s) => s.trim()).filter(Boolean),
          description: internshipForm.description.trim(),
          applicationUrl: internshipForm.applicationUrl.trim(),
        }

        if (isEditing) {
          await updateInternshipApi(editingId, payload)
          setMessage('Internship updated successfully!')
        } else {
          await createInternshipApi(payload)
          setMessage('Internship opening published!')
        }

        setShowModal(false)
        loadData()
        setTimeout(() => setMessage(''), 3500)
      } catch (err) {
        setUrlError(err.message || 'Failed to save internship')
      } finally {
        setIsSubmitting(false)
      }
    } else {
      // Job Link
      if (!jobLinkForm.title.trim() || !jobLinkForm.company.trim()) {
        setUrlError('Job Title * and Company Name * are required.')
        return
      }
      if (!jobLinkForm.jobUrl.trim()) {
        setUrlError('Job URL * is required.')
        return
      }
      if (!isValidUrl(jobLinkForm.jobUrl)) {
        setUrlError('Please enter a valid Job URL (e.g. https://company.com/careers/software-engineer).')
        return
      }
      if (jobLinkForm.companyWebsite.trim() && !isValidUrl(jobLinkForm.companyWebsite)) {
        setUrlError('Please enter a valid Company Website URL starting with http:// or https://')
        return
      }

      setIsSubmitting(true)
      try {
        const payload = {
          title: jobLinkForm.title.trim(),
          company: jobLinkForm.company.trim(),
          location: (jobLinkForm.location || 'Remote').trim(),
          workMode: jobLinkForm.workMode,
          jobType: jobLinkForm.jobType,
          skills: jobLinkForm.skills.split(',').map((s) => s.trim()).filter(Boolean),
          description: jobLinkForm.description.trim(),
          jobUrl: jobLinkForm.jobUrl.trim(),
          companyWebsite: jobLinkForm.companyWebsite.trim(),
          deadline: jobLinkForm.deadline || undefined,
        }

        if (isEditing) {
          await updateJobLinkApi(editingId, payload)
          setMessage('Job link updated successfully!')
        } else {
          await createJobLinkApi(payload)
          setMessage('Job opportunity link added successfully!')
        }

        setShowModal(false)
        loadData()
        setTimeout(() => setMessage(''), 3500)
      } catch (err) {
        setUrlError(err.message || 'Failed to save job link')
      } finally {
        setIsSubmitting(false)
      }
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

  async function handleDeleteJobLink(id) {
    if (!window.confirm('Delete this job opportunity link?')) return
    try {
      await deleteJobLinkApi(id)
      setJobLinks((prev) => prev.filter((j) => j._id !== id))
      setMessage('Job opportunity link removed.')
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      alert(err.message || 'Delete failed')
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-12">
      {/* Top Header Card */}
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
              Post verified internship openings and share external job opportunity links for student talent.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow hover:bg-indigo-500"
          >
            <Plus size={16} />
            {activeTab === 'internships' ? 'Post Internship' : 'Add Job Link'}
          </button>
        </div>

        {/* Quick Stats */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <span className="text-xs text-slate-500">My Internship Postings</span>
            <p className="mt-1 text-2xl font-bold text-slate-900">{internships.length}</p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <span className="text-xs text-slate-500">My Job Opportunity Links</span>
            <p className="mt-1 text-2xl font-bold text-slate-900">{jobLinks.length}</p>
          </div>
        </div>
      </div>

      {message && (
        <div className="flex items-center gap-2 rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm font-medium text-teal-800 shadow-sm">
          <CheckCircle2 size={18} className="text-teal-600" />
          {message}
        </div>
      )}

      {/* Navigation Tabs */}
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
          onClick={() => setActiveTab('job_links')}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
            activeTab === 'job_links'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Link2 size={14} />
          Job Opportunities ({jobLinks.length})
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
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                        {item.type}
                      </span>
                      <span className="text-[11px] text-slate-400">{item.location}</span>
                      <span className="text-[11px] font-semibold text-teal-700">• {item.stipend}</span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900">{item.title}</h3>
                    <p className="text-xs text-slate-500 line-clamp-1">{item.description}</p>
                    {item.applicationUrl && (
                      <div className="flex items-center gap-1 text-[11px] text-indigo-600 truncate pt-0.5">
                        <span className="font-semibold text-slate-400">Application URL:</span>
                        <a
                          href={item.applicationUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline flex items-center gap-0.5"
                        >
                          <span className="truncate">{item.applicationUrl}</span>
                          <ExternalLink size={10} className="shrink-0" />
                        </a>
                      </div>
                    )}
                    <div className="flex items-center gap-4 text-xs text-slate-400 pt-0.5">
                      <span>Duration: {item.duration}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => openEditModal(item)}
                      className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      <Pencil size={13} />
                      Edit
                    </button>
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
        ) : jobLinks.length === 0 ? (
          <div className="py-12 text-center">
            <Link2 size={36} className="mx-auto text-slate-300" />
            <p className="mt-2 text-sm font-semibold text-slate-700">No job opportunity links yet</p>
            <p className="text-xs text-slate-400">Click "Add Job Link" to share external job opportunities.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {jobLinks.map((job) => (
              <div key={job._id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4">
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-purple-700">
                      {job.workMode || 'Remote'}
                    </span>
                    <span className="text-[11px] text-slate-400">{job.location}</span>
                    <span className="text-[11px] font-semibold text-slate-600">• {job.jobType || 'Full-time'}</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">{job.title}</h3>
                  <p className="text-xs text-slate-500 line-clamp-1">{job.description}</p>
                  {job.jobUrl && (
                    <div className="flex items-center gap-1 text-[11px] text-purple-600 truncate pt-0.5">
                      <span className="font-semibold text-slate-400">Job URL:</span>
                      <a
                        href={job.jobUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline flex items-center gap-0.5"
                      >
                        <span className="truncate">{job.jobUrl}</span>
                        <ExternalLink size={10} className="shrink-0" />
                      </a>
                    </div>
                  )}
                  {job.deadline && (
                    <div className="flex items-center gap-1 text-[11px] text-slate-400 pt-0.5">
                      <Calendar size={11} />
                      <span>Last Date: {new Date(job.deadline).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => openEditModal(job)}
                    className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <Pencil size={13} />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteJobLink(job._id)}
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
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900">
                {activeTab === 'internships'
                  ? isEditing
                    ? 'Edit Internship Opening'
                    : 'Post Internship Opening'
                  : isEditing
                  ? 'Edit Job Opportunity Link'
                  : 'Add Job Link'}
              </h2>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            {urlError && (
              <div className="mt-3 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-medium text-rose-700">
                <AlertCircle size={15} className="shrink-0 text-rose-500" />
                <span>{urlError}</span>
              </div>
            )}

            {activeTab === 'internships' ? (
              /* Internship Form */
              <form onSubmit={handleSubmit} className="mt-4 space-y-3">
                <div>
                  <label className="text-xs font-medium text-slate-700">Internship Title *</label>
                  <input
                    type="text"
                    required
                    value={internshipForm.title}
                    onChange={(e) => setInternshipForm({ ...internshipForm, title: e.target.value })}
                    placeholder="e.g. Software Development Intern"
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-medium text-slate-700">Company Name *</label>
                    <input
                      type="text"
                      required
                      value={internshipForm.company}
                      onChange={(e) => setInternshipForm({ ...internshipForm, company: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-700">Location *</label>
                    <input
                      type="text"
                      required
                      value={internshipForm.location}
                      onChange={(e) => setInternshipForm({ ...internshipForm, location: e.target.value })}
                      placeholder="e.g. Remote / Bengaluru"
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-medium text-slate-700">Work Type</label>
                    <select
                      value={internshipForm.type}
                      onChange={(e) => setInternshipForm({ ...internshipForm, type: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-xs outline-none focus:border-indigo-500"
                    >
                      <option value="Remote">Remote</option>
                      <option value="Hybrid">Hybrid</option>
                      <option value="On-site">On-site</option>
                      <option value="Full-time">Full-time</option>
                      <option value="Part-time">Part-time</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-700">Duration</label>
                    <input
                      type="text"
                      value={internshipForm.duration}
                      onChange={(e) => setInternshipForm({ ...internshipForm, duration: e.target.value })}
                      placeholder="e.g. 2 Months"
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700">Stipend</label>
                  <input
                    type="text"
                    value={internshipForm.stipend}
                    onChange={(e) => setInternshipForm({ ...internshipForm, stipend: e.target.value })}
                    placeholder="e.g. ₹15,000/month"
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700">
                    Application URL * <span className="text-[11px] text-slate-400">(External company apply link)</span>
                  </label>
                  <input
                    type="url"
                    required
                    value={internshipForm.applicationUrl}
                    onChange={(e) => {
                      setInternshipForm({ ...internshipForm, applicationUrl: e.target.value })
                      setUrlError('')
                    }}
                    placeholder="https://company.com/careers/intern"
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700">Required Skills (comma separated)</label>
                  <input
                    type="text"
                    value={internshipForm.skills}
                    onChange={(e) => setInternshipForm({ ...internshipForm, skills: e.target.value })}
                    placeholder="React, Node.js, MongoDB"
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700">Description *</label>
                  <textarea
                    rows={3}
                    required
                    value={internshipForm.description}
                    onChange={(e) => setInternshipForm({ ...internshipForm, description: e.target.value })}
                    placeholder="Detail internship responsibilities..."
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
                    {isSubmitting ? 'Saving…' : isEditing ? 'Update Internship' : 'Publish Internship'}
                  </button>
                </div>
              </form>
            ) : (
              /* Job Link Form */
              <form onSubmit={handleSubmit} className="mt-4 space-y-3">
                <div>
                  <label className="text-xs font-medium text-slate-700">Job Title *</label>
                  <input
                    type="text"
                    required
                    value={jobLinkForm.title}
                    onChange={(e) => setJobLinkForm({ ...jobLinkForm, title: e.target.value })}
                    placeholder="e.g. Software Engineer"
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-medium text-slate-700">Company Name *</label>
                    <input
                      type="text"
                      required
                      value={jobLinkForm.company}
                      onChange={(e) => setJobLinkForm({ ...jobLinkForm, company: e.target.value })}
                      placeholder="e.g. ABC Technologies"
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-700">Location</label>
                    <input
                      type="text"
                      value={jobLinkForm.location}
                      onChange={(e) => setJobLinkForm({ ...jobLinkForm, location: e.target.value })}
                      placeholder="e.g. Bangalore"
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-medium text-slate-700">Work Mode</label>
                    <select
                      value={jobLinkForm.workMode}
                      onChange={(e) => setJobLinkForm({ ...jobLinkForm, workMode: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-xs outline-none focus:border-indigo-500"
                    >
                      <option value="Remote">Remote</option>
                      <option value="Hybrid">Hybrid</option>
                      <option value="On-site">On-site</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-700">Job Type</label>
                    <input
                      type="text"
                      value={jobLinkForm.jobType}
                      onChange={(e) => setJobLinkForm({ ...jobLinkForm, jobType: e.target.value })}
                      placeholder="e.g. Full Time"
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700">Required Skills</label>
                  <input
                    type="text"
                    value={jobLinkForm.skills}
                    onChange={(e) => setJobLinkForm({ ...jobLinkForm, skills: e.target.value })}
                    placeholder="e.g. Java, Spring Boot, MySQL"
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700">Short Description</label>
                  <textarea
                    rows={2}
                    value={jobLinkForm.description}
                    onChange={(e) => setJobLinkForm({ ...jobLinkForm, description: e.target.value })}
                    placeholder="Brief description of the opportunity..."
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700">
                    Job URL * <span className="text-[11px] text-slate-400">(External company job application page)</span>
                  </label>
                  <input
                    type="url"
                    required
                    value={jobLinkForm.jobUrl}
                    onChange={(e) => {
                      setJobLinkForm({ ...jobLinkForm, jobUrl: e.target.value })
                      setUrlError('')
                    }}
                    placeholder="https://company.com/careers/software-engineer"
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-medium text-slate-700">Company Website</label>
                    <input
                      type="url"
                      value={jobLinkForm.companyWebsite}
                      onChange={(e) => setJobLinkForm({ ...jobLinkForm, companyWebsite: e.target.value })}
                      placeholder="https://company.com"
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-700">Last Date to Apply</label>
                    <input
                      type="date"
                      value={jobLinkForm.deadline}
                      onChange={(e) => setJobLinkForm({ ...jobLinkForm, deadline: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-indigo-500"
                    />
                  </div>
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
                    {isSubmitting ? 'Saving…' : isEditing ? 'Update Job Link' : 'Save Job Link'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
