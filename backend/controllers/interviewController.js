import InterviewSession from '../models/InterviewSession.js'
import StudentProfile from '../models/StudentProfile.js'
import {
  askGemini,
  isGeminiConfigured,
  getDifficultyPlan,
  buildTurnMessages,
  parseInterviewDecision,
  buildEvaluationMessages,
  parseInterviewEvaluation,
} from '../services/geminiService.js'

// ── Helpers ──────────────────────────────────────────────────────────

function sanitizeString(value, maxLen = 120) {
  if (typeof value !== 'string') return ''
  return value.trim().slice(0, maxLen)
}

/**
 * Build a compact profile summary used to personalize questions.
 * The candidate never re-enters information already stored here.
 */
function buildProfileSummary(profile, user) {
  if (!profile && !user) return ''

  const lines = []
  const name = profile?.basicInfo?.fullName || user?.name
  if (name) lines.push(`Name: ${name}`)

  const edu = profile?.education?.[0]
  if (edu) {
    const parts = [edu.degree, edu.branch, edu.college, edu.graduationYear].filter(Boolean)
    if (edu.cgpa) parts.push(`CGPA ${edu.cgpa}`)
    if (parts.length) lines.push(`Education: ${parts.join(', ')}`)
  }

  if (profile?.careerTarget?.targetJobRole) {
    lines.push(`Stated target role: ${profile.careerTarget.targetJobRole}`)
  }

  if (profile?.skills) {
    const all = Object.values(profile.skills)
      .filter((arr) => Array.isArray(arr))
      .flat()
    if (all.length) lines.push(`Skills: ${all.join(', ')}`)
  }

  if (profile?.projects?.length) {
    lines.push(
      'Projects: ' +
        profile.projects
          .slice(0, 4)
          .map(
            (p) =>
              `${p.name || 'Untitled'}${p.technologiesUsed?.length ? ` (using ${p.technologiesUsed.join(', ')})` : ''}${p.description ? ` — ${String(p.description).slice(0, 150)}` : ''}`
          )
          .join('; ')
    )
  }

  if (profile?.internships?.length) {
    lines.push(
      'Internships: ' +
        profile.internships
          .slice(0, 3)
          .map((i) => `${i.role || 'Role'} at ${i.companyName || 'company'}`)
          .join('; ')
    )
  }

  if (profile?.hackathons?.length) {
    lines.push(
      'Hackathons: ' + profile.hackathons.slice(0, 3).map((h) => h.name).filter(Boolean).join('; ')
    )
  }

  if (profile?.certifications?.length) {
    lines.push(
      'Certifications: ' +
        profile.certifications.slice(0, 4).map((c) => c.name).filter(Boolean).join('; ')
    )
  }

  if (profile?.codingProfiles?.length) {
    lines.push(
      'Coding profiles: ' +
        profile.codingProfiles
          .slice(0, 3)
          .map((c) => `${c.platform || 'platform'}${c.problemsSolved ? ` (${c.problemsSolved} problems)` : ''}`)
          .join('; ')
    )
  }

  if (profile?.basicInfo?.githubUrl) lines.push(`GitHub: ${profile.basicInfo.githubUrl}`)
  if (profile?.basicInfo?.portfolioUrl) lines.push(`Portfolio: ${profile.basicInfo.portfolioUrl}`)

  return lines.join('\n')
}

/**
 * Recommended skills for step 2 — derived from the candidate's own profile
 * skills plus the target role, so they never type what already exists.
 * Role/level-aware weighting is heuristic here; the AI personalizes the
 * questions themselves at interview time.
 */
function recommendSkills(profile, role, level) {
  const byCategory = profile?.skills || {}
  const flatten = (arr) => (Array.isArray(arr) ? arr.filter(Boolean) : [])
  const recommended = []
  const seen = new Set()
  const push = (name) => {
    const key = name.toLowerCase().trim()
    if (!key || seen.has(key)) return
    seen.add(key)
    recommended.push(name)
  }

  const roleLower = (role || '').toLowerCase()
  const isFrontend = /front|react|web|ui/.test(roleLower)
  const isBackend = /back|node|api|server|java|python/.test(roleLower)
  const isFullstack = /full|stack/.test(roleLower)

  if (isFrontend || isFullstack || !roleLower) {
    flatten(byCategory.frontend).slice(0, 3).forEach(push)
  }
  if (isBackend || isFullstack || !roleLower) {
    flatten(byCategory.backend).slice(0, 3).forEach(push)
  }
  flatten(byCategory.programmingLanguages).slice(0, 2).forEach(push)
  flatten(byCategory.database).slice(0, 2).forEach(push)
  flatten(byCategory.tools).slice(0, 1).forEach(push)
  flatten(byCategory.cloudDevOps).slice(0, 1).forEach(push)
  flatten(byCategory.aiMl).slice(0, 1).forEach(push)

  // Guarantee at least a few recommendations even with an empty profile
  if (recommended.length < 3) {
    ;['JavaScript', 'Data Structures', 'Communication'].forEach(push)
  }
  return recommended.slice(0, 10)
}

