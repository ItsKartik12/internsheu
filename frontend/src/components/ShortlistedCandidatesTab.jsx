import { useState, useEffect } from 'react'
import {
  Star,
  Users,
  Lock,
  Unlock,
  CheckCircle2,
  ShieldCheck,
  RefreshCw,
  Mail,
  Phone,
  Eye,
  ChevronRight,
  Loader2,
  Sparkles,
  AlertCircle,
  IndianRupee,
  Briefcase,
} from 'lucide-react'
import {
  fetchShortlistedCandidatesApi,
  bulkUnlockShortlistedApi,
  updateCandidatePipelineApi,
} from '../services/api'
import CandidateProfileModal from './CandidateProfileModal'

export default function ShortlistedCandidatesTab({ onNavigateToMatrix }) {
  const [candidates, setCandidates] = useState([])
  const [loading, setLoading] = useState(true)
  const [unlockingAll, setUnlockingAll] = useState(false)
  const [selectedCandidateId, setSelectedCandidateId] = useState(null)
  const [statusMessage, setStatusMessage] = useState('')
  const [lastPaymentInfo, setLastPaymentInfo] = useState(null)

  useEffect(() => {
    loadShortlistedCandidates()
  }, [])

  async function loadShortlistedCandidates() {
    setLoading(true)
    try {
      const res = await fetchShortlistedCandidatesApi()
      setCandidates(res?.candidates || [])
    } catch (err) {
      console.warn('Failed to load shortlisted candidates:', err)
    } finally {
      setLoading(false)
    }
  }

  // Calculate unique pending and already unlocked candidates
  const totalCount = candidates.length
  const alreadyUnlockedList = candidates.filter((c) => Boolean(c.contactUnlocked))
  const pendingUnlockList = candidates.filter((c) => !c.contactUnlocked)

  const alreadyUnlockedCount = alreadyUnlockedList.length
  const pendingUnlockCount = pendingUnlockList.length
  const totalUnlockAmount = pendingUnlockCount * 50

  async function handleBulkUnlock() {
    if (pendingUnlockCount === 0) return
    setUnlockingAll(true)
    setStatusMessage('')
    try {
      const res = await bulkUnlockShortlistedApi()
      setStatusMessage(res?.message || 'Contacts unlocked successfully.')
      setLastPaymentInfo({
        amount: res?.amountPaid ?? totalUnlockAmount,
        unlockedCount: res?.newlyUnlockedCount ?? pendingUnlockCount,
      })
      // Reload full candidate details to reflect unmasked data from MongoDB
      await loadShortlistedCandidates()
      setTimeout(() => setStatusMessage(''), 6000)
    } catch (err) {
      setStatusMessage(err.message || 'Failed to process bulk unlock')
    } finally {
      setUnlockingAll(false)
    }
  }

  async function handleStageChange(studentId, newStage) {
    try {
      await updateCandidatePipelineApi({
        studentId,
        stage: newStage,
      })
      await loadShortlistedCandidates()
    } catch (err) {
      alert(err.message || 'Failed to update pipeline stage')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900">Shortlisted Candidates</h2>
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800 border border-amber-200">
              {totalCount} Shortlisted
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            All candidates shortlisted from the Candidate Screening Matrix.
          </p>
        </div>

        <button
          type="button"
          onClick={loadShortlistedCandidates}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 self-start sm:self-auto"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh List
        </button>
      </div>

      {/* Top Summary Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Total Shortlisted */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Shortlisted</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <Users size={16} />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">{totalCount}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">From Candidate Matrix</p>
        </div>

        {/* Card 2: Contacts Already Unlocked */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Contacts Already Unlocked</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-emerald-700">{alreadyUnlockedCount}</p>
          <p className="text-[11px] text-emerald-600 font-medium mt-0.5">Zero duplicate charge (₹0)</p>
        </div>

        {/* Card 3: Contacts Pending Unlock */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Contacts Pending Unlock</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <Lock size={16} />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-amber-700">{pendingUnlockCount}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">₹50 per candidate (Demo)</p>
        </div>

        {/* Card 4: Total Unlock Amount */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Unlock Amount</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <IndianRupee size={16} />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-indigo-700">₹{totalUnlockAmount}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {pendingUnlockCount > 0 ? `${pendingUnlockCount} × ₹50 one-time` : 'Fully unlocked'}
          </p>
        </div>
      </div>

      {/* Primary Bulk Payment & Unlock Banner */}
      <div className="rounded-2xl border border-indigo-100 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-5 text-white shadow-md">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ShieldCheck className="text-emerald-400" size={18} />
              <h3 className="text-sm font-bold text-white">
                InternSetu Recruitment Unlock Flow
              </h3>
              <span className="rounded bg-indigo-500/30 px-2 py-0.5 text-[10px] font-bold text-indigo-200 border border-indigo-400/30">
                DEMO SIMULATION
              </span>
            </div>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Recruiters unlock all pending shortlisted candidates in a single bulk action.
              Candidate contact details remain permanently unlocked for your company across all stage transitions and future shortlists.
            </p>
          </div>

          <div className="shrink-0 flex flex-col items-start md:items-end gap-1.5">
            {pendingUnlockCount > 0 ? (
              <button
                type="button"
                onClick={handleBulkUnlock}
                disabled={unlockingAll}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 px-5 py-2.5 text-xs font-bold text-white shadow-lg hover:from-amber-600 hover:to-orange-600 transition disabled:opacity-50"
              >
                {unlockingAll ? (
                  <>
                    <Loader2 size={15} className="animate-spin" /> Unlocking Contacts...
                  </>
                ) : (
                  <>
                    <Unlock size={15} /> Unlock All Pending Contacts — ₹{totalUnlockAmount}
                  </>
                )}
              </button>
            ) : totalCount > 0 ? (
              <div className="flex items-center gap-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 px-4 py-2 text-xs font-bold text-emerald-300">
                <CheckCircle2 size={15} className="text-emerald-400" />
                All shortlisted candidate contacts are already unlocked.
              </div>
            ) : (
              <button
                type="button"
                disabled
                className="flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2 text-xs font-medium text-slate-400 cursor-not-allowed border border-slate-700"
              >
                No Candidates Shortlisted
              </button>
            )}
            {pendingUnlockCount > 0 && (
              <span className="text-[10px] text-slate-400">
                Calculation: {pendingUnlockCount} pending × ₹50 = ₹{totalUnlockAmount}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Success Notification Alert */}
      {statusMessage && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-800 shadow-sm animate-fadeIn">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Candidates Table */}
      {loading ? (
        <div className="py-20 text-center text-xs text-slate-400">
          <Loader2 className="animate-spin inline mr-2" size={16} /> Loading shortlisted candidates...
        </div>
      ) : candidates.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <Star size={40} className="mx-auto text-amber-300" />
          <h3 className="mt-3 text-sm font-bold text-slate-800">No shortlisted candidates yet</h3>
          <p className="mt-1 text-xs text-slate-400 max-w-md mx-auto">
            Screen candidates in the Candidate Matrix and select <strong>"Shortlisted"</strong> from the Pipeline dropdown.
            They will automatically appear here for centralized review and bulk contact unlocking.
          </p>
          {onNavigateToMatrix && (
            <button
              type="button"
              onClick={onNavigateToMatrix}
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 transition"
            >
              Go to Candidate Matrix <ChevronRight size={13} />
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-100 bg-slate-50/80 text-slate-500 font-semibold">
              <tr>
                <th className="py-3 px-4">Candidate</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4 text-center">Assessment</th>
                <th className="py-3 px-4 text-center">DSA</th>
                <th className="py-3 px-4 text-center">AI Interview</th>
                <th className="py-3 px-4 text-center">Overall</th>
                <th className="py-3 px-4">Opportunity</th>
                <th className="py-3 px-4 text-center">Contact Status</th>
                <th className="py-3 px-4 text-right">Profile</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {candidates.map((c, idx) => {
                const isUnlocked = Boolean(c.contactUnlocked)
                const candidateId = c.studentId || c._id

                return (
                  <tr key={c._id || idx} className="hover:bg-slate-50/70 transition">
                    {/* Candidate Name & Info */}
                    <td className="py-3.5 px-4">
                      <div
                        onClick={() => setSelectedCandidateId(candidateId)}
                        className="cursor-pointer group"
                      >
                        <p className="font-bold text-slate-900 group-hover:text-indigo-600 flex items-center gap-1.5">
                          {c.name || 'Candidate'}
                          <span className="rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-bold text-indigo-700">
                            #{idx + 1}
                          </span>
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {c.branch || c.fieldMark || 'Computer Science'} · CGPA {c.cgpa || 8.2}
                        </p>
                      </div>
                    </td>

                    {/* Email & Phone */}
                    <td className="py-3.5 px-4">
                      {isUnlocked ? (
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1 text-slate-900 font-semibold text-[11px]">
                            <Mail size={11} className="text-emerald-600" />
                            <a href={`mailto:${c.email}`} className="hover:underline hover:text-indigo-600 truncate max-w-[180px]">
                              {c.email}
                            </a>
                          </div>
                          {c.phone && (
                            <div className="flex items-center gap-1 text-slate-600 text-[11px]">
                              <Phone size={11} className="text-emerald-600" />
                              <span>{c.phone}</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1 text-slate-400 font-mono text-[11px] select-none">
                            <Lock size={10} className="text-amber-500" />
                            <span style={{ filter: 'blur(0.5px)' }}>{c.maskedEmail || c.email || '••••••••••'}</span>
                          </div>
                          <div className="flex items-center gap-1 text-slate-400 font-mono text-[10px] select-none">
                            <Lock size={9} className="text-amber-500" />
                            <span>••••••••••</span>
                          </div>
                        </div>
                      )}
                    </td>

                    {/* Assessment */}
                    <td className="py-3.5 px-4 text-center">
                      <span className="font-semibold text-slate-800">
                        {c.assessmentScore != null ? `${Math.round(c.assessmentScore)}%` : '—'}
                      </span>
                    </td>

                    {/* DSA */}
                    <td className="py-3.5 px-4 text-center">
                      <div>
                        <span className="font-bold text-teal-700">
                          {c.dsaRank ? `#${c.dsaRank}` : `${c.dsaScore || 850} pts`}
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          {c.dsaSolved != null ? `${c.dsaSolved} solved` : 'Contest Active'}
                        </span>
                      </div>
                    </td>

                    {/* AI Interview */}
                    <td className="py-3.5 px-4 text-center">
                      <span className="font-semibold text-purple-700">
                        {c.aiInterviewScore != null ? `${Math.round(c.aiInterviewScore)}%` : 'Not Assessed'}
                      </span>
                    </td>

                    {/* Overall Score */}
                    <td className="py-3.5 px-4 text-center">
                      <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 font-bold text-indigo-700">
                        {c.overallScore != null ? `${Math.round(c.overallScore)}%` : (c.overall ? `${c.overall}%` : '88%')}
                      </span>
                    </td>

                    {/* Opportunity */}
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                        <Briefcase size={10} className="text-slate-400" />
                        {c.poolName || c.opportunityTitle || 'General Pool'}
                      </span>
                    </td>

                    {/* Contact Status */}
                    <td className="py-3.5 px-4 text-center">
                      {isUnlocked ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                          <CheckCircle2 size={11} /> ✓ Contact Unlocked
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-800 border border-amber-200">
                          <Lock size={10} /> 🔒 Contact Locked — ₹50
                        </span>
                      )}
                    </td>

                    {/* Profile */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedCandidateId(candidateId)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 transition"
                      >
                        <Eye size={12} /> Profile
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
          onPipelineUpdated={loadShortlistedCandidates}
        />
      )}
    </div>
  )
}
