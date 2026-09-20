// Gemini-direct service for the AI Interviewer.
// Ported/adapted from ai-interviewer/apps/backend (omniroute.ts Gemini path,
// interview-prompts.ts, result.ts) — reduced to direct Gemini REST calls,
// converted to plain ESM JavaScript, and reshaped for the interview model.
//
// GEMINI_API_KEY never leaves the backend.

const GEMINI_TIMEOUT_MS = 20000

// Candidate models in order of responsiveness & quota stability.
// Updated after the retired 1.5/2.0 IDs (and 2.5 IDs, which are closed to
// new API keys) started returning 404. All three below were live-verified
// with the configured key: 3.6-flash + 3.5-flash-lite return 200, and
// gemini-flash-latest is an evergreen alias that always tracks a current
// flash model as a safety net.
const CANDIDATE_MODELS = [
  'gemini-3.6-flash',
  'gemini-flash-latest',
  'gemini-3.5-flash-lite',
]

export function isGeminiConfigured() {
  return Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim())
}

/**
 * Core chat call. messages: [{ role: 'system'|'user'|'assistant', content }]
 * options.maxOutputTokens overrides the default ceiling (the final evaluation
 * JSON is much larger than a single interview turn and needs more room).
 * Returns plain text, or throws with a readable message.
 */
export async function askGemini(messages, options = {}) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured on the backend.')
  }

  const systemMessage = messages.find((m) => m.role === 'system')?.content
  const conversationTurns = messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }))

  // Gemini requires at least one user turn.
  if (conversationTurns.length === 0) {
    conversationTurns.push({
      role: 'user',
      parts: [{ text: systemMessage || 'Please begin the interview.' }],
    })
  }

  const requestBody = {
    contents: conversationTurns,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: options.maxOutputTokens || 2048,
    },
  }
  if (systemMessage) {
    requestBody.systemInstruction = { parts: [{ text: systemMessage }] }
  }

  let lastError = null
  for (const model of CANDIDATE_MODELS) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS)
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      })
      const text = await response.text()
      let data = {}
      try {
        data = JSON.parse(text)
      } catch {
        data = {}
      }
      if (response.ok) {
        const content = data?.candidates?.[0]?.content?.parts?.[0]?.text
        if (typeof content === 'string' && content.trim()) {
          return content.trim()
        }
        lastError = new Error('Gemini returned an empty response.')
      } else {
        lastError = new Error(data?.error?.message || `Gemini HTTP ${response.status}`)
      }
    } catch (err) {
      lastError = err?.name === 'AbortError'
        ? new Error(`Gemini request timed out after ${GEMINI_TIMEOUT_MS / 1000}s`)
        : err
    } finally {
      clearTimeout(timeoutId)
    }
  }
  throw lastError || new Error('All Gemini models failed.')
}

/**
 * Extract and parse a JSON object from an AI response. Handles markdown
 * code fences, leading prose, and trailing commas. Returns {} on failure —
 * callers must treat an empty result as "generate a safe fallback".
 */
export function parseAiJson(responseText) {
  if (typeof responseText !== 'string' || !responseText.trim()) return {}
  let candidate = responseText
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim()
  const start = candidate.indexOf('{')
  const end = candidate.lastIndexOf('}')
  if (start >= 0 && end > start) {
    candidate = candidate.slice(start, end + 1)
  } else {
    return {}
  }
  try {
    return JSON.parse(candidate)
  } catch {
    try {
      return JSON.parse(candidate.replace(/,\s*([}\]])/g, '$1'))
    } catch {
      return {}
    }
  }
}

function clampScore(value, fallback = 0) {
  const num = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(num)) return fallback
  return Math.max(0, Math.min(100, Math.round(num)))
}

function stringList(value, maxItems = 6) {
  if (!Array.isArray(value)) return []
  return value
    .filter((s) => typeof s === 'string' && s.trim())
    .map((s) => s.trim())
    .slice(0, maxItems)
}

function normalizeLevel(value, fallback = 'Intermediate') {
  return ['Beginner', 'Intermediate', 'Advanced'].includes(value) ? value : fallback
}

// ── Skill recommendation (setup step 2) ──────────────────────────────
// Role/company/level-driven. The candidate's profile is ONLY context for
// personalization — profile skills are never blindly copied into the
// recommendation list or auto-selected as interview skills.

