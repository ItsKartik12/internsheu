import Contest from '../models/Contest.js'
import ContestResult from '../models/ContestResult.js'
import Problem from '../models/Problem.js'
import vjudgeService from '../services/judge/VJudgeService.js'
import judge0Service from '../services/judge/Judge0Service.js'

/**
 * Helper to update contest status based on current time
 */
function normalizeContestStatus(contest) {
  const now = new Date()
  if (!contest.isPublished || contest.status === 'Draft' || contest.status === 'Archived') {
    return contest.status
  }
  if (now < new Date(contest.startDate)) {
    return 'Scheduled'
  }
  if (now >= new Date(contest.startDate) && now <= new Date(contest.endDate)) {
    return 'Live'
  }
  if (now > new Date(contest.endDate)) {
    if (contest.status === 'Results Available') return 'Results Available'
    return 'Ended'
  }
  return contest.status
}

// ────────────────────────────────────────────────────────
// INDUSTRY ENDPOINTS
// ────────────────────────────────────────────────────────

/**
 * GET /api/industry/contests (Industry's own contests)
 */
export async function getIndustryContests(req, res, next) {
  try {
    const filter = req.user.role === 'admin' ? {} : { industryId: req.user._id }
    const contests = await Contest.find(filter)
      .populate('problems', 'title slug topic difficulty externalProblemId')
      .sort({ createdAt: -1 })
      .lean()

    const normalized = contests.map((c) => ({
      ...c,
      computedStatus: normalizeContestStatus(c),
    }))

    res.json({ contests: normalized })
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/industry/contests/:id
 */
export async function getContestById(req, res, next) {
  try {
    const contest = await Contest.findById(req.params.id)
      .populate('problems')
      .populate('industryId', 'name email')
      .lean()

    if (!contest) {
      return res.status(404).json({ error: 'Contest not found' })
    }

    if (
      req.user.role !== 'admin' &&
      req.user.role === 'industry' &&
      contest.industryId._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ error: 'Access denied to another industry contest' })
    }

    const computedStatus = normalizeContestStatus(contest)
    res.json({ contest: { ...contest, computedStatus } })
  } catch (err) {
    next(err)
  }
}

/**
 * POST /api/industry/contests
 */
export async function createContest(req, res, next) {
  try {
    const {
      title,
      role,
      description,
      problems,
      startDate,
      endDate,
      durationMinutes,
      eligibility,
      maxParticipants,
      allowedLanguages,
      externalContestId,
      externalContestUrl,
      isPublished,
    } = req.body

    if (!title || !startDate || !endDate) {
      return res.status(400).json({ error: 'Title, start date, and end date are required' })
    }

    const start = new Date(startDate)
    const end = new Date(endDate)

    if (start >= end) {
      return res.status(400).json({ error: 'End time must be strictly after start time' })
    }

    // Verify problems exist
    const problemList = Array.isArray(problems) ? problems : []
    if (problemList.length > 0) {
      const count = await Problem.countDocuments({ _id: { $in: problemList } })
      if (count !== problemList.length) {
        return res.status(400).json({ error: 'One or more selected problems do not exist' })
      }
    }

    const published = Boolean(isPublished)
    const contest = await Contest.create({
      title: title.trim(),
      role: role?.trim() || 'Software Engineer',
      company: req.user.name || 'Company',
      industryId: req.user._id,
      description: description?.trim() || '',
      problems: problemList,
      startDate: start,
      endDate: end,
      durationMinutes: Number(durationMinutes) || 60,
      eligibility: eligibility?.trim() || 'Open to all students',
      maxParticipants: Number(maxParticipants) || 200,
      allowedLanguages: Array.isArray(allowedLanguages) && allowedLanguages.length > 0
        ? allowedLanguages
        : ['C++', 'Java', 'Python', 'JavaScript'],
      status: published ? (new Date() >= start ? 'Live' : 'Scheduled') : 'Draft',
      isPublished: published,
      externalProvider: 'vjudge',
      externalContestId: externalContestId?.trim() || '',
      externalContestUrl: externalContestUrl?.trim() || (externalContestId ? vjudgeService.getContestUrl(externalContestId) : ''),
    })

    res.status(201).json({ contest, message: 'DSA Contest created successfully' })
  } catch (err) {
    next(err)
  }
}

/**
 * PUT /api/industry/contests/:id
 */
