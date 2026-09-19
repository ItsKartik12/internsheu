import { Link, NavLink, Outlet } from 'react-router-dom'
import { GraduationCap, ArrowRight, Briefcase, Building2, BookOpen } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function PublicLayout({ children }) {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Official Government / National Portal Identification Bar */}
      <div className="border-b border-slate-200/90 bg-slate-100/90 text-slate-700 text-[11px] font-medium py-1 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-900">भारत सरकार</span>
            <span className="text-slate-300">|</span>
            <span>Government of India</span>
            <span className="hidden md:inline text-slate-400">·</span>
            <span className="hidden md:inline text-slate-600">Academia-Industry Collaboration & Skill Assessment Portal</span>
          </div>
          <div className="flex items-center gap-3 text-[10px] text-slate-500">
            <span className="hidden sm:inline">National Education & Industry Initiative</span>
            <span className="inline-flex items-center gap-1 font-semibold text-teal-800 bg-teal-50 border border-teal-200/80 rounded px-1.5 py-0.5">
              Verified Portal
            </span>
          </div>
        </div>
      </div>

      {/* Public Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-sm shadow-xs">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            {/* State Emblem of India */}
            <img
              src="/assets/state-emblem-india.png"
              alt="State Emblem of India"
              className="h-8 sm:h-10 w-auto object-contain shrink-0"
              loading="eager"
            />
            <div className="h-7 w-px bg-slate-200 shrink-0" />
            <div className="flex items-center gap-2 sm:gap-2.5">
              <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-teal-500/15 ring-1 ring-teal-500/30 shrink-0">
                <GraduationCap size={18} className="text-teal-600 sm:w-5 sm:h-5" strokeWidth={2.25} />
              </div>
              <div className="leading-tight">
                <span className="text-sm sm:text-base font-extrabold tracking-tight text-slate-900">InternSetu</span>
                <span className="block text-[9px] sm:text-[10px] font-medium text-slate-500">Academia × Industry Portal</span>
              </div>
            </div>
          </Link>

          <nav className="hidden items-center gap-2 sm:flex">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  isActive ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:text-slate-900'
                }`
              }
            >
              Home
            </NavLink>
            <NavLink
              to="/internships"
              className={({ isActive }) =>
                `rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  isActive ? 'bg-teal-50 text-teal-700 font-bold' : 'text-slate-600 hover:text-slate-900'
                }`
              }
            >
              Internships
            </NavLink>
            <NavLink
              to="/jobs"
              className={({ isActive }) =>
                `rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  isActive ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-600 hover:text-slate-900'
                }`
              }
            >
              Career Jobs
            </NavLink>
            <NavLink
              to="/courses"
              className={({ isActive }) =>
                `rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  isActive ? 'bg-purple-50 text-purple-700 font-bold' : 'text-slate-600 hover:text-slate-900'
                }`
              }
            >
              Verified Courses
            </NavLink>
          </nav>

          <div className="flex items-center gap-3">
            {user ? (
              <Link
                to={
                  user.role === 'admin'
                    ? '/admin'
                    : user.role === 'industry'
                    ? '/industry'
                    : user.role === 'educator'
                    ? '/educator'
                    : '/dashboard'
                }
                className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-slate-800"
              >
                Go to Workspace <ArrowRight size={13} />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                >
                  Sign In
                </Link>
                <Link
                  to="/login"
                  state={{ mode: 'register' }}
                  className="rounded-xl bg-teal-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-teal-500"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8">
        {children || <Outlet />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-400">
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 InternSetu · Smart India Hackathon Academia-Industry Collaboration Platform</p>
          <div className="flex gap-4 font-medium text-slate-500">
            <Link to="/internships" className="hover:text-teal-600">Internships</Link>
            <Link to="/jobs" className="hover:text-teal-600">Jobs</Link>
            <Link to="/courses" className="hover:text-teal-600">Courses</Link>
            <Link to="/login" className="hover:text-teal-600">Login</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
