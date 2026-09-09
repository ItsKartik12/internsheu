import { Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import StudentDashboard from './components/StudentDashboard'
import SkillGapAnalysis from './components/SkillGapAnalysis'
import OpportunityFeed from './components/OpportunityFeed'
import ComingSoon from './components/ComingSoon'
import { getStudentById, getStudentSkillProfile } from './data/mockDatabase'

// Logged-in student context. In a production build this would come from
// an auth/session provider — kept as a simple lookup for the demo build.
const CURRENT_STUDENT_ID = 'STU-001'

function useCurrentStudent() {
  const base = getStudentById(CURRENT_STUDENT_ID)
  const skills = getStudentSkillProfile(CURRENT_STUDENT_ID)
  return { ...base, skills }
}

export default function App() {
  const student = useCurrentStudent()

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header student={student} />
        <main className="flex-1 overflow-y-auto px-6 py-8">
          <Routes>
            <Route path="/" element={<StudentDashboard student={student} />} />
            <Route path="/skill-gap" element={<SkillGapAnalysis student={student} />} />
            <Route path="/opportunities" element={<OpportunityFeed student={student} />} />
            <Route path="/applications" element={<ComingSoon title="Applications" />} />
            <Route path="/mentorship" element={<ComingSoon title="Mentorship" />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}
