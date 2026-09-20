import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Briefcase,
  Search,
  MapPin,
  IndianRupee,
  Building2,
  CheckCircle2,
  Plus,
  X,
  Send,
  Users,
  Award,
  WifiOff,
} from 'lucide-react'
import {
  fetchJobs,
  applyJobApi,
  createJobApi,
  trackVisitJobUrlApi,
  fetchMyJobApplications,
} from '../services/api'
import { useAuth } from '../context/AuthContext'
import { getCachedJobs, saveCachedJobs } from '../services/offlineDb'
import { isOnline, subscribeNetworkStatus } from '../services/networkStatus'

const EXP_LEVELS = ['All', 'Entry Level', 'Mid Level', 'Senior Level']
const JOB_TYPES = ['All', 'Full-time', 'Part-time', 'Contract', 'Remote']

export default function JobsPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedExp, setSelectedExp] = useState('All')
  const [selectedType, setSelectedType] = useState('All')
  const [selectedJob, setSelectedJob] = useState(null)
  const [showPostModal, setShowPostModal] = useState(false)
  const [message, setMessage] = useState('')
  const [isOffline, setIsOffline] = useState(!isOnline())

  // Post form state (Admin only)
  const [title, setTitle] = useState('')
  const [company, setCompany] = useState(user?.name || '')
  const [location, setLocation] = useState('Bengaluru')
  const [type, setType] = useState('Full-time')
  const [experienceLevel, setExperienceLevel] = useState('Entry Level')
  const [salary, setSalary] = useState('₹8 - 12 LPA')
  const [skills, setSkills] = useState('')
  const [desc, setDesc] = useState('')
  const [jobUrl, setJobUrl] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [appliedIds, setAppliedIds] = useState(new Set())

  useEffect(() => {
    loadJobs()
  }, [search, selectedExp, selectedType])

  useEffect(() => {
    const unsub = subscribeNetworkStatus((online) => {
      setIsOffline(!online)
      if (online) loadJobs()
    })
    return () => unsub()
  }, [])

  useEffect(() => {
    if (user?.role === 'student') {
      fetchMyJobApplications()
        .then((res) => {
          const ids = new Set((res?.applications || []).map((a) => a.jobId))
          setAppliedIds(ids)
        })
        .catch(() => {})
    }
  }, [user])

  async function handleVisitAndApplyJob(job, e) {
    if (e) e.stopPropagation()
    if (!job?.jobUrl) return

    if (!isOnline()) {
      setMessage('Internet connection required to open the external application site.')
      setTimeout(() => setMessage(''), 4000)
      return
    }

    if (!user) {
      navigate('/login', { state: { from: '/jobs' } })
      return
    }

    if (user?.role === 'student') {
      try {
        await applyJobApi(job._id)
        await trackVisitJobUrlApi(job._id)
        setAppliedIds((prev) => new Set([...prev, job._id]))
        setMessage('Application recorded in InternSetu. Opening company application portal…')
        setTimeout(() => setMessage(''), 4000)
      } catch (err) {
        console.warn('Job application tracking notice:', err.message)
      }
    }

    window.open(job.jobUrl, '_blank', 'noopener,noreferrer')
  }

  async function loadJobs() {
    setLoading(true)
    try {
      // 1. Check IndexedDB cache first
      const cached = await getCachedJobs()
      if (cached && cached.length > 0) {
        setJobs(cached)
        setLoading(false)
      }

      // 2. Fetch fresh jobs if online
      if (isOnline()) {
        const data = await fetchJobs({
          search: search || undefined,
          experienceLevel: selectedExp !== 'All' ? selectedExp : undefined,
          type: selectedType !== 'All' ? selectedType : undefined,
        })
        if (data?.jobs && Array.isArray(data.jobs)) {
          setJobs(data.jobs)
          setIsOffline(false)
          // Cache default unfiltered list
          if (!search && selectedExp === 'All' && selectedType === 'All') {
            await saveCachedJobs(data.jobs)
          }
        }
      } else {
        setIsOffline(true)
      }
    } catch (err) {
      console.warn('[Jobs] Failed to fetch fresh jobs:', err.message)
      const cached = await getCachedJobs()
      if (cached && cached.length > 0) {
        setJobs(cached)
      }
      setIsOffline(true)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateJob(e) {
    e.preventDefault()
    if (!title.trim() || !desc.trim()) return

    setIsSubmitting(true)
    try {
      const payload = {
        title: title.trim(),
        company: company.trim() || 'Nexus Tech',
        location: location.trim(),
        type,
        experienceLevel,
        salary: salary.trim(),
        skills: skills.split(',').map((s) => s.trim()).filter(Boolean),
        description: desc.trim(),
        jobUrl: jobUrl.trim() || undefined,
      }
      await createJobApi(payload)
      setShowPostModal(false)
      setTitle('')
      setSkills('')
      setDesc('')
      setJobUrl('')
      loadJobs()
      setMessage('Job vacancy posted successfully!')
      setTimeout(() => setMessage(''), 3500)
    } catch (err) {
      alert(err.message || 'Failed to post job')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 rounded-2xl bg-gradient-to-r from-purple-900 via-slate-900 to-indigo-950 p-6 text-white shadow-md sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <div>
          <div className="flex items-center gap-2 text-purple-400">
            <Award size={20} />
            <span className="text-xs font-semibold uppercase tracking-wider">Career Gateway</span>
          </div>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">
            Full-Time Career Opportunities
          </h1>
          <p className="mt-1 max-w-xl text-sm text-slate-300">
            Direct placement listings from partner companies looking for qualified graduates and skilled candidates.
          </p>
        </div>

        {isAdmin && (
          <button
            type="button"
            onClick={() => setShowPostModal(true)}
            className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-purple-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-purple-400"
          >
            <Plus size={16} />
            Post Career Job
          </button>
        )}
      </div>

      {isOffline && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs font-medium text-amber-800">
          <WifiOff size={15} className="shrink-0 text-amber-600" />
          <span>Offline · Showing last synced career jobs</span>
        </div>
      )}

      {message && (
        <div className="flex items-center gap-2 rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm font-medium text-teal-800 shadow-sm">
          <CheckCircle2 size={18} className="text-teal-600" />
          {message}
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search jobs by title, company, skills..."
            className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm text-slate-800 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedExp}
            onChange={(e) => setSelectedExp(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm outline-none focus:border-purple-500"
          >
            {EXP_LEVELS.map((lvl) => (
              <option key={lvl} value={lvl}>
                {lvl === 'All' ? 'All Experience' : lvl}
              </option>
            ))}
          </select>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm outline-none focus:border-purple-500"
          >
            {JOB_TYPES.map((t) => (
              <option key={t} value={t}>
                {t === 'All' ? 'All Job Types' : t}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Jobs Grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="h-64 animate-pulse rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" />
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <Briefcase size={40} className="text-slate-300" />
          <h3 className="mt-3 text-base font-semibold text-slate-800">No matching jobs found</h3>
          <p className="mt-1 text-xs text-slate-500">Try modifying your search or check again later.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {jobs.map((job) => {
            const isApplied = appliedIds.has(job._id)
            return (
              <div
                key={job._id}
                onClick={() => setSelectedJob(job)}
                className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:border-slate-300 hover:shadow-md cursor-pointer"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-900">
                      <Building2 size={13} className="text-slate-400" />
                      {job.company}
                    </span>
                    <span className="rounded-md bg-purple-50 px-2 py-0.5 text-[10px] font-semibold text-purple-700">
                      {job.experienceLevel}
                    </span>
                  </div>

                  <h2 className="mt-2.5 text-base font-bold text-slate-900 group-hover:text-purple-600 transition-colors">
                    <Link
                      to={`/jobs/${job._id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="hover:underline focus:outline-none"
                    >
                      {job.title}
                    </Link>
                  </h2>

                  <p className="mt-2 text-xs leading-relaxed text-slate-500 line-clamp-3">
                    {job.description}
                  </p>

                  <div className="mt-3.5 flex flex-wrap gap-1">
                    {(job.skills || []).map((sk, idx) => (
                      <span key={idx} className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-5 border-t border-slate-100 pt-3">
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <div className="flex items-center gap-1">
                      <MapPin size={13} className="text-slate-400" />
                      <span>{job.location}</span>
                    </div>
                    <div className="flex items-center gap-0.5 font-semibold text-emerald-700">
                      <span>{job.salary || 'Best in Industry'}</span>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1 text-[11px] text-slate-400">
                      <Users size={12} />
                      <span>{job.openings || 1} opening{(job.openings || 1) > 1 ? 's' : ''}</span>
                    </div>

                    {job.jobUrl ? (
                      <button
                        type="button"
                        onClick={(e) => handleVisitAndApplyJob(job, e)}
                        className={`flex items-center gap-1 rounded-lg px-3.5 py-1.5 text-xs font-semibold shadow-sm transition ${
                          isApplied
                            ? 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                            : 'bg-purple-600 text-white hover:bg-purple-500'
                        }`}
                      >
                        {isApplied ? 'Visited & Applied ↗' : 'Visit Job & Apply ↗'}
                      </button>
                    ) : (
                      <span
                        onClick={(e) => e.stopPropagation()}
                        className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-400 cursor-not-allowed"
                        title="Application link unavailable"
                      >
                        Application link unavailable
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Detail Modal */}
      {selectedJob && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Job details"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4"
          onClick={() => setSelectedJob(null)}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-xs font-semibold text-purple-600">{selectedJob.company}</span>
                <h2 className="mt-1 text-lg font-bold text-slate-900">{selectedJob.title}</h2>
                <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
                  <span>{selectedJob.location}</span>
                  <span>•</span>
                  <span>{selectedJob.experienceLevel}</span>
                  <span>•</span>
                  <span className="font-semibold text-emerald-600">{selectedJob.salary}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedJob(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="my-4 max-h-[60vh] overflow-y-auto space-y-4">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">About the Role</h4>
                <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">{selectedJob.description}</p>
              </div>

              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Core Competencies</h4>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {(selectedJob.skills || []).map((sk, i) => (
                    <span key={i} className="rounded-lg bg-purple-50 px-2.5 py-1 text-xs font-medium text-purple-700">
                      {sk}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
              <Link
                to={`/jobs/${selectedJob._id}`}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Full Page ↗
              </Link>
              <button
                type="button"
                onClick={() => setSelectedJob(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Close
              </button>
              {selectedJob.jobUrl ? (
                <button
                  type="button"
                  onClick={(e) => handleVisitAndApplyJob(selectedJob, e)}
                  className={`flex items-center gap-1 rounded-xl px-5 py-2 text-xs font-semibold shadow transition ${
                    appliedIds.has(selectedJob._id)
                      ? 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                      : 'bg-purple-600 text-white hover:bg-purple-500'
                  }`}
                >
                  {appliedIds.has(selectedJob._id) ? 'Visited & Applied ↗' : 'Visit Job & Apply ↗'}
                </button>
              ) : (
                <button
                  type="button"
                  disabled
                  className="rounded-xl bg-slate-100 px-5 py-2 text-xs font-semibold text-slate-400 cursor-not-allowed"
                >
                  Application link unavailable
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Admin Post Modal */}
      {isAdmin && showPostModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Post career job"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4"
          onClick={() => setShowPostModal(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900">Post Career Job (Admin)</h2>
              <button
                type="button"
                onClick={() => setShowPostModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateJob} className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-700">Role Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Associate Backend Engineer"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium text-slate-700">Company Name *</label>
                  <input
                    type="text"
                    required
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700">Location *</label>
                  <input
                    type="text"
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium text-slate-700">Experience Level</label>
                  <select
                    value={experienceLevel}
                    onChange={(e) => setExperienceLevel(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-xs outline-none focus:border-purple-500"
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
                    value={salary}
                    onChange={(e) => setSalary(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700">Job URL (optional)</label>
                <input
                  type="url"
                  value={jobUrl}
                  onChange={(e) => setJobUrl(e.target.value)}
                  placeholder="https://company.com/careers/job"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700">Required Skills</label>
                <input
                  type="text"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  placeholder="Java, Spring Boot, AWS"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700">Description *</label>
                <textarea
                  rows={3}
                  required
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder="Detail job requirements..."
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPostModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl bg-purple-600 px-4 py-2 text-xs font-semibold text-white hover:bg-purple-500 disabled:opacity-50"
                >
                  {isSubmitting ? 'Posting…' : 'Publish Job'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
