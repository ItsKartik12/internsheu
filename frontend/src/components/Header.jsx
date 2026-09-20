import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Bell, ChevronRight, LogOut, Menu, Wifi, WifiOff } from 'lucide-react'
import { isOnline, subscribeNetworkStatus } from '../services/networkStatus'

const routeMeta = {
  '/': { section: 'Overview', page: 'Dashboard' },
  '/dashboard': { section: 'Overview', page: 'Dashboard' },
  '/profile': { section: 'Profile', page: 'Student Profile' },
  '/courses': { section: 'Academics', page: 'Verified Courses' },
  '/internships': { section: 'Opportunities', page: 'Internships' },
  '/jobs': { section: 'Opportunities', page: 'Career Jobs' },
  '/assessment': { section: 'Assessments', page: 'Skill Assessments' },
  '/assessment/results': { section: 'Assessments', page: 'Skill Matrix' },
  '/industry-test': { section: 'Industry Screening', page: 'Industry Test (DSA)' },
  '/industry-assessment': { section: 'Industry Screening', page: 'Industry Assessment' },
  '/industry-matrix': { section: 'Industry Screening', page: 'Industry Matrix' },
  '/interview': { section: 'Growth', page: 'AI Mock Interview' },
  '/learning': { section: 'Growth', page: 'Learning Center' },
  '/applications': { section: 'Tracking', page: 'Applications' },
  '/mentorship': { section: 'Tracking', page: 'Mentorship' },
}

function NetworkDot() {
  const [online, setOnline] = useState(() => isOnline())

  useEffect(() => {
    return subscribeNetworkStatus(setOnline)
  }, [])

  return (
    <div
      title={online ? 'Network: Online' : 'Network: Offline (Changes saved locally)'}
      className={`flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium transition-colors ${
        online ? 'border border-emerald-200 bg-emerald-50 text-emerald-700' : 'border border-rose-200 bg-rose-50 text-rose-700'
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${online ? 'bg-emerald-500' : 'bg-rose-500'}`} />
      <span className="hidden sm:inline">{online ? 'Online' : 'Offline'}</span>
    </div>
  )
}

export default function Header({ student, onLogout, onMenuClick }) {
  const location = useLocation()
  const meta = routeMeta[location.pathname] ?? { section: 'Overview', page: 'Dashboard' }

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
      <div className="flex items-center gap-3">
        {onMenuClick && (
          <button
            type="button"
            onClick={onMenuClick}
            aria-label="Open menu"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 lg:hidden"
          >
            <Menu size={20} />
          </button>
        )}
        <div className="flex items-center gap-1.5 text-sm">
          <span className="hidden text-slate-400 sm:inline">{meta.section}</span>
          <ChevronRight size={14} className="hidden text-slate-300 sm:inline" />
          <span className="font-medium text-slate-900">{meta.page}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <NetworkDot />

        <button
          type="button"
          aria-label="Notifications"
          className="relative flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
        >
          <Bell size={18} />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-teal-500" />
        </button>

        <div className="h-8 w-px bg-slate-200" />

        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-xs font-semibold text-white">
            {student?.avatarInitials || 'ST'}
          </div>
          <div className="hidden leading-tight sm:block">
            <p className="text-sm font-medium text-slate-900">{student?.name || 'Student'}</p>
            <p className="text-xs text-slate-500">{student?.branch || ''}</p>
          </div>
        </div>

        {onLogout && (
          <button
            type="button"
            onClick={onLogout}
            aria-label="Sign out"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <LogOut size={16} />
          </button>
        )}
      </div>
    </header>
  )
}
