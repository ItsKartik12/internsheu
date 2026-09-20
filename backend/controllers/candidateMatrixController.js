import mongoose from 'mongoose'
import User from '../models/User.js'
import StudentProfile from '../models/StudentProfile.js'
import SkillResult from '../models/SkillResult.js'
import ContestResult from '../models/ContestResult.js'
import IndustryAssessmentAttempt from '../models/IndustryAssessmentAttempt.js'
import TalentPipeline from '../models/TalentPipeline.js'
import InternshipApplication from '../models/InternshipApplication.js'
import IndustryRequirement from '../models/IndustryRequirement.js'
import ContactUnlock from '../models/ContactUnlock.js'
import InterviewSession from '../models/InterviewSession.js'

/**
 * Helpers to mask contact info for student privacy
 */
export function maskEmail(email) {
  if (!email || typeof email !== 'string') return '••••••••••'
  const parts = email.split('@')
  if (parts.length !== 2) return '••••••••••'
  const [name, domain] = parts
  if (name.length <= 2) {
    return `${name[0]}*****@${domain}`
  }
  return `${name[0]}*****${name[name.length - 1]}@${domain}`
}

export function maskPhone(phone) {
  return '••••••••••'
}

/**
 * Helper to compute student's Industry Matrix evidence
 */
async function computeStudentIndustryMatrix(studentId, scoringWeights = null) {
  const [assessmentAttempts, contestResults, profile] = await Promise.all([
    IndustryAssessmentAttempt.find({ studentId })
      .populate('assessmentId', 'title role company')
      .sort({ createdAt: -1 })
      .lean(),
    ContestResult.find({ studentId })
      .populate('contestId', 'title role company startDate')
      .sort({ createdAt: -1 })
      .lean(),
    StudentProfile.findOne({ userId: studentId }).lean(),
  ])

  // 1. Industry Assessment aggregation
  let assessmentAverage = 0
  let totalAssessmentAttempts = assessmentAttempts.length
  let passedAssessments = 0
  if (totalAssessmentAttempts > 0) {
    const sum = assessmentAttempts.reduce((acc, curr) => acc + (curr.percentage || 0), 0)
    assessmentAverage = Math.round(sum / totalAssessmentAttempts)
    passedAssessments = assessmentAttempts.filter((a) => a.passed).length
  }

  // 2. DSA Contest aggregation
  let dsaScoreTotal = 0
  let totalProblemsSolved = 0
  let bestRank = 0
  let contestsParticipated = contestResults.length
  if (contestsParticipated > 0) {
    totalProblemsSolved = contestResults.reduce((acc, curr) => acc + (curr.problemsSolved || 0), 0)
    dsaScoreTotal = contestResults.reduce((acc, curr) => acc + (curr.score || 0), 0)
    const validRanks = contestResults.map((c) => c.rank).filter((r) => r > 0)
    bestRank = validRanks.length > 0 ? Math.min(...validRanks) : 1
  }

  // 3. AI Mock Interview — real evidence only. Selected skills are NOT
  // scores: only skills that obtained a valid score in a completed AI
  // interview count. No interview evidence ⇒ no AI interview score.
  const interviewSessions = await InterviewSession.find({
    userId: studentId,
    status: 'Done',
    'evaluation.assessedSkills.0': { $exists: true },
  })
    .select('evaluation.overallScore evaluation.assessedSkills')
    .lean()

  const interviewSkillMap = new Map() // lowercase skill → { display, scores: [] }
  for (const s of interviewSessions) {
    for (const a of s.evaluation?.assessedSkills || []) {
      if (!a?.skill || typeof a.score !== 'number' || !Number.isFinite(a.score)) continue
      const key = a.skill.toLowerCase().trim()
      if (!key) continue
      if (!interviewSkillMap.has(key)) {
        interviewSkillMap.set(key, { skill: a.skill, scores: [] })
      }
      interviewSkillMap.get(key).scores.push(Math.max(0, Math.min(100, Math.round(a.score))))
    }
  }
  const interviewSkills = [...interviewSkillMap.values()].map((e) => ({
    skill: e.skill,
    score: Math.round(e.scores.reduce((x, y) => x + y, 0) / e.scores.length),
    interviewsCount: e.scores.length,
  }))
  interviewSkills.sort((x, y) => y.score - x.score)

  const interviewsCompleted = interviewSessions.length
  // Overall interview score exists only when at least one interview produced evidence.
  const aiInterviewScore =
    interviewsCompleted > 0
      ? Math.round(
          interviewSessions.reduce((acc, s) => acc + (s.evaluation?.overallScore || 0), 0) /
            interviewsCompleted
        )
      : null

  // 4. Overall Industry Score calculation ONLY when weights are explicitly configured
  let overallIndustryScore = null
  let weightsApplied = null
  let isConfigured = false

  if (
    scoringWeights &&
    scoringWeights.isConfigured &&
    typeof scoringWeights.assessmentWeight === 'number' &&
    typeof scoringWeights.dsaWeight === 'number' &&
    typeof scoringWeights.aiInterviewWeight === 'number'
  ) {
    isConfigured = true
    weightsApplied = {
      assessmentWeight: scoringWeights.assessmentWeight,
      dsaWeight: scoringWeights.dsaWeight,
      aiInterviewWeight: scoringWeights.aiInterviewWeight,
    }

    const wAssess = scoringWeights.assessmentWeight / 100
    const wDsa = scoringWeights.dsaWeight / 100
    const wAi = scoringWeights.aiInterviewWeight / 100

    // Normalized DSA score out of 100
    const normalizedDsa = contestsParticipated > 0 ? Math.min(100, Math.round((dsaScoreTotal / (contestsParticipated * 300)) * 100)) : 0

    overallIndustryScore = Math.round(
      assessmentAverage * wAssess + normalizedDsa * wDsa + aiInterviewScore * wAi
    )
  }

  return {
    hasEvidence: totalAssessmentAttempts > 0 || contestsParticipated > 0,
    assessment: {
      score: assessmentAverage,
      totalAttempts: totalAssessmentAttempts,
      passedCount: passedAssessments,
      recentAttempts: assessmentAttempts.slice(0, 5),
    },
    dsa: {
      score: dsaScoreTotal,
      problemsSolved: totalProblemsSolved,
      bestRank,
      contestsParticipated,
      contests: contestResults.slice(0, 5),
    },
    aiInterview: {
      score: aiInterviewScore,
      status: interviewsCompleted > 0 ? 'Completed' : 'Not Attempted',
      interviewsCompleted,
      skills: interviewSkills,
    },
    overallIndustryScore,
    isConfigured,
    weightsApplied,
    message: isConfigured ? 'Computed with configured industry weights' : 'Not configured',
  }
}

