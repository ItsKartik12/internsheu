import { useEffect, useState } from 'react'
import { Routes, Route, Navigate, Outlet, useLocation, useOutletContext, NavLink } from 'react-router-dom'
import { LogOut, ShieldCheck, BookOpen, Building2, Briefcase } from 'lucide-react'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import AiChatbot from './components/AiChatbot'
import StudentDashboard from './components/StudentDashboard'
import SkillGapAnalysis from './components/SkillGapAnalysis'
import OpportunityFeed from './components/OpportunityFeed'
import VideoInterview from './components/VideoInterview'
import LearningModules from './components/LearningModules'
import AdminDashboard from './components/AdminDashboard'
import ComingSoon from './components/ComingSoon'
import Login from './components/Login'
import CoursesPage from './components/CoursesPage'
import InternshipsPage from './components/InternshipsPage'
import JobsPage from './components/JobsPage'
import EducatorDashboard from './components/EducatorDashboard'
import IndustryDashboard from './components/IndustryDashboard'
import AssessmentPage from './components/AssessmentPage'
import SkillResultsPage from './components/SkillResultsPage'

import { AuthProvider, useAuth } from './context/AuthContext'
import { getStudentById, getStudentSkillProfile } from './data/mockDatabase'

function useCurrentStudent(user) {
  if (!user) return null
  const base = getStudentById(user.studentId || 'STU-001')
  const defaultSkills = getStudentSkillProfile('STU-001')

  if (base) {
    return {
      ...base,
      name: user.name || base.name,
      email: user.email || base.email,
      enrollmentNo: user.enrollmentNo || base.enrollmentNo,
      branch: user.fieldMark || base.branch,
      skills: defaultSkills,
    }
  }

  return {
    id: user._id || 'STU-001',
    name: user.name || 'Student',
    enrollmentNo: user.enrollmentNo || '2024CS001',
    email: user.email || 'student@internsheu.edu',
    institute: 'Technical Institute of Engineering',
    branch: user.fieldMark || 'Computer Science & Engineering',
    semester: 6,
    cgpa: 8.5,
    targetRole: 'ROLE-003',
    avatarInitials: (user.name || 'Student')
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase(),
    skills: defaultSkills,
  }
}

function useStudentContext() {
  return useOutletContext()
}

function ProtectedRoute({ allowedRoles }) {
  const { isAuthenticated, role, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center text-xs text-slate-400">Loading session…</div>
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  if (!allowedRoles.includes(role)) {
    if (role === 'admin') return <Navigate to="/admin" replace />
    if (role === 'educator') return <Navigate to="/educator" replace />
    if (role === 'industry') return <Navigate to="/industry" replace />
    return <Navigate to="/" replace />
  }

  return <Outlet />
}

function StudentLayout() {
  const { user, logout } = useAuth()
  const student = useCurrentStudent(user)
  const location = useLocation()
  const [isNavOpen, setIsNavOpen] = useState(false)

  useEffect(() => {
    setIsNavOpen(false)
  }, [location.pathname])

  if (!student) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar isOpen={isNavOpen} onClose={() => setIsNavOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header student={student} onLogout={logout} onMenuClick={() => setIsNavOpen(true)} />
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 sm:py-8">
          <Outlet context={student} />
        </main>
      </div>
      <AiChatbot />
    </div>
  )
}

function EducatorLayout() {
  const { user, logout } = useAuth()

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-50">
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-slate-900 px-6">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500/15">
              <BookOpen size={16} className="text-teal-400" />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold text-white">internsheu · Educator Portal</p>
              <p className="text-[11px] text-slate-400">{user?.name || 'Faculty'}</p>
            </div>
          </div>

          <nav className="hidden sm:flex items-center gap-2">
            <NavLink
              to="/educator"
              end
              className={({ isActive }) =>
                `rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  isActive ? 'bg-white/15 text-white' : 'text-slate-400 hover:text-white'
                }`
              }
            >
              Dashboard
            </NavLink>
            <NavLink
              to="/courses"
              className={({ isActive }) =>
                `rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  isActive ? 'bg-white/15 text-white' : 'text-slate-400 hover:text-white'
                }`
              }
            >
              Course Catalog
            </NavLink>
          </nav>
        </div>

        <button
          type="button"
          onClick={logout}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
        >
          <LogOut size={14} />
          Sign out
        </button>
      </header>
      <main className="flex-1 overflow-y-auto px-6 py-8">
        <Outlet />
      </main>
    </div>
  )
}