export async function updateContest(req, res, next) {
  try {
    const contest = await Contest.findById(req.params.id)
    if (!contest) {
      return res.status(404).json({ error: 'Contest not found' })
    }

    if (req.user.role !== 'admin' && contest.industryId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied to edit this contest' })
    }

    const currentStatus = normalizeContestStatus(contest)
    if (currentStatus === 'Live' && req.body.problems !== undefined) {
      return res.status(400).json({ error: 'Cannot modify problems while contest is currently Live' })
    }

    if (req.body.startDate && req.body.endDate) {
      const start = new Date(req.body.startDate)
      const end = new Date(req.body.endDate)
      if (start >= end) {
        return res.status(400).json({ error: 'End time must be strictly after start time' })
      }
      contest.startDate = start
      contest.endDate = end
    }

    const fields = [
      'title',
      'role',
      'description',
      'durationMinutes',
      'eligibility',
      'maxParticipants',
      'allowedLanguages',
      'externalContestId',
      'externalContestUrl',
      'isPublished',
    ]

    for (const f of fields) {
      if (req.body[f] !== undefined) {
        contest[f] = req.body[f]
      }
    }

    if (req.body.problems && currentStatus !== 'Live') {
      contest.problems = req.body.problems
    }

    if (contest.isPublished && contest.status === 'Draft') {
      contest.status = new Date() >= contest.startDate ? 'Live' : 'Scheduled'
    }

    await contest.save()
    res.json({ contest, message: 'Contest updated successfully' })
  } catch (err) {
    next(err)
  }
}

/**
 * POST /api/industry/contests/:id/publish
 */
export async function publishContest(req, res, next) {
  try {
    const contest = await Contest.findById(req.params.id)
    if (!contest) return res.status(404).json({ error: 'Contest not found' })

    if (req.user.role !== 'admin' && contest.industryId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' })
    }

    if (!contest.problems || contest.problems.length === 0) {
      return res.status(400).json({ error: 'Please add at least one problem before publishing the contest' })
    }

    contest.isPublished = true
    const now = new Date()
    contest.status = now >= contest.startDate && now <= contest.endDate ? 'Live' : 'Scheduled'
    await contest.save()

    res.json({ contest, message: 'Contest published successfully' })
  } catch (err) {
    next(err)
  }
}

/**
 * DELETE /api/industry/contests/:id
 */