// ────────────────────────────────────────────────────────
// STUDENT ENDPOINTS
// ────────────────────────────────────────────────────────

/**
 * GET /api/student/industry-matrix
 * Returns student's own Industry Matrix data
 */
export async function getStudentIndustryMatrix(req, res, next) {
  try {
    const studentId = req.user._id
    // Check if there is an active requirement with configured weights
    const reqWithWeights = await IndustryRequirement.findOne({
      'scoringWeights.isConfigured': true,
      isActive: true,
    }).lean()

    const matrixData = await computeStudentIndustryMatrix(
      studentId,
      reqWithWeights?.scoringWeights || null
    )

    res.json({ industryMatrix: matrixData })
  } catch (err) {
    next(err)
  }
}

// ────────────────────────────────────────────────────────
// INDUSTRY ENDPOINTS
// ────────────────────────────────────────────────────────

/**
 * GET /api/industry/candidates
 * Ranked candidate matrix for Industry candidate discovery
 */
export async function getCandidateMatrix(req, res, next) {
  try {
    const { sort = 'overall', order = 'desc', search, role, minScore } = req.query
    const industryId = req.user._id

    // Fetch industry requirements if configured
    const industryReq = await IndustryRequirement.findOne({ industryId, isActive: true }).lean()

    // Find all student users
    const studentFilter = { role: 'student', isActive: true }
    if (search && search.trim()) {
      const q = search.trim()
      studentFilter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { fieldMark: { $regex: q, $options: 'i' } },
      ]
    }

    const students = await User.find(studentFilter).select('-passwordHash').lean()
    const studentIds = students.map((s) => s._id)

    // Load student profiles, skill results, contest results, assessment attempts, and pipeline stages in parallel
    const [profiles, skillResults, contestResults, assessmentAttempts, pipelineEntries, contactUnlocks] = await Promise.all([
      StudentProfile.find({ userId: { $in: studentIds } }).lean(),
      SkillResult.find({ studentId: { $in: studentIds } }).lean(),
      ContestResult.find({ studentId: { $in: studentIds } }).lean(),
      IndustryAssessmentAttempt.find({ studentId: { $in: studentIds } }).lean(),
      TalentPipeline.find({ industryId, studentId: { $in: studentIds } }).lean(),
      ContactUnlock.find({ companyId: industryId, candidateId: { $in: studentIds } }).lean(),
    ])

    const profileMap = new Map(profiles.map((p) => [p.userId.toString(), p]))
    const skillMap = new Map(skillResults.map((s) => [s.studentId.toString(), s]))
    const pipelineMap = new Map(pipelineEntries.map((p) => [p.studentId.toString(), p]))
    const unlockSet = new Set(contactUnlocks.map((u) => u.candidateId.toString()))

    // Group contest results by student
    const contestMap = new Map()
    for (const c of contestResults) {
      const sid = c.studentId.toString()
      const list = contestMap.get(sid) || []
      list.push(c)
      contestMap.set(sid, list)
    }

    // Group assessment attempts by student
    const assessmentMap = new Map()
    for (const a of assessmentAttempts) {
      const sid = a.studentId.toString()
      const list = assessmentMap.get(sid) || []
      list.push(a)
      assessmentMap.set(sid, list)
    }

    // AI interview evidence — real evaluations only, never a fabricated baseline
    const interviewSessions = await InterviewSession.find({
      userId: { $in: studentIds },
      status: 'Done',
      'evaluation.assessedSkills.0': { $exists: true },
    })
      .select('userId evaluation.overallScore')
      .lean()
    const interviewByStudent = new Map()
    for (const s of interviewSessions) {
      const key = s.userId?.toString()
      if (!key) continue
      if (!interviewByStudent.has(key)) interviewByStudent.set(key, { totals: 0, count: 0 })
      const entry = interviewByStudent.get(key)
      entry.totals += s.evaluation?.overallScore || 0
      entry.count += 1
    }
    const interviewAvgFor = (sid) => {
      const e = interviewByStudent.get(sid)
      return e && e.count > 0 ? Math.round(e.totals / e.count) : null
    }

    // Assemble candidates with evidence
    const candidates = students.map((student) => {
      const sid = student._id.toString()
      const prof = profileMap.get(sid)
      const skResult = skillMap.get(sid)
      const studentContests = contestMap.get(sid) || []
      const studentAttempts = assessmentMap.get(sid) || []
      const pipelineEntry = pipelineMap.get(sid)

      // Assessment %
      let assessmentScore = 0
      if (studentAttempts.length > 0) {
        const sum = studentAttempts.reduce((acc, curr) => acc + (curr.percentage || 0), 0)
        assessmentScore = Math.round(sum / studentAttempts.length)
      }

      // DSA metrics
      let dsaScore = 0
      let dsaSolved = 0
      let dsaRank = 0
      if (studentContests.length > 0) {
        dsaScore = studentContests.reduce((acc, curr) => acc + (curr.score || 0), 0)
        dsaSolved = studentContests.reduce((acc, curr) => acc + (curr.problemsSolved || 0), 0)
        const validRanks = studentContests.map((c) => c.rank).filter((r) => r > 0)
        dsaRank = validRanks.length > 0 ? Math.min(...validRanks) : 0
      }

      // AI Mock Interview — null when no completed interview evidence exists
      const aiInterview = interviewAvgFor(sid)

      // Match Score calculation against industry requirement or student skills
      let matchScore = 75
      const studentSkills = []
      if (prof?.skills) {
        for (const list of Object.values(prof.skills)) {
          if (Array.isArray(list)) studentSkills.push(...list)
        }
      }

      if (industryReq?.requiredSkills?.length > 0 && studentSkills.length > 0) {
        const reqSkillsLower = industryReq.requiredSkills.map((s) => s.toLowerCase().trim())
        const matches = studentSkills.filter((s) => reqSkillsLower.includes(s.toLowerCase().trim())).length
        matchScore = Math.min(98, Math.max(50, Math.round((matches / reqSkillsLower.length) * 100)))
      }

      // Overall Industry Score (only if weights configured)
      let overall = null
      if (industryReq?.scoringWeights?.isConfigured) {
        const wAssess = industryReq.scoringWeights.assessmentWeight / 100
        const wDsa = industryReq.scoringWeights.dsaWeight / 100
        const wAi = industryReq.scoringWeights.aiInterviewWeight / 100
        const normDsa = Math.min(100, Math.round((dsaScore / Math.max(1, studentContests.length * 300)) * 100))
        // No interview evidence contributes 0 to the weighted composite (shown as Not Assessed elsewhere)
        overall = Math.round(assessmentScore * wAssess + normDsa * wDsa + (aiInterview ?? 0) * wAi)
      }

      const isContactUnlocked = Boolean(pipelineEntry?.contactUnlocked || unlockSet.has(sid))

      return {
        _id: student._id,
        studentId: student._id,
        name: prof?.basicInfo?.fullName || student.name,
        email: isContactUnlocked ? student.email : maskEmail(student.email),
        phone: isContactUnlocked ? (prof?.basicInfo?.phone || '+91 98765 43210') : '••••••••••',
        contactUnlocked: isContactUnlocked,
        enrollmentNo: student.enrollmentNo || '',
        fieldMark: student.fieldMark || prof?.education?.[0]?.branch || 'Computer Science',
        institute: prof?.education?.[0]?.college || 'Engineering Institute',
        cgpa: prof?.education?.[0]?.cgpa || 8.2,
        assessmentScore,
        dsaScore,
        dsaSolved,
        dsaRank: dsaRank > 0 ? `#${dsaRank}` : '—',
        dsaRankNum: dsaRank > 0 ? dsaRank : 999999,
        aiInterview,
        overall: overall !== null ? overall : null,
        matchScore,
        pipelineStage: pipelineEntry?.stage || 'Matched',
        poolName: pipelineEntry?.poolName || 'General Pool',
        hasProfile: Boolean(prof),
        hasSkillMatrix: Boolean(skResult),
        skillsCount: studentSkills.length,
      }
    })

    // Filter by minScore if provided
    let filtered = candidates
    if (minScore) {
      const min = Number(minScore)
      filtered = filtered.filter((c) => (c.overall ?? c.assessmentScore) >= min)
    }

    // Sort
    const isAsc = order === 'asc'
    filtered.sort((a, b) => {
      let valA, valB
      if (sort === 'overall') {
        valA = a.overall ?? a.matchScore
        valB = b.overall ?? b.matchScore
      } else if (sort === 'assessment') {
        valA = a.assessmentScore
        valB = b.assessmentScore
      } else if (sort === 'dsaScore') {
        valA = a.dsaScore
        valB = b.dsaScore
      } else if (sort === 'dsaRank') {
        valA = a.dsaRankNum
        valB = b.dsaRankNum
        // In ranking, lower number is better
        return isAsc ? valB - valA : valA - valB
      } else if (sort === 'aiInterview') {
        valA = a.aiInterview ?? -1
        valB = b.aiInterview ?? -1
      } else if (sort === 'match') {
        valA = a.matchScore
        valB = b.matchScore
      } else {
        valA = a.overall ?? 0
        valB = b.overall ?? 0
      }
      return isAsc ? valA - valB : valB - valA
    })

    // Assign display ranks
    const ranked = filtered.map((c, index) => ({
      ...c,
      rank: index + 1,
    }))

    res.json({
      candidates: ranked,
      totalCount: ranked.length,
      requirement: industryReq || null,
    })
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/industry/candidates/:studentId
 * Comprehensive candidate profile with Skill Matrix & Industry Matrix tabs
 */
export async function getCandidateProfile(req, res, next) {
  try {
    const { studentId } = req.params
    const industryId = req.user._id

    if (!mongoose.isValidObjectId(studentId)) {
      return res.status(400).json({ error: 'Invalid candidate ID format' })
    }

    const student = await User.findById(studentId).select('-passwordHash').lean()
    if (!student) {
      return res.status(404).json({ error: 'Candidate not found' })
    }

    const [profile, skillResult, contestResults, assessmentAttempts, pipelineEntry, applications, existingUnlock, interviewSessions] = await Promise.all([
      StudentProfile.findOne({ userId: studentId }).lean(),
      SkillResult.findOne({ studentId }).lean(),
      ContestResult.find({ studentId }).populate('contestId', 'title role company startDate').lean(),
      IndustryAssessmentAttempt.find({ studentId }).populate('assessmentId', 'title role company').lean(),
      TalentPipeline.findOne({ industryId, studentId }).lean(),
      InternshipApplication.find({ studentId, industryId }).populate('internshipId', 'title location stipend').lean(),
      ContactUnlock.findOne({ companyId: industryId, candidateId: studentId }).lean(),
      InterviewSession.find({ userId: studentId, status: 'Done' }).select('evaluation.overallScore').lean(),
    ])

    // Privacy: hide phone and email unless contact has been unlocked
    const isUnlocked = Boolean(pipelineEntry?.contactUnlocked || existingUnlock)
    const rawEmail = student.email || profile?.basicInfo?.professionalEmail || ''
    const rawPhone = profile?.basicInfo?.phone || '+91 98765 43210'

    const sanitizedProfile = profile ? { ...profile } : null
    if (sanitizedProfile?.basicInfo) {
      if (!isUnlocked) {
        sanitizedProfile.basicInfo.phone = '🔒 Hidden until contact unlock'
        sanitizedProfile.basicInfo.professionalEmail = maskEmail(rawEmail)
      } else {
        sanitizedProfile.basicInfo.phone = rawPhone
        sanitizedProfile.basicInfo.professionalEmail = rawEmail
      }
    }

    res.json({
      student: {
        _id: student._id,
        name: profile?.basicInfo?.fullName || student.name,
        email: isUnlocked ? rawEmail : maskEmail(rawEmail),
        phone: isUnlocked ? rawPhone : '••••••••••',
        maskedEmail: maskEmail(rawEmail),
        contactUnlocked: isUnlocked,
        enrollmentNo: student.enrollmentNo || '',
        fieldMark: student.fieldMark || '',
        createdAt: student.createdAt,
      },
      profile: sanitizedProfile,
      skillMatrix: skillResult || null,
      industryMatrix: {
        assessmentAttempts,
        contestResults,
        // Real average across completed AI interviews — null when none exist
        aiInterviewScore:
          interviewSessions.length > 0
            ? Math.round(
                interviewSessions.reduce((acc, s) => acc + (s.evaluation?.overallScore || 0), 0) /
                  interviewSessions.length
              )
            : null,
      },
      pipelineStage: pipelineEntry?.stage || 'Matched',
      poolName: pipelineEntry?.poolName || 'General Pool',
      pipelineNotes: pipelineEntry?.notes || '',
      contactUnlocked: isUnlocked,
      applications: applications || [],
    })
  } catch (err) {
    next(err)
  }
}

/**
 * POST /api/industry/pipeline
 * Update candidate stage in talent pipeline / shortlist
 */
export async function updateCandidatePipeline(req, res, next) {
  try {
    const { studentId, stage, poolName, notes } = req.body
    if (!studentId || !stage) {
      return res.status(400).json({ error: 'Student ID and stage are required' })
    }

    const validStages = ['Matched', 'Shortlisted', 'Contacted', 'Interviewed', 'Selected']
    if (!validStages.includes(stage)) {
      return res.status(400).json({ error: 'Invalid pipeline stage' })
    }

    const existing = await TalentPipeline.findOne({ industryId: req.user._id, studentId })

    const entry = await TalentPipeline.findOneAndUpdate(
      { industryId: req.user._id, studentId },
      {
        stage,
        poolName: poolName || existing?.poolName || 'General Pool',
        notes: notes !== undefined ? notes : (existing?.notes || ''),
        contactUnlocked: existing?.contactUnlocked || false,
        updatedAt: new Date(),
      },
      { upsert: true, new: true }
    )

    res.json({ entry, message: `Candidate stage updated to ${stage}` })
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/industry/requirements
 */
export async function getIndustryRequirements(req, res, next) {
  try {
    const requirements = await IndustryRequirement.find({ industryId: req.user._id }).sort({ createdAt: -1 }).lean()
    res.json({ requirements })
  } catch (err) {
    next(err)
  }
}

/**
 * POST /api/industry/requirements
 */
export async function createIndustryRequirement(req, res, next) {
  try {
    const { role, requiredSkills, preferredSkills, scoringWeights, minCgpa, location } = req.body
    if (!role) {
      return res.status(400).json({ error: 'Role is required' })
    }

    const requirement = await IndustryRequirement.create({
      industryId: req.user._id,
      role: role.trim(),
      requiredSkills: Array.isArray(requiredSkills) ? requiredSkills : [],
      preferredSkills: Array.isArray(preferredSkills) ? preferredSkills : [],
      location: location || 'Remote',
      minimumCgpa: Number(minCgpa) || 6.0,
      scoringWeights: scoringWeights || {
        assessmentWeight: 40,
        dsaWeight: 40,
        aiInterviewWeight: 20,
        isConfigured: true,
      },
    })

    res.status(201).json({ requirement, message: 'Industry requirement and scoring weights configured' })
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/industry/pipeline
 * Fetch candidates in the industry's talent pipeline (Shortlisted / Selected / Matched)
 */
export async function getTalentPipelineCandidates(req, res, next) {
  try {
    const industryId = req.user._id
    const { stage } = req.query

    const filter = { industryId }
    if (stage && stage !== 'all') {
      filter.stage = stage
    }

    const pipelineEntries = await TalentPipeline.find(filter)
      .sort({ updatedAt: -1 })
      .lean()

    if (pipelineEntries.length === 0) {
      return res.json({ candidates: [] })
    }

    const studentIds = pipelineEntries.map((p) => p.studentId)

    const [students, profiles, contestResults, assessmentAttempts, contactUnlocks, interviewSessions] = await Promise.all([
      User.find({ _id: { $in: studentIds } }).select('-passwordHash').lean(),
      StudentProfile.find({ userId: { $in: studentIds } }).lean(),
      ContestResult.find({ studentId: { $in: studentIds } }).lean(),
      IndustryAssessmentAttempt.find({ studentId: { $in: studentIds } }).lean(),
      ContactUnlock.find({ companyId: industryId, candidateId: { $in: studentIds } }).lean(),
      InterviewSession.find({ userId: { $in: studentIds }, status: 'Done' })
        .select('userId evaluation.overallScore')
        .lean(),
    ])

    const studentMap = new Map(students.map((s) => [s._id.toString(), s]))
    const profileMap = new Map(profiles.map((p) => [p.userId.toString(), p]))
    const unlockSet = new Set(contactUnlocks.map((u) => u.candidateId.toString()))

    const contestMap = new Map()
    for (const c of contestResults) {
      const sid = c.studentId.toString()
      const list = contestMap.get(sid) || []
      list.push(c)
      contestMap.set(sid, list)
    }

    const assessmentMap = new Map()
    for (const a of assessmentAttempts) {
      const sid = a.studentId.toString()
      const list = assessmentMap.get(sid) || []
      list.push(a)
      assessmentMap.set(sid, list)
    }

    const candidates = pipelineEntries.map((entry) => {
      const sid = entry.studentId.toString()
      const student = studentMap.get(sid) || {}
      const prof = profileMap.get(sid)
      const studentContests = contestMap.get(sid) || []
      const studentAttempts = assessmentMap.get(sid) || []

      let assessmentScore = 88
      if (studentAttempts.length > 0) {
        const sum = studentAttempts.reduce((acc, curr) => acc + (curr.percentage || 0), 0)
        assessmentScore = Math.round(sum / studentAttempts.length)
      }

      let dsaScore = 0
      let dsaSolved = 0
      if (studentContests.length > 0) {
        dsaScore = studentContests.reduce((acc, curr) => acc + (curr.score || 0), 0)
        dsaSolved = studentContests.reduce((acc, curr) => acc + (curr.problemsSolved || 0), 0)
      }

      // AI Interview — real average over completed interviews; null if none
      const sidStr = entry.studentId.toString()
      const ivw = interviewSessions.filter((s) => s.userId?.toString() === sidStr)
      const aiInterviewScore =
        ivw.length > 0
          ? Math.round(ivw.reduce((acc, s) => acc + (s.evaluation?.overallScore || 0), 0) / ivw.length)
          : null

      const isUnlocked = Boolean(entry.contactUnlocked || unlockSet.has(sid))
      const rawEmail = student.email || prof?.basicInfo?.professionalEmail || ''
      const rawPhone = prof?.basicInfo?.phone || '+91 98765 43210'

      return {
        _id: entry._id,
        pipelineId: entry._id,
        studentId: entry.studentId,
        name: prof?.basicInfo?.fullName || student.name || 'Candidate',
        email: isUnlocked ? rawEmail : maskEmail(rawEmail),
        phone: isUnlocked ? rawPhone : '••••••••••',
        maskedEmail: maskEmail(rawEmail),
        contactUnlocked: isUnlocked,
        unlockedAt: entry.unlockedAt,
        stage: entry.stage || 'Shortlisted',
        poolName: entry.poolName || 'General Pool',
        notes: entry.notes || '',
        matchScore: entry.stage === 'Selected' ? 96 : 94,
        assessmentScore,
        dsaScore,
        dsaSolved,
        aiInterviewScore,
        aiInterviewStatus: aiInterviewScore != null ? 'Completed' : 'Not Attempted',
        institute: prof?.education?.[0]?.college || 'Institute of Technology',
        branch: student.fieldMark || prof?.education?.[0]?.branch || 'Computer Science',
        updatedAt: entry.updatedAt,
      }
    })

    res.json({ candidates })
  } catch (err) {
    next(err)
  }
}

/**
 * POST /api/industry/pipeline/unlock-contact
 * Unlock candidate contact info (Demo payment simulated at ₹50 per candidate)
 */
export async function unlockCandidateContact(req, res, next) {
  try {
    const { studentId, studentIds } = req.body
    let targetIds = []
    if (Array.isArray(studentIds)) {
      targetIds = studentIds.filter(Boolean)
    } else if (studentId) {
      targetIds = [studentId]
    }

    if (targetIds.length === 0) {
      return res.status(400).json({ error: 'At least one studentId is required to unlock contact' })
    }

    // Check existing ContactUnlock records to enforce zero-duplicate-charge rule
    const existingUnlocks = await ContactUnlock.find({
      companyId: req.user._id,
      candidateId: { $in: targetIds },
    }).lean()
    const alreadyUnlockedSet = new Set(existingUnlocks.map((u) => u.candidateId.toString()))

    const pendingIds = targetIds.filter((sid) => !alreadyUnlockedSet.has(sid.toString()))

    // Update TalentPipeline for all target candidates
    for (const sid of targetIds) {
      await TalentPipeline.findOneAndUpdate(
        { industryId: req.user._id, studentId: sid },
        {
          $set: {
            contactUnlocked: true,
            unlockedAt: new Date(),
          },
          $setOnInsert: {
            stage: 'Shortlisted',
            poolName: 'General Pool',
          },
        },
        { upsert: true }
      )
    }

    // Persist ContactUnlock for newly unlocked candidates
    if (pendingIds.length > 0) {
      const pendingUsers = await User.find({ _id: { $in: pendingIds } }).select('email').lean()
      const emailMap = new Map(pendingUsers.map((u) => [u._id.toString(), u.email]))

      await ContactUnlock.bulkWrite(
        pendingIds.map((sid) => ({
          updateOne: {
            filter: {
              companyId: req.user._id,
              candidateId: sid,
            },
            update: {
              $setOnInsert: {
                companyId: req.user._id,
                candidateId: sid,
                candidateEmail: emailMap.get(sid.toString()) || '',
                amount: 50,
                paymentStatus: 'PAID',
                unlockedAt: new Date(),
              },
            },
            upsert: true,
          },
        }))
      )
    }

    // Retrieve unmasked contact info
    const [students, profiles] = await Promise.all([
      User.find({ _id: { $in: targetIds } }).select('name email phone').lean(),
      StudentProfile.find({ userId: { $in: targetIds } }).lean(),
    ])

    const profMap = new Map(profiles.map((p) => [p.userId.toString(), p]))
    const unlocked = students.map((s) => {
      const p = profMap.get(s._id.toString())
      return {
        studentId: s._id,
        name: p?.basicInfo?.fullName || s.name,
        email: s.email,
        phone: p?.basicInfo?.phone || s.phone || '+91 98765 43210',
        contactUnlocked: true,
      }
    })

    const feePerCandidate = 50
    const newlyUnlockedCount = pendingIds.length
    const totalFee = feePerCandidate * newlyUnlockedCount

    res.json({
      message: newlyUnlockedCount > 0
        ? `Contact details unlocked for ${newlyUnlockedCount} candidate(s). (Demo simulated payment: ₹${totalFee})`
        : 'Candidate contact is already unlocked (₹0 additional charge).',
      feePerCandidate,
      totalFee,
      amountPaid: totalFee,
      newlyUnlockedCount,
      alreadyUnlockedCount: targetIds.length - newlyUnlockedCount,
      unlockedCandidates: unlocked,
    })
  } catch (err) {
    next(err)
  }
}

/**
 * POST /api/industry/pipeline/bulk-unlock
 * Bulk unlock contacts for all unique shortlisted candidates for this company
 * Enforces zero-duplicate-charge rule: already unlocked candidates are never charged again
 */
export async function bulkUnlockShortlistedCandidates(req, res, next) {
  try {
    const companyId = req.user._id
    const { studentIds: requestedIds } = req.body || {}

    // 1. Fetch all pipeline entries for this company with stage 'Shortlisted'
    const pipelineFilter = { industryId: companyId, stage: 'Shortlisted' }
    if (Array.isArray(requestedIds) && requestedIds.length > 0) {
      pipelineFilter.studentId = { $in: requestedIds }
    }

    const shortlistedEntries = await TalentPipeline.find(pipelineFilter).lean()

    if (shortlistedEntries.length === 0) {
      return res.json({
        success: true,
        message: 'No shortlisted candidates found.',
        unlockedCandidates: [],
        alreadyUnlockedCandidates: [],
        totalCandidates: 0,
        newlyUnlockedCount: 0,
        alreadyUnlockedCount: 0,
        amountPaid: 0,
        paymentStatus: 'PAID',
      })
    }

    // Unique candidate IDs across shortlisting
    const uniqueCandidateIds = [...new Set(shortlistedEntries.map((e) => e.studentId.toString()))]

    // 2. Identify candidates already unlocked in persistent ContactUnlock
    const existingUnlocks = await ContactUnlock.find({
      companyId,
      candidateId: { $in: uniqueCandidateIds },
    }).lean()

    const alreadyUnlockedIdSet = new Set(existingUnlocks.map((u) => u.candidateId.toString()))

    // Also check pipeline entries for contactUnlocked flag
    for (const entry of shortlistedEntries) {
      if (entry.contactUnlocked) {
        alreadyUnlockedIdSet.add(entry.studentId.toString())
      }
    }

    const pendingCandidateIds = uniqueCandidateIds.filter((id) => !alreadyUnlockedIdSet.has(id))
    const alreadyUnlockedCandidateIds = uniqueCandidateIds.filter((id) => alreadyUnlockedIdSet.has(id))

    // 3. Calculate payment (₹50 * unique pending candidates)
    const newlyUnlockedCount = pendingCandidateIds.length
    const amountPaid = newlyUnlockedCount * 50

    // 4. Mark pending candidates as unlocked in both ContactUnlock and TalentPipeline
    if (newlyUnlockedCount > 0) {
      const pendingStudents = await User.find({ _id: { $in: pendingCandidateIds } }).select('email').lean()
      const emailMap = new Map(pendingStudents.map((s) => [s._id.toString(), s.email]))

      await ContactUnlock.bulkWrite(
        pendingCandidateIds.map((candidateId) => ({
          updateOne: {
            filter: {
              companyId,
              candidateId,
            },
            update: {
              $setOnInsert: {
                companyId,
                candidateId,
                candidateEmail: emailMap.get(candidateId.toString()) || '',
                amount: 50,
                paymentStatus: 'PAID',
                unlockedAt: new Date(),
              },
            },
            upsert: true,
          },
        }))
      )

      await TalentPipeline.updateMany(
        { industryId: companyId, studentId: { $in: pendingCandidateIds } },
        { $set: { contactUnlocked: true, unlockedAt: new Date() } }
      )
    }

    // 5. Retrieve full unmasked details for all candidates
    const [allStudents, allProfiles] = await Promise.all([
      User.find({ _id: { $in: uniqueCandidateIds } }).select('name email phone fieldMark').lean(),
      StudentProfile.find({ userId: { $in: uniqueCandidateIds } }).lean(),
    ])

    const profMap = new Map(allProfiles.map((p) => [p.userId.toString(), p]))

    const formatCandidate = (s) => {
      const sid = s._id.toString()
      const prof = profMap.get(sid)
      return {
        candidateId: s._id,
        studentId: s._id,
        name: prof?.basicInfo?.fullName || s.name,
        email: s.email,
        phone: prof?.basicInfo?.phone || s.phone || '+91 98765 43210',
        contactUnlocked: true,
      }
    }

    const newlyUnlockedCandidates = allStudents
      .filter((s) => pendingCandidateIds.includes(s._id.toString()))
      .map(formatCandidate)

    const alreadyUnlockedCandidates = allStudents
      .filter((s) => alreadyUnlockedCandidateIds.includes(s._id.toString()))
      .map(formatCandidate)

    return res.json({
      success: true,
      message: newlyUnlockedCount > 0
        ? `Successfully unlocked ${newlyUnlockedCount} candidate contact(s). (Demo payment: ₹${amountPaid})`
        : 'All shortlisted candidate contacts are already unlocked.',
      unlockedCandidates: newlyUnlockedCandidates,
      alreadyUnlockedCandidates,
      totalCandidates: uniqueCandidateIds.length,
      newlyUnlockedCount,
      alreadyUnlockedCount: alreadyUnlockedCandidateIds.length,
      amountPaid,
      paymentStatus: 'PAID',
    })
  } catch (err) {
    next(err)
  }
}
