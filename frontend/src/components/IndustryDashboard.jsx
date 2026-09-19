import { useState, useEffect } from 'react'
import {
  Building2,
  Briefcase,
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  MapPin,
  IndianRupee,
  X,
  ExternalLink,
  Link2,
  Calendar,
  AlertCircle,
  Code2,
  ClipboardCheck,
  Users,
  Trophy,
  BarChart3,
  Eye,
  FileCheck,
  Loader2,
  ChevronDown,
  Star,
  ShieldCheck,
  CreditCard,
} from 'lucide-react'
import {
  fetchInternships,
  createInternshipApi,
  updateInternshipApi,
  deleteInternshipApi,
  fetchJobLinks,
  createJobLinkApi,
  updateJobLinkApi,
  deleteJobLinkApi,
  fetchIndustryContests,
  createContestApi,
  deleteContestApi,
  publishContestApi,
  fetchContestStandings,
  fetchIndustryAssessments,
  createIndustryAssessmentApi,
  deleteIndustryAssessmentApi,
  fetchAssessmentResultsApi,
  fetchCandidateMatrix,
  fetchCandidateProfile,
  updateCandidatePipelineApi,
  fetchInternshipApplications,
  fetchProblems,
  getPaymentConfigApi,
  createPostingOrderApi,
  verifyAndPublishPostingApi,
} from '../services/api'
import { useAuth } from '../context/AuthContext'
import CandidateProfileModal from './CandidateProfileModal'
import CandidateMatrixTab from './industry/CandidateMatrixTab'
import ShortlistedCandidatesTab from './industry/ShortlistedCandidatesTab'