function IndustryLayout() {
  const { user, logout } = useAuth()

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-50">
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-slate-900 px-6">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/20">
              <Building2 size={16} className="text-indigo-400" />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold text-white">internsheu · Industry Workspace</p>
              <p className="text-[11px] text-slate-400">{user?.name || 'Partner Recruiter'}</p>
            </div>
          </div>

          <nav className="hidden sm:flex items-center gap-2">
            <NavLink
              to="/industry"
              end
              className={({ isActive }) =>
                `rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  isActive ? 'bg-white/15 text-white' : 'text-slate-400 hover:text-white'
                }`
              }
            >
              Recruitment Dashboard
            </NavLink>
            <NavLink
              to="/internships"
              className={({ isActive }) =>
                `rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  isActive ? 'bg-white/15 text-white' : 'text-slate-400 hover:text-white'
                }`
              }
            >
              Internships
            </NavLink>
            <NavLink
              to="/jobs"
              className={({ isActive }) =>
                `rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  isActive ? 'bg-white/15 text-white' : 'text-slate-400 hover:text-white'
                }`
              }
            >
              Career Jobs
            </NavLink>
          </nav>
        </div>

        <button
          type="button"
          onClick={logout}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
        >
          <LogOut size={14} />
          Sign out
        </button>
      </header>
      <main className="flex-1 overflow-y-auto px-6 py-8">
        <Outlet />
      </main>
    </div>
  )
}

function AdminLayout() {
  const { user, logout } = useAuth()

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-50">
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-slate-900 px-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500/15">
            <ShieldCheck size={16} className="text-teal-400" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-white">internsheu · Institutional Admin Console</p>
            <p className="text-[11px] text-slate-400">{user?.name || 'Administrator'}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={logout}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
        >
          <LogOut size={14} />
          Sign out
        </button>
      </header>
      <main className="flex-1 overflow-y-auto px-6 py-8">
        <Outlet />
      </main>
    </div>
  )
}

// Student route wrappers
function StudentDashboardRoute() {
  return <StudentDashboard student={useStudentContext()} />
}
function SkillGapAnalysisRoute() {
  return <SkillGapAnalysis student={useStudentContext()} />
}
function OpportunityFeedRoute() {
  return <OpportunityFeed student={useStudentContext()} />
}
function VideoInterviewRoute() {
  return <VideoInterview student={useStudentContext()} />
}
function LearningModulesRoute() {
  return <LearningModules student={useStudentContext()} />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      {/* Student Protected Routes */}
      <Route element={<ProtectedRoute allowedRoles={['student']} />}>
        <Route element={<StudentLayout />}>
          <Route path="/" element={<StudentDashboardRoute />} />
          <Route path="/courses" element={<CoursesPage />} />
          <Route path="/internships" element={<InternshipsPage />} />
          <Route path="/jobs" element={<JobsPage />} />
          <Route path="/assessment" element={<AssessmentPage />} />
          <Route path="/assessment/results" element={<SkillResultsPage />} />
          <Route path="/skill-gap" element={<SkillGapAnalysisRoute />} />
          <Route path="/opportunities" element={<OpportunityFeedRoute />} />
          <Route path="/interview" element={<VideoInterviewRoute />} />
          <Route path="/learning" element={<LearningModulesRoute />} />
          <Route path="/applications" element={<ComingSoon title="Applications" />} />
          <Route path="/mentorship" element={<ComingSoon title="Mentorship" />} />
        </Route>
      </Route>

      {/* Educator Protected Routes */}
      <Route element={<ProtectedRoute allowedRoles={['educator', 'admin']} />}>
        <Route element={<EducatorLayout />}>
          <Route path="/educator" element={<EducatorDashboard />} />
          <Route path="/educator/courses" element={<CoursesPage />} />
        </Route>
      </Route>

      {/* Industry Protected Routes */}
      <Route element={<ProtectedRoute allowedRoles={['industry', 'admin']} />}>
        <Route element={<IndustryLayout />}>
          <Route path="/industry" element={<IndustryDashboard />} />
          <Route path="/industry/internships" element={<InternshipsPage />} />
          <Route path="/industry/jobs" element={<JobsPage />} />
        </Route>
      </Route>

      {/* Admin Protected Routes */}
      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<AdminDashboard />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
