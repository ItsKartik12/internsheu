import { useState, useEffect } from 'react'
import {
  Briefcase,
  Search,
  MapPin,
  Clock,
  IndianRupee,
  Building2,
  CheckCircle2,
  Plus,
  X,
  Send,
  Users,
} from 'lucide-react'
import { fetchInternships, applyInternshipApi, createInternshipApi } from '../services/api'
import { useAuth } from '../context/AuthContext'

const WORK_TYPES = ['All', 'Remote', 'Hybrid', 'On-site']

export default function InternshipsPage() {
  const { user } = useAuth()
  const isIndustryOrAdmin = user?.role === 'industry' || user?.role === 'admin'

  const [internships, setInternships] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedType, setSelectedType] = useState('All')
  const [appliedIds, setAppliedIds] = useState(new Set())
  const [selectedItem, setSelectedItem] = useState(null)
  const [showPostModal, setShowPostModal] = useState(false)
  const [message, setMessage] = useState('')

  // Post form state
  const [postTitle, setPostTitle] = useState('')
  const [postCompany, setPostCompany] = useState(user?.name || '')
  const [postLocation, setPostLocation] = useState('Remote')
  const [postType, setPostType] = useState('Remote')
  const [postStipend, setPostStipend] = useState('₹20,000 / month')
  const [postDuration, setPostDuration] = useState('3 Months')
  const [postSkills, setPostSkills] = useState('')
  const [postDesc, setPostDesc] = useState('')
  const [postApplicationUrl, setPostApplicationUrl] = useState('')
  const [urlError, setUrlError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    loadInternships()
  }, [search, selectedType])

  async function loadInternships() {
    setLoading(true)
    const data = await fetchInternships({
      search: search || undefined,
      type: selectedType !== 'All' ? selectedType : undefined,
    })
    setInternships(data?.internships || [])
    setLoading(false)
  }

  async function handleApply(e, id) {
    e.stopPropagation()
    try {
      await applyInternshipApi(id)
      setAppliedIds((prev) => new Set([...prev, id]))
      setInternships((prev) =>
        prev.map((item) => (item._id === id ? { ...item, applicantsCount: (item.applicantsCount || 0) + 1 } : item))
      )
      setMessage('Application submitted! Recruiter has been notified.')
      setTimeout(() => setMessage(''), 3500)
    } catch {
      setAppliedIds((prev) => new Set([...prev, id]))
      setMessage('Application received (demo mode)!')
      setTimeout(() => setMessage(''), 3500)
    }
  }

  async function handleCreateInternship(e) {
    e.preventDefault()
    setUrlError('')
    if (!postTitle.trim() || !postDesc.trim() || !postLocation.trim()) return

    if (!postApplicationUrl.trim()) {
      setUrlError('Application URL * is required.')
      return
    }

    if (!/^https?:\/\/.+/i.test(postApplicationUrl.trim())) {
      setUrlError('Please enter a valid Application URL starting with http:// or https://')
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        title: postTitle.trim(),
        company: postCompany.trim() || user?.name || 'Company',
        location: postLocation.trim(),
        type: postType,
        stipend: postStipend.trim(),
        duration: postDuration.trim(),
        skills: postSkills.split(',').map((s) => s.trim()).filter(Boolean),
        description: postDesc.trim(),
        applicationUrl: postApplicationUrl.trim(),
      }
      await createInternshipApi(payload)
      setShowPostModal(false)
      setPostTitle('')
      setPostSkills('')
      setPostDesc('')
      setPostApplicationUrl('')
      setUrlError('')
      loadInternships()
      setMessage('Internship posting published successfully!')
      setTimeout(() => setMessage(''), 3500)
    } catch (err) {
      setUrlError(err.message || 'Failed to post internship')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-12">
      {/* Hero Banner */}
      <div className="flex flex-col gap-4 rounded-2xl bg-gradient-to-r from-blue-900 via-slate-900 to-teal-950 p-6 text-white shadow-md sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <div>
          <div className="flex items-center gap-2 text-blue-400">
            <Briefcase size={20} />
            <span className="text-xs font-semibold uppercase tracking-wider">Industry Opportunities</span>
          </div>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">
            Verified Industry Internships
          </h1>
          <p className="mt-1 max-w-xl text-sm text-slate-300">
            Explore active internship positions aligned with your validated skills and academic discipline.
          </p>
        </div>

        {isIndustryOrAdmin && (
          <button
            type="button"
            onClick={() => setShowPostModal(true)}
            className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-400"
          >
            <Plus size={16} />
            Post Internship
          </button>
        )}
      </div>

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
            placeholder="Search internships by title, company, or required skills..."
            className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm outline-none focus:border-blue-500"
          >
            {WORK_TYPES.map((t) => (
              <option key={t} value={t}>
                {t === 'All' ? 'All Work Types' : t}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Internships Grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="h-64 animate-pulse rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" />
          ))}
        </div>
      ) : internships.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <Briefcase size={40} className="text-slate-300" />
          <h3 className="mt-3 text-base font-semibold text-slate-800">No internships found</h3>
          <p className="mt-1 text-xs text-slate-500">Check back soon or try clearing filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {internships.map((item) => {
            const isApplied = appliedIds.has(item._id)
            return (
              <div
                key={item._id}
                onClick={() => setSelectedItem(item)}
                className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:border-slate-300 hover:shadow-md cursor-pointer"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-900">
                      <Building2 size={13} className="text-slate-400" />
                      {item.company}
                    </span>
                    <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                      {item.type}
                    </span>
                  </div>

                  <h3 className="mt-2.5 text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                    {item.title}
                  </h3>

                  <p className="mt-2 text-xs leading-relaxed text-slate-500 line-clamp-3">
                    {item.description}
                  </p>

                  <div className="mt-3.5 flex flex-wrap gap-1">
                    {(item.skills || []).map((sk, idx) => (
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
                      <span>{item.location}</span>
                    </div>
                    <div className="flex items-center gap-1 font-semibold text-teal-700">
                      <IndianRupee size={12} />
                      <span>{item.stipend || 'Competitive'}</span>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1 text-[11px] text-slate-400">
                      <Users size={12} />
                      <span>{item.applicantsCount || 0} applied</span>
                    </div>

                    {item.applicationUrl ? (
                      <a
                        href={item.applicationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-500"
                      >
                        Visit & Apply ↗
                      </a>
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
      {selectedItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-xs font-semibold text-blue-600">{selectedItem.company}</span>
                <h2 className="mt-1 text-lg font-bold text-slate-900">{selectedItem.title}</h2>
                <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
                  <span>{selectedItem.location}</span>
                  <span>•</span>
                  <span>{selectedItem.type}</span>
                  <span>•</span>
                  <span className="font-semibold text-teal-600">{selectedItem.stipend}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="my-4 max-h-[60vh] overflow-y-auto space-y-4">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Position Overview</h4>
                <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">{selectedItem.description}</p>
              </div>

              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Skills Required</h4>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {(selectedItem.skills || []).map((sk, i) => (
                    <span key={i} className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                      {sk}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs">
                <div>
                  <span className="text-slate-400">Duration:</span>
                  <p className="font-semibold text-slate-700">{selectedItem.duration || '3 Months'}</p>
                </div>
                <div>
                  <span className="text-slate-400">Openings:</span>
                  <p className="font-semibold text-slate-700">{selectedItem.openings || 1}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Close
              </button>
              {selectedItem.applicationUrl ? (
                <a
                  href={selectedItem.applicationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 rounded-xl bg-blue-600 px-5 py-2 text-xs font-semibold text-white shadow hover:bg-blue-500"
                >
                  Visit & Apply ↗
                </a>
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

      {/* Post Modal */}
      {showPostModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4"
          onClick={() => setShowPostModal(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="text-blue-600" size={20} />
                <h2 className="text-base font-bold text-slate-900">Post New Internship</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowPostModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            {urlError && (
              <div className="mt-3 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-medium text-rose-700">
                <span>{urlError}</span>
              </div>
            )}

            <form onSubmit={handleCreateInternship} className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-700">Internship Title *</label>
                <input
                  type="text"
                  required
                  value={postTitle}
                  onChange={(e) => setPostTitle(e.target.value)}
                  placeholder="e.g. AI Research Intern"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium text-slate-700">Company Name *</label>
                  <input
                    type="text"
                    required
                    value={postCompany}
                    onChange={(e) => setPostCompany(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700">Work Type</label>
                  <select
                    value={postType}
                    onChange={(e) => setPostType(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-xs outline-none focus:border-blue-500"
                  >
                    <option value="Remote">Remote</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="On-site">On-site</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium text-slate-700">Location *</label>
                  <input
                    type="text"
                    required
                    value={postLocation}
                    onChange={(e) => setPostLocation(e.target.value)}
                    placeholder="e.g. Bengaluru / Remote"
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700">Stipend</label>
                  <input
                    type="text"
                    value={postStipend}
                    onChange={(e) => setPostStipend(e.target.value)}
                    placeholder="e.g. ₹25,000 / month"
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700">
                  Application URL * <span className="text-[11px] text-slate-400">(External company apply link)</span>
                </label>
                <input
                  type="url"
                  required
                  value={postApplicationUrl}
                  onChange={(e) => {
                    setPostApplicationUrl(e.target.value)
                    setUrlError('')
                  }}
                  placeholder="https://company.com/careers/intern"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700">Required Skills (comma separated)</label>
                <input
                  type="text"
                  value={postSkills}
                  onChange={(e) => setPostSkills(e.target.value)}
                  placeholder="Python, PyTorch, SQL"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700">Description *</label>
                <textarea
                  rows={3}
                  required
                  value={postDesc}
                  onChange={(e) => setPostDesc(e.target.value)}
                  placeholder="Describe internship responsibilities and deliverables..."
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-blue-500"
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
                  className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
                >
                  {isSubmitting ? 'Posting…' : 'Publish Internship'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
