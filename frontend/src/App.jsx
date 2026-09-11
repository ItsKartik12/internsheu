import { Routes, Route, Navigate, Outlet, useLocation, useOutletContext } from 'react-router-dom'
import { LogOut, ShieldCheck } from 'lucide-react'
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
import { AuthProvider, useAuth } from './context/AuthContext'
import { getStudentById, getStudentSkillProfile } from './data/mockDatabase'

function useCurrentStudent(studentId) {
  const base = getStudentById(studentId)
  const skills = getStudentSkillProfile(studentId)
  return base ? { ...base, skills } : null
}

// Every page under StudentLayout reads the resolved student record back out
// via this hook, so component signatures (`student` prop) stay unchanged
// from before RBAC was introduced.
function useStudentContext() {
  return useOutletContext()
}

// Guards a subtree by role. Unauthenticated users go to /login (remembering
// where they were headed); authenticated users with the wrong role are sent
// to their own home instead of the page they tried to hit — a student can
// never land on /admin, even by typing the URL directly.
function ProtectedRoute({ allowedRoles }) {
  const { isAuthenticated, role } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  if (!allowedRoles.includes(role)) {
    return <Navigate to={role === 'admin' ? '/admin' : '/'} replace />
  }

  return <Outlet />
}

// Persistent shell for student-facing pages — sidebar, header, floating AI
// mentor — around every authenticated student route.
function StudentLayout() {
  const { user, logout } = useAuth()
  const student = useCurrentStudent(user?.studentId)

  if (!student) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header student={student} onLogout={logout} />
        <main className="flex-1 overflow-y-auto px-6 py-8">
          <Outlet context={student} />
        </main>
      </div>
      <AiChatbot />
    </div>
  )
}

// Deliberately separate, lighter-weight shell for the admin console — a
// distinct nav surface signals distinct privileges rather than reusing the
// student sidebar with items hidden.
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
            <p className="text-sm font-semibold text-white">internsheu · Admin Console</p>
            <p className="text-[11px] text-slate-400">{user?.name}</p>
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

// Thin per-page wrappers: pull `student` from the layout's Outlet context
// and hand it down as a prop, exactly as each page already expects.
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

      {/* Student-only territory */}
      <Route element={<ProtectedRoute allowedRoles={['student']} />}>
        <Route element={<StudentLayout />}>
          <Route path="/" element={<StudentDashboardRoute />} />
          <Route path="/skill-gap" element={<SkillGapAnalysisRoute />} />
          <Route path="/opportunities" element={<OpportunityFeedRoute />} />
          <Route path="/interview" element={<VideoInterviewRoute />} />
          <Route path="/learning" element={<LearningModulesRoute />} />
          <Route path="/applications" element={<ComingSoon title="Applications" />} />
          <Route path="/mentorship" element={<ComingSoon title="Mentorship" />} />
        </Route>
      </Route>

      {/* Admin-only territory */}
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