/** Role-keyword → relevant skills table for the no-AI fallback. */
const ROLE_SKILL_TABLE = [
  { re: /front|react|web|ui/, skills: ['JavaScript', 'React', 'HTML & CSS', 'State Management', 'Responsive Design'] },
  { re: /back|node|api|server/, skills: ['Node.js', 'REST APIs', 'Express.js', 'Databases', 'Authentication & Security'] },
  { re: /full|stack/, skills: ['JavaScript', 'React', 'Node.js', 'REST APIs', 'MongoDB', 'Deployment Basics'] },
  { re: /mobile|android|flutter|ios/, skills: ['Mobile UI Design', 'State Management', 'REST APIs', 'App Lifecycle'] },
  { re: /data|ml|ai|machine/, skills: ['Python', 'Data Analysis', 'Machine Learning Basics', 'Statistics', 'SQL'] },
  { re: /devops|cloud|sre|platform/, skills: ['Linux Basics', 'Docker', 'CI/CD', 'Cloud Fundamentals', 'Networking Basics'] },
  { re: /java|spring/, skills: ['Java', 'OOP Concepts', 'Spring Boot', 'REST APIs', 'SQL'] },
  { re: /python|django/, skills: ['Python', 'Django', 'REST APIs', 'SQL', 'Data Structures'] },
  { re: /qa|test|sdet/, skills: ['Testing Fundamentals', 'Automation Basics', 'API Testing', 'Selenium Basics'] },
]

/**
 * Deterministic role-relevant fallback used when Gemini is unavailable.
 * Never returns the candidate's whole profile skill list — at most one
 * profile skill may appear per category, and only for the matched role.
 */
export function fallbackSkillRecommendations(role, profile = null, level = '') {
  const roleLower = (role || '').toLowerCase()
  const matched = ROLE_SKILL_TABLE.filter((e) => e.re.test(roleLower))
  const base = matched.length
    ? matched.flatMap((e) => e.skills)
    : ['JavaScript', 'Data Structures', 'REST APIs', 'SQL', 'Git & Version Control']

  // Level-aware augmentation (one extra topic).
  if (level === 'Advanced') base.push('System Design Basics')
  else if (level === 'Beginner') base.push('Programming Fundamentals')

  const out = []
  const seen = new Set()
  const push = (name) => {
    const key = String(name).toLowerCase().trim()
    if (!key || seen.has(key)) return
    seen.add(key)
    out.push(String(name).trim())
  }
  base.forEach(push)

  // Light personalization: up to 2 of the candidate's own skills, strictly
  // capped — profile skills must never flood the recommendation list.
  if (profile?.skills) {
    const own = Object.values(profile.skills)
      .filter((arr) => Array.isArray(arr))
      .flat()
      .filter(Boolean)
    own.slice(0, 2).forEach(push)
  }
  return out.slice(0, 8)
}

/**
 * AI-generated skill recommendations for the interview setup (step 2).
 * Uses role + company + level as the primary signal and the profile summary
 * only as background context. Returns a clean string list, or null when
 * Gemini is not configured / fails / returns nothing usable (caller falls
 * back to fallbackSkillRecommendations).
 */
export async function recommendInterviewSkills({ role, company, level, profileSummary }) {
  if (!isGeminiConfigured()) return null

  const system = [
    'You are a technical interview designer for a college placement platform.',
    'Given a target role, optional target company, candidate level, and short candidate background, recommend 5-8 concrete skills to assess in a mock interview.',
    'RULES:',
    '- Skills must be directly relevant to the role/company — general software skills only fill gaps.',
    '- Prefer widely recognized skill names (e.g. "React", "Node.js", "REST APIs", "SQL").',
    '- Use the candidate background only to make topics relevant; do NOT dump their whole skill list.',
    '- Each skill must be assessable through spoken Q&A in a short interview.',
    'Reply with ONLY JSON: {"skills": ["...", "..."]}',
  ].join('\n')

  const user = [
    `Target role: ${role}`,
    company ? `Target company: ${company}` : 'Target company: (not specified)',
    `Candidate level: ${level || 'Intermediate'}`,
    '',
    'Candidate background (context only):',
    profileSummary || '(no profile information provided)',
  ].join('\n')

  try {
    const response = await askGemini([
      { role: 'system', content: system },
      { role: 'user', content: user },
    ])
    const parsed = parseAiJson(response)
    if (!Array.isArray(parsed.skills)) return null
    const skills = []
    const seen = new Set()
    for (const item of parsed.skills) {
      if (typeof item !== 'string') continue
      const name = item.trim().slice(0, 60)
      const key = name.toLowerCase()
      if (!name || seen.has(key)) continue
      seen.add(key)
      skills.push(name)
      if (skills.length >= 10) break
    }
    return skills.length > 0 ? skills : null
  } catch {
    return null
  }
}

