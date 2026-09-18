import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  FileText,
  Briefcase,
  Building2,
  MapPin,
  IndianRupee,
  ExternalLink,
  Clock,
  CheckCircle2,
  ArrowUpRight,
  RefreshCw,
  Laptop,
} from 'lucide-react'
import {
  fetchMyApplications,
  fetchMyJobApplications,
  trackVisitJobUrlApi,
} from '../services/api'

export default function StudentApplications() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialTab = searchParams.get('tab') === 'jobs' ? 'jobs' : 'internships'
  const [activeTab, setActiveTab] = useState(initialTab)

  const [internshipApps, setInternshipApps] = useState([])
  const [jobApps, setJobApps] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAllApplications()
  }, [])

  function handleTabChange(tab) {
    setActiveTab(tab)
    setSearchParams(tab === 'jobs' ? { tab: 'jobs' } : {})
  }

  async function loadAllApplications() {
    setLoading(true)
    try {
      const [internshipRes, jobRes] = await Promise.all([
        fetchMyApplications().catch((err) => {
          console.warn('Could not fetch internship applications:', err.message)
          return { applications: [] }
        }),
        fetchMyJobApplications().catch((err) => {
          console.warn('Could not fetch job applications:', err.message)
          return { applications: [] }
        }),
      ])

      setInternshipApps(internshipRes?.applications || [])
      setJobApps(jobRes?.applications || [])
    } finally {
      setLoading(false)
    }
  }

  async function handleVisitJobPortal(app) {
    if (!app?.applicationUrl) return

    if (!app.externalPortalVisited) {
      try {
        await trackVisitJobUrlApi(app.jobId)
        setJobApps((prev) =>
          prev.map((item) =>
            item._id === app._id
              ? {
                  ...item,
                  status: 'VISITED_COMPANY_APPLICATION',
                  externalPortalVisited: true,
                  visitedAt: new Date().toISOString(),
                }
              : item
          )
        )
      } catch (err) {
        console.warn('Could not track job portal visit:', err.message)
      }
    }

    window.open(app.applicationUrl, '_blank', 'noopener,noreferrer')
  }

  const internshipVisitedCount = internshipApps.filter(
    (a) => a.status === 'VISITED_COMPANY_APPLICATION' || a.status === 'COMPANY_APPLICATION_CONFIRMED'
  ).length

  const jobVisitedCount = jobApps.filter(
    (a) => a.status === 'VISITED_COMPANY_APPLICATION' || a.externalPortalVisited
  ).length

  function getInternshipStatusBadge(status) {
    if (status === 'COMPANY_APPLICATION_CONFIRMED') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
          <CheckCircle2 size={12} /> Company Confirmed
        </span>
      )
    }
    if (status === 'VISITED_COMPANY_APPLICATION') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 border border-amber-200">
          <ExternalLink size={12} /> Visited Company Portal
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 border border-blue-200">
        <CheckCircle2 size={12} /> Applied via InternSetu
      </span>
    )
  }

  function getJobStatusBadge(status, externalVisited) {
    if (status === 'VISITED_COMPANY_APPLICATION' || externalVisited) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 border border-amber-200">
          <ExternalLink size={12} /> Visited Company Portal
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 border border-blue-200">
        <CheckCircle2 size={12} /> Applied via InternSetu
      </span>
    )
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-12">
      {/* Top Banner Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-indigo-600">
              <FileText size={20} />
              <span className="text-xs font-bold uppercase tracking-wider">Student Career Track</span>
            </div>
            <h1 className="mt-1 text-2xl font-extrabold text-slate-900">
              My Applications
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              Track all your InternSetu application records, external portal visits, and company recruitment updates.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadAllApplications}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <RefreshCw size={13} /> Refresh
            </button>
            {activeTab === 'internships' ? (
              <Link
                to="/internships"
                className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-indigo-500 transition"
              >
                <Briefcase size={14} /> Browse Internships
              </Link>
            ) : (
              <Link
                to="/jobs"
                className="flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-purple-500 transition"
              >
                <Building2 size={14} /> Browse Career Jobs
              </Link>
            )}
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="mt-6 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={() => handleTabChange('internships')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeTab === 'internships'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Briefcase size={14} />
            <span>Internship Applications</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                activeTab === 'internships' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {internshipApps.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('jobs')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeTab === 'jobs'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Building2 size={14} />
            <span>Job Applications</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                activeTab === 'jobs' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {jobApps.length}
            </span>
          </button>
        </div>

        {/* Quick Metrics Cards */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <span className="text-xs text-slate-500">Total Applications</span>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {activeTab === 'internships' ? internshipApps.length : jobApps.length}
            </p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <span className="text-xs text-slate-500">Company Portals Visited</span>
            <p
              className={`mt-1 text-2xl font-bold ${
                activeTab === 'internships' ? 'text-indigo-600' : 'text-purple-600'
              }`}
            >
              {activeTab === 'internships' ? internshipVisitedCount : jobVisitedCount}
            </p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <span className="text-xs text-slate-500">Platform Tracking</span>
            <p className="mt-1 text-xs font-semibold text-teal-700">Verified by InternSetu</p>
          </div>
        </div>
      </div>

      {/* Main Applications Content */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400">Loading your applications...</div>
        ) : activeTab === 'internships' ? (
          /* TAB 1: INTERNSHIP APPLICATIONS */
          internshipApps.length === 0 ? (
            <div className="py-16 text-center">
              <Briefcase size={40} className="mx-auto text-slate-300" />
              <h3 className="mt-3 text-sm font-bold text-slate-700">No internship applications yet</h3>
              <p className="mt-1 text-xs text-slate-400">
                Explore verified internship openings and click &quot;Visit &amp; Apply&quot; to apply.
              </p>
              <Link
                to="/internships"
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-indigo-500"
              >
                Explore Openings <ArrowUpRight size={13} />
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {internshipApps.map((app) => {
                const internship = app.internshipId || {}
                const appUrl = internship.applicationUrl || app.companyApplicationUrl

                return (
                  <div
                    key={app._id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-5 first:pt-0 last:pb-0"
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        {getInternshipStatusBadge(app.status)}
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                          {internship.type || 'Remote'}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-slate-900">
                        {internship.title || 'Internship Position'}
                      </h3>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1 font-semibold text-slate-700">
                          <Building2 size={13} className="text-slate-400" />
                          {internship.company || 'Company'}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <MapPin size={13} className="text-slate-400" />
                          {internship.location || 'Remote'}
                        </span>
                        {internship.stipend && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1 font-semibold text-teal-700">
                              <IndianRupee size={12} />
                              {internship.stipend}
                            </span>
                          </>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-1">
                        <Clock size={12} />
                        <span>
                          Applied on {new Date(app.appliedAt || app.createdAt).toLocaleDateString()}
                        </span>
                        {app.visitedCompanyUrlAt && (
                          <span>
                            · Visited external portal:{' '}
                            {new Date(app.visitedCompanyUrlAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {appUrl ? (
                        <a
                          href={appUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 rounded-xl bg-indigo-50 px-4 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition"
                        >
                          Visit Portal <ExternalLink size={12} />
                        </a>
                      ) : (
                        <span className="text-xs text-slate-400">Portal link unavailable</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )
        ) : (
          /* TAB 2: JOB APPLICATIONS */
          jobApps.length === 0 ? (
            <div className="py-16 text-center">
              <Building2 size={40} className="mx-auto text-slate-300" />
              <h3 className="mt-3 text-sm font-bold text-slate-700">No job applications yet</h3>
              <p className="mt-1 text-xs text-slate-400">
                Explore verified career job opportunities and click &quot;Visit Job &amp; Apply&quot; to apply.
              </p>
              <Link
                to="/jobs"
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-purple-500"
              >
                Explore Career Jobs <ArrowUpRight size={13} />
              </Link>
            </div>
          ) : (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">My Job Applications</h3>
                  <p className="text-xs text-slate-500">
                    Showing your direct career applications and company recruitment portal records.
                  </p>
                </div>
              </div>

              <div className="divide-y divide-slate-100">
                {jobApps.map((app) => {
                  const hasPortalUrl = Boolean(app.applicationUrl)

                  return (
                    <div
                      key={app._id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-5 first:pt-0 last:pb-0"
                    >
                      <div className="space-y-1.5 flex-1 min-w-0">
                        {/* Status + Metadata Badges */}
                        <div className="flex flex-wrap items-center gap-2">
                          {getJobStatusBadge(app.status, app.externalPortalVisited)}
                          <span className="rounded-md bg-purple-50 px-2 py-0.5 text-[10px] font-semibold text-purple-700 border border-purple-100">
                            {app.workMode || 'Remote'}
                          </span>
                          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                            {app.jobType || 'Full-time'}
                          </span>
                        </div>

                        {/* Job Title */}
                        <h3 className="text-base font-bold text-slate-900">
                          {app.jobTitle || 'Job Position'}
                        </h3>

                        {/* Company + Location */}
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                          <span className="flex items-center gap-1 font-semibold text-slate-700">
                            <Building2 size={13} className="text-slate-400" />
                            {app.companyName || 'Company'}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <MapPin size={13} className="text-slate-400" />
                            {app.location || 'Remote'}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-purple-600 font-medium">
                            <Laptop size={12} />
                            {app.workMode || 'Remote'}
                          </span>
                        </div>

                        {/* Dates & External Portal Visit Status */}
                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 pt-1">
                          <Clock size={12} />
                          <span>
                            Applied on {new Date(app.appliedAt || app.createdAt).toLocaleDateString()}
                          </span>
                          {app.visitedAt || app.externalPortalVisited ? (
                            <span className="text-amber-700 font-semibold">
                              · Visited external portal:{' '}
                              {app.visitedAt ? new Date(app.visitedAt).toLocaleDateString() : 'Yes'}
                            </span>
                          ) : (
                            <span className="text-slate-400">
                              · External company portal not yet visited
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action Button */}
                      <div className="flex items-center gap-2 shrink-0">
                        {hasPortalUrl ? (
                          <button
                            type="button"
                            onClick={() => handleVisitJobPortal(app)}
                            className="flex items-center gap-1 rounded-xl bg-purple-50 px-4 py-2 text-xs font-semibold text-purple-700 hover:bg-purple-100 transition border border-purple-200"
                          >
                            Visit Portal <ExternalLink size={12} />
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400">Portal link unavailable</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        )}
      </div>
    </div>
  )
}
