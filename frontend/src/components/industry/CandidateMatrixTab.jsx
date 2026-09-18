import { useState, useEffect } from 'react'
import {
  Users,
  Search,
  ArrowUpDown,
  Trophy,
  ExternalLink,
  Award,
  Code2,
  Video,
  Sparkles,
  ChevronRight,
  Filter,
  RefreshCw,
  Lock,
  Unlock,
  CheckCircle2,
  Mail,
  Phone,
  ShieldCheck,
  IndianRupee,
  Loader2,
} from 'lucide-react'
import { fetchCandidateMatrix, updateCandidatePipelineApi, unlockCandidateContactApi } from '../../services/api'
import CandidateProfileModal from '../CandidateProfileModal'

export default function CandidateMatrixTab() {
  const [candidates, setCandidates] = useState([])
  const [loading, setLoading] = useState(true)
  const [sortField, setSortField] = useState('overall')
  const [sortOrder, setSortOrder] = useState('desc')
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('All')
  const [selectedCandidateId, setSelectedCandidateId] = useState(null)
  const [requirement, setRequirement] = useState(null)
  const [unlockingId, setUnlockingId] = useState(null)

  useEffect(() => {
    loadCandidates()
  }, [sortField, sortOrder])

  async function loadCandidates() {
    setLoading(true)
    const res = await fetchCandidateMatrix({
      sort: sortField,
      order: sortOrder,
      search: search.trim() || undefined,
    })
    setCandidates(res?.candidates || [])
    setRequirement(res?.requirement || null)
    setLoading(false)
  }

  function handleSort(field) {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  async function handleQuickStageChange(studentId, newStage) {
    try {
      await updateCandidatePipelineApi({
        studentId,
        stage: newStage,
      })
      loadCandidates()
    } catch (err) {
      alert(err.message || 'Failed to update pipeline stage')
    }
  }

  async function handleUnlockContact(candidate) {
    const targetId = candidate.studentId || candidate._id
    setUnlockingId(targetId)
    try {
      const res = await unlockCandidateContactApi({ studentId: targetId })
      if (res?.unlockedCandidates?.length > 0) {
        const unlocked = res.unlockedCandidates[0]
        setCandidates((prev) =>
          prev.map((c) => {
            const cId = c.studentId || c._id
            if (cId === targetId || String(cId) === String(targetId)) {
              return {
                ...c,
                email: unlocked.email || c.email,
                phone: unlocked.phone || c.phone,
                contactUnlocked: true,
              }
            }
            return c
          })
        )
      }
      // Refresh candidate data from server to ensure sync
      await loadCandidates()
    } catch (err) {
      alert(err.message || 'Failed to unlock contact')
    } finally {
      setUnlockingId(null)
    }
  }

  const filteredCandidates = candidates.filter((c) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      c.name?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.fieldMark?.toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Candidate Discovery & Matrix</h2>
          <p className="text-xs text-slate-500">
            Screen candidates rank-wise across Industry Assessments, DSA Contests, and AI Mock Interviews.
          </p>
        </div>

        <button
          type="button"
          onClick={loadCandidates}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 self-start sm:self-auto"
        >
          <RefreshCw size={13} /> Refresh Rankings
        </button>
      </div>

      {/* Transparent Disclaimer */}
      <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 text-xs text-slate-600 flex items-center justify-between gap-4">
        <span>
          <strong>Recruitment Screening Matrix:</strong> Match scores and rankings assist recruiter candidate discovery. InternSetu provides screening intelligence; company recruiters make all final recruitment decisions.
        </span>
        {requirement?.scoringWeights?.isConfigured && (
          <span className="rounded-md bg-indigo-100 px-2.5 py-1 text-[10px] font-bold text-indigo-800 shrink-0">
            Scoring Weights: Assess {requirement.scoringWeights.assessmentWeight}% · DSA {requirement.scoringWeights.dsaWeight}% · AI {requirement.scoringWeights.aiInterviewWeight}%
          </span>
        )}
      </div>

      {/* Revenue Model Banner */}
      <div className="rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 via-orange-50 to-yellow-50 p-4 text-xs">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 shrink-0">
            <ShieldCheck size={16} className="text-amber-700" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-amber-900 flex items-center gap-2">
              InternSetu Revenue Model
              <span className="rounded-full bg-amber-200/70 px-2 py-0.5 text-[10px] font-bold text-amber-800">DEMO</span>
            </h3>
            <p className="mt-1 text-amber-800 leading-relaxed">
              Contact information is privacy-protected. Unlock candidate contacts at <strong className="text-amber-900">₹50/candidate</strong> (Demo). 
              Candidate names, scores, and profiles remain visible — only email and phone are protected until unlocked.
            </p>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg bg-amber-100/80 px-3 py-1.5 text-amber-900 font-bold shrink-0">
            <Lock size={13} />
            <span>Privacy Protected</span>
          </div>
        </div>
      </div>

      {/* Filter and Sort Toolbar */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadCandidates()}
            placeholder="Search candidates by name, email, or department..."
            className="w-full rounded-lg border border-slate-200 pl-8 pr-3 py-2 text-xs outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-400">Sort by:</span>
          {[
            { id: 'overall', label: 'Overall' },
            { id: 'assessment', label: 'Assessment' },
            { id: 'dsaScore', label: 'DSA Score' },
            { id: 'dsaRank', label: 'DSA Rank' },
            { id: 'aiInterview', label: 'AI Interview' },
            { id: 'match', label: 'Match %' },
          ].map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => handleSort(s.id)}
              className={`rounded-lg px-2.5 py-1 font-semibold transition ${
                sortField === s.id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {s.label} {sortField === s.id && (sortOrder === 'desc' ? '↓' : '↑')}
            </button>
          ))}
        </div>
      </div>

      {/* Candidate Matrix Table */}
      {loading ? (
        <div className="py-16 text-center text-xs text-slate-400">Loading candidates ranking...</div>
      ) : filteredCandidates.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <Users size={36} className="mx-auto text-slate-300" />
          <h3 className="mt-3 text-sm font-bold text-slate-700">No candidates found</h3>
          <p className="mt-1 text-xs text-slate-400">Try adjusting your search criteria or role filters.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-semibold">
              <tr>
                <th className="py-3 px-4">Rank</th>
                <th className="py-3 px-4">Student Candidate</th>
                <th className="py-3 px-4">Contact Info</th>
                <th className="py-3 px-4">Assessment</th>
                <th className="py-3 px-4">DSA Contest</th>
                <th className="py-3 px-4">AI Interview</th>
                <th className="py-3 px-4">Overall Score</th>
                <th className="py-3 px-4">Match %</th>
                <th className="py-3 px-4">Pipeline Stage</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCandidates.map((c, idx) => {
                const isUnlocked = Boolean(c.contactUnlocked)
                const isUnlocking = unlockingId === (c.studentId || c._id)

                return (
                  <tr key={c._id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-50 text-indigo-700 font-extrabold text-[11px]">
                        {c.rank || idx + 1}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div
                        onClick={() => setSelectedCandidateId(c._id)}
                        className="cursor-pointer group"
                      >
                        <p className="font-bold text-slate-900 group-hover:text-indigo-600 flex items-center gap-1">
                          {c.name}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate max-w-[180px]">
                          {c.fieldMark} · CGPA {c.cgpa}
                        </p>
                      </div>
                    </td>

                    {/* Contact Info Column */}
                    <td className="py-3.5 px-4">
                      {isUnlocked ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <Mail size={11} className="text-emerald-500" />
                            <span className="text-[11px] font-medium text-slate-800 truncate max-w-[160px]">{c.email}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Phone size={11} className="text-emerald-500" />
                            <span className="text-[11px] font-medium text-slate-800">{c.phone}</span>
                          </div>
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-700 border border-emerald-200">
                            <CheckCircle2 size={9} /> Unlocked ✓
                          </span>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <Mail size={11} className="text-slate-300" />
                            <span className="text-[11px] text-slate-400 select-none font-mono" style={{ filter: 'blur(0.5px)' }}>{c.email || '••••••••••'}</span>
                            <Lock size={9} className="text-amber-500" />
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Phone size={11} className="text-slate-300" />
                            <span className="text-[11px] text-slate-400 select-none font-mono">••••••••••</span>
                            <Lock size={9} className="text-amber-500" />
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleUnlockContact(c)
                            }}
                            disabled={isUnlocking}
                            className="mt-0.5 inline-flex items-center gap-1 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 px-2 py-1 text-[10px] font-bold text-white shadow-sm hover:from-amber-600 hover:to-orange-600 transition disabled:opacity-50"
                          >
                            {isUnlocking ? (
                              <>
                                <Loader2 size={10} className="animate-spin" /> Unlocking...
                              </>
                            ) : (
                              <>
                                <Unlock size={10} /> Unlock Contact ₹50
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-800">{c.assessmentScore}%</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div>
                        <span className="font-bold text-teal-700">{c.dsaRank}</span>
                        <span className="text-[10px] text-slate-400 block">{c.dsaScore} pts ({c.dsaSolved} solved)</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-purple-700">{c.aiInterview}%</span>
                    </td>
                    <td className="py-3.5 px-4">
                      {c.overall !== null ? (
                        <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 font-bold text-indigo-700">
                          {c.overall}%
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Unweighted</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-emerald-600">{c.matchScore}% Match</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <select
                        value={c.pipelineStage}
                        onChange={(e) => handleQuickStageChange(c._id, e.target.value)}
                        className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 outline-none"
                      >
                        <option value="Matched">Matched</option>
                        <option value="Shortlisted">Shortlisted</option>
                        <option value="Contacted">Contacted</option>
                        <option value="Interviewed">Interviewed</option>
                        <option value="Selected">Selected</option>
                      </select>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedCandidateId(c._id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100"
                      >
                        View Profile <ChevronRight size={12} />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Candidate Profile Modal */}
      {selectedCandidateId && (
        <CandidateProfileModal
          candidateId={selectedCandidateId}
          onClose={() => setSelectedCandidateId(null)}
          onPipelineUpdated={loadCandidates}
        />
      )}
    </div>
  )
}
