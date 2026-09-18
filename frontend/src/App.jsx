import { useEffect, useState, lazy, Suspense } from 'react'
import { Routes, Route, Navigate, Outlet, useLocation, useOutletContext, NavLink } from 'react-router-dom'
import { LogOut, ShieldCheck, BookOpen, Building2, Briefcase } from 'lucide-react'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import AiChatbot from './components/AiChatbot'
import ErrorBoundary from './components/ErrorBoundary'
import PageLoader from './components/PageLoader'

// Eagerly loaded public and SEO critical components
import Login from './components/Login'
import CoursesPage from './components/CoursesPage'
import InternshipsPage from './components/InternshipsPage'
import JobsPage from './components/JobsPage'
import LandingPage from './components/LandingPage'
import InternshipDetailPage from './components/InternshipDetailPage'
import JobDetailPage from './components/JobDetailPage'
import NotFound from './components/NotFound'
import PublicLayout from './components/PublicLayout'
import { HelmetProvider } from 'react-helmet-async'

// Code-split / Lazy-loaded heavy private workspace components
const StudentDashboard = lazy(() => import('./components/StudentDashboard'))
const SkillGapAnalysis = lazy(() => import('./components/SkillGapAnalysis'))
const OpportunityFeed = lazy(() => import('./components/OpportunityFeed'))
const VideoInterview = lazy(() => import('./components/VideoInterview'))
const LearningModules = lazy(() => import('./components/LearningModules'))
const AdminDashboard = lazy(() => import('./components/AdminDashboard'))
const ComingSoon = lazy(() => import('./components/ComingSoon'))
const EducatorDashboard = lazy(() => import('./components/EducatorDashboard'))
const IndustryDashboard = lazy(() => import('./components/IndustryDashboard'))
const AssessmentPage = lazy(() => import('./components/AssessmentPage'))
const SkillResultsPage = lazy(() => import('./components/SkillResultsPage'))
const StudentProfile = lazy(() => import('./components/StudentProfile'))
const IndustryTest = lazy(() => import('./components/IndustryTest'))
const IndustryAssessment = lazy(() => import('./components/IndustryAssessment'))
const IndustryMatrix = lazy(() => import('./components/IndustryMatrix'))
const StudentApplications = lazy(() => import('./components/StudentApplications'))

import { AuthProvider, useAuth } from './context/AuthContext'

function useCurrentStudent(user) {
  if (!user) return null

  const name = user.name || 'Student'
  const initials = name
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'ST'

  return {
    id: user._id || user.studentId || 'STU-001',
    name,
    email: user.email || '',
    enrollmentNo: user.enrollmentNo || '',
    branch: user.fieldMark || 'Computer Science & Engineering',
    institute: user.institute || 'Engineering College',
    semester: user.semester || 1,
    cgpa: user.cgpa || 0,
    targetRole: user.targetRole || 'ROLE-003',
    avatarInitials: initials,
    skills: user.skills || [],
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
    return <Navigate to="/dashboard" replace />
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
          <Suspense fallback={<PageLoader message="Loading student workspace…" />}>
            <Outlet context={student} />
          </Suspense>
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
              <p className="text-sm font-semibold text-white">internsetu · Educator Portal</p>
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
        <Suspense fallback={<PageLoader message="Loading educator dashboard…" />}>
          <Outlet />
        </Suspense>
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
              <p className="text-sm font-semibold text-white">internsetu · Industry Workspace</p>
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
        <Suspense fallback={<PageLoader message="Loading industry workspace…" />}>
          <Outlet />
        </Suspense>
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
            <p className="text-sm font-semibold text-white">internsetu · Institutional Admin Console</p>
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
        <Suspense fallback={<PageLoader message="Loading administrator console…" />}>
          <Outlet />
        </Suspense>
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

function PublicOrStudentRoute({ component: Component }) {
  const { isAuthenticated, role, user, logout } = useAuth()
  const student = useCurrentStudent(user)
  const location = useLocation()
  const [isNavOpen, setIsNavOpen] = useState(false)

  useEffect(() => {
    setIsNavOpen(false)
  }, [location.pathname])

  if (isAuthenticated && role === 'student' && student) {
    return (
      <div className="flex h-screen overflow-hidden bg-slate-50">
        <Sidebar isOpen={isNavOpen} onClose={() => setIsNavOpen(false)} />
        <div className="flex min-w-0 flex-1 flex-col">
          <Header student={student} onLogout={logout} onMenuClick={() => setIsNavOpen(true)} />
          <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 sm:py-8">
            <Component />
          </main>
        </div>
        <AiChatbot />
      </div>
    )
  }

  return (
    <PublicLayout>
      <Component />
    </PublicLayout>
  )
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public Read-Only Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/internships" element={<PublicOrStudentRoute component={InternshipsPage} />} />
      <Route path="/internships/:id" element={<PublicOrStudentRoute component={InternshipDetailPage} />} />
      <Route path="/jobs" element={<PublicOrStudentRoute component={JobsPage} />} />
      <Route path="/jobs/:id" element={<PublicOrStudentRoute component={JobDetailPage} />} />
      <Route path="/courses" element={<PublicOrStudentRoute component={CoursesPage} />} />

      {/* Student Protected Routes */}
      <Route element={<ProtectedRoute allowedRoles={['student']} />}>
        <Route element={<StudentLayout />}>
          <Route path="/dashboard" element={<StudentDashboardRoute />} />
          <Route path="/profile" element={<StudentProfile />} />
          <Route path="/assessment" element={<AssessmentPage />} />
          <Route path="/assessment/results" element={<SkillResultsPage />} />
          <Route path="/industry-test" element={<IndustryTest />} />
          <Route path="/industry-assessment" element={<IndustryAssessment />} />
          <Route path="/industry-matrix" element={<IndustryMatrix />} />
          <Route path="/skill-gap" element={<SkillGapAnalysisRoute />} />
          <Route path="/opportunities" element={<OpportunityFeedRoute />} />
          <Route path="/interview" element={<VideoInterviewRoute />} />
          <Route path="/learning" element={<LearningModulesRoute />} />
          <Route path="/applications" element={<StudentApplications />} />
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

      {/* Real 404 handler — No redirect to / */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default function App() {
  return (
    <HelmetProvider>
      <AuthProvider>
        <ErrorBoundary>
          <AppRoutes />
        </ErrorBoundary>
      </AuthProvider>
    </HelmetProvider>
  )
}
