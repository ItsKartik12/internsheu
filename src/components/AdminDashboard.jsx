import { Users, TrendingUp, Briefcase, Building2, ArrowUpRight, ArrowRight } from 'lucide-react'
import { adminOverview, departmentBreakdown, recentPlacementActivity } from '../data/mockDatabase'

const statusStyles = {
  'Offer accepted': 'bg-teal-50 text-teal-700',
  'Interview scheduled': 'bg-indigo-50 text-indigo-700',
  'Application submitted': 'bg-slate-100 text-slate-600',
}

function MetricCard({ label, value, growth, icon: Icon, accent }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
      <div className="flex items-start justify-between">
        <p className="text-sm text-slate-500">{label}</p>
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${accent}`}>
          <Icon size={16} />
        </div>
      </div>
      <p className="mt-3 text-2xl font-semibold text-slate-900">{value}</p>
      <p className="mt-1 flex items-center gap-1 text-xs font-medium text-teal-600">
        <ArrowUpRight size={12} />
        {growth}
      </p>
    </div>
  )
}

export default function AdminDashboard() {
  const maxStudents = Math.max(...departmentBreakdown.map((d) => d.students))

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header strip */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-card">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Institution overview</p>
        <h1 className="mt-1 text-xl font-semibold text-slate-900">Admin Dashboard</h1>
        <p className="mt-1.5 text-sm text-slate-500">
          Placement performance and internship activity across all departments, updated in real time.
        </p>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Total students"
          value={adminOverview.totalStudents.toLocaleString('en-IN')}
          growth={adminOverview.studentGrowth}
          icon={Users}
          accent="bg-indigo-50 text-indigo-600"
        />
        <MetricCard
          label="Placement rate"
          value={`${adminOverview.placementRate}%`}
          growth={adminOverview.placementGrowth}
          icon={TrendingUp}
          accent="bg-teal-50 text-teal-600"
        />
        <MetricCard
          label="Active internships"
          value={adminOverview.activeInternships}
          growth={adminOverview.internshipGrowth}
          icon={Briefcase}
          accent="bg-slate-100 text-slate-600"
        />
        <MetricCard
          label="Partner companies"
          value={adminOverview.partnerCompanies}
          growth={adminOverview.partnerGrowth}
          icon={Building2}
          accent="bg-indigo-50 text-indigo-600"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Department breakdown */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-card lg:col-span-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Placement by department</h2>
            <button type="button" className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-500">
              Full report
              <ArrowRight size={12} />
            </button>
          </div>
          <div className="mt-5 space-y-5">
            {departmentBreakdown.map((dept) => (
              <div key={dept.department}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-800">{dept.department}</span>
                  <span className="text-slate-500">{dept.students.toLocaleString('en-IN')} students · {dept.placementRate}%</span>
                </div>
                <div className="relative mt-2 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full bg-slate-300"
                    style={{ width: `${(dept.students / maxStudents) * 100}%` }}
                  />
                  <div
                    className="absolute inset-y-0 left-0 rounded-full bg-indigo-500"
                    style={{ width: `${(dept.students / maxStudents) * (dept.placementRate / 100) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-[11px] text-slate-400">
            Bar length reflects student headcount; the indigo fill shows the placed share within it.
          </p>
        </div>

        {/* Recent activity */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-card lg:col-span-2">
          <h2 className="text-sm font-semibold text-slate-900">Recent placement activity</h2>
          <ul className="mt-4 divide-y divide-slate-100">
            {recentPlacementActivity.map((activity) => (
              <li key={activity.id} className="py-3.5 first:pt-0 last:pb-0">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{activity.studentName}</p>
                    <p className="text-xs text-slate-500">{activity.role} · {activity.company}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusStyles[activity.status]}`}>
                    {activity.status}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