function difficultyTargets(plan) {
  return { minQuestions: plan.minQuestions, maxQuestions: plan.maxQuestions }
}

// ── POST /api/interview/create ───────────────────────────────────────
// Step 1 + step 2 combined: persist configuration and return profile-based
// skill recommendations for confirmation.
export async function createInterview(req, res, next) {
  try {
    const { role, company, level, selectedSkills } = req.body

    const safeRole = sanitizeString(role, 80)
    const safeCompany = sanitizeString(company, 80)
    const safeLevel = ['Beginner', 'Intermediate', 'Advanced'].includes(level)
      ? level
      : 'Intermediate'
    const skills = Array.isArray(selectedSkills)
      ? selectedSkills.filter((s) => typeof s === 'string' && s.trim()).map((s) => s.trim().slice(0, 60)).slice(0, 10)
      : []

    if (!safeRole) {
      return res.status(400).json({ error: 'Target role is required' })
    }
    if (skills.length === 0) {
      return res.status(400).json({ error: 'At least one selected skill is required' })
    }

    const profile = await StudentProfile.findOne({ userId: req.user._id }).lean()
    const profileSummary = buildProfileSummary(profile, req.user)

    const plan = getDifficultyPlan(safeLevel)
    const session = await InterviewSession.create({
      userId: req.user._id,
      role: safeRole,
      company: safeCompany,
      level: safeLevel,
      selectedSkills: skills,
      status: 'Pre',
      turns: [],
      config: {
        profileSummary,
        difficultyPlan: difficultyTargets(plan),
        recommendedSkills: recommendSkills(profile, safeRole, safeLevel),
      },
    })

    res.status(201).json({
      sessionId: session._id,
      role: session.role,
      company: session.company,
      level: session.level,
      selectedSkills: session.selectedSkills,
      recommendedSkills: session.config?.recommendedSkills || [],
    })
  } catch (err) {
    next(err)
  }
}

// ── GET /api/interview/skills?role=&company=&level= ──────────────────
// Returns profile-derived skill recommendations before session creation
// (used by setup step 2 while the user is still choosing).
export async function getRecommendedSkills(req, res, next) {
  try {
    const profile = await StudentProfile.findOne({ userId: req.user._id }).lean()
    const role = sanitizeString(req.query.role, 80)
    const level = sanitizeString(req.query.level, 20)
    res.json({ recommendedSkills: recommendSkills(profile, role, level) })
  } catch (err) {
    next(err)
  }
}

// ── POST /api/interview/:id/start ────────────────────────────────────
// Generates the interviewer's first question.
export async function startInterview(req, res, next) {
  try {
    const session = await InterviewSession.findOne({
      _id: req.params.id,
      userId: req.user._id,
    })
    if (!session) {
      return res.status(404).json({ error: 'Interview not found' })
    }
    if (!isGeminiConfigured()) {
      return res.status(503).json({ error: 'AI service is not configured. Contact the administrator.' })
    }

    // Resume support: if the interview already started, return its state.
    if (session.status !== 'Pre' || session.turns.length > 0) {
      const lastInterviewer = [...session.turns].reverse().find((t) => t.speaker === 'interviewer')
      return res.json({
        status: session.status,
        question: lastInterviewer?.text || '',
        questionType: lastInterviewer?.questionType || 'introduction',
        skillTag: lastInterviewer?.skillTag || '',
        finished: session.status === 'Done',
      })
    }

    const plan = getDifficultyPlan(session.level)
    const messages = buildTurnMessages({ interview: session, transcript: [], difficultyPlan: plan })

    const aiResponse = await askGemini(messages)
    const decision = parseInterviewDecision(aiResponse, plan)

    if (decision.finished) {
      // Degenerate case: AI refused to start. Give a sane opening question.
      decision.message = `Hi${session.company ? `, and welcome — thanks for speaking with ${session.company}` : ''}! To start, could you briefly introduce yourself and walk me through a project you've worked on recently?`
      decision.questionType = 'introduction'
      decision.skillTag = session.selectedSkills[0] || ''
      decision.finished = false
    }

    session.turns.push({
      speaker: 'interviewer',
      text: decision.message,
      questionType: decision.questionType || 'introduction',
      skillTag: decision.skillTag || '',
      createdAt: new Date(),
    })
    session.status = 'InProgress'
    await session.save()

    const targets = session.config?.difficultyPlan || difficultyTargets(plan)
    res.json({
      status: session.status,
      question: decision.message,
      questionType: decision.questionType,
      skillTag: decision.skillTag,
      finished: false,
      minQuestions: targets.minQuestions,
      maxQuestions: targets.maxQuestions,
    })
  } catch (err) {
    if (err?.message?.includes('GEMINI')) {
      return res.status(502).json({ error: 'AI service is temporarily unavailable. Please try again.' })
    }
    next(err)
  }
}

