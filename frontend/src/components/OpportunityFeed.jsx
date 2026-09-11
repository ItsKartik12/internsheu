import { useMemo, useState } from 'react'
import { MapPin, Clock3, IndianRupee, CheckCircle2, XCircle } from 'lucide-react'
import { getMatchedOpportunities } from '../data/mockDatabase'

const filters = [
  { id: 'all', label: 'All matches' },
  { id: 'strong', label: 'Strong (≥60%)' },
  { id: 'building', label: 'Needs upskilling (<60%)' },
]

function matchColor(score) {
  if (score >= 60) return 'bg-teal-50 text-teal-700'
  if (score >= 35) return 'bg-indigo-50 text-indigo-700'
  return 'bg-slate-100 text-slate-600'
}

function OpportunityCard({ opportunity }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-sm font-semibold text-white">
            {opportunity.company.logoInitials}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">{opportunity.title}</h3>
            <p className="text-xs text-slate-500">{opportunity.company.name} · {opportunity.company.sector}</p>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
              <span className="flex items-center gap-1"><MapPin size={12} /> {opportunity.location}</span>
              <span className="flex items-center gap-1"><Clock3 size={12} /> {opportunity.duration}</span>
              <span className="flex items-center gap-1"><IndianRupee size={12} /> {opportunity.stipend.replace('₹', '')}</span>
            </div>
          </div>
        </div>
        <div className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${matchColor(opportunity.matchScore)}`}>
          {opportunity.matchScore}% match
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {opportunity.requiredSkills.map((skill) => {
          const isMissing = opportunity.missingSkills.some((m) => m.id === skill.id)
          return (
            <span
              key={skill.id}
              className={[
                'inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium',
                isMissing ? 'bg-slate-50 text-slate-400' : 'bg-teal-50 text-teal-700',
              ].join(' ')}
            >
              {isMissing ? <XCircle size={11} /> : <CheckCircle2 size={11} />}
              {skill.name}
            </span>
          )
        })}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
        <p className="text-xs text-slate-400">
          {opportunity.matchedCount}/{opportunity.totalRequired} required skills matched
        </p>
        <button
          type="button"
          className="rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-indigo-500"
        >
          Apply now
        </button>
      </div>
    </div>
  )
}

export default function OpportunityFeed({ student }) {
  const [activeFilter, setActiveFilter] = useState('all')
  const allOpportunities = useMemo(() => getMatchedOpportunities(student.id), [student.id])

  const visibleOpportunities = allOpportunities.filter((opp) => {
    if (activeFilter === 'strong') return opp.matchScore >= 60
    if (activeFilter === 'building') return opp.matchScore < 60
    return true
  })

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-card">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">Opportunity feed</h1>
            <p className="mt-1 text-sm text-slate-500">
              Ranked by skill overlap and weighted proficiency against each listing's requirements.
            </p>
          </div>
          <div className="flex gap-1.5 rounded-xl bg-slate-100 p-1">
            {filters.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setActiveFilter(f.id)}
                className={[
                  'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                  activeFilter === f.id
                    ? 'bg-white text-slate-900 shadow-card'
                    : 'text-slate-500 hover:text-slate-700',
                ].join(' ')}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {visibleOpportunities.map((opp) => (
          <OpportunityCard key={opp.id} opportunity={opp} />
        ))}
      </div>

      {visibleOpportunities.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-400">
          No opportunities in this range yet — check back as new listings are matched.
        </div>
      )}
    </div>
  )
}
