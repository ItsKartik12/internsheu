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
  Award,
  Sparkles,
  Building2,
  X,
} from 'lucide-react'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/courses', label: 'Verified Courses', icon: BookOpen },
  { to: '/internships', label: 'Internships', icon: Briefcase },
  { to: '/jobs', label: 'Career Jobs', icon: Building2 },
  { to: '/assessment', label: 'Skill Assessments', icon: Award },
  { to: '/assessment/results', label: 'Skill Matrix', icon: Sparkles },
  { to: '/skill-gap', label: 'Skill Gap Analysis', icon: Radar },
  { to: '/opportunities', label: 'Opportunity Feed', icon: Briefcase },
  { to: '/interview', label: 'AI Mock Interview', icon: Video },
  { to: '/learning', label: 'Learning Center', icon: BookOpen },
  { to: '/applications', label: 'Applications', icon: FileText },
  { to: '/mentorship', label: 'Mentorship', icon: MessageSquare },
]

function NavItem({ to, label, icon: Icon, end, onNavigate }) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onNavigate}
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

function SidebarContent({ onNavigate, onClose }) {
  return (
    <>
      <div className="flex items-center justify-between px-2 pb-8">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-500/15">
            <GraduationCap size={20} className="text-teal-400" strokeWidth={2.25} />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-white">internsheu</p>
            <p className="text-[11px] text-slate-500">Academia × Industry</p>
          </div>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-white lg:hidden"
          >
            <X size={18} />
          </button>
        )}
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {navItems.map((item) => (
          <NavItem key={item.to} {...item} onNavigate={onNavigate} />
        ))}
      </nav>

      <div className="mt-6 rounded-xl border border-white/5 bg-white/[0.03] p-3.5">
        <p className="text-xs font-medium text-slate-300">SIH 2026 Build</p>
        <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
          Connecting student potential with verified industry demand.
        </p>
      </div>
    </>
  )
}

// Desktop: a persistent column, always visible at lg+ (unchanged behavior).
// Mobile/tablet: an off-canvas drawer that only renders when `isOpen` is
// true, triggered by the hamburger button in Header.jsx. Without this split,
// the nav was only ever reachable at desktop widths — invisible entirely on
// phones, with no way to move between pages.
export default function Sidebar({ isOpen, onClose }) {
  return (
    <>
      {/* Desktop sidebar — unchanged */}
      <aside className="hidden w-64 shrink-0 flex-col bg-slate-900 px-4 py-6 lg:flex">
        <SidebarContent />
      </aside>

      {/* Mobile drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-slate-900/60"
            onClick={onClose}
            aria-hidden="true"
          />
          <aside className="relative flex h-full w-72 max-w-[80vw] flex-col bg-slate-900 px-4 py-6 shadow-md">
            <SidebarContent onNavigate={onClose} onClose={onClose} />
          </aside>
        </div>
      )}
    </>
  )
}