// ── POST /api/interview/:id/respond ──────────────────────────────────
// Records the candidate's confirmed answer and generates the next
// adaptive question.
export async function respondInterview(req, res, next) {
  try {
    const { answer } = req.body
    const text = typeof answer === 'string' ? answer.trim() : ''
    if (!text) {
      return res.status(400).json({ error: 'Answer text is required' })
    }
    if (text.length > 5000) {
      return res.status(400).json({ error: 'Answer is too long' })
    }

    const session = await InterviewSession.findOne({
      _id: req.params.id,
      userId: req.user._id,
    })
    if (!session) {
      return res.status(404).json({ error: 'Interview not found' })
    }
    if (session.status === 'Done') {
      return res.status(409).json({ error: 'This interview is already completed', completed: true })
    }
    if (session.status === 'Pre') {
      return res.status(400).json({ error: 'Interview has not started yet' })
    }
    if (!isGeminiConfigured()) {
      return res.status(503).json({ error: 'AI service is not configured. Contact the administrator.' })
    }

    // Record the candidate's confirmed transcript as the answer.
    session.turns.push({
      speaker: 'candidate',
      text,
      questionType: '',
      skillTag: '',
      createdAt: new Date(),
    })

    const plan = getDifficultyPlan(session.level)
    const questionCount = session.turns.filter((t) => t.speaker === 'interviewer').length
    const isFinalTurn = questionCount >= plan.maxQuestions

    const messages = buildTurnMessages({
      interview: session,
      transcript: session.turns,
      difficultyPlan: plan,
      isFinalTurn,
    })

    const aiResponse = await askGemini(messages)
    const decision = parseInterviewDecision(aiResponse, plan)

    // Guard against AI prematurely finishing before the minimum questions.
    const belowMinimum = questionCount < plan.minQuestions
    if (decision.finished && belowMinimum) {
      decision.finished = false
      decision.message = decision.message || 'Could you elaborate a bit more on that?'
      decision.questionType = 'follow-up'
    }

    let evaluation = null
    if (decision.finished) {
      session.turns.push({
        speaker: 'interviewer',
        text: decision.message,
        questionType: 'wrap-up',
        skillTag: '',
        createdAt: new Date(),
      })
      // Persist the answer + wrap-up first so nothing is lost even if the
      // evaluation call below fails.
      session.status = 'Done'
      session.completedAt = new Date()
      await session.save()
      return res.json({ finished: true, message: decision.message })
    }

    session.turns.push({
      speaker: 'interviewer',
      text: decision.message,
      questionType: decision.questionType || 'follow-up',
      skillTag: decision.skillTag || '',
      createdAt: new Date(),
    })
    await session.save()

    const targets = session.config?.difficultyPlan || difficultyTargets(plan)
    res.json({
      finished: false,
      message: decision.message,
      questionType: decision.questionType,
      skillTag: decision.skillTag,
      minQuestions: targets.minQuestions,
      maxQuestions: targets.maxQuestions,
    })
  } catch (err) {
    if (err?.message?.includes('GEMINI')) {
      return res.status(502).json({ error: 'AI service is temporarily unavailable. Please try again.' })
    }
    next(err)
  }
}

