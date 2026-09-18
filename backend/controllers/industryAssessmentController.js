import IndustryAssessment from '../models/IndustryAssessment.js'
import IndustryAssessmentAttempt from '../models/IndustryAssessmentAttempt.js'

// ────────────────────────────────────────────────────────
// INDUSTRY ENDPOINTS
// ────────────────────────────────────────────────────────

/**
 * GET /api/industry/assessments
 */
export async function getIndustryAssessments(req, res, next) {
  try {
    const filter = req.user.role === 'admin' ? {} : { industryId: req.user._id }
    const assessments = await IndustryAssessment.find(filter)
      .sort({ createdAt: -1 })
      .lean()

    res.json({ assessments })
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/industry/assessments/:id
 */
export async function getAssessmentById(req, res, next) {
  try {
    const assessment = await IndustryAssessment.findById(req.params.id)
      .populate('industryId', 'name email')
      .lean()

    if (!assessment) {
      return res.status(404).json({ error: 'Assessment not found' })
    }

    if (
      req.user.role !== 'admin' &&
      req.user.role === 'industry' &&
      assessment.industryId._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ error: 'Access denied' })
    }

    res.json({ assessment })
  } catch (err) {
    next(err)
  }
}

/**
 * POST /api/industry/assessments
 */
export async function createAssessment(req, res, next) {
  try {
    const {
      title,
      description,
      role,
      durationMinutes,
      startDate,
      endDate,
      eligibility,
      maxAttempts,
      passingScore,
      questions,
      status,
    } = req.body

    if (!title) {
      return res.status(400).json({ error: 'Assessment title is required' })
    }

    const questionList = Array.isArray(questions) ? questions : []
    // Validate each question has at least 2 options and a valid correctAnswer index
    for (let i = 0; i < questionList.length; i++) {
      const q = questionList[i]
      if (!q.question || !Array.isArray(q.options) || q.options.length < 2) {
        return res.status(400).json({ error: `Question ${i + 1} must have text and at least 2 options` })
      }
      if (typeof q.correctAnswer !== 'number' || q.correctAnswer < 0 || q.correctAnswer >= q.options.length) {
        return res.status(400).json({ error: `Question ${i + 1} has an invalid correct answer option selection` })
      }
    }

    const assessment = await IndustryAssessment.create({
      title: title.trim(),
      description: description?.trim() || '',
      role: role?.trim() || 'Software Engineer',
      company: req.user.name || 'Company',
      industryId: req.user._id,
      durationMinutes: Number(durationMinutes) || 30,
      startDate: startDate ? new Date(startDate) : new Date(),
      endDate: endDate ? new Date(endDate) : undefined,
      eligibility: eligibility?.trim() || 'Open to all students',
      maxAttempts: Number(maxAttempts) || 1,
      passingScore: Number(passingScore) || 60,
      status: status || 'Draft',
      questions: questionList,
    })

    res.status(201).json({ assessment, message: 'Industry Assessment created successfully' })
  } catch (err) {
    next(err)
  }
}

/**
 * PUT /api/industry/assessments/:id
 */
export async function updateAssessment(req, res, next) {
  try {
    const assessment = await IndustryAssessment.findById(req.params.id)
    if (!assessment) {
      return res.status(404).json({ error: 'Assessment not found' })
    }

    if (req.user.role !== 'admin' && assessment.industryId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied to edit this assessment' })
    }

    const updatable = [
      'title',
      'description',
      'role',
      'durationMinutes',
      'startDate',
      'endDate',
      'eligibility',
      'maxAttempts',
      'passingScore',
      'status',
      'questions',
    ]

    for (const f of updatable) {
      if (req.body[f] !== undefined) {
        assessment[f] = req.body[f]
      }
    }

    await assessment.save()
    res.json({ assessment, message: 'Assessment updated successfully' })
  } catch (err) {
    next(err)
  }
}

/**
 * DELETE /api/industry/assessments/:id
 */
