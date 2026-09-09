import { Link } from 'react-router-dom'
import { ArrowUpRight, Award, Radar, Briefcase, TrendingUp } from 'lucide-react'
import { getSkillGapAnalysis, getMatchedOpportunities } from '../data/mockDatabase'

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

export default function StudentDashboard({ student }) {
  const skillGaps = getSkillGapAnalysis(student.id, student.targetRole)
  const opportunities = getMatchedOpportunities(student.id)

  const metSkills = skillGaps.filter((s) => s.status === 'met').length
  const openGaps = skillGaps.filter((s) => s.status === 'gap').length
  const topMatches = opportunities.slice(0, 3)
  const bestMatch = opportunities[0]

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Welcome / profile strip */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-card">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div>
            <p className="text-sm text-slate-500">Welcome back,</p>
            <h1 className="mt-0.5 text-xl font-semibold text-slate-900">{student.name}</h1>
            <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1.5 text-sm text-slate-500">
              <span>Enrollment No. <span className="font-medium text-slate-700">{student.enrollmentNo}</span></span>
              <span>Semester <span className="font-medium text-slate-700">{student.semester}</span></span>
              <span>CGPA <span className="font-medium text-slate-700">{student.cgpa}</span></span>
            </div>
          </div>
          <div className="flex gap-2">
            <Link
              to="/skill-gap"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              View skill report
            </Link>
            <Link
              to="/opportunities"
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
            >
              Browse matches
              <ArrowUpRight size={15} />
            </Link>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Skills benchmark-ready"
          value={`${metSkills}/${skillGaps.length}`}
          sub="Meeting target-role thresholds"
          icon={Award}
          accent="bg-teal-50 text-teal-600"
        />
        <StatCard
          label="Open skill gaps"
          value={openGaps}
          sub="Recommended for upskilling"
          icon={Radar}
          accent="bg-indigo-50 text-indigo-600"
        />
        <StatCard
          label="Matched opportunities"
          value={opportunities.length}
          sub={bestMatch ? `Top match: ${bestMatch.matchScore}%` : '—'}
          icon={Briefcase}
          accent="bg-slate-100 text-slate-600"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Skill snapshot */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-card lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Skill snapshot</h2>
            <Link to="/skill-gap" className="text-xs font-medium text-indigo-600 hover:text-indigo-500">
              Full analysis
            </Link>
          </div>
          <ul className="mt-4 space-y-4">
            {student.skills.map((skill) => (
              <li key={skill.id}>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-700">{skill.name}</span>
                  <span className="font-medium text-slate-900">{skill.proficiency}%</span>
                </div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-teal-500"
                    style={{ width: `${skill.proficiency}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Top opportunity matches */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-card lg:col-span-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Top opportunity matches</h2>
            <Link to="/opportunities" className="text-xs font-medium text-indigo-600 hover:text-indigo-500">
              View all
            </Link>
          </div>
          <ul className="mt-4 divide-y divide-slate-100">
            {topMatches.map((opp) => (
              <li key={opp.id} className="flex items-center justify-between gap-4 py-3.5 first:pt-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-[11px] font-semibold text-white">
                    {opp.company.logoInitials}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{opp.title}</p>
                    <p className="text-xs text-slate-500">{opp.company.name} · {opp.location}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 rounded-full bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-700">
                  <TrendingUp size={12} />
                  {opp.matchScore}%
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
