import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import AiChatbot from './components/AiChatbot'
import StudentDashboard from './components/StudentDashboard'
import SkillGapAnalysis from './components/SkillGapAnalysis'
import OpportunityFeed from './components/OpportunityFeed'
import VideoInterview from './components/VideoInterview'
import LearningModules from './components/LearningModules'
import ComingSoon from './components/ComingSoon'
import Login from './components/Login'
import { AuthProvider, useAuth } from './context/AuthContext'
import { getStudentById, getStudentSkillProfile } from './data/mockDatabase'

// Logged-in student context. In a production build this would come from
// an auth/session provider — kept as a simple lookup for the demo build.
const CURRENT_STUDENT_ID = 'STU-001'

function useCurrentStudent() {
  const base = getStudentById(CURRENT_STUDENT_ID)
  const skills = getStudentSkillProfile(CURRENT_STUDENT_ID)
  return { ...base, skills }
}

// Wraps every internal route: redirects to /login if there's no session,
// preserving the originally requested path so Login can send them back.
function ProtectedRoute() {
  const { isAuthenticated } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  return <Outlet />
}

// Persistent shell — sidebar, header, floating AI mentor — around every
// authenticated page. The active route renders into <Outlet />.
function DashboardLayout({ student }) {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header student={student} />
        <main className="flex-1 overflow-y-auto px-6 py-8">
          <Outlet />
        </main>
      </div>
      <AiChatbot />
    </div>
  )
}

function AppRoutes() {
  const student = useCurrentStudent()

  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout student={student} />}>
          <Route path="/" element={<StudentDashboard student={student} />} />
          <Route path="/skill-gap" element={<SkillGapAnalysis student={student} />} />
          <Route path="/opportunities" element={<OpportunityFeed student={student} />} />
          <Route path="/interview" element={<VideoInterview student={student} />} />
          <Route path="/learning" element={<LearningModules student={student} />} />
          <Route path="/applications" element={<ComingSoon title="Applications" />} />
          <Route path="/mentorship" element={<ComingSoon title="Mentorship" />} />
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