export async function deleteAssessment(req, res, next) {
  try {
    const assessment = await IndustryAssessment.findById(req.params.id)
    if (!assessment) return res.status(404).json({ error: 'Assessment not found' })

    if (req.user.role !== 'admin' && assessment.industryId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' })
    }

    await IndustryAssessment.findByIdAndDelete(req.params.id)
    await IndustryAssessmentAttempt.deleteMany({ assessmentId: req.params.id })

    res.json({ message: 'Assessment deleted successfully' })
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/industry/assessments/:id/results
 * Industry views candidate results and question-wise statistics
 */
export async function getAssessmentResults(req, res, next) {
  try {
    const assessment = await IndustryAssessment.findById(req.params.id).lean()
    if (!assessment) return res.status(404).json({ error: 'Assessment not found' })

    if (req.user.role !== 'admin' && assessment.industryId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' })
    }

    const attempts = await IndustryAssessmentAttempt.find({ assessmentId: assessment._id })
      .populate('studentId', 'name email enrollmentNo fieldMark')
      .sort({ score: -1, percentage: -1, timeTakenSeconds: 1 })
      .lean()

    // Compute question-wise stats
    const questionStats = (assessment.questions || []).map((q, idx) => {
      let correctCount = 0
      let totalAnswers = 0
      for (const att of attempts) {
        const ans = att.answers.find((a) => a.questionId.toString() === q._id.toString())
        if (ans) {
          totalAnswers++
          if (ans.isCorrect) correctCount++
        }
      }
      return {
        questionIndex: idx + 1,
        questionText: q.question,
        topic: q.topic,
        difficulty: q.difficulty,
        totalAnswers,
        correctCount,
        accuracyPercentage: totalAnswers > 0 ? Math.round((correctCount / totalAnswers) * 100) : 0,
      }
    })

    res.json({
      assessment: {
        _id: assessment._id,
        title: assessment.title,
        role: assessment.role,
        durationMinutes: assessment.durationMinutes,
        passingScore: assessment.passingScore,
        totalQuestions: assessment.questions.length,
      },
      attempts,
      questionStats,
    })
  } catch (err) {
    next(err)
  }
}

// ────────────────────────────────────────────────────────
// STUDENT ENDPOINTS
// ────────────────────────────────────────────────────────

/**
 * GET /api/student/industry-assessments
 * List available published assessments with student's attempt state
 */
export async function getStudentIndustryAssessments(req, res, next) {
  try {
    const assessments = await IndustryAssessment.find({ status: 'Published' })
      .select('-questions.correctAnswer -questions.explanation')
      .sort({ createdAt: -1 })
      .lean()

    // Find student's attempts
    const myAttempts = await IndustryAssessmentAttempt.find({ studentId: req.user._id }).lean()
    const attemptMap = new Map()
    for (const att of myAttempts) {
      const list = attemptMap.get(att.assessmentId.toString()) || []
      list.push(att)
      attemptMap.set(att.assessmentId.toString(), list)
    }

    const results = assessments.map((a) => {
      const attempts = attemptMap.get(a._id.toString()) || []
      const latestAttempt = attempts.length > 0 ? attempts[attempts.length - 1] : null
      const attemptsCount = attempts.length
      const canAttempt = attemptsCount < (a.maxAttempts || 1)

      return {
        _id: a._id,
        title: a.title,
        description: a.description,
        company: a.company,
        role: a.role,
        durationMinutes: a.durationMinutes,
        eligibility: a.eligibility,
        passingScore: a.passingScore,
        questionCount: a.questions?.length || 0,
        maxAttempts: a.maxAttempts || 1,
        attemptsCount,
        canAttempt,
        latestScore: latestAttempt?.score ?? null,
        latestPercentage: latestAttempt?.percentage ?? null,
        passed: latestAttempt?.passed ?? false,
      }
    })

    res.json({ assessments: results })
  } catch (err) {
    next(err)
  }
}

/**
 * POST /api/student/industry-assessments/:id/start
 * Starts assessment: returns questions WITHOUT revealing correct answers!
 */
export async function startStudentAssessment(req, res, next) {
  try {
    const assessment = await IndustryAssessment.findOne({ _id: req.params.id, status: 'Published' }).lean()
    if (!assessment) {
      return res.status(404).json({ error: 'Assessment not found or not published' })
    }

    const previousAttempts = await IndustryAssessmentAttempt.countDocuments({
      assessmentId: assessment._id,
      studentId: req.user._id,
    })

    if (previousAttempts >= (assessment.maxAttempts || 1)) {
      return res.status(400).json({ error: `You have reached the maximum attempt limit (${assessment.maxAttempts}) for this assessment.` })
    }

    // Strip out correctAnswer and explanation for safe test-taking
    const sanitizedQuestions = (assessment.questions || []).map((q) => ({
      _id: q._id,
      question: q.question,
      options: q.options,
      marks: q.marks || 2,
      negativeMarks: q.negativeMarks || 0,
      topic: q.topic,
      difficulty: q.difficulty,
    }))

    res.json({
      assessment: {
        _id: assessment._id,
        title: assessment.title,
        company: assessment.company,
        role: assessment.role,
        durationMinutes: assessment.durationMinutes,
        passingScore: assessment.passingScore,
        totalQuestions: sanitizedQuestions.length,
      },
      questions: sanitizedQuestions,
    })
  } catch (err) {
    next(err)
  }
}

/**
 * POST /api/student/industry-assessments/:id/submit
 * Grades student MCQ submission server-side and stores IndustryAssessmentAttempt
 */
export async function submitStudentAssessment(req, res, next) {
  try {
    const { answers, timeTakenSeconds } = req.body
    const assessment = await IndustryAssessment.findById(req.params.id).lean()
    if (!assessment) {
      return res.status(404).json({ error: 'Assessment not found' })
    }

    const previousAttempts = await IndustryAssessmentAttempt.countDocuments({
      assessmentId: assessment._id,
      studentId: req.user._id,
    })

    if (previousAttempts >= (assessment.maxAttempts || 1)) {
      return res.status(400).json({ error: 'Maximum attempts already reached' })
    }

    const answersMap = new Map()
    if (Array.isArray(answers)) {
      for (const ans of answers) {
        if (ans.questionId) {
          answersMap.set(ans.questionId.toString(), ans.selectedAnswer)
        }
      }
    }

    let totalMarks = 0
    let score = 0
    const detailedAnswers = []

    for (const q of assessment.questions || []) {
      const qMarks = q.marks || 2
      const qNeg = q.negativeMarks || 0
      totalMarks += qMarks

      const selected = answersMap.get(q._id.toString())
      if (selected !== undefined && selected !== null && selected !== -1) {
        const isCorrect = Number(selected) === q.correctAnswer
        const marksObtained = isCorrect ? qMarks : -qNeg
        score += marksObtained
        detailedAnswers.push({
          questionId: q._id,
          selectedAnswer: Number(selected),
          isCorrect,
          marksObtained,
        })
      } else {
        detailedAnswers.push({
          questionId: q._id,
          selectedAnswer: -1,
          isCorrect: false,
          marksObtained: 0,
        })
      }
    }

    // Normalized floor score at 0
    const finalScore = Math.max(0, score)
    const percentage = totalMarks > 0 ? Math.round((finalScore / totalMarks) * 100) : 0
    const passed = percentage >= (assessment.passingScore || 60)

    const attempt = await IndustryAssessmentAttempt.create({
      assessmentId: assessment._id,
      studentId: req.user._id,
      industryId: assessment.industryId,
      answers: detailedAnswers,
      score: finalScore,
      totalMarks,
      percentage,
      passed,
      timeTakenSeconds: Number(timeTakenSeconds) || 0,
      completedAt: new Date(),
    })

    // Increment attemptsCount on assessment
    await IndustryAssessment.findByIdAndUpdate(assessment._id, { $inc: { attemptsCount: 1 } })

    // Provide complete feedback now that it's submitted
    const questionReview = (assessment.questions || []).map((q) => {
      const userAns = detailedAnswers.find((a) => a.questionId.toString() === q._id.toString())
      return {
        _id: q._id,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        selectedAnswer: userAns ? userAns.selectedAnswer : -1,
        isCorrect: userAns ? userAns.isCorrect : false,
        explanation: q.explanation || '',
      }
    })

    res.json({
      message: 'Assessment submitted successfully',
      attempt: {
        _id: attempt._id,
        score: finalScore,
        totalMarks,
        percentage,
        passed,
        timeTakenSeconds: attempt.timeTakenSeconds,
        completedAt: attempt.completedAt,
      },
      questionReview,
    })
  } catch (err) {
    next(err)
  }
}
