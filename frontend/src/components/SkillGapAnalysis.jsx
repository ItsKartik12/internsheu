import { AlertTriangle, CheckCircle2, CircleDashed } from 'lucide-react'
import { getSkillGapAnalysis, industryRoles } from '../data/mockDatabase'

const statusConfig = {
  met: {
    label: 'Benchmark met',
    icon: CheckCircle2,
    text: 'text-teal-700',
    chip: 'bg-teal-50 text-teal-700',
    bar: 'bg-teal-500',
  },
  near: {
    label: 'Near benchmark',
    icon: CircleDashed,
    text: 'text-indigo-700',
    chip: 'bg-indigo-50 text-indigo-700',
    bar: 'bg-indigo-500',
  },
  gap: {
    label: 'Priority gap',
    icon: AlertTriangle,
    text: 'text-amber-700',
    chip: 'bg-amber-50 text-amber-700',
    bar: 'bg-amber-500',
  },
}

export default function SkillGapAnalysis({ student }) {
  const gapData = getSkillGapAnalysis(student.id, student.targetRole)
  const targetRole = industryRoles.find((r) => r.id === student.targetRole)
  const priorityGaps = gapData.filter((s) => s.status === 'gap').sort((a, b) => b.gap - a.gap)

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-card">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Benchmarked against</p>
        <h1 className="mt-1 text-lg font-semibold text-slate-900">{targetRole?.title}</h1>
        <p className="mt-1.5 text-sm text-slate-500">
          Comparing {student.name}'s current proficiency against skill thresholds drawn from partner
          companies hiring for this track.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Comparison chart */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-card lg:col-span-3">
          <h2 className="text-sm font-semibold text-slate-900">Current vs. required proficiency</h2>
          <div className="mt-6 space-y-5">
            {gapData.map((skill) => {
              const config = statusConfig[skill.status]
              return (
                <div key={skill.skillId}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-800">{skill.name}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${config.chip}`}>
                      {config.label}
                    </span>
                  </div>
                  <div className="relative mt-2 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="absolute inset-y-0 left-0 rounded-full bg-slate-300"
                      style={{ width: `${skill.required}%` }}
                    />
                    <div
                      className={`absolute inset-y-0 left-0 rounded-full ${config.bar}`}
                      style={{ width: `${skill.current}%` }}
                    />
                  </div>
                  <div className="mt-1 flex justify-between text-[11px] text-slate-400">
                    <span>Current: {skill.current}%</span>
                    <span>Required: {skill.required}%</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Priority recommendations */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-card lg:col-span-2">
          <h2 className="text-sm font-semibold text-slate-900">Priority upskilling areas</h2>
          <p className="mt-1 text-xs text-slate-500">
            Ranked by the size of the gap against the target-role benchmark.
          </p>
          <ul className="mt-4 space-y-3">
            {priorityGaps.map((skill) => (
              <li
                key={skill.skillId}
                className="rounded-xl border border-amber-100 bg-amber-50/60 p-3.5"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-900">{skill.name}</p>
                  <span className="text-xs font-semibold text-amber-700">−{skill.gap} pts</span>
                </div>
                <p className="mt-1 text-xs text-slate-500">{skill.category}</p>
              </li>
            ))}
            {priorityGaps.length === 0 && (
              <li className="rounded-xl border border-teal-100 bg-teal-50/60 p-3.5 text-sm text-teal-700">
                No critical gaps — all thresholds are within reach.
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  )
}
