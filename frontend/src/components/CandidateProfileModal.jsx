import { useState, useEffect } from 'react'
import {
  X,
  User,
  GraduationCap,
  Briefcase,
  Award,
  Code2,
  Video,
  BarChart3,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  Calendar,
  FileText,
  Mail,
  Phone,
  MapPin,
  Github,
  Linkedin,
  FolderGit2,
  Lock,
  Unlock,
  ShieldCheck,
  Loader2,
} from 'lucide-react'
import { fetchCandidateProfile, updateCandidatePipelineApi, unlockCandidateContactApi } from '../services/api'

export default function CandidateProfileModal({ candidateId, candidate, onClose, onPipelineUpdated, onPipelineUpdate }) {
  const resolveId = (c) => {
    if (!c) return null
    if (typeof c === 'string') return c
    if (typeof c === 'object') {
      if (c.studentId) return typeof c.studentId === 'object' ? (c.studentId._id || String(c.studentId)) : c.studentId
      if (c.student) return typeof c.student === 'object' ? (c.student._id || String(c.student)) : c.student
      if (c._id) return typeof c._id === 'object' ? (c._id._id || String(c._id)) : c._id
    }
    return null
  }
  const effectiveId = resolveId(candidateId) || resolveId(candidate)
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(candidate && typeof candidate === 'object' && candidate.profile ? candidate : null)
  const [activeTab, setActiveTab] = useState('overview') // 'overview' | 'academics' | 'projects' | 'industryMatrix' | 'skillMatrix'
  const [pipelineStage, setPipelineStage] = useState(candidate?.pipelineStage || 'Matched')
  const [notes, setNotes] = useState(candidate?.pipelineNotes || '')
  const [savingPipeline, setSavingPipeline] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [unlocking, setUnlocking] = useState(false)

  async function handleUnlockContact() {
    if (!effectiveId) return
    setUnlocking(true)
    setStatusMessage('')
    try {
      const res = await unlockCandidateContactApi({ studentId: effectiveId })
      setStatusMessage(res?.message || 'Contact details unlocked! (Demo simulated payment: ₹50)')
      await loadProfile(effectiveId)
      if (onPipelineUpdated) onPipelineUpdated()
      if (onPipelineUpdate) onPipelineUpdate(effectiveId, pipelineStage)
      setTimeout(() => setStatusMessage(''), 4000)
    } catch (err) {
      setStatusMessage(err.message || 'Failed to unlock contact')
    } finally {
      setUnlocking(false)
    }
  }

  useEffect(() => {
    if (effectiveId) {
      loadProfile(effectiveId)
    } else if (candidate && typeof candidate === 'object') {
      setData(candidate)
      setPipelineStage(candidate.pipelineStage || 'Matched')
      setNotes(candidate.pipelineNotes || '')
      setLoading(false)
    }
  }, [effectiveId])

  async function loadProfile(idToLoad = effectiveId) {
    if (!idToLoad) return
    setLoading(true)
    try {
      const res = await fetchCandidateProfile(idToLoad)
      setData(res)
      setPipelineStage(res.pipelineStage || 'Matched')
      setNotes(res.pipelineNotes || '')
    } catch (err) {
      console.error('Failed to load candidate profile:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleUpdateStage(newStage) {
    setSavingPipeline(true)
    setStatusMessage('')
    try {
      await updateCandidatePipelineApi({
        studentId: effectiveId,
        stage: newStage,
        notes,
      })
      setPipelineStage(newStage)
      setStatusMessage(`Candidate moved to ${newStage}`)
      if (onPipelineUpdated) onPipelineUpdated(newStage)
      if (onPipelineUpdate) onPipelineUpdate(effectiveId, newStage)
      setTimeout(() => setStatusMessage(''), 3000)
    } catch (err) {
      setStatusMessage(err.message || 'Failed to update pipeline stage')
    } finally {
      setSavingPipeline(false)
    }
  }

  if (!effectiveId && !data) return null

  const student = data?.student || {}
  const profile = data?.profile || {}
  const basicInfo = profile?.basicInfo || {}
  const careerTarget = profile?.careerTarget || {}
  const education = profile?.education || []
  const skills = profile?.skills || {}
  const projects = profile?.projects || []
  const internships = profile?.internships || []
  const achievements = profile?.achievements || []
  const certifications = profile?.certifications || []
  const codingProfiles = profile?.codingProfiles || []
  const skillMatrix = data?.skillMatrix
  const industryMatrix = data?.industryMatrix
  const isContactUnlocked = Boolean(data?.contactUnlocked || student?.contactUnlocked)

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Candidate Profile"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-900 px-6 py-4 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-300 font-bold text-lg">
              {student.name ? student.name[0] : 'S'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">{student.name || 'Candidate'}</h2>
                <span className="rounded-full bg-indigo-500/20 px-2.5 py-0.5 text-[10px] font-semibold text-indigo-300">
                  {student.fieldMark || 'Engineering'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Target Role: <span className="text-slate-200">{careerTarget.targetJobRole || 'Software Engineer Intern'}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Pipeline Stage Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50 px-6 py-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
            <span>Pipeline Stage:</span>
            <span className="rounded-md bg-indigo-100 px-2 py-0.5 text-indigo-800 font-bold">
              {pipelineStage}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {['Matched', 'Shortlisted', 'Contacted', 'Interviewed', 'Selected'].map((stage) => (
              <button
                key={stage}
                type="button"
                disabled={savingPipeline || pipelineStage === stage}
                onClick={() => handleUpdateStage(stage)}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                  pipelineStage === stage
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                }`}
              >
                {stage}
              </button>
            ))}
          </div>
        </div>

        {statusMessage && (
          <div className="bg-teal-50 px-6 py-2 text-xs font-semibold text-teal-800 border-b border-teal-100 flex items-center gap-2">
            <CheckCircle2 size={14} className="text-teal-600" />
            {statusMessage}
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-white px-6">
          {[
            { id: 'overview', label: 'Overview & Profile', icon: User },
            { id: 'industryMatrix', label: 'Industry Matrix', icon: BarChart3 },
            { id: 'skillMatrix', label: 'Skill Matrix', icon: Sparkles },
            { id: 'projects', label: 'Projects & Experience', icon: FolderGit2 },
            { id: 'academics', label: 'Academics & Records', icon: GraduationCap },
          ].map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 border-b-2 py-3 px-3 text-xs font-semibold transition ${
                  isActive
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="py-20 text-center text-xs text-slate-400">Loading candidate profile...</div>
          ) : activeTab === 'overview' ? (
            <div className="space-y-6">
              {/* Verification Badges */}
              <div className="flex flex-wrap gap-2">
                <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                  <CheckCircle2 size={13} /> Profile Verified
                </span>
                <span className="flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-[11px] font-bold text-blue-700 border border-blue-200">
                  <CheckCircle2 size={13} /> Skills Assessed
                </span>
                <span className="flex items-center gap-1.5 rounded-full bg-purple-50 px-3 py-1 text-[11px] font-bold text-purple-700 border border-purple-200">
                  <CheckCircle2 size={13} /> AI Interview Completed
                </span>
                {projects.length > 0 && (
                  <span className="flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-[11px] font-bold text-amber-700 border border-amber-200">
                    <CheckCircle2 size={13} /> Verified Projects
                  </span>
                )}
              </div>

              {/* Contact Information & Privacy Unlock Card */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/90 p-4 text-xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-200/80">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                      <span>Candidate Contact Information</span>
                      {isContactUnlocked ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                          <CheckCircle2 size={11} /> Contact Unlocked ✓
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-200">
                          <Lock size={10} /> 🔒 Privacy-Protected
                        </span>
                      )}
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {isContactUnlocked
                        ? 'Contact information is fully unlocked for recruiter outreach and interview coordination.'
                        : 'Contact information is privacy-protected. Unlock candidate contacts at ₹50/candidate (Demo).'}
                    </p>
                  </div>

                  {!isContactUnlocked && (
                    <button
                      type="button"
                      onClick={handleUnlockContact}
                      disabled={unlocking}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:from-amber-600 hover:to-orange-600 transition disabled:opacity-50 shrink-0 self-start sm:self-auto"
                    >
                      {unlocking ? (
                        <>
                          <Loader2 size={12} className="animate-spin" /> Unlocking...
                        </>
                      ) : (
                        <>
                          <Unlock size={12} /> Unlock Contact — ₹50 (Demo)
                        </>
                      )}
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  <div className="flex items-center gap-2">
                    <Mail size={14} className={isContactUnlocked ? 'text-emerald-600' : 'text-slate-400'} />
                    <span className="text-slate-500">Email:</span>
                    {isContactUnlocked ? (
                      <a
                        href={`mailto:${student.email}`}
                        className="font-semibold text-slate-900 hover:text-indigo-600 underline"
                      >
                        {student.email}
                      </a>
                    ) : (
                      <span
                        className="font-mono text-slate-400 select-none bg-slate-200/70 px-2 py-0.5 rounded text-[11px] flex items-center gap-1.5"
                        style={{ filter: 'blur(0.5px)' }}
                      >
                        <Lock size={10} className="text-amber-500" />
                        {student.maskedEmail || student.email || 'r*****@gmail.com'}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Phone size={14} className={isContactUnlocked ? 'text-emerald-600' : 'text-slate-400'} />
                    <span className="text-slate-500">Phone:</span>
                    {isContactUnlocked ? (
                      <a
                        href={`tel:${student.phone || basicInfo.phone}`}
                        className="font-semibold text-slate-900 hover:text-indigo-600 underline"
                      >
                        {student.phone || basicInfo.phone}
                      </a>
                    ) : (
                      <span className="font-mono text-slate-400 select-none bg-slate-200/70 px-2 py-0.5 rounded text-[11px] flex items-center gap-1.5">
                        <Lock size={10} className="text-amber-500" />
                        ••••••••••
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-slate-400" />
                    <span className="text-slate-500">Location:</span>
                    <span className="font-semibold text-slate-900">{basicInfo.city || 'Remote Available'}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-slate-400" />
                    <span className="text-slate-500">Work Preference:</span>
                    <span className="font-semibold text-slate-900">{careerTarget.workPreference || 'Remote / Hybrid'}</span>
                  </div>
                </div>
              </div>

              {/* Social and Portfolio links */}
              <div className="flex flex-wrap gap-3">
                {basicInfo.githubUrl && (
                  <a
                    href={basicInfo.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <Github size={14} /> GitHub Profile
                  </a>
                )}
                {basicInfo.linkedinUrl && (
                  <a
                    href={basicInfo.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-slate-50"
                  >
                    <Linkedin size={14} /> LinkedIn Profile
                  </a>
                )}
                {basicInfo.portfolioUrl && (
                  <a
                    href={basicInfo.portfolioUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-slate-50"
                  >
                    <FileText size={14} /> Portfolio / Resume
                  </a>
                )}
              </div>

              {/* Skills categorization */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Technical Skills</h3>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(skills).flatMap(([cat, list]) =>
                    (Array.isArray(list) ? list : []).map((sk, idx) => (
                      <span key={`${cat}-${idx}`} className="rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700">
                        {sk}
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : activeTab === 'industryMatrix' ? (
            <div className="space-y-6">
              <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4 text-xs text-indigo-900">
                <span className="font-bold">Candidate Industry Matrix:</span> Evaluated directly via company-issued tests, DSA contests, and AI video interviews.
              </div>

              {/* Contests Performance */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">DSA Coding Contests</h3>
                {(!industryMatrix?.contestResults || industryMatrix.contestResults.length === 0) ? (
                  <p className="text-xs text-slate-400 italic">No DSA contest submissions recorded yet.</p>
                ) : (
                  <div className="space-y-2">
                    {industryMatrix.contestResults.map((c) => (
                      <div key={c._id} className="rounded-xl border border-slate-200 p-4 text-xs flex justify-between items-center">
                        <div>
                          <p className="font-bold text-slate-900">{c.contestId?.title || 'DSA Contest'}</p>
                          <p className="text-slate-500 text-[11px]">Problems Solved: {c.problemsSolved} · Score: {c.score} pts</p>
                        </div>
                        <span className="font-bold text-teal-700 rounded-full bg-teal-50 px-3 py-1">
                          {c.rank > 0 ? `Rank #${c.rank}` : 'Participated'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Assessment Attempts */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Industry Screening Assessments</h3>
                {(!industryMatrix?.assessmentAttempts || industryMatrix.assessmentAttempts.length === 0) ? (
                  <p className="text-xs text-slate-400 italic">No MCQ screening tests attempted yet.</p>
                ) : (
                  <div className="space-y-2">
                    {industryMatrix.assessmentAttempts.map((a) => (
                      <div key={a._id} className="rounded-xl border border-slate-200 p-4 text-xs flex justify-between items-center">
                        <div>
                          <p className="font-bold text-slate-900">{a.assessmentId?.title || 'Screening Assessment'}</p>
                          <p className="text-slate-500 text-[11px]">Score: {a.score} / {a.totalMarks} ({a.percentage}%)</p>
                        </div>
                        <span className={`font-bold rounded-full px-3 py-1 ${a.passed ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                          {a.passed ? 'Passed' : 'Attempted'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* AI Mock Interview */}
              <div className="rounded-xl border border-slate-200 p-4 text-xs space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-900">AI Mock Interview Benchmark:</span>
                  <span className="font-bold text-purple-700">{industryMatrix?.aiInterviewScore || 84}%</span>
                </div>
                <p className="text-slate-500 text-[11px]">Evaluated on behavioral communication, system design explanation, and technical clarity.</p>
              </div>
            </div>
          ) : activeTab === 'skillMatrix' ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-xs">
                <h3 className="font-bold text-slate-900">Academic Skill Matrix</h3>
                <p className="text-slate-500 mt-0.5">Evaluated through standard collegiate topic assessments.</p>
              </div>

              {skillMatrix?.skills && skillMatrix.skills.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {skillMatrix.skills.map((s, idx) => (
                    <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-slate-800">{s.topic}</span>
                        <span className="ml-2 text-[10px] text-slate-400">({s.category})</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-indigo-600">{s.percentage}%</span>
                        <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                          {s.level}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic py-6 text-center">No skill matrix assessments taken yet.</p>
              )}
            </div>
          ) : activeTab === 'projects' ? (
            <div className="space-y-6">
              {/* Projects */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Technical Projects</h3>
                {projects.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No projects listed.</p>
                ) : (
                  projects.map((p, i) => (
                    <div key={i} className="rounded-xl border border-slate-200 p-4 space-y-2 text-xs">
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-slate-900">{p.name}</h4>
                        {p.githubUrl && (
                          <a href={p.githubUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline flex items-center gap-0.5">
                            Code <ExternalLink size={10} />
                          </a>
                        )}
                      </div>
                      <p className="text-slate-600">{p.description}</p>
                      {p.technologiesUsed && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {p.technologiesUsed.map((t, idx) => (
                            <span key={idx} className="rounded bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600 font-medium">
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Internships */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Work Experience & Internships</h3>
                {internships.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No previous internships listed.</p>
                ) : (
                  internships.map((int, i) => (
                    <div key={i} className="rounded-xl border border-slate-200 p-4 space-y-1 text-xs">
                      <div className="flex justify-between items-center">
                        <h4 className="font-bold text-slate-900">{int.role}</h4>
                        <span className="text-slate-400 text-[11px]">{int.companyName}</span>
                      </div>
                      <p className="text-slate-600">{int.responsibilities || int.achievements}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Education Details</h3>
              {education.map((edu, i) => (
                <div key={i} className="rounded-xl border border-slate-200 p-4 text-xs space-y-1">
                  <h4 className="font-bold text-slate-900">{edu.degree} · {edu.branch}</h4>
                  <p className="text-slate-600">{edu.college}</p>
                  <p className="text-indigo-600 font-semibold">CGPA: {edu.cgpa} · Class of {edu.graduationYear}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
