import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowUpRight, Award, Radar, Briefcase, TrendingUp,
  Wifi, WifiOff, User, FolderGit2, Code2, Trophy,
  GraduationCap, Loader2, AlertCircle, ExternalLink,
} from 'lucide-react'
import { fetchStudentDashboard, fetchProfile } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { getCachedDashboard, saveCachedDashboard, getLocalProfile } from '../services/offlineDb'
import { isOnline, subscribeNetworkStatus } from '../services/networkStatus'

function initialsFromCompany(name) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase()
}

function StatCard({ label, value, sub, icon: Icon, accent }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
      <div className="flex items-start justify-between">
        <p className="text-sm text-slate-500">{label}</p>
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${accent}`}>
          <Icon size={16} />
        </div>
      </div>
      <p className="mt-3 text-2xl font-semibold text-slate-900">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{sub}</p>
    </div>
  )
}

function ProfileCompletion({ percentage }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-900">Profile Completion</p>
        <span className="text-sm font-semibold text-indigo-600">{percentage}%</span>
      </div>
      <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-teal-500 transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
      {percentage < 100 && (
        <Link
          to="/profile"
          className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-500"
        >
          Complete your profile <ArrowUpRight size={12} />
        </Link>
      )}
    </div>
  )
}

function EmptyState({ title, message, actionLabel, actionTo }) {
  return (
    <div className="rounded-xl border-2 border-dashed border-slate-200 py-8 text-center">
      <p className="text-sm font-medium text-slate-400">{title}</p>
      <p className="mt-1 text-xs text-slate-400">{message}</p>
      {actionLabel && actionTo && (
        <Link
          to={actionTo}
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-medium text-white hover:bg-indigo-500"
        >
          {actionLabel} <ArrowUpRight size={12} />
        </Link>
      )}
    </div>
  )
}

function SkillChip({ name, category }) {
  const colors = {
    'Programming Language': 'bg-blue-50 text-blue-700',
    Frontend: 'bg-purple-50 text-purple-700',
    Backend: 'bg-green-50 text-green-700',
    Database: 'bg-orange-50 text-orange-700',
    Tools: 'bg-slate-100 text-slate-700',
    'Cloud & DevOps': 'bg-cyan-50 text-cyan-700',
    'AI/ML': 'bg-rose-50 text-rose-700',
  }
  return (
    <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${colors[category] || 'bg-slate-100 text-slate-600'}`}>
      {name}
    </span>
  )
}