/**
 * Difficulty plan for a level. Questions target SLIGHTLY EASIER than the
 * selected level (hard requirement): Advanced → upper-intermediate,
 * Intermediate → solid fundamentals, Beginner → gentle basics.
 */
export function getDifficultyPlan(level) {
  if (level === 'Beginner') {
    return {
      minQuestions: 5,
      maxQuestions: 6,
      questionGuidance:
        'Questions should be gently below Beginner level: simple fundamentals, definitions, and short practical checks. Build confidence. Ask one thing at a time.',
    }
  }
  if (level === 'Advanced') {
    return {
      minQuestions: 7,
      maxQuestions: 8,
      questionGuidance:
        'Questions should sit at UPPER-INTERMEDIATE / moderate-advanced — slightly easier than the Advanced label. Depth, trade-offs, and edge cases are welcome, but do NOT start with expert-level system design or extreme internals. Escalate gradually.',
    }
  }
  return {
    minQuestions: 6,
    maxQuestions: 7,
    questionGuidance:
      'Questions should be at a comfortable intermediate level — slightly easier than what a strong Intermediate candidate expects. Focus on fundamentals plus one practical scenario.',
  }
}

/**
 * Build the system prompt for the interviewer. Uses profile context so the
 * candidate never re-enters information InternSetu already stores.
 */
export function buildInterviewSystemPrompt({ interview, profileSummary, difficultyPlan }) {
  const skills = (interview.selectedSkills || []).join(', ') || 'general engineering'
  const companyLine = interview.company
    ? `The candidate is interviewing with ${interview.company}.`
    : 'No specific company was named.'

  return [
    `You are a friendly but rigorous technical interviewer for the role "${interview.role || 'Software Engineer'}". ${companyLine}`,
    ``,
    `The candidate SELF-ASSESSED as ${interview.level}. ${difficultyPlan.questionGuidance}`,
    ``,
    `Selected interview skill scope (stay within these topics): ${skills}.`,
    ``,
    `CANDIDATE BACKGROUND (from their InternSetu profile — use it to personalize questions; do NOT invent experience they do not have):`,
    profileSummary || '(No profile information available.)',
    ``,
    `RULES:`,
    `- Ask ONE question at a time and keep it short enough to be spoken aloud.`,
    `- Never repeat a question you already asked. Track covered topics.`,
    `- Start with a brief warm introduction question about the candidate's background or a project.`,
    `- ADAPT to the previous answer: if it was strong, go one step deeper (edge case, trade-off, debugging scenario). If it was weak or vague, ask a SIMPLER clarifying question about the same concept before moving on.`,
    `- Rotate across the selected skills; if the candidate clearly mastered one, move to another.`,
    `- Occasionally ask practical/debugging or project-specific questions grounded in the candidate's real projects.`,
    `- Questions must be answerable by voice in under 2 minutes.`,
    `- Do not mention that you are an AI or that this is a mock.`,
  ].join('\n')
}

/**
 * Build the per-turn instruction. Returns the message list for askGemini.
 */
