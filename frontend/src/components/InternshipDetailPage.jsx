import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import {
  Briefcase,
  Building2,
  MapPin,
  Clock,
  IndianRupee,
  Calendar,
  ExternalLink,
  ArrowLeft,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  FileCheck,
} from 'lucide-react'
import {
  fetchInternshipById,
  applyInternsetuApi,
  trackVisitCompanyUrlApi,
  fetchMyApplications,
} from '../services/api'
import { useAuth } from '../context/AuthContext'
import { generateJobPostingSchema, generateBreadcrumbSchema } from '../utils/schemaGenerator'
import NotFound from './NotFound'

export default function InternshipDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { user, isAuthenticated } = useAuth()

  const [internship, setInternship] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [applied, setApplied] = useState(false)
  const [isApplying, setIsApplying] = useState(false)
  const [feedbackMessage, setFeedbackMessage] = useState('')

  useEffect(() => {
    let isMounted = true
    async function loadData() {
      setLoading(true)
      setError(false)
      try {
        const data = await fetchInternshipById(id)
        if (!isMounted) return
        if (!data || !data._id) {
          setError(true)
        } else {
          setInternship(data)
        }
      } catch (err) {
        if (isMounted) setError(true)
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    loadData()
    return () => {
      isMounted = false
    }
  }, [id])

  useEffect(() => {
    if (isAuthenticated && user?.role === 'student' && internship?._id) {
      fetchMyApplications()
        .then((res) => {
          if (res?.applications && Array.isArray(res.applications)) {
            const hasApplied = res.applications.some(
              (a) => (a.internshipId?._id || a.internshipId) === internship._id
            )
            if (hasApplied) setApplied(true)
          }
        })
        .catch(() => {})
    }
  }, [isAuthenticated, user, internship])

  async function handleVisitAndApply(e) {
    if (e) e.preventDefault()

    if (!isAuthenticated) {
      navigate('/login', { state: { from: location.pathname } })
      return
    }

    setIsApplying(true)
    setFeedbackMessage('')

    try {
      if (user?.role === 'student') {
        await applyInternsetuApi(internship._id, {
          coverNote: '',
          resumeUrl: '',
        })
        await trackVisitCompanyUrlApi(internship._id)
        setApplied(true)
        setFeedbackMessage(
          'Application interest recorded in InternSetu. Opening employer application portal... Please complete your application on the external site.'
        )
      }
    } catch (err) {
      console.warn('InternSetu tracking notice:', err.message)
      setFeedbackMessage('Proceeding to employer application portal...')
    } finally {
      setIsApplying(false)
      if (internship?.applicationUrl) {
        window.open(internship.applicationUrl, '_blank', 'noopener,noreferrer')
      }
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 text-center">
        <div className="inline-flex h-10 w-10 animate-spin items-center justify-center rounded-full border-2 border-teal-500 border-t-transparent"></div>
        <p className="mt-4 text-sm font-medium text-slate-600">Loading internship opportunity details…</p>
      </div>
    )
  }

  if (error || !internship) {
    return <NotFound />
  }

  const canonicalUrl = `https://internsetu.vercel.app/internships/${internship._id}`
  const pageTitle = `${internship.title} at ${internship.company} | InternSetu`
  const metaDescription = internship.description
    ? `${internship.title} opportunity at ${internship.company}. Location: ${internship.location || 'Remote'}. ${internship.description.slice(0, 140)}...`
    : `Explore the ${internship.title} internship at ${internship.company} on InternSetu.`

  const breadcrumbItems = [
    { name: 'Home', url: 'https://internsetu.vercel.app/' },
    { name: 'Internships', url: 'https://internsetu.vercel.app/internships' },
    { name: internship.title, url: canonicalUrl },
  ]

  const jobPostingSchema = generateJobPostingSchema({
    title: internship.title,
    company: internship.company,
    companyWebsite: internship.companyWebsite,
    description: internship.description,
    location: internship.location,
    workMode: internship.workMode,
    createdAt: internship.createdAt,
    deadline: internship.deadline,
    salary: internship.stipend,
    isInternship: true,
  })

  const breadcrumbSchema = generateBreadcrumbSchema(breadcrumbItems)

  return (
    <article className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Route-Specific Dynamic SEO via react-helmet-async */}
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={metaDescription} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:type" content="article" />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:site_name" content="InternSetu" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={metaDescription} />
        <script type="application/ld+json">{JSON.stringify(jobPostingSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
      </Helmet>

      {/* Visible Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-xs text-slate-500">
        <Link to="/" className="transition hover:text-teal-600">
          Home
        </Link>
        <ChevronRight size={12} className="text-slate-400" />
        <Link to="/internships" className="transition hover:text-teal-600">
          Internships
        </Link>
        <ChevronRight size={12} className="text-slate-400" />
        <span className="font-semibold text-slate-800 line-clamp-1" aria-current="page">
          {internship.title}
        </span>
      </nav>

      {/* Back Navigation Button */}
      <div className="mb-6">
        <Link
          to="/internships"
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-900"
        >
          <ArrowLeft size={14} />
          Back to Internships
        </Link>
      </div>

      {/* Main Header Card */}
      <header className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-start">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700 border border-teal-200/60">
                <Briefcase size={12} />
                Internship
              </span>
              {internship.workMode && (
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                  {internship.workMode}
                </span>
              )}
              {internship.type && internship.type !== internship.workMode && (
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                  {internship.type}
                </span>
              )}
              {applied && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
                  <CheckCircle2 size={12} />
                  Applied via InternSetu
                </span>
              )}
            </div>

            {/* Clear H1 for SEO & GEO */}
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              {internship.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
              <div className="inline-flex items-center gap-1.5 font-medium text-slate-800">
                <Building2 size={16} className="text-slate-400" />
                <span>{internship.company}</span>
              </div>
              {internship.location && (
                <div className="inline-flex items-center gap-1.5 text-slate-600">
                  <MapPin size={16} className="text-slate-400" />
                  <span>{internship.location}</span>
                </div>
              )}
              {internship.duration && (
                <div className="inline-flex items-center gap-1.5 text-slate-600">
                  <Clock size={16} className="text-slate-400" />
                  <span>{internship.duration}</span>
                </div>
              )}
              {internship.stipend && (
                <div className="inline-flex items-center gap-1.5 font-semibold text-teal-700">
                  <IndianRupee size={15} />
                  <span>{internship.stipend}</span>
                </div>
              )}
            </div>
          </div>

          {/* Primary CTA */}
          <div className="flex flex-col items-stretch sm:items-end gap-2 shrink-0">
            {internship.applicationUrl ? (
              <button
                type="button"
                id="btn-internship-visit-apply"
                onClick={handleVisitAndApply}
                disabled={isApplying}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-60"
              >
                <span>{applied ? 'Visit Application Portal' : 'Visit & Apply'}</span>
                <ExternalLink size={15} />
              </button>
            ) : (
              <div className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800 border border-amber-200">
                Applications closed or external portal pending
              </div>
            )}
            <p className="text-[11px] text-slate-400 text-center sm:text-right">
              {isAuthenticated ? 'Recorded on your InternSetu profile' : 'Requires student login to track'}
            </p>
          </div>
        </div>

        {/* Feedback message banner */}
        {feedbackMessage && (
          <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-teal-200 bg-teal-50/70 p-3 text-xs text-teal-900">
            <CheckCircle2 size={16} className="text-teal-600 shrink-0 mt-0.5" />
            <p>{feedbackMessage}</p>
          </div>
        )}
      </header>

      {/* Content Grid */}
      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left 2 Columns: Structured Details */}
        <div className="space-y-6 lg:col-span-2">
          {/* Description */}
          {internship.description && (
            <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900">Role Overview</h2>
              <div className="mt-4 whitespace-pre-line text-sm leading-relaxed text-slate-700">
                {internship.description}
              </div>
            </section>
          )}

          {/* Responsibilities */}
          {internship.responsibilities && (
            <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900">Key Responsibilities</h2>
              <div className="mt-4 whitespace-pre-line text-sm leading-relaxed text-slate-700">
                {internship.responsibilities}
              </div>
            </section>
          )}

          {/* Eligibility & Qualifications */}
          {(internship.eligibility || internship.qualifications) && (
            <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900">Eligibility & Qualifications</h2>
              <div className="mt-4 space-y-4 text-sm leading-relaxed text-slate-700">
                {internship.eligibility && (
                  <div>
                    <h3 className="font-semibold text-slate-800">Eligibility Criteria:</h3>
                    <p className="mt-1 whitespace-pre-line">{internship.eligibility}</p>
                  </div>
                )}
                {internship.qualifications && (
                  <div>
                    <h3 className="font-semibold text-slate-800">Required Qualifications:</h3>
                    <p className="mt-1 whitespace-pre-line">{internship.qualifications}</p>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Skills Required */}
          {Array.isArray(internship.skills) && internship.skills.length > 0 && (
            <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900">Required Skills</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {internship.skills.map((skill, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-800"
                  >
                    <Sparkles size={12} className="text-teal-600" />
                    {skill}
                  </span>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Right Column: Opportunity Overview Sidebar */}
        <aside className="space-y-6">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <h2 className="text-base font-bold text-slate-900">Opportunity Snapshot</h2>
            <dl className="mt-4 space-y-4 divide-y divide-slate-100 text-xs">
              <div className="flex justify-between pt-3 first:pt-0">
                <dt className="text-slate-500">Company</dt>
                <dd className="font-semibold text-slate-800">{internship.company}</dd>
              </div>
              {internship.location && (
                <div className="flex justify-between pt-3">
                  <dt className="text-slate-500">Location</dt>
                  <dd className="font-semibold text-slate-800">{internship.location}</dd>
                </div>
              )}
              {internship.workMode && (
                <div className="flex justify-between pt-3">
                  <dt className="text-slate-500">Work Mode</dt>
                  <dd className="font-semibold text-slate-800">{internship.workMode}</dd>
                </div>
              )}
              {internship.stipend && (
                <div className="flex justify-between pt-3">
                  <dt className="text-slate-500">Stipend</dt>
                  <dd className="font-semibold text-teal-700">{internship.stipend}</dd>
                </div>
              )}
              {internship.duration && (
                <div className="flex justify-between pt-3">
                  <dt className="text-slate-500">Duration</dt>
                  <dd className="font-semibold text-slate-800">{internship.duration}</dd>
                </div>
              )}
              {internship.openings !== undefined && internship.openings !== null && (
                <div className="flex justify-between pt-3">
                  <dt className="text-slate-500">Openings</dt>
                  <dd className="font-semibold text-slate-800">{internship.openings}</dd>
                </div>
              )}
              {internship.deadline && (
                <div className="flex justify-between pt-3">
                  <dt className="text-slate-500">Deadline</dt>
                  <dd className="font-semibold text-slate-800">
                    {new Date(internship.deadline).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </dd>
                </div>
              )}
            </dl>

            {internship.applicationUrl && (
              <div className="mt-6 border-t border-slate-100 pt-6">
                <button
                  type="button"
                  id="btn-sidebar-internship-apply"
                  onClick={handleVisitAndApply}
                  disabled={isApplying}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-teal-700"
                >
                  <span>{applied ? 'Visit External Portal' : 'Visit & Apply'}</span>
                  <ExternalLink size={13} />
                </button>
              </div>
            )}
          </div>

          {/* InternSetu Transparency Banner */}
          <div className="rounded-2xl border border-slate-200/80 bg-slate-50 p-5 text-xs text-slate-600">
            <div className="flex items-center gap-2 font-semibold text-slate-800">
              <FileCheck size={16} className="text-teal-600" />
              <span>InternSetu Verified Posting</span>
            </div>
            <p className="mt-2 leading-relaxed text-slate-600">
              This opportunity is published for students through InternSetu. Clicking <strong>Visit & Apply</strong> records your interest in InternSetu and directs you to the official employer portal to complete any final steps.
            </p>
          </div>
        </aside>
      </div>
    </article>
  )
}