// ── POST /api/interview/:id/finish ───────────────────────────────────
// Completes the interview and runs the Gemini evaluation. Idempotent:
// finishing an already-finished interview returns the existing result.
export async function finishInterview(req, res, next) {
  try {
    const session = await InterviewSession.findOne({
      _id: req.params.id,
      userId: req.user._id,
    })
    if (!session) {
      return res.status(404).json({ error: 'Interview not found' })
    }

    // Idempotent completion — return the stored result.
    if (session.status === 'Done' && session.evaluation && session.title) {
      return res.json({ alreadyCompleted: true, session })
    }

    if (!isGeminiConfigured()) {
      return res.status(503).json({ error: 'AI service is not configured. Contact the administrator.' })
    }

    // Mark Done BEFORE the AI call so a crashed evaluation still leaves a
    // recoverable record (re-calling finish retries the evaluation).
    if (session.status !== 'Done') {
      session.status = 'Done'
      session.completedAt = new Date()
      await session.save()
    }

    const messages = buildEvaluationMessages({ interview: session, transcript: session.turns })
    const aiResponse = await askGemini(messages)
    const evaluation = parseInterviewEvaluation(aiResponse, session)

    session.evaluation = {
      overallScore: evaluation.overallScore,
      demonstratedLevel: evaluation.demonstratedLevel,
      assessedSkills: evaluation.assessedSkills,
      notAssessedSkills: evaluation.notAssessedSkills,
      communication: evaluation.communication,
      problemSolving: evaluation.problemSolving,
      overallStrengths: evaluation.overallStrengths,
      overallWeaknesses: evaluation.overallWeaknesses,
      summary: evaluation.summary,
    }
    session.title = evaluation.title
    await session.save()

    res.json({ alreadyCompleted: false, session })
  } catch (err) {
    // If evaluation failed after marking Done, allow a retry on the next
    // finish call (evaluation is still missing, so the idempotency check
    // above will not short-circuit).
    if (err?.message?.includes('GEMINI')) {
      return res.status(502).json({
        error: 'Interview completed, but evaluation failed. Please retry to generate your results.',
        retryable: true,
      })
    }
    next(err)
  }
}

// ── GET /api/interview/mine ──────────────────────────────────────────
// Compact list for the Previous Interviews panel. Ownership enforced by
// the userId filter.
export async function getMyInterviews(req, res, next) {
  try {
    const sessions = await InterviewSession.find({ userId: req.user._id })
      .select('title role company level status selectedSkills evaluation.overallScore createdAt completedAt')
      .sort({ createdAt: -1 })
      .limit(20)
      .lean()
    res.json({ interviews: sessions })
  } catch (err) {
    next(err)
  }
}

// ── GET /api/interview/:id ───────────────────────────────────────────
// Full detail for one interview. Ownership verified — another user's
// interview returns 404 (does not leak existence).
export async function getInterviewById(req, res, next) {
  try {
    const session = await InterviewSession.findOne({
      _id: req.params.id,
      userId: req.user._id,
    }).lean()
    if (!session) {
      return res.status(404).json({ error: 'Interview not found' })
    }
    res.json({ interview: session })
  } catch (err) {
    next(err)
  }
}

// ── GET /api/interview/results/me ────────────────────────────────────
// Interview skill averages for the Skill Matrix — computed ONLY from
// interviews where the skill was actually assessed. Never mixed with
// the traditional SkillResult system.
export async function getMyInterviewSkillResults(req, res, next) {
  try {
    const sessions = await InterviewSession.find({
      userId: req.user._id,
      status: 'Done',
      'evaluation.assessedSkills.0': { $exists: true },
    })
      .select('evaluation.assessedSkills level createdAt')
      .lean()

    // skill name (lowercase) → { scores: [], display: string }
    const bySkill = new Map()
    for (const session of sessions) {
      for (const assessed of session.evaluation.assessedSkills || []) {
        if (!assessed?.skill || typeof assessed.score !== 'number') continue
        const key = assessed.skill.toLowerCase().trim()
        if (!bySkill.has(key)) bySkill.set(key, { display: assessed.skill, scores: [] })
        bySkill.get(key).scores.push(assessed.score)
      }
    }

    const skills = [...bySkill.values()].map((entry) => {
      const average = Math.round(entry.scores.reduce((a, b) => a + b, 0) / entry.scores.length)
      let level
      if (average >= 75) level = 'Strong'
      else if (average >= 60) level = 'Intermediate'
      else if (average >= 40) level = 'Beginner'
      else level = 'Needs Improvement'
      return {
        skill: entry.display,
        averageScore: average,
        level,
        interviewsCount: entry.scores.length,
      }
    })

    skills.sort((a, b) => b.averageScore - a.averageScore)

    res.json({ skills, interviewsCompleted: sessions.length })
  } catch (err) {
    next(err)
  }
}
