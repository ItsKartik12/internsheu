import { useEffect, useState } from 'react'
import { Briefcase, Building2, MapPin, Clock3, IndianRupee, ExternalLink, Loader2 } from 'lucide-react'
import { fetchInternships, fetchJobs } from '../services/api'

function initialsFromCompany(name) {
  if (!name) return 'OP'
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase()
}

export default function OpportunityFeed() {
  const [activeTab, setActiveTab] = useState('internships') // 'internships' | 'jobs'
  const [internships, setInternships] = useState([])
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    const [intRes, jobRes] = await Promise.all([
      fetchInternships(),
      fetchJobs(),
    ])
    setInternships(intRes?.internships || [])
    setJobs(jobRes?.jobs || [])
    setLoading(false)
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-12">
      {/* Header Banner */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-card">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Student Opportunity Gateway</h1>
            <p className="mt-1 text-xs text-slate-500">
              Verified corporate opportunities. All applications redirect directly to partner portals.
            </p>
          </div>

          {/* Student opportunity area tabs: [ Internships ] [ Jobs ] */}
          <div className="flex gap-1.5 rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setActiveTab('internships')}
              className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
                activeTab === 'internships'
                  ? 'bg-white text-slate-900 shadow-card'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Briefcase size={14} />
              Internships ({internships.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('jobs')}
              className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
                activeTab === 'jobs'
                  ? 'bg-white text-slate-900 shadow-card'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Building2 size={14} />
              Jobs ({jobs.length})
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="flex items-center gap-3 text-slate-400">
            <Loader2 size={20} className="animate-spin" />
            <span className="text-sm">Loading opportunities…</span>
          </div>
        </div>
      ) : activeTab === 'internships' ? (
        internships.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
            <Briefcase size={36} className="mx-auto text-slate-300 mb-2" />
            No internships available yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {internships.map((item) => (
              <div
                key={item._id}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-card flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex gap-3.5">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-900 text-sm font-semibold text-white">
                        {initialsFromCompany(item.company)}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">{item.title}</h3>
                        <p className="text-xs text-slate-500">{item.company}</p>
                        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
                          {item.duration && (
                            <span className="flex items-center gap-1">
                              <Clock3 size={12} /> {item.duration}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <MapPin size={12} /> {item.location}
                          </span>
                          {item.stipend && (
                            <span className="flex items-center gap-1 text-teal-700 font-medium">
                              <IndianRupee size={12} /> {item.stipend.replace('₹', '')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {item.description && (
                    <p className="mt-3 text-xs text-slate-600 line-clamp-2">{item.description}</p>
                  )}

                  {Array.isArray(item.skills) && item.skills.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {item.skills.map((skill, idx) => (
                        <span
                          key={idx}
                          className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                  <span className="text-[11px] text-slate-400">
                    Type: <span className="font-medium text-slate-600">{item.type}</span>
                  </span>

                  {item.applicationUrl ? (
                    <a
                      href={item.applicationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-xl bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white shadow hover:bg-blue-500 transition-colors"
                    >
                      Visit & Apply ↗
                    </a>
                  ) : (
                    <span
                      className="rounded-xl bg-slate-100 px-3.5 py-1.5 text-xs font-medium text-slate-400 cursor-not-allowed"
                      title="Application link unavailable"
                    >
                      Application link unavailable
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      ) : jobs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
          <Building2 size={36} className="mx-auto text-slate-300 mb-2" />
          No job opportunities available yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {jobs.map((job) => (
            <div
              key={job._id}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-card flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-3.5">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-900 text-sm font-semibold text-white">
                      {initialsFromCompany(job.company)}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{job.title}</h3>
                      <p className="text-xs text-slate-500">{job.company}</p>
                      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
                        <span className="font-semibold text-purple-700">
                          {job.type || 'Full Time'}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <MapPin size={12} /> {job.location}
                        </span>
                        {job.salary && job.salary !== 'External Opportunity' && (
                          <>
                            <span>•</span>
                            <span className="text-emerald-700 font-medium">{job.salary}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {job.description && (
                  <p className="mt-3 text-xs text-slate-600 line-clamp-2">{job.description}</p>
                )}

                {Array.isArray(job.skills) && job.skills.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {job.skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                <span className="text-[11px] text-slate-400">
                  Work Mode: <span className="font-medium text-slate-600">{job.workMode || 'Remote'}</span>
                </span>

                {job.jobUrl ? (
                  <a
                    href={job.jobUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-xl bg-purple-600 px-4 py-1.5 text-xs font-semibold text-white shadow hover:bg-purple-500 transition-colors"
                  >
                    Visit Job & Apply ↗
                  </a>
                ) : (
                  <span
                    className="rounded-xl bg-slate-100 px-3.5 py-1.5 text-xs font-medium text-slate-400 cursor-not-allowed"
                    title="Application link unavailable"
                  >
                    Application link unavailable
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