export function buildTurnMessages({ interview, transcript, difficultyPlan, isFinalTurn }) {
  const conversation = transcript
    .map((t) => `${t.speaker === 'interviewer' ? 'INTERVIEWER' : 'CANDIDATE'}: ${t.text}`)
    .join('\n\n')

  const questionCount = transcript.filter((t) => t.speaker === 'interviewer').length
  const nearEnd = questionCount >= difficultyPlan.maxQuestions - 1

  const turnInstruction = isFinalTurn || nearEnd
    ? [
        `This is the final turn. Thank the candidate briefly and close the interview naturally.`,
        `Reply with ONLY JSON:`,
        `{"finished": true, "message": "<short closing line>", "questionType": "wrap-up", "skillTag": ""}`,
      ].join('\n')
    : [
        `Decide the next interviewer turn based on the conversation so far.`,
        `You have asked ${questionCount} question(s) so far (plan: ${difficultyPlan.minQuestions}-${difficultyPlan.maxQuestions} total).`,
        `If the interview is complete enough, set finished=true and give a short closing message.`,
        `Reply with ONLY JSON:`,
        `{"finished": false, "message": "<the next interviewer question, spoken naturally>", "questionType": "introduction|conceptual|practical|debugging|scenario|project|follow-up|behavioral", "skillTag": "<one of the selected skills this question probes>", "difficultyNote": "easier|same|deeper"}`,
      ].join('\n')

  return [
    {
      role: 'system',
      content: buildInterviewSystemPrompt({
        interview,
        profileSummary: interview?.config?.profileSummary,
        difficultyPlan,
      }),
    },
    {
      role: 'user',
      content: [
        `CONVERSATION SO FAR:`,
        conversation || '(empty — this is the first turn)',
        ``,
        turnInstruction,
      ].join('\n'),
    },
  ]
}

/**
 * Parse the per-turn decision JSON into a safe shape.
 */
export function parseInterviewDecision(responseText, difficultyPlan) {
  const parsed = parseAiJson(responseText)
  const message = typeof parsed.message === 'string' && parsed.message.trim()
    ? parsed.message.trim()
    : ''

  const finished = parsed.finished === true || !message

  return {
    finished,
    message: message || 'Thank you for your time. That concludes our interview — let me prepare your performance summary.',
    questionType: typeof parsed.questionType === 'string' ? parsed.questionType : 'follow-up',
    skillTag: typeof parsed.skillTag === 'string' ? parsed.skillTag : '',
  }
}

/**
 * Build the evaluation prompt and parse the final evaluation.
 * HARD RULE: only skills actually tested get scores (assessedSkills);
 * untested selected skills are listed in notAssessedSkills with a reason.
 */
export function buildEvaluationMessages({ interview, transcript }) {
  const conversation = transcript
    .map((t) => `${t.speaker === 'interviewer' ? 'INTERVIEWER' : 'CANDIDATE'}: ${t.text}`)
    .join('\n\n')

  const selectedSkills = (interview.selectedSkills || []).join(', ')

  const system = [
    `You are an expert technical interview evaluator. You produce an evidence-based assessment of the candidate from the transcript only.`,
    `HARD RULES:`,
    `- Score ONLY skills that the interview ACTUALLY tested (put them in assessedSkills with transcript evidence).`,
    `- Name assessed skills using the EXACT names from the selected skill scope when the tested topic corresponds to one (e.g. use "SQL", not "MongoDB", if SQL was the selected scope and the questions tested SQL concepts). Only use a different name if the conversation clearly tested a skill outside the selected scope.`,
    `- Selected skills that were never really probed must go into notAssessedSkills with a reason. NEVER give them a score, not even zero.`,
    `- Scores are 0-100 integers grounded in the answers. No arbitrary numbers.`,
    `- communication and problemSolving are separate from technical skill scores.`,
    `- demonstratedLevel should reflect what the candidate actually demonstrated.`,
  ].join('\n')

  const user = [
    `Selected skill scope: ${selectedSkills}`,
    `Self-assessed level: ${interview.level}`,
    `Target role: ${interview.role || 'Software Engineer'}`,
    interview.company ? `Target company: ${interview.company}` : '',
    ``,
    `TRANSCRIPT:`,
    conversation,
    ``,
    `Also generate a SHORT title (2-5 words) describing what was actually discussed, e.g. "Backend API debugging", "React performance discussion". Never generic titles like "Interview" or "Mock Interview".`,
    ``,
    `Reply with ONLY JSON in exactly this shape:`,
    `{
  "title": "<short specific title>",
  "overallScore": <0-100>,
  "demonstratedLevel": "Beginner|Intermediate|Advanced",
  "communication": { "score": <0-100>, "assessment": "<1-2 sentences>", "evidence": "<short transcript citation>" },
  "problemSolving": { "score": <0-100>, "assessment": "<1-2 sentences>", "evidence": "<short transcript citation>" },
  "assessedSkills": [
    { "skill": "<tested skill>", "score": <0-100>, "level": "Beginner|Intermediate|Advanced",
      "strengths": ["..."], "weaknesses": ["..."], "evidence": "<short transcript citation>" }
  ],
  "notAssessedSkills": [ { "skill": "<selected but untested skill>", "reason": "<why>" } ],
  "overallStrengths": ["..."],
  "overallWeaknesses": ["..."],
  "summary": "<2-3 sentence final summary>"
}`,
  ].filter(Boolean).join('\n')

  return [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ]
}

