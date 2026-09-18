import { useState, useEffect } from 'react'
import {
  Briefcase,
  ExternalLink,
  Users,
  CheckCircle2,
  Calendar,
  FileText,
  Clock,
  ChevronRight,
} from 'lucide-react'
import { fetchInternships, fetchInternshipApplications } from '../../services/api'
import CandidateProfileModal from '../CandidateProfileModal'
import { useAuth } from '../../context/AuthContext'

export default function IndustryApplicationsTab() {
  const { user } = useAuth()
  const [internships, setInternships] = useState([])
  const [selectedInternshipId, setSelectedInternshipId] = useState('all')
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCandidateId, setSelectedCandidateId] = useState(null)

  useEffect(() => {
    loadInternshipsAndApplications()
  }, [])

  async function loadInternshipsAndApplications() {
    setLoading(true)
    const intRes = await fetchInternships({ industryId: user?._id })
    const list = intRes?.internships || []
    setInternships(list)

    if (list.length > 0) {
      // Load applications for all internships
      const allApps = []
      for (const item of list) {
        const appRes = await fetchInternshipApplications(item._id)
        if (appRes?.applications) {
          allApps.push(...appRes.applications.map((a) => ({ ...a, internshipTitle: item.title })))
        }
      }
      setApplications(allApps)
    }
    setLoading(false)
  }

  const filteredApplications = applications.filter((app) => {
    if (selectedInternshipId === 'all') return true
    return app.internshipId?._id === selectedInternshipId || app.internshipId === selectedInternshipId
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Internship Applications & Interest</h2>
          <p className="text-xs text-slate-500">
            Track student applications submitted via InternSetu and external website visit activity.
          </p>
        </div>

        {internships.length > 0 && (
          <select
            value={selectedInternshipId}
            onChange={(e) => setSelectedInternshipId(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 outline-none"
          >
            <option value="all">All Internships ({internships.length})</option>
            {internships.map((i) => (
              <option key={i._id} value={i._id}>
                {i.title}
              </option>
            ))}
          </select>
        )}
      </div>

      {loading ? (
        <div className="py-16 text-center text-xs text-slate-400">Loading applications...</div>
      ) : filteredApplications.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <Briefcase size={36} className="mx-auto text-slate-300" />
          <h3 className="mt-3 text-sm font-bold text-slate-700">No applications received yet</h3>
          <p className="mt-1 text-xs text-slate-400">
            When students submit their profiles or visit your application link, they will appear here.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          {filteredApplications.map((app) => {
            const snap = app.studentSnapshot || {}
            const isVisited = app.status === 'VISITED_COMPANY_APPLICATION'

            return (
              <div key={app._id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        isVisited
                          ? 'bg-purple-50 text-purple-700 border border-purple-200'
                          : 'bg-teal-50 text-teal-700 border border-teal-200'
                      }`}
                    >
                      • {isVisited ? 'Visited Company Application' : 'Applied on InternSetu'}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      Applied for: <span className="font-semibold text-slate-700">{app.internshipTitle}</span>
                    </span>
                  </div>

                  <div className="cursor-pointer" onClick={() => setSelectedCandidateId(app.studentId?._id || app.studentId)}>
                    <h3 className="text-sm font-bold text-slate-900 hover:text-indigo-600 transition">
                      {snap.name || app.studentId?.name || 'Student Applicant'}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {snap.branch || app.studentId?.fieldMark} · {snap.institute} · CGPA {snap.cgpa || 8.0}
                    </p>
                  </div>

                  {app.coverNote && (
                    <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 italic">
                      "{app.coverNote}"
                    </p>
                  )}

                  {snap.skills && snap.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {snap.skills.slice(0, 6).map((sk, idx) => (
                        <span key={idx} className="rounded bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600">
                          {sk}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setSelectedCandidateId(app.studentId?._id || app.studentId)}
                    className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    View Full Profile <ChevronRight size={12} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {selectedCandidateId && (
        <CandidateProfileModal
          candidateId={selectedCandidateId}
          onClose={() => setSelectedCandidateId(null)}
          onPipelineUpdated={loadInternshipsAndApplications}
        />
      )}
    </div>
  )
}
