import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Radar,
  Briefcase,
  FileText,
  MessageSquare,
  Video,
  BookOpen,
  GraduationCap,
} from 'lucide-react'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/skill-gap', label: 'Skill Gap Analysis', icon: Radar },
  { to: '/opportunities', label: 'Opportunity Feed', icon: Briefcase },
  { to: '/interview', label: 'AI Mock Interview', icon: Video },
  { to: '/learning', label: 'Learning Center', icon: BookOpen },
  { to: '/applications', label: 'Applications', icon: FileText },
  { to: '/mentorship', label: 'Mentorship', icon: MessageSquare },
]

function NavItem({ to, label, icon: Icon, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        [
          'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
          isActive
            ? 'bg-white/10 text-white'
            : 'text-slate-400 hover:bg-white/5 hover:text-slate-100',
        ].join(' ')
      }
    >
      {({ isActive }) => (
        <>
          <Icon
            size={18}
            strokeWidth={2}
            className={isActive ? 'text-teal-400' : 'text-slate-500 group-hover:text-slate-300'}
          />
          <span>{label}</span>
        </>
      )}
    </NavLink>
  )
}

export default function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 flex-col bg-slate-900 px-4 py-6 lg:flex">
      <div className="flex items-center gap-2.5 px-2 pb-8">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-500/15">
          <GraduationCap size={20} className="text-teal-400" strokeWidth={2.25} />
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold text-white">internsheu</p>
          <p className="text-[11px] text-slate-500">Academia × Industry</p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {navItems.map((item) => (
          <NavItem key={item.to} {...item} />
        ))}
      </nav>

      <div className="mt-6 rounded-xl border border-white/5 bg-white/[0.03] p-3.5">
        <p className="text-xs font-medium text-slate-300">SIH 2026 Build</p>
        <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
          Connecting student potential with verified industry demand.
        </p>
      </div>
    </aside>
  )
}