function isValidUrl(url) {
  if (!url || typeof url !== 'string') return false
  const trimmed = url.trim()
  if (!/^https?:\/\//i.test(trimmed)) return false
  try {
    const parsed = new URL(trimmed)
    return (parsed.protocol === 'http:' || parsed.protocol === 'https:') && Boolean(parsed.hostname)
  } catch {
    return false
  }
}

const PIPELINE_STAGES = ['Matched', 'Shortlisted', 'Contacted', 'Interviewed', 'Selected']

export default function IndustryDashboard() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('internships')
  const [internships, setInternships] = useState([])
  const [jobLinks, setJobLinks] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [urlError, setUrlError] = useState('')

  // Modal State
  const [showModal, setShowModal] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Industry Contests state
  const [contests, setContests] = useState([])
  const [contestsLoading, setContestsLoading] = useState(false)
  const [showContestModal, setShowContestModal] = useState(false)
  const [contestForm, setContestForm] = useState({ title: '', description: '', role: '', durationMinutes: 120, startDate: '', endDate: '', allowedLanguages: 'C++,Java,Python,JavaScript', maxParticipants: 200 })
  const [contestSubmitting, setContestSubmitting] = useState(false)
  const [contestError, setContestError] = useState('')
  const [viewStandings, setViewStandings] = useState(null)
  const [standings, setStandings] = useState([])
  const [availableProblems, setAvailableProblems] = useState([])
  const [selectedProblems, setSelectedProblems] = useState([])

  // Industry Assessments state
  const [assessments, setAssessments] = useState([])
  const [assessmentsLoading, setAssessmentsLoading] = useState(false)
  const [showAssessmentModal, setShowAssessmentModal] = useState(false)
  const [assessmentForm, setAssessmentForm] = useState({ title: '', description: '', role: '', durationMinutes: 60, startDate: '', endDate: '', maxAttempts: 1, passingScore: 60 })
  const [assessmentQuestions, setAssessmentQuestions] = useState([])
  const [assessmentSubmitting, setAssessmentSubmitting] = useState(false)
  const [assessmentError, setAssessmentError] = useState('')
  const [viewingResults, setViewingResults] = useState(null)
  const [assessmentResults, setAssessmentResults] = useState([])

  // Candidate Matrix state
  const [candidates, setCandidates] = useState([])
  const [candidatesLoading, setCandidatesLoading] = useState(false)
  const [selectedCandidate, setSelectedCandidate] = useState(null)
  const [candidateProfile, setCandidateProfile] = useState(null)
  const [candidateSortBy, setCandidateSortBy] = useState('overall')

  // Applications state
  const [applications, setApplications] = useState([])
  const [applicationsLoading, setApplicationsLoading] = useState(false)

  // Payment Gate state
  const [paymentConfig, setPaymentConfig] = useState({
    isConfigured: false,
    keyId: null,
    gateway: 'none',
  })
  const [modalStep, setModalStep] = useState('form') // 'form' | 'review'
  const [isPaying, setIsPaying] = useState(false)
  const [paymentError, setPaymentError] = useState('')

  // Internship form state
  const [internshipForm, setInternshipForm] = useState({
    title: '',
    company: user?.name || '',
    location: 'Remote',
    type: 'Remote',
    stipend: '₹25,000 / month',
    monthlyStipend: 25000,
    candidatesRequired: 4,
    duration: '3 Months',
    skills: '',
    description: '',
    applicationUrl: '',
  })

  // Job Link form state
  const [jobLinkForm, setJobLinkForm] = useState({
    title: '',
    company: user?.name || '',
    location: 'Remote',
    workMode: 'Remote',
    jobType: 'Full-time',
    skills: '',
    description: '',
    jobUrl: '',
    companyWebsite: '',
    deadline: '',
    monthlySalary: 30000,
    candidatesRequired: 1,
  })

  // Platform Fee calculation helper: 1% × Monthly Stipend × Candidates Required
  function computeFee(stipendVal, candidatesVal) {
    let stipend = 0
    if (typeof stipendVal === 'number') {
      stipend = Math.max(0, stipendVal)
    } else if (stipendVal) {
      const num = String(stipendVal).replace(/[^0-9]/g, '')
      stipend = num ? parseInt(num, 10) : 0
    }

    const candidates = Math.max(1, parseInt(candidatesVal, 10) || 1)
    const fee = Math.round(stipend * candidates * 0.01)

    return {
      monthlyStipend: stipend,
      candidatesRequired: candidates,
      platformFee: fee,
      formula: `1% × ₹${stipend.toLocaleString('en-IN')} × ${candidates}`,
    }
  }

  function loadRazorpayScript() {
    return new Promise((resolve) => {
      if (typeof window !== 'undefined' && window.Razorpay) {
        resolve(true)
        return
      }
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.async = true
      script.onload = () => resolve(true)
      script.onerror = () => resolve(false)
      document.body.appendChild(script)
    })
  }

  useEffect(() => {
    loadData()
    loadPaymentConfig()
  }, [])

  async function loadPaymentConfig() {
    try {
      const cfg = await getPaymentConfigApi()
      if (cfg) setPaymentConfig(cfg)
    } catch (e) {
      console.warn('[dashboard] payment config check:', e.message)
    }
  }

  useEffect(() => {
    if (activeTab === 'contests') loadContests()
    else if (activeTab === 'assessments') loadAssessments()
    else if (activeTab === 'candidates') loadCandidates()
    else if (activeTab === 'applications') loadApplications()
  }, [activeTab])

  async function loadData() {
    setLoading(true)
    const [internshipRes, jobLinkRes] = await Promise.all([
      fetchInternships({ industryId: user?._id }),
      fetchJobLinks({ industryId: user?._id }),
    ])
    setInternships(internshipRes?.internships || [])
    setJobLinks(jobLinkRes?.jobLinks || [])
    setLoading(false)
  }

  async function loadContests() {
    setContestsLoading(true)
    try {
      const res = await fetchIndustryContests()
      setContests((res?.contests || []).filter(c => String(c.industryId) === String(user?._id) || !c.industryId))
    } catch (e) { console.warn(e) }
    setContestsLoading(false)
  }

  async function loadAssessments() {
    setAssessmentsLoading(true)
    try {
      const res = await fetchIndustryAssessments()
      setAssessments(res?.assessments || [])
    } catch (e) { console.warn(e) }
    setAssessmentsLoading(false)
  }

  async function loadCandidates() {
    setCandidatesLoading(true)
    try {
      const res = await fetchCandidateMatrix({ sort: candidateSortBy })
      setCandidates(res?.candidates || [])
    } catch (e) { console.warn(e) }
    setCandidatesLoading(false)
  }

  async function loadApplications() {
    setApplicationsLoading(true)
    try {
      // Aggregate applications across all industry internships
      const internRes = await fetchInternships({ industryId: user?._id })
      const internList = internRes?.internships || []
      const appArrays = await Promise.all(internList.map(i => fetchInternshipApplications(i._id).catch(() => ({ applications: [] }))))
      const flat = appArrays.flatMap((r, idx) => (r?.applications || []).map(a => ({ ...a, internshipTitle: internList[idx]?.title || '' })))
      setApplications(flat)
    } catch (e) { console.warn(e) }
    setApplicationsLoading(false)
  }

  async function handleOpenContestModal() {
    setContestError('')
    setContestForm({ title: '', description: '', role: '', durationMinutes: 120, startDate: '', endDate: '', allowedLanguages: 'C++,Java,Python,JavaScript', maxParticipants: 200 })
    setSelectedProblems([])
    const res = await fetchProblems({ status: 'active' }).catch(() => ({ problems: [] }))
    setAvailableProblems(res?.problems || [])
    setShowContestModal(true)
  }

  async function handleCreateContest(e) {
    e.preventDefault()
    if (!contestForm.title.trim()) { setContestError('Title is required'); return }
    setContestSubmitting(true)
    try {
      await createContestApi({
        ...contestForm,
        problems: selectedProblems,
        allowedLanguages: contestForm.allowedLanguages.split(',').map(s => s.trim()).filter(Boolean),
        company: user?.name || '',
      })
      setShowContestModal(false)
      setMessage('Contest created successfully!')
      setTimeout(() => setMessage(''), 3500)
      loadContests()
    } catch (err) { setContestError(err.message || 'Failed to create contest') }
    setContestSubmitting(false)
  }

  async function handlePublishContest(id) {
    try {
      await publishContestApi(id)
      setMessage('Contest published!')
      setTimeout(() => setMessage(''), 3000)
      loadContests()
    } catch (err) { alert(err.message || 'Publish failed') }
  }

  async function handleDeleteContest(id) {
    if (!window.confirm('Delete this contest?')) return
    try {
      await deleteContestApi(id)
      loadContests()
    } catch (err) { alert(err.message || 'Delete failed') }
  }

  async function handleViewStandings(contest) {
    setViewStandings(contest)
    const res = await fetchContestStandings(contest._id).catch(() => ({ standings: [] }))
    setStandings(res?.standings || [])
  }

  async function handleOpenAssessmentModal() {
    setAssessmentError('')
    setAssessmentForm({ title: '', description: '', role: '', durationMinutes: 60, startDate: '', endDate: '', maxAttempts: 1, passingScore: 60 })
    setAssessmentQuestions([{ question: '', options: ['', '', '', ''], correctAnswer: 0, marks: 2, negativeMarks: 0, topic: '', difficulty: 'Medium', explanation: '' }])
    setShowAssessmentModal(true)
  }

  async function handleCreateAssessment(e) {
    e.preventDefault()
    if (!assessmentForm.title.trim()) { setAssessmentError('Title is required'); return }
    if (assessmentQuestions.length === 0) { setAssessmentError('Add at least one question'); return }
    setAssessmentSubmitting(true)
    try {
      await createIndustryAssessmentApi({ ...assessmentForm, questions: assessmentQuestions, company: user?.name || '' })
      setShowAssessmentModal(false)
      setMessage('Assessment created and published!')
      setTimeout(() => setMessage(''), 3500)
      loadAssessments()
    } catch (err) { setAssessmentError(err.message || 'Failed to create assessment') }
    setAssessmentSubmitting(false)
  }

  async function handleViewAssessmentResults(assessment) {
    setViewingResults(assessment)
    const res = await fetchAssessmentResultsApi(assessment._id).catch(() => ({ attempts: [] }))
    setAssessmentResults(res?.attempts || [])
  }

  async function handleDeleteAssessment(id) {
    if (!window.confirm('Delete this assessment?')) return
    try {
      await deleteIndustryAssessmentApi(id)
      loadAssessments()
    } catch (err) { alert(err.message || 'Delete failed') }
  }

  async function handleViewCandidate(studentOrId) {
    const studentId = typeof studentOrId === 'object' && studentOrId !== null
      ? (studentOrId._id || studentOrId.studentId?._id || studentOrId.studentId)
      : studentOrId
    try {
      const res = await fetchCandidateProfile(studentId)
      setCandidateProfile(res?.candidate || null)
      setSelectedCandidate(studentId)
    } catch (err) { alert('Could not load candidate profile: ' + err.message) }
  }

  async function handlePipelineUpdate(studentOrId, stage) {
    const studentId = typeof studentOrId === 'object' && studentOrId !== null
      ? (studentOrId._id || studentOrId.studentId?._id || studentOrId.studentId)
      : studentOrId
    try {
      await updateCandidatePipelineApi({ studentId, stage, poolName: 'Default Pool' })
      setMessage(`Candidate moved to ${stage}`)
      setTimeout(() => setMessage(''), 3000)
      loadCandidates()
    } catch (err) { alert(err.message || 'Pipeline update failed') }
  }

  function addQuestion() {
    setAssessmentQuestions(prev => [...prev, { question: '', options: ['', '', '', ''], correctAnswer: 0, marks: 2, negativeMarks: 0, topic: '', difficulty: 'Medium', explanation: '' }])
  }

  function removeQuestion(idx) {
    setAssessmentQuestions(prev => prev.filter((_, i) => i !== idx))
  }

  function updateQuestion(idx, field, value) {
    setAssessmentQuestions(prev => prev.map((q, i) => i === idx ? { ...q, [field]: value } : q))
  }

  function updateOption(qIdx, oIdx, value) {
    setAssessmentQuestions(prev => prev.map((q, i) => {
      if (i !== qIdx) return q
      const opts = [...q.options]
      opts[oIdx] = value
      return { ...q, options: opts }
    }))
  }

  function openCreateModal() {
    setIsEditing(false)
    setEditingId(null)
    setUrlError('')
    setModalStep('form')
    setPaymentError('')
    setIsPaying(false)

    if (activeTab === 'internships') {
      setInternshipForm({
        title: '',
        company: user?.name || '',
        location: 'Remote',
        type: 'Remote',
        stipend: '₹25,000 / month',
        monthlyStipend: 25000,
        candidatesRequired: 4,
        duration: '3 Months',
        skills: '',
        description: '',
        applicationUrl: '',
      })
    } else {
      setJobLinkForm({
        title: '',
        company: user?.name || '',
        location: 'Remote',
        workMode: 'Remote',
        jobType: 'Full-time',
        skills: '',
        description: '',
        jobUrl: '',
        companyWebsite: '',
        deadline: '',
        monthlySalary: 30000,
        candidatesRequired: 1,
      })
    }
    setShowModal(true)
  }

  function openEditModal(item) {
    setIsEditing(true)
    setEditingId(item._id)
    setUrlError('')
    setModalStep('form')
    setPaymentError('')
    setIsPaying(false)

    if (activeTab === 'internships') {
      const stipendNum = item.monthlyStipend || (item.stipend ? computeFee(item.stipend, 1).monthlyStipend : 25000)
      setInternshipForm({
        title: item.title || '',
        company: item.company || '',
        location: item.location || 'Remote',
        type: item.type || 'Remote',
        stipend: item.stipend || `₹${stipendNum.toLocaleString('en-IN')} / month`,
        monthlyStipend: stipendNum,
        candidatesRequired: item.candidatesRequired || item.openings || 1,
        duration: item.duration || '3 Months',
        skills: Array.isArray(item.skills) ? item.skills.join(', ') : item.skills || '',
        description: item.description || '',
        applicationUrl: item.applicationUrl || '',
      })
    } else {
      setJobLinkForm({
        title: item.title || '',
        company: item.company || '',
        location: item.location || 'Remote',
        workMode: item.workMode || 'Remote',
        jobType: item.jobType || item.type || 'Full-time',
        skills: Array.isArray(item.skills) ? item.skills.join(', ') : item.skills || '',
        description: item.description || '',
        jobUrl: item.jobUrl || '',
        companyWebsite: item.companyWebsite || '',
        deadline: item.deadline ? new Date(item.deadline).toISOString().split('T')[0] : '',
        monthlySalary: item.monthlySalary || 30000,
        candidatesRequired: item.candidatesRequired || 1,
      })
    }
    setShowModal(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setUrlError('')
    setPaymentError('')

    if (activeTab === 'internships') {
      if (!internshipForm.title.trim() || !internshipForm.description.trim() || !internshipForm.location.trim()) {
        setUrlError('Please fill in all required fields.')
        return
      }
      if (!internshipForm.applicationUrl.trim()) {
        setUrlError('Application URL * is required.')
        return
      }
      if (!isValidUrl(internshipForm.applicationUrl)) {
        setUrlError('Please enter a valid Application URL (e.g. https://company.com/careers/intern).')
        return
      }

      const stipendVal = Number(internshipForm.monthlyStipend)
      if (isNaN(stipendVal) || stipendVal <= 0) {
        setUrlError('Monthly stipend must be greater than ₹0.')
        return
      }

      const candVal = Number(internshipForm.candidatesRequired)
      if (isNaN(candVal) || candVal < 1 || !Number.isInteger(candVal)) {
        setUrlError('Number of Candidates Required must be an integer of at least 1.')
        return
      }

      if (isEditing) {
        // Direct update for existing posting (preserves edit without re-payment)
        setIsSubmitting(true)
        try {
          const payload = {
            title: internshipForm.title.trim(),
            company: (internshipForm.company || user?.name || 'Company').trim(),
            location: internshipForm.location.trim(),
            type: internshipForm.type,
            stipend: internshipForm.stipend ? internshipForm.stipend.trim() : `₹${stipendVal.toLocaleString('en-IN')} / month`,
            monthlyStipend: stipendVal,
            openings: candVal,
            candidatesRequired: candVal,
            duration: internshipForm.duration.trim(),
            skills: internshipForm.skills.split(',').map((s) => s.trim()).filter(Boolean),
            description: internshipForm.description.trim(),
            applicationUrl: internshipForm.applicationUrl.trim(),
          }
          await updateInternshipApi(editingId, payload)
          setMessage('Internship updated successfully!')
          setShowModal(false)
          loadData()
          setTimeout(() => setMessage(''), 3500)
        } catch (err) {
          setUrlError(err.message || 'Failed to update internship')
        } finally {
          setIsSubmitting(false)
        }
      } else {
        // Advance to Review & Payment Step
        setModalStep('review')
      }
    } else {
      // Job Link
      if (!jobLinkForm.title.trim() || !jobLinkForm.company.trim()) {
        setUrlError('Job Title * and Company Name * are required.')
        return
      }
      if (!jobLinkForm.jobUrl.trim()) {
        setUrlError('Job URL * is required.')
        return
      }
      if (!isValidUrl(jobLinkForm.jobUrl)) {
        setUrlError('Please enter a valid Job URL (e.g. https://company.com/careers/software-engineer).')
        return
      }
      if (jobLinkForm.companyWebsite.trim() && !isValidUrl(jobLinkForm.companyWebsite)) {
        setUrlError('Please enter a valid Company Website URL starting with http:// or https://')
        return
      }

      const salaryVal = Number(jobLinkForm.monthlySalary)
      if (isNaN(salaryVal) || salaryVal <= 0) {
        setUrlError('Monthly salary must be greater than ₹0.')
        return
      }

      const candVal = Number(jobLinkForm.candidatesRequired)
      if (isNaN(candVal) || candVal < 1 || !Number.isInteger(candVal)) {
        setUrlError('Number of Candidates Required must be an integer of at least 1.')
        return
      }

      if (isEditing) {
        setIsSubmitting(true)
        try {
          const payload = {
            title: jobLinkForm.title.trim(),
            company: jobLinkForm.company.trim(),
            location: (jobLinkForm.location || 'Remote').trim(),
            workMode: jobLinkForm.workMode,
            jobType: jobLinkForm.jobType,
            monthlySalary: salaryVal,
            candidatesRequired: candVal,
            skills: jobLinkForm.skills.split(',').map((s) => s.trim()).filter(Boolean),
            description: jobLinkForm.description.trim(),
            jobUrl: jobLinkForm.jobUrl.trim(),
            companyWebsite: jobLinkForm.companyWebsite.trim(),
            deadline: jobLinkForm.deadline || undefined,
          }
          await updateJobLinkApi(editingId, payload)
          setMessage('Job link updated successfully!')
          setShowModal(false)
          loadData()
          setTimeout(() => setMessage(''), 3500)
        } catch (err) {
          setUrlError(err.message || 'Failed to update job link')
        } finally {
          setIsSubmitting(false)
        }
      } else {
        // Advance to Review & Payment Step
        setModalStep('review')
      }
    }
  }

  async function handleExecutePayment() {
    setPaymentError('')
    setIsPaying(true)

    try {
      const isInternship = activeTab === 'internships'
      const monthlyCompensation = isInternship
        ? Number(internshipForm.monthlyStipend)
        : Number(jobLinkForm.monthlySalary)
      const candidatesCount = isInternship
        ? Number(internshipForm.candidatesRequired)
        : Number(jobLinkForm.candidatesRequired)
      const title = isInternship ? internshipForm.title : jobLinkForm.title

      // 1. Create order on backend (strictly calculates 1% platform fee)
      const orderRes = await createPostingOrderApi({
        postingType: isInternship ? 'internship' : 'job',
        postingTitle: title,
        monthlyStipend: monthlyCompensation,
        candidatesRequired: candidatesCount,
      })

      if (!orderRes?.order?.orderId) {
        throw new Error(orderRes?.error || 'Failed to create payment order. Please try again.')
      }

      const { orderId, amount, currency, keyId } = orderRes.order

      // Check Razorpay script
      const scriptLoaded = await loadRazorpayScript()
      if (!scriptLoaded || !window.Razorpay) {
        throw new Error('Razorpay Checkout failed to load. Please check your internet connection and try again.')
      }

      // 2. Prepare posting payload for verification
      const postingData = isInternship
        ? {
            title: internshipForm.title.trim(),
            company: (internshipForm.company || user?.name || 'Company').trim(),
            location: internshipForm.location.trim(),
            type: internshipForm.type,
            workMode: internshipForm.type,
            stipend: internshipForm.stipend ? internshipForm.stipend.trim() : `₹${monthlyCompensation.toLocaleString('en-IN')} / month`,
            monthlyStipend: monthlyCompensation,
            candidatesRequired: candidatesCount,
            duration: internshipForm.duration.trim(),
            skills: internshipForm.skills.split(',').map((s) => s.trim()).filter(Boolean),
            description: internshipForm.description.trim(),
            applicationUrl: internshipForm.applicationUrl.trim(),
          }
        : {
            title: jobLinkForm.title.trim(),
            company: jobLinkForm.company.trim(),
            location: (jobLinkForm.location || 'Remote').trim(),
            workMode: jobLinkForm.workMode,
            jobType: jobLinkForm.jobType,
            monthlySalary: monthlyCompensation,
            candidatesRequired: candidatesCount,
            skills: jobLinkForm.skills.split(',').map((s) => s.trim()).filter(Boolean),
            description: jobLinkForm.description.trim(),
            jobUrl: jobLinkForm.jobUrl.trim(),
            companyWebsite: jobLinkForm.companyWebsite.trim(),
            deadline: jobLinkForm.deadline || undefined,
          }

      // 3. Open Razorpay Checkout
      const rzp = new window.Razorpay({
        key: keyId,
        amount: amount * 100, // paise
        currency: currency || 'INR',
        name: 'InternSetu',
        description: `Platform Fee (1% × ₹${monthlyCompensation.toLocaleString('en-IN')} × ${candidatesCount})`,
        order_id: orderId,
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
        },
        theme: {
          color: '#4f46e5',
        },
        handler: async function (response) {
          try {
            // 4. Verification on backend (strictly verifies HMAC-SHA256 signature and fee integrity)
            const verifyRes = await verifyAndPublishPostingApi({
              orderId: response.razorpay_order_id || orderId,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
              postingType: isInternship ? 'internship' : 'job',
              postingData,
            })

            if (verifyRes?.success) {
              setMessage(isInternship ? 'Payment verified and internship published!' : 'Payment verified and job link published!')
              setShowModal(false)
              setModalStep('form')
              loadData()
              setTimeout(() => setMessage(''), 4000)
            } else {
              throw new Error(verifyRes?.error || 'Payment verification failed on server.')
            }
          } catch (verifyErr) {
            setPaymentError(verifyErr.message || 'Payment verification failed. Posting was not published.')
          } finally {
            setIsPaying(false)
          }
        },
        modal: {
          ondismiss: function () {
            setIsPaying(false)
            setPaymentError('Payment was cancelled. No posting was created. Your form data is saved.')
          },
        },
      })

      rzp.on('payment.failed', function (resp) {
        setIsPaying(false)
        setPaymentError(resp.error?.description || 'Payment failed. No posting was created. Please try again.')
      })

      rzp.open()
    } catch (err) {
      setPaymentError(err.message || 'Payment initiation failed. Please try again.')
      setIsPaying(false)
    }
  }

  async function handleDeleteInternship(id) {
    if (!window.confirm('Delete this internship posting?')) return
    try {
      await deleteInternshipApi(id)
      setInternships((prev) => prev.filter((i) => i._id !== id))
      setMessage('Internship posting removed.')
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      alert(err.message || 'Delete failed')
    }
  }

  async function handleDeleteJobLink(id) {
    if (!window.confirm('Delete this job opportunity link?')) return
    try {
      await deleteJobLinkApi(id)
      setJobLinks((prev) => prev.filter((j) => j._id !== id))
      setMessage('Job opportunity link removed.')
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      alert(err.message || 'Delete failed')
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-12">
      {/* Top Header Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-indigo-600">
              <Building2 size={20} />
              <span className="text-xs font-bold uppercase tracking-wider">Recruiter Workspace</span>
            </div>
            <h1 className="mt-1 text-2xl font-extrabold text-slate-900">
              Industry Talent Management
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              Post verified internship openings and share external job opportunity links for student talent.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow hover:bg-indigo-500"
          >
            <Plus size={16} />
            {activeTab === 'internships' ? 'Post Internship' : 'Add Job Link'}
          </button>
        </div>

        {/* Quick Stats */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <span className="text-xs text-slate-500">My Internship Postings</span>
            <p className="mt-1 text-2xl font-bold text-slate-900">{internships.length}</p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <span className="text-xs text-slate-500">My Job Opportunity Links</span>
            <p className="mt-1 text-2xl font-bold text-slate-900">{jobLinks.length}</p>
          </div>
        </div>
      </div>

      {message && (
        <div className="flex items-center gap-2 rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm font-medium text-teal-800 shadow-sm">
          <CheckCircle2 size={18} className="text-teal-600" />
          {message}
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1">
        {[
          { id: 'internships', label: `Internships (${internships.length})`, Icon: Briefcase },
          { id: 'job_links', label: `Job Opportunities (${jobLinks.length})`, Icon: Link2 },
          { id: 'contests', label: 'DSA Contests', Icon: Code2 },
          { id: 'assessments', label: 'MCQ Assessments', Icon: ClipboardCheck },
          { id: 'candidates', label: 'Candidate Matrix', Icon: Users },
          { id: 'applications', label: 'Applications', Icon: FileCheck },
          { id: 'shortlisted', label: 'Shortlisted Candidates', Icon: Star },
        ].map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
              activeTab === id
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Icon size={13} />
            {label}
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        {/* ── DSA Contests Tab ── */}
        {activeTab === 'contests' && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-bold text-slate-900">DSA Contests</h2>
                <p className="text-xs text-slate-500 mt-0.5">Create coding contests with problems from the Problem Library</p>
              </div>
              <button type="button" onClick={handleOpenContestModal} className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500">
                <Plus size={14} /> Create Contest
              </button>
            </div>
            {contestsLoading ? (
              <div className="py-10 text-center text-xs text-slate-400"><Loader2 className="animate-spin inline mr-2" size={14} />Loading contests…</div>
            ) : contests.length === 0 ? (
              <div className="py-12 text-center">
                <Code2 size={36} className="mx-auto text-slate-300" />
                <p className="mt-2 text-sm font-semibold text-slate-700">No contests yet</p>
                <p className="text-xs text-slate-400">Create a DSA contest and select problems from the Problem Library.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {contests.map(c => (
                  <div key={c._id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                          c.status === 'Live' ? 'bg-green-50 text-green-700' :
                          c.status === 'Ended' ? 'bg-slate-100 text-slate-500' :
                          c.status === 'Scheduled' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'
                        }`}>{c.status || 'Draft'}</span>
                        <span className="text-[11px] text-slate-400">{c.problems?.length || 0} problems</span>
                        {c.role && <span className="text-[11px] text-indigo-600 font-medium">{c.role}</span>}
                      </div>
                      <h3 className="text-sm font-bold text-slate-900">{c.title}</h3>
                      <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{c.description}</p>
                      {c.startDate && (
                        <p className="text-[11px] text-slate-400 mt-0.5">{new Date(c.startDate).toLocaleDateString()} — {c.endDate ? new Date(c.endDate).toLocaleDateString() : '—'} · {c.durationMinutes}min</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button type="button" onClick={() => handleViewStandings(c)} className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
                        <Trophy size={12} /> Standings
                      </button>
                      {(c.status === 'Draft' || c.status === 'Scheduled') && (
                        <button type="button" onClick={() => handlePublishContest(c._id)} className="flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-500">
                          <Star size={12} /> Publish
                        </button>
                      )}
                      <button type="button" onClick={() => handleDeleteContest(c._id)} className="flex items-center gap-1 rounded-lg border border-red-100 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── MCQ Assessments Tab ── */}
        {activeTab === 'assessments' && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-bold text-slate-900">MCQ / Aptitude Assessments</h2>
                <p className="text-xs text-slate-500 mt-0.5">Create screening assessments with MCQ questions and instant scoring</p>
              </div>
              <button type="button" onClick={handleOpenAssessmentModal} className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500">
                <Plus size={14} /> Create Assessment
              </button>
            </div>
            {assessmentsLoading ? (
              <div className="py-10 text-center text-xs text-slate-400"><Loader2 className="animate-spin inline mr-2" size={14} />Loading…</div>
            ) : assessments.length === 0 ? (
              <div className="py-12 text-center">
                <ClipboardCheck size={36} className="mx-auto text-slate-300" />
                <p className="mt-2 text-sm font-semibold text-slate-700">No assessments yet</p>
                <p className="text-xs text-slate-400">Create an MCQ assessment to screen candidates.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {assessments.map(a => (
                  <div key={a._id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                          a.status === 'Published' ? 'bg-green-50 text-green-700' :
                          a.status === 'Paused' ? 'bg-amber-50 text-amber-700' :
                          a.status === 'Ended' ? 'bg-slate-100 text-slate-500' : 'bg-blue-50 text-blue-700'
                        }`}>{a.status || 'Draft'}</span>
                        <span className="text-[11px] text-slate-400">{a.questions?.length || 0} questions · {a.durationMinutes}min</span>
                        {a.role && <span className="text-[11px] text-indigo-600 font-medium">{a.role}</span>}
                      </div>
                      <h3 className="text-sm font-bold text-slate-900">{a.title}</h3>
                      <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{a.description}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Passing: {a.passingScore}% · Max Attempts: {a.maxAttempts}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button type="button" onClick={() => handleViewAssessmentResults(a)} className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
                        <BarChart3 size={12} /> Results
                      </button>
                      <button type="button" onClick={() => handleDeleteAssessment(a._id)} className="flex items-center gap-1 rounded-lg border border-red-100 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Candidate Matrix Tab ── */}
        {activeTab === 'candidates' && (
          <CandidateMatrixTab />
        )}

        {/* ── Applications Tab ── */}
        {activeTab === 'applications' && (
          <div>
            <div className="mb-5">
              <h2 className="text-base font-bold text-slate-900">InternSetu Applications</h2>
              <p className="text-xs text-slate-500 mt-0.5">Applications submitted via InternSetu across all your internship postings</p>
            </div>
            {applicationsLoading ? (
              <div className="py-10 text-center text-xs text-slate-400"><Loader2 className="animate-spin inline mr-2" size={14} />Loading applications…</div>
            ) : applications.length === 0 ? (
              <div className="py-12 text-center">
                <FileCheck size={36} className="mx-auto text-slate-300" />
                <p className="mt-2 text-sm font-semibold text-slate-700">No applications yet</p>
                <p className="text-xs text-slate-400">Applications from students will appear here once they apply through InternSetu.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {applications.map((app, idx) => (
                  <div key={app._id || idx} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                          app.status === 'APPLIED_INTERNSETU' ? 'bg-blue-50 text-blue-700' :
                          app.status === 'VISITED_COMPANY_APPLICATION' ? 'bg-amber-50 text-amber-700' :
                          app.status === 'COMPANY_APPLICATION_CONFIRMED' ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'
                        }`}>{(app.status || '').replace(/_/g, ' ')}</span>
                        {app.internshipTitle && <span className="text-[11px] text-slate-400">{app.internshipTitle}</span>}
                      </div>
                      <h3 className="text-sm font-bold text-slate-900">{app.studentSnapshot?.name || 'Student'}</h3>
                      <p className="text-xs text-slate-500">{app.studentSnapshot?.email || ''} · {app.studentSnapshot?.branch || ''}</p>
                      {app.coverNote && <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">Note: {app.coverNote}</p>}
                      <p className="text-[11px] text-slate-400 mt-0.5">{app.createdAt ? new Date(app.createdAt).toLocaleDateString() : ''}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {app.resumeUrl && (
                        <a href={app.resumeUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50">
                          <ExternalLink size={12} /> Resume
                        </a>
                      )}
                      <button type="button" onClick={() => handleViewCandidate(app.studentId)} className="flex items-center gap-1 rounded-lg border border-indigo-200 px-3 py-1.5 text-xs text-indigo-700 hover:bg-indigo-50">
                        <Eye size={12} /> Profile
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Shortlisted Candidates Tab (Immediately right of Applications) ── */}
        {activeTab === 'shortlisted' && (
          <ShortlistedCandidatesTab onNavigateToMatrix={() => setActiveTab('candidates')} />
        )}

        {loading && (activeTab === 'internships' || activeTab === 'job_links') ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading postings…</div>
        ) : activeTab === 'internships' ? (
          internships.length === 0 ? (
            <div className="py-12 text-center">
              <Briefcase size={36} className="mx-auto text-slate-300" />
              <p className="mt-2 text-sm font-semibold text-slate-700">No internship postings yet</p>
              <p className="text-xs text-slate-400">Click "Post Internship" to recruit student interns.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {internships.map((item) => (
                <div key={item._id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                        {item.type}
                      </span>
                      <span className="text-[11px] text-slate-400">{item.location}</span>
                      <span className="text-[11px] font-semibold text-teal-700">• {item.stipend}</span>
                      <span className="text-[11px] font-medium text-slate-600">
                        • {item.candidatesRequired || item.openings || 1} {Number(item.candidatesRequired || item.openings || 1) === 1 ? 'candidate' : 'candidates'} required
                      </span>
                      {item.platformFeeAmount ? (
                        <div className="flex items-center gap-1 text-[11px] text-slate-600">
                          <span>• Platform Fee: <strong className="text-slate-800">₹{item.platformFeeAmount.toLocaleString('en-IN')}</strong></span>
                          <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 flex items-center gap-0.5">
                            <CheckCircle2 size={10} /> Paid
                          </span>
                        </div>
                      ) : null}
                    </div>
                    <h3 className="text-sm font-bold text-slate-900">{item.title}</h3>
                    <p className="text-xs text-slate-500 line-clamp-1">{item.description}</p>
                    {item.applicationUrl && (
                      <div className="flex items-center gap-1 text-[11px] text-indigo-600 truncate pt-0.5">
                        <span className="font-semibold text-slate-400">Application URL:</span>
                        <a
                          href={item.applicationUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline flex items-center gap-0.5"
                        >
                          <span className="truncate">{item.applicationUrl}</span>
                          <ExternalLink size={10} className="shrink-0" />
                        </a>
                      </div>
                    )}
                    <div className="flex items-center gap-4 text-xs text-slate-400 pt-0.5">
                      <span>Duration: {item.duration}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => openEditModal(item)}
                      className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      <Pencil size={13} />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteInternship(item._id)}
                      className="flex items-center gap-1 rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50"
                    >
                      <Trash2 size={13} />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : jobLinks.length === 0 ? (
          <div className="py-12 text-center">
            <Link2 size={36} className="mx-auto text-slate-300" />
            <p className="mt-2 text-sm font-semibold text-slate-700">No job opportunity links yet</p>
            <p className="text-xs text-slate-400">Click "Add Job Link" to share external job opportunities.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {jobLinks.map((job) => (
              <div key={job._id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4">
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-purple-700">
                      {job.workMode || 'Remote'}
                    </span>
                    <span className="text-[11px] text-slate-400">{job.location}</span>
                    <span className="text-[11px] font-semibold text-slate-600">• {job.jobType || 'Full-time'}</span>
                    {job.candidatesRequired ? (
                      <span className="text-[11px] font-medium text-slate-600">
                        • {job.candidatesRequired} {Number(job.candidatesRequired) === 1 ? 'candidate' : 'candidates'} required
                      </span>
                    ) : null}
                    {job.platformFeeAmount ? (
                      <div className="flex items-center gap-1 text-[11px] text-slate-600">
                        <span>• Platform Fee: <strong className="text-slate-800">₹{job.platformFeeAmount.toLocaleString('en-IN')}</strong></span>
                        <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 flex items-center gap-0.5">
                          <CheckCircle2 size={10} /> Paid
                        </span>
                      </div>
                    ) : null}
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">{job.title}</h3>
                  <p className="text-xs text-slate-500 line-clamp-1">{job.description}</p>
                  {job.jobUrl && (
                    <div className="flex items-center gap-1 text-[11px] text-purple-600 truncate pt-0.5">
                      <span className="font-semibold text-slate-400">Job URL:</span>
                      <a
                        href={job.jobUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline flex items-center gap-0.5"
                      >
                        <span className="truncate">{job.jobUrl}</span>
                        <ExternalLink size={10} className="shrink-0" />
                      </a>
                    </div>
                  )}
                  {job.deadline && (
                    <div className="flex items-center gap-1 text-[11px] text-slate-400 pt-0.5">
                      <Calendar size={11} />
                      <span>Last Date: {new Date(job.deadline).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => openEditModal(job)}
                    className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <Pencil size={13} />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteJobLink(job._id)}
                    className="flex items-center gap-1 rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50"
                  >
                    <Trash2 size={13} />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  {modalStep === 'review'
                    ? 'Payment Summary'
                    : activeTab === 'internships'
                    ? isEditing
                      ? 'Edit Internship Opening'
                      : 'Post Internship Opening'
                    : isEditing
                    ? 'Edit Job Opportunity Link'
                    : 'Add Job Link'}
                </h2>
                {modalStep === 'review' && (
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Review InternSetu platform fee breakdown and complete payment to publish.
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowModal(false)
                  setModalStep('form')
                  setPaymentError('')
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            {urlError && modalStep === 'form' && (
              <div className="mt-3 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-medium text-rose-700">
                <AlertCircle size={15} className="shrink-0 text-rose-500" />
                <span>{urlError}</span>
              </div>
            )}

            {modalStep === 'review' ? (
              /* Payment Summary Step */
              <div className="mt-4 space-y-4">
                {(() => {
                  const isInternship = activeTab === 'internships'
                  const feeInfo = isInternship
                    ? computeFee(internshipForm.monthlyStipend, internshipForm.candidatesRequired)
                    : computeFee(jobLinkForm.monthlySalary, jobLinkForm.candidatesRequired)
                  const itemTitle = isInternship ? internshipForm.title : jobLinkForm.title

                  return (
                    <>
                      <div className="rounded-2xl border border-slate-200 bg-slate-50/90 p-4 space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
                          <span className="text-xs font-medium text-slate-500">Opportunity Title</span>
                          <span className="text-xs font-bold text-slate-900 max-w-[240px] truncate text-right">{itemTitle}</span>
                        </div>
                        <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
                          <span className="text-xs font-medium text-slate-500">{isInternship ? 'Monthly Stipend' : 'Monthly Salary'}</span>
                          <span className="text-xs font-semibold text-slate-900">
                            ₹{feeInfo.monthlyStipend.toLocaleString('en-IN')} / month
                          </span>
                        </div>
                        <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
                          <span className="text-xs font-medium text-slate-500">Candidates Required</span>
                          <span className="text-xs font-bold text-slate-900">{feeInfo.candidatesRequired}</span>
                        </div>
                        <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
                          <span className="text-xs font-medium text-slate-500">Platform Fee</span>
                          <span className="text-xs font-bold text-teal-700">1%</span>
                        </div>
                        <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
                          <span className="text-xs font-medium text-slate-500">Calculation</span>
                          <span className="text-xs font-mono font-medium text-slate-700">
                            ₹{feeInfo.monthlyStipend.toLocaleString('en-IN')} × {feeInfo.candidatesRequired} × 1%
                          </span>
                        </div>
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-sm font-bold text-slate-900">Amount Payable</span>
                          <span className="text-lg font-black text-indigo-700">
                            ₹{feeInfo.platformFee.toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>

                      {/* Razorpay / Configuration Status */}
                      {paymentConfig.isConfigured ? (
                        <div className="flex items-center gap-2 rounded-xl bg-blue-50 border border-blue-200 p-2.5 text-xs text-blue-800">
                          <ShieldCheck size={16} className="text-blue-600 shrink-0" />
                          <span>Secure online checkout powered by Razorpay.</span>
                        </div>
                      ) : (
                        <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900 space-y-1">
                          <div className="flex items-center gap-1.5 font-bold text-amber-800">
                            <AlertCircle size={15} className="text-amber-600 shrink-0" />
                            <span>DEVELOPMENT CONFIGURATION NOTICE</span>
                          </div>
                          <p className="text-[11px] leading-relaxed text-amber-800">
                            Razorpay API keys (<code>RAZORPAY_KEY_ID</code> and <code>RAZORPAY_KEY_SECRET</code>) are not configured in <code>backend/.env</code>. Real payment processing cannot proceed until keys are provided.
                          </p>
                        </div>
                      )}

                      {paymentError && (
                        <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                          <AlertCircle size={15} className="shrink-0 text-rose-500 mt-0.5" />
                          <span className="leading-relaxed">{paymentError}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => {
                            setModalStep('form')
                            setPaymentError('')
                          }}
                          disabled={isPaying}
                          className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          ← Back to Edit
                        </button>
                        <button
                          type="button"
                          onClick={handleExecutePayment}
                          disabled={isPaying}
                          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white shadow hover:bg-indigo-500 disabled:opacity-50"
                        >
                          <CreditCard size={14} />
                          <span>{isPaying ? 'Processing…' : `Pay ₹${feeInfo.platformFee.toLocaleString('en-IN')}`}</span>
                        </button>
                      </div>
                    </>
                  )
                })()}
              </div>
            ) : activeTab === 'internships' ? (
              /* Internship Form */
              <form onSubmit={handleSubmit} className="mt-4 space-y-3">
                <div>
                  <label className="text-xs font-medium text-slate-700">Internship Title *</label>
                  <input
                    type="text"
                    required
                    value={internshipForm.title}
                    onChange={(e) => setInternshipForm({ ...internshipForm, title: e.target.value })}
                    placeholder="e.g. Software Development Intern"
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-medium text-slate-700">Company Name *</label>
                    <input
                      type="text"
                      required
                      value={internshipForm.company}
                      onChange={(e) => setInternshipForm({ ...internshipForm, company: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-700">Location *</label>
                    <input
                      type="text"
                      required
                      value={internshipForm.location}
                      onChange={(e) => setInternshipForm({ ...internshipForm, location: e.target.value })}
                      placeholder="e.g. Remote / Bengaluru"
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-medium text-slate-700">Work Type</label>
                    <select
                      value={internshipForm.type}
                      onChange={(e) => setInternshipForm({ ...internshipForm, type: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-xs outline-none focus:border-indigo-500"
                    >
                      <option value="Remote">Remote</option>
                      <option value="Hybrid">Hybrid</option>
                      <option value="On-site">On-site</option>
                      <option value="Full-time">Full-time</option>
                      <option value="Part-time">Part-time</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-700">Duration</label>
                    <input
                      type="text"
                      value={internshipForm.duration}
                      onChange={(e) => setInternshipForm({ ...internshipForm, duration: e.target.value })}
                      placeholder="e.g. 3 Months"
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Monthly Stipend and Number of Candidates Required */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-medium text-slate-700">Monthly Stipend (₹/month) *</label>
                    <div className="relative mt-1">
                      <span className="absolute left-3 top-2 text-xs font-semibold text-slate-400">₹</span>
                      <input
                        type="number"
                        min="1"
                        required
                        value={internshipForm.monthlyStipend || ''}
                        onChange={(e) => {
                          const val = e.target.value
                          setInternshipForm({
                            ...internshipForm,
                            monthlyStipend: val,
                            stipend: val ? `₹${Number(val).toLocaleString('en-IN')} / month` : '',
                          })
                        }}
                        placeholder="25000"
                        className="w-full rounded-xl border border-slate-200 pl-7 pr-3 py-2 text-xs outline-none focus:border-indigo-500 font-medium"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-700">Number of Candidates Required *</label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      required
                      value={internshipForm.candidatesRequired || ''}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '')
                        setInternshipForm({
                          ...internshipForm,
                          candidatesRequired: val ? Math.max(1, parseInt(val, 10)) : '',
                        })
                      }}
                      placeholder="4"
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-indigo-500 font-medium"
                    />
                  </div>
                </div>

                {/* Dynamic Platform Fee Calculation Box */}
                {(() => {
                  const currentFee = computeFee(internshipForm.monthlyStipend, internshipForm.candidatesRequired)
                  return (
                    <div className="rounded-xl border border-emerald-200/90 bg-gradient-to-br from-emerald-50/90 to-teal-50/70 p-3 text-xs">
                      <div className="flex items-center justify-between text-slate-700 font-medium">
                        <span>InternSetu Platform Fee</span>
                        <span className="text-[11px] text-slate-500">1% of monthly stipend × candidates required</span>
                      </div>
                      <div className="mt-1.5 flex items-center justify-between border-t border-emerald-200/60 pt-1.5">
                        <span className="text-slate-600 font-mono text-[11px]">{currentFee.formula}</span>
                        <span className="font-bold text-slate-900 text-sm">₹{currentFee.platformFee.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="mt-1 flex items-center justify-between font-bold text-emerald-800 text-xs">
                        <span>Total Payment Required</span>
                        <span className="text-base text-emerald-900 font-extrabold">₹{currentFee.platformFee.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  )
                })()}

                <div>
                  <label className="text-xs font-medium text-slate-700">
                    Application URL * <span className="text-[11px] text-slate-400">(External company apply link)</span>
                  </label>
                  <input
                    type="url"
                    required
                    value={internshipForm.applicationUrl}
                    onChange={(e) => {
                      setInternshipForm({ ...internshipForm, applicationUrl: e.target.value })
                      setUrlError('')
                    }}
                    placeholder="https://company.com/careers/intern"
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700">Required Skills (comma separated)</label>
                  <input
                    type="text"
                    value={internshipForm.skills}
                    onChange={(e) => setInternshipForm({ ...internshipForm, skills: e.target.value })}
                    placeholder="React, Node.js, MongoDB"
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700">Description *</label>
                  <textarea
                    rows={3}
                    required
                    value={internshipForm.description}
                    onChange={(e) => setInternshipForm({ ...internshipForm, description: e.target.value })}
                    placeholder="Detail internship responsibilities..."
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
                  >
                    {isSubmitting
                      ? 'Saving…'
                      : isEditing
                      ? 'Update Internship'
                      : `Review & Pay ₹${computeFee(internshipForm.monthlyStipend, internshipForm.candidatesRequired).platformFee.toLocaleString('en-IN')}`}
                  </button>
                </div>
              </form>
            ) : (
              /* Job Link Form */
              <form onSubmit={handleSubmit} className="mt-4 space-y-3">
                <div>
                  <label className="text-xs font-medium text-slate-700">Job Title *</label>
                  <input
                    type="text"
                    required
                    value={jobLinkForm.title}
                    onChange={(e) => setJobLinkForm({ ...jobLinkForm, title: e.target.value })}
                    placeholder="e.g. Software Engineer"
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-medium text-slate-700">Company Name *</label>
                    <input
                      type="text"
                      required
                      value={jobLinkForm.company}
                      onChange={(e) => setJobLinkForm({ ...jobLinkForm, company: e.target.value })}
                      placeholder="e.g. ABC Technologies"
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-700">Location</label>
                    <input
                      type="text"
                      value={jobLinkForm.location}
                      onChange={(e) => setJobLinkForm({ ...jobLinkForm, location: e.target.value })}
                      placeholder="e.g. Bangalore"
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-medium text-slate-700">Work Mode</label>
                    <select
                      value={jobLinkForm.workMode}
                      onChange={(e) => setJobLinkForm({ ...jobLinkForm, workMode: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-xs outline-none focus:border-indigo-500"
                    >
                      <option value="Remote">Remote</option>
                      <option value="Hybrid">Hybrid</option>
                      <option value="On-site">On-site</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-700">Job Type</label>
                    <input
                      type="text"
                      value={jobLinkForm.jobType}
                      onChange={(e) => setJobLinkForm({ ...jobLinkForm, jobType: e.target.value })}
                      placeholder="e.g. Full Time"
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Monthly Salary & Candidates Required */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-medium text-slate-700">Monthly Compensation (₹/month) *</label>
                    <div className="relative mt-1">
                      <span className="absolute left-3 top-2 text-xs font-semibold text-slate-400">₹</span>
                      <input
                        type="number"
                        min="1"
                        required
                        value={jobLinkForm.monthlySalary || ''}
                        onChange={(e) => setJobLinkForm({ ...jobLinkForm, monthlySalary: e.target.value })}
                        placeholder="30000"
                        className="w-full rounded-xl border border-slate-200 pl-7 pr-3 py-2 text-xs outline-none focus:border-indigo-500 font-medium"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-700">Number of Candidates Required *</label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      required
                      value={jobLinkForm.candidatesRequired || ''}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '')
                        setJobLinkForm({
                          ...jobLinkForm,
                          candidatesRequired: val ? Math.max(1, parseInt(val, 10)) : '',
                        })
                      }}
                      placeholder="1"
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-indigo-500 font-medium"
                    />
                  </div>
                </div>

                {/* Dynamic Platform Fee Calculation Box for Job */}
                {(() => {
                  const currentJobFee = computeFee(jobLinkForm.monthlySalary, jobLinkForm.candidatesRequired)
                  return (
                    <div className="rounded-xl border border-purple-200/90 bg-gradient-to-br from-purple-50/90 to-indigo-50/70 p-3 text-xs">
                      <div className="flex items-center justify-between text-slate-700 font-medium">
                        <span>InternSetu Platform Fee</span>
                        <span className="text-[11px] text-slate-500">1% of monthly salary × candidates required</span>
                      </div>
                      <div className="mt-1.5 flex items-center justify-between border-t border-purple-200/60 pt-1.5">
                        <span className="text-slate-600 font-mono text-[11px]">{currentJobFee.formula}</span>
                        <span className="font-bold text-slate-900 text-sm">₹{currentJobFee.platformFee.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="mt-1 flex items-center justify-between font-bold text-purple-800 text-xs">
                        <span>Total Payment Required</span>
                        <span className="text-base text-purple-900 font-extrabold">₹{currentJobFee.platformFee.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  )
                })()}

                <div>
                  <label className="text-xs font-medium text-slate-700">Required Skills</label>
                  <input
                    type="text"
                    value={jobLinkForm.skills}
                    onChange={(e) => setJobLinkForm({ ...jobLinkForm, skills: e.target.value })}
                    placeholder="e.g. Java, Spring Boot, MySQL"
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700">Short Description</label>
                  <textarea
                    rows={2}
                    value={jobLinkForm.description}
                    onChange={(e) => setJobLinkForm({ ...jobLinkForm, description: e.target.value })}
                    placeholder="Brief description of the opportunity..."
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700">
                    Job URL * <span className="text-[11px] text-slate-400">(External company job application page)</span>
                  </label>
                  <input
                    type="url"
                    required
                    value={jobLinkForm.jobUrl}
                    onChange={(e) => {
                      setJobLinkForm({ ...jobLinkForm, jobUrl: e.target.value })
                      setUrlError('')
                    }}
                    placeholder="https://company.com/careers/software-engineer"
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-medium text-slate-700">Company Website</label>
                    <input
                      type="url"
                      value={jobLinkForm.companyWebsite}
                      onChange={(e) => setJobLinkForm({ ...jobLinkForm, companyWebsite: e.target.value })}
                      placeholder="https://company.com"
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-700">Last Date to Apply</label>
                    <input
                      type="date"
                      value={jobLinkForm.deadline}
                      onChange={(e) => setJobLinkForm({ ...jobLinkForm, deadline: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
                  >
                    {isSubmitting
                      ? 'Saving…'
                      : isEditing
                      ? 'Update Job Link'
                      : `Review & Pay ₹${computeFee(jobLinkForm.monthlySalary, jobLinkForm.candidatesRequired).platformFee.toLocaleString('en-IN')}`}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ── Contest Creation Modal ── */}
      {showContestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Create DSA Contest</h3>
              <button type="button" onClick={() => setShowContestModal(false)} className="rounded-lg p-1.5 hover:bg-slate-100"><X size={16} /></button>
            </div>
            <form onSubmit={handleCreateContest} className="p-5 space-y-4">
              {contestError && <div className="rounded-xl bg-red-50 px-4 py-2.5 text-xs text-red-700">{contestError}</div>}
              <div>
                <label className="text-xs font-medium text-slate-700">Contest Title *</label>
                <input type="text" value={contestForm.title} onChange={e => setContestForm({...contestForm, title: e.target.value})} placeholder="e.g. Frontend Engineering Challenge 2025" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700">Description</label>
                <textarea rows={2} value={contestForm.description} onChange={e => setContestForm({...contestForm, description: e.target.value})} placeholder="Contest overview..." className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-indigo-500" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium text-slate-700">Target Role</label>
                  <input type="text" value={contestForm.role} onChange={e => setContestForm({...contestForm, role: e.target.value})} placeholder="e.g. SDE Intern" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700">Duration (minutes)</label>
                  <input type="number" min={30} value={contestForm.durationMinutes} onChange={e => setContestForm({...contestForm, durationMinutes: Number(e.target.value)})} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-indigo-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium text-slate-700">Start Date &amp; Time</label>
                  <input type="datetime-local" value={contestForm.startDate} onChange={e => setContestForm({...contestForm, startDate: e.target.value})} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700">End Date &amp; Time</label>
                  <input type="datetime-local" value={contestForm.endDate} onChange={e => setContestForm({...contestForm, endDate: e.target.value})} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-indigo-500" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700">Allowed Languages (comma-separated)</label>
                <input type="text" value={contestForm.allowedLanguages} onChange={e => setContestForm({...contestForm, allowedLanguages: e.target.value})} placeholder="C++,Java,Python,JavaScript" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700 mb-2 block">Select Problems from Library</label>
                {availableProblems.length === 0 ? (
                  <p className="text-xs text-slate-400">No active problems in library. Ask admin to add problems first.</p>
                ) : (
                  <div className="max-h-36 overflow-y-auto space-y-1 border border-slate-100 rounded-xl p-2">
                    {availableProblems.map(p => (
                      <label key={p._id} className="flex items-center gap-2 text-xs cursor-pointer hover:bg-slate-50 px-2 py-1 rounded-lg">
                        <input type="checkbox" checked={selectedProblems.includes(p._id)} onChange={e => setSelectedProblems(prev => e.target.checked ? [...prev, p._id] : prev.filter(id => id !== p._id))} />
                        <span className="font-medium text-slate-800">{p.title}</span>
                        <span className="text-slate-400">{p.difficulty} · {p.topic}</span>
                      </label>
                    ))}
                  </div>
                )}
                <p className="text-[11px] text-slate-400 mt-1">{selectedProblems.length} problem(s) selected</p>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowContestModal(false)} className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={contestSubmitting} className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-50">{contestSubmitting ? 'Creating…' : 'Create Contest'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Standings Modal ── */}
      {viewStandings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Standings — {viewStandings.title}</h3>
              <button type="button" onClick={() => setViewStandings(null)} className="rounded-lg p-1.5 hover:bg-slate-100"><X size={16} /></button>
            </div>
            <div className="p-5">
              {standings.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">No submissions yet. Results appear after contest ends or after sync.</p>
              ) : (
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400">
                      <th className="py-2 text-left font-semibold">Rank</th>
                      <th className="py-2 text-left font-semibold">Student</th>
                      <th className="py-2 text-center font-semibold">Score</th>
                      <th className="py-2 text-center font-semibold">Solved</th>
                      <th className="py-2 text-center font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {standings.map((s, i) => (
                      <tr key={s.studentId || i}>
                        <td className="py-2 font-bold text-slate-700">#{s.rank || i + 1}</td>
                        <td className="py-2 font-medium text-slate-800">{s.studentName || 'Student'}</td>
                        <td className="py-2 text-center">{s.score ?? '—'}</td>
                        <td className="py-2 text-center">{s.problemsSolved ?? '—'}</td>
                        <td className="py-2 text-center"><span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600">{s.syncStatus || 'Synced'}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Assessment Creation Modal ── */}
      {showAssessmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Create MCQ Assessment</h3>
              <button type="button" onClick={() => setShowAssessmentModal(false)} className="rounded-lg p-1.5 hover:bg-slate-100"><X size={16} /></button>
            </div>
            <form onSubmit={handleCreateAssessment} className="p-5 space-y-4">
              {assessmentError && <div className="rounded-xl bg-red-50 px-4 py-2.5 text-xs text-red-700">{assessmentError}</div>}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium text-slate-700">Title *</label>
                  <input type="text" value={assessmentForm.title} onChange={e => setAssessmentForm({...assessmentForm, title: e.target.value})} placeholder="e.g. React Developer Screening" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700">Role</label>
                  <input type="text" value={assessmentForm.role} onChange={e => setAssessmentForm({...assessmentForm, role: e.target.value})} placeholder="e.g. Frontend Intern" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-indigo-500" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700">Description</label>
                <textarea rows={2} value={assessmentForm.description} onChange={e => setAssessmentForm({...assessmentForm, description: e.target.value})} placeholder="Assessment overview..." className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-indigo-500" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs font-medium text-slate-700">Duration (min)</label>
                  <input type="number" min={10} value={assessmentForm.durationMinutes} onChange={e => setAssessmentForm({...assessmentForm, durationMinutes: Number(e.target.value)})} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700">Passing Score (%)</label>
                  <input type="number" min={0} max={100} value={assessmentForm.passingScore} onChange={e => setAssessmentForm({...assessmentForm, passingScore: Number(e.target.value)})} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700">Max Attempts</label>
                  <input type="number" min={1} value={assessmentForm.maxAttempts} onChange={e => setAssessmentForm({...assessmentForm, maxAttempts: Number(e.target.value)})} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-indigo-500" />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-bold text-slate-700">Questions ({assessmentQuestions.length})</label>
                  <button type="button" onClick={addQuestion} className="flex items-center gap-1 rounded-lg bg-indigo-50 px-2.5 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"><Plus size={12} /> Add Question</button>
                </div>
                <div className="space-y-4">
                  {assessmentQuestions.map((q, qIdx) => (
                    <div key={qIdx} className="rounded-xl border border-slate-200 p-4 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <label className="text-[11px] font-medium text-slate-500">Q{qIdx + 1} *</label>
                          <textarea rows={2} value={q.question} onChange={e => updateQuestion(qIdx, 'question', e.target.value)} placeholder="Enter question text..." className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-indigo-500" />
                        </div>
                        <button type="button" onClick={() => removeQuestion(qIdx)} className="rounded-lg p-1.5 hover:bg-red-50 text-red-400 mt-4 shrink-0"><X size={13} /></button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {q.options.map((opt, oIdx) => (
                          <div key={oIdx} className="flex items-center gap-2">
                            <input type="radio" name={`correct-${qIdx}`} checked={q.correctAnswer === oIdx} onChange={() => updateQuestion(qIdx, 'correctAnswer', oIdx)} className="shrink-0" />
                            <input type="text" value={opt} onChange={e => updateOption(qIdx, oIdx, e.target.value)} placeholder={`Option ${oIdx + 1}`} className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs outline-none focus:border-indigo-500" />
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <label className="text-[11px] text-slate-400">Marks</label>
                          <input type="number" min={0} value={q.marks} onChange={e => updateQuestion(qIdx, 'marks', Number(e.target.value))} className="mt-0.5 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs outline-none" />
                        </div>
                        <div className="flex-1">
                          <label className="text-[11px] text-slate-400">Negative Marks</label>
                          <input type="number" min={0} value={q.negativeMarks} onChange={e => updateQuestion(qIdx, 'negativeMarks', Number(e.target.value))} className="mt-0.5 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs outline-none" />
                        </div>
                        <div className="flex-1">
                          <label className="text-[11px] text-slate-400">Difficulty</label>
                          <select value={q.difficulty} onChange={e => updateQuestion(qIdx, 'difficulty', e.target.value)} className="mt-0.5 w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs outline-none">
                            <option>Easy</option><option>Medium</option><option>Hard</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowAssessmentModal(false)} className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={assessmentSubmitting} className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-50">{assessmentSubmitting ? 'Creating…' : 'Create & Publish'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Assessment Results Modal ── */}
      {viewingResults && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Results — {viewingResults.title}</h3>
              <button type="button" onClick={() => setViewingResults(null)} className="rounded-lg p-1.5 hover:bg-slate-100"><X size={16} /></button>
            </div>
            <div className="p-5">
              {assessmentResults.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">No attempts yet.</p>
              ) : (
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400">
                      <th className="py-2 text-left font-semibold">Student</th>
                      <th className="py-2 text-center font-semibold">Score</th>
                      <th className="py-2 text-center font-semibold">%</th>
                      <th className="py-2 text-center font-semibold">Passed</th>
                      <th className="py-2 text-center font-semibold">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {assessmentResults.map((r, i) => (
                      <tr key={r._id || i}>
                        <td className="py-2 font-medium text-slate-800">{r.studentName || r.studentId || 'Student'}</td>
                        <td className="py-2 text-center">{r.score}/{r.totalMarks}</td>
                        <td className="py-2 text-center">{Math.round(r.percentage || 0)}%</td>
                        <td className="py-2 text-center"><span className={`rounded px-2 py-0.5 text-[10px] font-bold ${r.passed ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>{r.passed ? 'Pass' : 'Fail'}</span></td>
                        <td className="py-2 text-center text-slate-400">{r.completedAt ? new Date(r.completedAt).toLocaleDateString() : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Candidate Profile Modal ── */}
      {selectedCandidate && (
        <CandidateProfileModal
          candidateId={selectedCandidate}
          candidate={candidateProfile}
          onClose={() => { setSelectedCandidate(null); setCandidateProfile(null) }}
          onPipelineUpdated={loadCandidates}
          onPipelineUpdate={handlePipelineUpdate}
        />
      )}
    </div>
  )
}