export default function StudentDashboard({ student: propStudent }) {
  const { user } = useAuth()
  const userId = user?._id || user?.id

  const [dashboardData, setDashboardData] = useState(null)
  const [profileData, setProfileData] = useState(null)
  const [completionPercentage, setCompletionPercentage] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isLive, setIsLive] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setError(null)

      // 1. Try reading cached data from IndexedDB first (instant render)
      if (userId) {
        try {
          const cachedDash = await getCachedDashboard(userId)
          const localProf = await getLocalProfile(userId)
          if (!cancelled) {
            if (cachedDash) {
              setDashboardData(cachedDash)
              setIsLive(false)
            }
            if (localProf?.profile) {
              setProfileData(localProf.profile)
              setCompletionPercentage(localProf.completionPercentage || 0)
            }
            if (cachedDash || localProf) {
              setIsLoading(false)
            }
          }
        } catch (cacheErr) {
          console.warn('[Dashboard] IndexedDB cache read error:', cacheErr)
        }
      }

      // 2. If online, fetch fresh data from backend API
      if (isOnline()) {
        try {
          const [dashRes, profRes] = await Promise.all([
            fetchStudentDashboard(),
            fetchProfile(),
          ])

          if (cancelled) return

          if (dashRes) {
            setDashboardData(dashRes)
            setIsLive(true)
            if (userId) {
              await saveCachedDashboard(userId, dashRes)
            }
          }

          if (profRes?.profile) {
            setProfileData(profRes.profile)
            setCompletionPercentage(profRes.completionPercentage ?? 0)
          } else if (profRes && typeof profRes === 'object' && !profRes.error) {
            setProfileData(profRes)
          }
        } catch (err) {
          console.warn('[Dashboard] Backend fetch failed:', err.message)
          // Only show error if we have no cached data at all
          if (!cancelled) {
            const hasCache = await getCachedDashboard(userId)
            if (!hasCache) {
              setError('Unable to load your profile. Please check your connection and try again.')
            }
          }
        } finally {
          if (!cancelled) setIsLoading(false)
        }
      } else {
        // Offline mode
        if (!cancelled) {
          setIsLive(false)
          setIsLoading(false)
        }
      }
    }

    load()

    // Listen for network reconnection to revalidate automatically
    const unsub = subscribeNetworkStatus((online) => {
      if (online) {
        load()
      } else {
        setIsLive(false)
      }
    })

    return () => {
      cancelled = true
      unsub()
    }
  }, [userId])

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex items-center gap-3 text-slate-400">
          <Loader2 size={20} className="animate-spin" />
          <span className="text-sm">Loading your profile...</span>
        </div>
      </div>
    )
  }

  if (error && !dashboardData && !profileData) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <AlertCircle size={32} className="mx-auto text-red-400" />
        <p className="mt-3 text-sm font-medium text-red-700">{error}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-4 rounded-lg bg-slate-100 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-200"
        >
          Retry
        </button>
      </div>
    )
  }

  // Build display data from real profile or dashboard API
  const student = dashboardData?.student || {}
  const profile = profileData || {}
  const profileExists = student.profileExists || !profile.isNew

  const achievements = (
    (Array.isArray(profile.achievements) && profile.achievements.length > 0)
      ? profile.achievements
      : (Array.isArray(student.achievements) ? student.achievements : [])
  ).filter((a) => a && (a.title || a.organization || a.description))

  const internships = (
    (Array.isArray(profile.internships) && profile.internships.length > 0)
      ? profile.internships
      : (Array.isArray(student.internships) ? student.internships : [])
  )

  const hackathons = (
    (Array.isArray(profile.hackathons) && profile.hackathons.length > 0)
      ? profile.hackathons
      : (Array.isArray(student.hackathons) ? student.hackathons : [])
  )

  const certifications = (
    (Array.isArray(profile.certifications) && profile.certifications.length > 0)
      ? profile.certifications
      : (Array.isArray(student.certifications) ? student.certifications : [])
  )
  const matchedOpportunities = (dashboardData?.matchedOpportunities || []).map((opp) => ({
    ...opp,
    company: typeof opp.company === 'string'
      ? { name: opp.company, logoInitials: initialsFromCompany(opp.company) }
      : opp.company,
  }))

  // Use real data with fallback to user auth data
  const displayName = profile.basicInfo?.fullName || student.name || propStudent?.name || 'Student'
  const displayEmail = profile.basicInfo?.professionalEmail || student.email || ''
  const displayEnrollment = student.enrollmentNo || propStudent?.enrollmentNo || ''
  const primaryEdu = (profile.education || [])[0] || {}
  const displayCollege = primaryEdu.college || student.institute || ''
  const displayDegree = primaryEdu.degree || student.degree || ''
  const displayBranch = primaryEdu.branch || student.branch || propStudent?.branch || ''
  const displayCgpa = primaryEdu.cgpa || student.cgpa || ''
  const displayGradYear = primaryEdu.graduationYear || student.graduationYear || ''
  const displayTargetRole = profile.careerTarget?.targetJobRole || student.targetRole || ''
  const displayCity = profile.basicInfo?.city || student.city || ''

  // Build skills list from profile
  const allSkills = []
  if (profile.skills) {
    const categories = {
      programmingLanguages: 'Programming Language',
      frontend: 'Frontend',
      backend: 'Backend',
      database: 'Database',
      tools: 'Tools',
      cloudDevOps: 'Cloud & DevOps',
      aiMl: 'AI/ML',
    }
    for (const [key, category] of Object.entries(categories)) {
      if (Array.isArray(profile.skills[key])) {
        profile.skills[key].forEach((name) => {
          allSkills.push({ name, category })
        })
      }
    }
  }
  // Fall back to dashboard API skills if profile skills empty
  const skillsToShow = allSkills.length > 0 ? allSkills : (student.skills || [])

  const topMatches = matchedOpportunities.slice(0, 3)
  const bestMatch = matchedOpportunities[0]

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {!isLive && (
        <div className="flex items-center gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-medium text-amber-800 shadow-sm">
          <WifiOff size={16} className="shrink-0 text-amber-600" />
          <span>Offline · Showing last synced dashboard data from device cache</span>
        </div>
      )}
      {/* Welcome / Profile Overview */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-card">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-2.5">
              <p className="text-sm text-slate-500">Welcome back,</p>
              <span
                className={[
                  'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold',
                  isLive ? 'bg-teal-50 text-teal-700' : 'bg-slate-100 text-slate-500',
                ].join(' ')}
                title={isLive ? 'Data loaded from the live backend API' : 'Backend unreachable — showing cached data'}
              >
                {isLive ? <Wifi size={11} /> : <WifiOff size={11} />}
                {isLive ? 'Live API' : 'Offline'}
              </span>
            </div>
            <h1 className="mt-0.5 text-xl font-semibold text-slate-900">{displayName}</h1>
            <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1.5 text-sm text-slate-500">
              {displayEnrollment && (
                <span>Enrollment No. <span className="font-medium text-slate-700">{displayEnrollment}</span></span>
              )}
              {displayDegree && (
                <span>{displayDegree} <span className="font-medium text-slate-700">{displayBranch}</span></span>
              )}
              {displayCgpa && (
                <span>CGPA <span className="font-medium text-slate-700">{displayCgpa}</span></span>
              )}
              {displayGradYear && (
                <span>Graduating <span className="font-medium text-slate-700">{displayGradYear}</span></span>
              )}
            </div>
            {displayCollege && (
              <p className="mt-1.5 text-xs text-slate-400">{displayCollege}</p>
            )}
            {displayTargetRole && (
              <p className="mt-1 text-xs text-indigo-600 font-medium">Target: {displayTargetRole}</p>
            )}
          </div>
          <div className="flex gap-2">
            <Link
              to="/profile"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              <User size={15} />
              Edit Profile
            </Link>
            <Link
              to="/internships"
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
            >
              Browse matches
              <ArrowUpRight size={15} />
            </Link>
          </div>
        </div>
      </div>

      {/* Profile Completion + Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ProfileCompletion percentage={completionPercentage} />
        <StatCard
          label="Skills"
          value={skillsToShow.length}
          sub="Technical skills listed"
          icon={Code2}
          accent="bg-teal-50 text-teal-600"
        />
        <StatCard
          label="Projects"
          value={(profile.projects || []).length}
          sub="Portfolio projects"
          icon={FolderGit2}
          accent="bg-indigo-50 text-indigo-600"
        />
        <StatCard
          label="Matched opportunities"
          value={matchedOpportunities.length}
          sub={bestMatch ? `Top match: ${bestMatch.matchScore}%` : '—'}
          icon={Briefcase}
          accent="bg-slate-100 text-slate-600"
        />
      </div>

      {/* Incomplete profile CTA */}
      {!profileExists && completionPercentage < 30 && (
        <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-6 text-center">
          <GraduationCap size={28} className="mx-auto text-indigo-400" />
          <h2 className="mt-3 text-sm font-semibold text-slate-900">Complete your profile to unlock your resume and career insights</h2>
          <p className="mt-1 text-xs text-slate-500">Add your education, skills, projects, and experience to get personalized recommendations.</p>
          <Link
            to="/profile"
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500"
          >
            Complete Profile <ArrowUpRight size={14} />
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Skills snapshot */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-card lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Technical Skills</h2>
            <Link to="/profile" className="text-xs font-medium text-indigo-600 hover:text-indigo-500">
              Edit skills
            </Link>
          </div>
          {skillsToShow.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {skillsToShow.map((skill, i) => (
                <SkillChip key={`${skill.name}-${i}`} name={skill.name} category={skill.category} />
              ))}
            </div>
          ) : (
            <EmptyState title="No skills added" message="Add your technical skills in your profile" actionLabel="Add Skills" actionTo="/profile" />
          )}
        </div>

        {/* Top opportunity matches */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-card lg:col-span-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Top opportunity matches</h2>
            <Link to="/internships" className="text-xs font-medium text-indigo-600 hover:text-indigo-500">
              View all
            </Link>
          </div>
          {topMatches.length > 0 ? (
            <ul className="mt-4 divide-y divide-slate-100">
              {topMatches.map((opp) => (
                <li key={opp.id} className="flex items-center justify-between gap-4 py-3.5 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-[11px] font-semibold text-white">
                      {opp.company?.logoInitials || '??'}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">{opp.title}</p>
                      <p className="text-xs text-slate-500">{opp.company?.name || opp.company} · {opp.location}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 rounded-full bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-700">
                    <TrendingUp size={12} />
                    {opp.matchScore}%
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="No matches yet" message="Complete your profile to get matched with opportunities" />
          )}
        </div>
      </div>

      {/* Projects & Experience Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Projects */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-card">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Projects</h2>
            <Link to="/profile" className="text-xs font-medium text-indigo-600 hover:text-indigo-500">
              Manage
            </Link>
          </div>
          {(profile.projects || []).length > 0 ? (
            <ul className="mt-4 space-y-3">
              {(profile.projects || []).slice(0, 3).map((proj, i) => (
                <li key={i} className="rounded-lg border border-slate-100 bg-slate-50/50 p-3">
                  <p className="text-sm font-medium text-slate-900">{proj.name}</p>
                  {proj.role && <p className="mt-0.5 text-xs text-slate-500">{proj.role}</p>}
                  {(proj.technologiesUsed || []).length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {proj.technologiesUsed.slice(0, 5).map((t) => (
                        <span key={t} className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-600">{t}</span>
                      ))}
                    </div>
                  )}
                  <div className="mt-2 flex gap-3">
                    {proj.githubUrl && (
                      <a href={proj.githubUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-indigo-600 hover:underline">GitHub ↗</a>
                    )}
                    {proj.liveDemoUrl && (
                      <a href={proj.liveDemoUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-indigo-600 hover:underline">Demo ↗</a>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-4">
              <EmptyState title="No projects yet" message="Add your projects to showcase your work" actionLabel="Add Projects" actionTo="/profile" />
            </div>
          )}
        </div>

        {/* Experience & Achievements */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-card">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Experience & Achievements</h2>
            <Link to="/profile" className="text-xs font-medium text-indigo-600 hover:text-indigo-500">
              Manage
            </Link>
          </div>
          <div className="mt-4 space-y-4">
            {/* Internships */}
            {internships.length > 0 ? (
              <div>
                <p className="mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">Internships</p>
                {internships.slice(0, 3).map((int, i) => (
                  <div key={int._id || i} className="mb-2 rounded-lg border border-slate-100 bg-slate-50/50 p-3">
                    <p className="text-sm font-medium text-slate-900">{int.role || 'Role'}</p>
                    <p className="text-xs text-slate-500">{int.companyName} {int.location && `· ${int.location}`}</p>
                  </div>
                ))}
              </div>
            ) : null}

            {/* Achievements */}
            {achievements.length > 0 ? (
              <div>
                <p className="mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">Achievements</p>
                <div className="space-y-2">
                  {achievements.map((ach, i) => (
                    <div key={ach._id || i} className="rounded-lg border border-slate-100 bg-slate-50/50 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5">
                          <Award size={16} className="mt-0.5 shrink-0 text-amber-500" />
                          <div>
                            <p className="text-sm font-medium text-slate-900">{ach.title}</p>
                            <div className="flex flex-wrap items-center gap-x-2 text-xs text-slate-500">
                              {ach.organization && <span>{ach.organization}</span>}
                              {ach.organization && (ach.dateOrYear || ach.year || ach.date) && <span>·</span>}
                              {(ach.dateOrYear || ach.year || ach.date) && (
                                <span>{ach.dateOrYear || ach.year || ach.date}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        {ach.credentialUrl && (
                          <a
                            href={ach.credentialUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex shrink-0 items-center gap-1 rounded bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-600 hover:bg-indigo-100 hover:underline"
                          >
                            Credential <ExternalLink size={11} />
                          </a>
                        )}
                      </div>
                      {ach.description && (
                        <p className="mt-1.5 pl-6.5 text-xs text-slate-600">{ach.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Hackathons */}
            {hackathons.length > 0 ? (
              <div>
                <p className="mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">Hackathons</p>
                {hackathons.slice(0, 3).map((h, i) => (
                  <div key={h._id || i} className="mb-2 flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50/50 p-3">
                    <Trophy size={14} className="shrink-0 text-amber-500" />
                    <div>
                      <p className="text-sm font-medium text-slate-900">{h.name}</p>
                      {h.position && <p className="text-xs text-slate-500">{h.position}</p>}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            {/* Certifications */}
            {certifications.length > 0 ? (
              <div>
                <p className="mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">Certifications</p>
                {certifications.slice(0, 3).map((c, i) => (
                  <div key={c._id || i} className="mb-2 flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50/50 p-3">
                    <Award size={14} className="shrink-0 text-indigo-500" />
                    <div>
                      <p className="text-sm font-medium text-slate-900">{c.name}</p>
                      {c.issuingOrganization && <p className="text-xs text-slate-500">{c.issuingOrganization}</p>}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            {/* Empty state if nothing */}
            {internships.length === 0 &&
             achievements.length === 0 &&
             hackathons.length === 0 &&
             certifications.length === 0 && (
              <EmptyState title="No experience or achievements yet" message="Add internships, hackathons, achievements, and certifications to your profile" actionLabel="Add Experience" actionTo="/profile" />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