/**
 * Parse and sanitize the evaluation JSON. Enforces the assessed/notAssessed
 * separation against the actual selected skill list.
 */
export function parseInterviewEvaluation(responseText, interview) {
  const parsed = parseAiJson(responseText)
  const selected = (interview.selectedSkills || []).map((s) => s.toLowerCase().trim())
  const fallbackLevel = normalizeLevel(interview.level)

  const title = typeof parsed.title === 'string' && parsed.title.trim()
    ? parsed.title.trim().slice(0, 80)
    : `${interview.role || 'Technical'} interview`

  // assessedSkills: keep only entries matching a selected skill, with scores
  const assessed = []
  const assessedNames = new Set()
  if (Array.isArray(parsed.assessedSkills)) {
    for (const item of parsed.assessedSkills) {
      if (!item || typeof item.skill !== 'string') continue
      const skillName = item.skill.trim()
      if (!skillName) continue
      assessed.push({
        skill: skillName,
        score: clampScore(item.score, 0),
        level: normalizeLevel(item.level, fallbackLevel),
        strengths: stringList(item.strengths, 4),
        weaknesses: stringList(item.weaknesses, 4),
        evidence: typeof item.evidence === 'string' ? item.evidence.slice(0, 500) : '',
      })
      assessedNames.add(skillName.toLowerCase())
    }
  }

  // notAssessedSkills: selected skills never actually scored. Trust the AI's
  // list, but ALWAYS add any selected skill the AI failed to score — this
  // guarantees no selected skill silently vanishes from the result.
  const notAssessed = []
  if (Array.isArray(parsed.notAssessedSkills)) {
    for (const item of parsed.notAssessedSkills) {
      if (!item || typeof item.skill !== 'string') continue
      const name = item.skill.trim()
      if (!name) continue
      const lower = name.toLowerCase()
      // If AI contradicted itself (scored AND marked untested), it was scored — skip.
      if (assessedNames.has(lower)) continue
      notAssessed.push({
        skill: name,
        reason: typeof item.reason === 'string' && item.reason.trim()
          ? item.reason.slice(0, 300)
          : 'Not tested during this interview',
      })
      assessedNames.add(lower)
    }
  }
  for (const sel of interview.selectedSkills || []) {
    if (!assessedNames.has(sel.toLowerCase().trim())) {
      notAssessed.push({ skill: sel, reason: 'Not tested during this interview' })
      assessedNames.add(sel.toLowerCase().trim())
    }
  }

  const comm = parsed.communication || {}
  const ps = parsed.problemSolving || {}

  return {
    title,
    overallScore: clampScore(parsed.overallScore, 0),
    demonstratedLevel: normalizeLevel(parsed.demonstratedLevel, fallbackLevel),
    assessedSkills: assessed,
    notAssessedSkills: notAssessed,
    communication: {
      score: clampScore(comm.score, 0),
      assessment: typeof comm.assessment === 'string' ? comm.assessment.slice(0, 600) : '',
      evidence: typeof comm.evidence === 'string' ? comm.evidence.slice(0, 500) : '',
    },
    problemSolving: {
      score: clampScore(ps.score, 0),
      assessment: typeof ps.assessment === 'string' ? ps.assessment.slice(0, 600) : '',
      evidence: typeof ps.evidence === 'string' ? ps.evidence.slice(0, 500) : '',
    },
    overallStrengths: stringList(parsed.overallStrengths, 6),
    overallWeaknesses: stringList(parsed.overallWeaknesses, 6),
    summary: typeof parsed.summary === 'string' ? parsed.summary.slice(0, 1200) : '',
  }
}