export async function deleteContest(req, res, next) {
  try {
    const contest = await Contest.findById(req.params.id)
    if (!contest) return res.status(404).json({ error: 'Contest not found' })

    if (req.user.role !== 'admin' && contest.industryId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' })
    }

    await Contest.findByIdAndDelete(req.params.id)
    await ContestResult.deleteMany({ contestId: req.params.id })

    res.json({ message: 'Contest deleted successfully' })
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/industry/contests/:id/standings
 */
export async function getContestStandings(req, res, next) {
  try {
    const contest = await Contest.findById(req.params.id).lean()
    if (!contest) return res.status(404).json({ error: 'Contest not found' })

    const results = await ContestResult.find({ contestId: req.params.id })
      .populate('studentId', 'name email enrollmentNo fieldMark')
      .sort({ score: -1, problemsSolved: -1, penaltyTime: 1 })
      .lean()

    // Assign normalized rank
    const ranked = results.map((r, index) => ({
      ...r,
      rank: index + 1,
    }))

    res.json({
      contestId: contest._id,
      title: contest.title,
      standings: ranked,
      totalParticipants: ranked.length,
    })
  } catch (err) {
    next(err)
  }
}

/**
 * POST /api/industry/contests/:id/sync-results
 */
export async function triggerResultSync(req, res, next) {
  try {
    const contest = await Contest.findById(req.params.id)
    if (!contest) return res.status(404).json({ error: 'Contest not found' })

    if (req.user.role !== 'admin' && contest.industryId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' })
    }

    const syncReport = await vjudgeService.syncResults(contest._id.toString(), contest.externalContestId)

    // Mark results sync status safely
    await ContestResult.updateMany(
      { contestId: contest._id },
      { syncStatus: syncReport.syncStatus, syncedAt: new Date() }
    )

    res.json({ syncReport, message: 'Result synchronization status refreshed.' })
  } catch (err) {
    next(err)
  }
}

// ────────────────────────────────────────────────────────
// STUDENT ENDPOINTS (Industry Tests)
// ────────────────────────────────────────────────────────

/**
 * GET /api/student/industry-tests
 */
export async function getStudentIndustryTests(req, res, next) {
  try {
    const contests = await Contest.find({ isPublished: true })
      .populate('problems', 'title slug topic difficulty externalProblemId')
      .sort({ startDate: -1 })
      .lean()

    const normalized = contests.map((c) => {
      const computedStatus = normalizeContestStatus(c)
      return {
        ...c,
        computedStatus,
      }
    })

    res.json({ contests: normalized })
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/student/industry-tests/live-shortcut
 * Returns currently active live contest for the Student Dashboard shortcut card
 */
export async function getLiveContestShortcut(req, res, next) {
  try {
    const now = new Date()
    const liveContest = await Contest.findOne({
      isPublished: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
    })
      .populate('problems', 'title difficulty')
      .lean()

    if (!liveContest) {
      return res.json({ liveContest: null })
    }

    const participantsCount = await ContestResult.countDocuments({ contestId: liveContest._id })

    res.json({
      liveContest: {
        ...liveContest,
        computedStatus: 'Live',
        participantsCount,
      },
    })
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/student/industry-tests/:id
 */
export async function getStudentContestDetails(req, res, next) {
  try {
    const contest = await Contest.findOne({ _id: req.params.id, isPublished: true })
      .populate('problems')
      .lean()

    if (!contest) {
      return res.status(404).json({ error: 'Contest not found or not published' })
    }

    const computedStatus = normalizeContestStatus(contest)

    // Fetch student's existing result and submissions if any
    const existingResult = await ContestResult.findOne({
      contestId: contest._id,
      studentId: req.user._id,
    }).lean()

    res.json({
      contest: { ...contest, computedStatus },
      myResult: existingResult || null,
    })
  } catch (err) {
    next(err)
  }
}

/**
 * POST /api/student/industry-tests/:id/submit
 */
export async function submitStudentSolution(req, res, next) {
  try {
    const { problemId, language, code, externalRunId } = req.body
    if (!problemId || !code) {
      return res.status(400).json({ error: 'Problem ID and solution code are required' })
    }

    const contest = await Contest.findById(req.params.id).populate('problems')
    if (!contest || !contest.isPublished) {
      return res.status(404).json({ error: 'Contest not found' })
    }

    const computedStatus = normalizeContestStatus(contest)
    if (computedStatus !== 'Live') {
      return res.status(400).json({
        error: `Cannot submit solution. Contest is currently ${computedStatus}. Submissions only allowed while Live.`,
      })
    }

    const problem = contest.problems.find((p) => p._id.toString() === problemId.toString())
    if (!problem) {
      return res.status(400).json({ error: 'Problem is not part of this contest' })
    }

    // Call judging service abstraction
    const judgeResponse = await vjudgeService.submitSolution({
      externalContestId: contest.externalContestId,
      externalProblemId: problem.externalProblemId,
      language: language || 'C++',
      code,
      studentId: req.user._id.toString(),
      externalRunId,
    })

    // Upsert ContestResult
    let result = await ContestResult.findOne({
      contestId: contest._id,
      studentId: req.user._id,
    })

    const newSubmission = {
      problemId: problem._id,
      language: language || 'C++',
      code,
      verdict: judgeResponse.verdict,
      score: 100, // standard problem score credit
      submittedAt: new Date(),
      externalRunId: externalRunId || null,
    }

    if (!result) {
      result = new ContestResult({
        contestId: contest._id,
        studentId: req.user._id,
        externalProvider: 'vjudge',
        externalContestId: contest.externalContestId || '',
        score: 100,
        problemsSolved: 1,
        totalProblems: contest.problems.length,
        submissionCount: 1,
        contestStatus: 'Participated',
        syncStatus: 'Result Sync Pending',
        submissions: [newSubmission],
      })
      // Increment contest participantsCount
      contest.participantsCount = (contest.participantsCount || 0) + 1
      await contest.save()
    } else {
      // Check if problem was already solved
      const alreadySolved = result.submissions.some(
        (s) => s.problemId.toString() === problem._id.toString() && s.verdict === 'Accepted'
      )
      result.submissions.push(newSubmission)
      result.submissionCount += 1
      if (!alreadySolved) {
        result.problemsSolved += 1
        result.score += 100
      }
    }

    await result.save()

    res.json({
      message: 'Solution recorded successfully in contest.',
      submission: newSubmission,
      resultSummary: {
        score: result.score,
        problemsSolved: result.problemsSolved,
        totalProblems: result.totalProblems,
        submissionCount: result.submissionCount,
      },
    })
  } catch (err) {
    next(err)
  }
}

/**
 * POST /api/student/industry-tests/:id/run
 * Real code execution via Judge0 sandboxed environment.
 * Student code is NEVER executed locally.
 * VJudge remains responsible for contest/submission functionality.
 */
export async function runStudentCode(req, res, next) {
  try {
    const { problemId, language, code } = req.body
    if (!problemId || !code) {
      return res.status(400).json({ error: 'Problem ID and code are required' })
    }

    const contest = await Contest.findById(req.params.id).populate('problems').lean()
    if (!contest || !contest.isPublished) {
      return res.status(404).json({ error: 'Contest not found' })
    }

    const problem = contest.problems.find((p) => p._id.toString() === problemId.toString())
    if (!problem) {
      return res.status(400).json({ error: 'Problem is not part of this contest' })
    }

    // Use Judge0 for real sandboxed code execution
    const runResult = await judge0Service.runCode({
      language: language || 'C++',
      code,
      sampleCases: problem.sampleCases || [],
    })

    res.json({
      supported: runResult.supported,
      message: runResult.message,
      status: runResult.status,
      language: runResult.language || language,
      languageId: runResult.languageId || null,
      problem: {
        title: problem.title,
        externalProblemId: problem.externalProblemId,
        externalUrl: problem.externalUrl || vjudgeService.getProblemUrl(problem.externalProblemId),
      },
      testCases: runResult.testCases || [],
    })
  } catch (err) {
    next(err)
  }
}
