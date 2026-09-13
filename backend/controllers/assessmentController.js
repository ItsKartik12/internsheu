import AssessmentTopic from '../models/AssessmentTopic.js'
import AssessmentQuestion from '../models/AssessmentQuestion.js'
import AssessmentAttempt from '../models/AssessmentAttempt.js'
import SkillResult from '../models/SkillResult.js'

function determineSkillLevel(percentage) {
  if (percentage >= 90) return 'Excellent'
  if (percentage >= 75) return 'Strong'
  if (percentage >= 60) return 'Intermediate'
  if (percentage >= 40) return 'Beginner'
  return 'Needs Improvement'
}

/**
 * GET /api/assessment/topics
 */
export async function getTopics(req, res, next) {
  try {
    const filter = req.user?.role === 'admin' ? {} : { isActive: true }
    const topics = await AssessmentTopic.find(filter).sort({ name: 1 }).lean()
    res.json({ topics })
  } catch (err) {
    next(err)
  }
}

/**
 * POST /api/assessment/topics (admin)
 */
export async function createTopic(req, res, next) {
  try {
    const { name, category, description, icon, timeLimitMinutes, passPercentage } = req.body

    if (!name) {
      return res.status(400).json({ error: 'Topic name is required' })
    }

    const slug = req.body.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

    const topic = await AssessmentTopic.create({
      name: name.trim(),
      slug,
      category: category || 'General',
      description: description || '',
      icon: icon || 'Code',
      timeLimitMinutes: timeLimitMinutes || 15,
      passPercentage: passPercentage || 60,
    })

    res.status(201).json({ topic })
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Topic name or slug already exists' })
    }
    next(err)
  }
}

/**
 * PUT /api/assessment/topics/:id (admin)
 */
export async function updateTopic(req, res, next) {
  try {
    const topic = await AssessmentTopic.findById(req.params.id)
    if (!topic) {
      return res.status(404).json({ error: 'Topic not found' })
    }

    const updatableFields = ['name', 'slug', 'category', 'description', 'icon', 'timeLimitMinutes', 'passPercentage', 'isActive']
    for (const field of updatableFields) {
      if (req.body[field] !== undefined) {
        topic[field] = req.body[field]
      }
    }

    await topic.save()
    res.json({ topic })
  } catch (err) {
    next(err)
  }
}

/**
 * DELETE /api/assessment/topics/:id (admin)
 */
export async function deleteTopic(req, res, next) {
  try {
    const topic = await AssessmentTopic.findByIdAndDelete(req.params.id)
    if (!topic) {
      return res.status(404).json({ error: 'Topic not found' })
    }

    // Also delete associated questions
    await AssessmentQuestion.deleteMany({ topicId: req.params.id })

    res.json({ message: 'Topic and associated questions deleted successfully' })
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/assessment/questions (admin)
 */
export async function getQuestions(req, res, next) {
  try {
    const { topicId, search } = req.query
    const filter = {}
    if (topicId) filter.topicId = topicId
    if (search) filter.question = { $regex: search, $options: 'i' }

    const questions = await AssessmentQuestion.find(filter)
      .populate('topicId', 'name')
      .sort({ createdAt: -1 })
      .lean()

    res.json({ questions })
  } catch (err) {
    next(err)
  }
}

/**
 * POST /api/assessment/questions (admin)
 */
export async function createQuestion(req, res, next) {
  try {
    const { topicId, question, options, correctAnswer, explanation, marks, difficulty } = req.body

    if (!topicId || !question || !Array.isArray(options) || options.length < 2 || correctAnswer === undefined) {
      return res.status(400).json({ error: 'topicId, question, at least 2 options, and correctAnswer index are required' })
    }

    const newQuestion = await AssessmentQuestion.create({
      topicId,
      question: question.trim(),
      options: options.map((opt) => opt.trim()),
      correctAnswer: Number(correctAnswer),
      explanation: explanation || '',
      marks: marks ? Number(marks) : 1,
      difficulty: difficulty || 'Medium',
    })

    // Update topic questionCount
    await AssessmentTopic.findByIdAndUpdate(topicId, { $inc: { questionCount: 1 } })

    res.status(201).json({ question: newQuestion })
  } catch (err) {
    next(err)
  }
}

/**
 * PUT /api/assessment/questions/:id (admin)
 */
export async function updateQuestion(req, res, next) {
  try {
    const question = await AssessmentQuestion.findById(req.params.id)
    if (!question) {
      return res.status(404).json({ error: 'Question not found' })
    }

    const updatable = ['question', 'options', 'correctAnswer', 'explanation', 'marks', 'difficulty', 'isActive']
    for (const field of updatable) {
      if (req.body[field] !== undefined) {
        question[field] = req.body[field]
      }
    }

    await question.save()
    res.json({ question })
  } catch (err) {
    next(err)
  }
}

/**
 * DELETE /api/assessment/questions/:id (admin)
 */
export async function deleteQuestion(req, res, next) {
  try {
    const question = await AssessmentQuestion.findByIdAndDelete(req.params.id)
    if (!question) {
      return res.status(404).json({ error: 'Question not found' })
    }

    await AssessmentTopic.findByIdAndUpdate(question.topicId, { $inc: { questionCount: -1 } })

    res.json({ message: 'Question deleted successfully' })
  } catch (err) {
    next(err)
  }
}

/**
 * POST /api/assessment/start
 * Starts assessment for student by topicId.
 * Strips correctAnswer and explanation to prevent cheating!
 */
export async function startAssessment(req, res, next) {
  try {
    const { topicId } = req.body
    if (!topicId) {
      return res.status(400).json({ error: 'topicId is required' })
    }

    const topic = await AssessmentTopic.findById(topicId)
    if (!topic || !topic.isActive) {
      return res.status(404).json({ error: 'Topic not found or inactive' })
    }

    // Fetch questions without correctAnswer & explanation
    const questions = await AssessmentQuestion.find({
      topicId,
      isActive: true,
    })
      .select('-correctAnswer -explanation')
      .lean()

    if (questions.length === 0) {
      return res.status(400).json({ error: 'No questions available for this topic yet' })
    }

    // Shuffle questions randomly
    const shuffled = [...questions].sort(() => 0.5 - Math.random())

    res.json({
      topic: {
        _id: topic._id,
        name: topic.name,
        category: topic.category,
        description: topic.description,
        timeLimitMinutes: topic.timeLimitMinutes,
        passPercentage: topic.passPercentage,
        totalQuestions: shuffled.length,
      },
      questions: shuffled,
    })
  } catch (err) {
    next(err)
  }
}

/**
 * POST /api/assessment/submit
 * Evaluates student answers on backend against correctAnswer
 */
export async function submitAssessment(req, res, next) {
  try {
    const { topicId, answers, timeTakenSeconds } = req.body

    if (!topicId || !Array.isArray(answers)) {
      return res.status(400).json({ error: 'topicId and answers array are required' })
    }

    const topic = await AssessmentTopic.findById(topicId)
    if (!topic) {
      return res.status(404).json({ error: 'Topic not found' })
    }

    const questionIds = answers.map((a) => a.questionId)
    const questions = await AssessmentQuestion.find({ _id: { $in: questionIds } }).lean()
    const questionMap = new Map(questions.map((q) => [q._id.toString(), q]))

    let score = 0
    let totalMarks = 0
    const scoredAnswers = []

    for (const ans of answers) {
      const q = questionMap.get(ans.questionId.toString())
      if (!q) continue

      const qMarks = q.marks || 1
      totalMarks += qMarks
      const isCorrect = Number(ans.selectedAnswer) === q.correctAnswer
      const marksObtained = isCorrect ? qMarks : 0
      if (isCorrect) score += marksObtained

      scoredAnswers.push({
        questionId: q._id,
        selectedAnswer: Number(ans.selectedAnswer),
        isCorrect,
        marksObtained,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation || '',
      })
    }

    const percentage = totalMarks > 0 ? Math.round((score / totalMarks) * 100) : 0
    const passed = percentage >= (topic.passPercentage || 60)
    const level = determineSkillLevel(percentage)

    // 1. Save attempt record
    const attempt = await AssessmentAttempt.create({
      studentId: req.user._id,
      topicId: topic._id,
      questionIds: scoredAnswers.map((a) => a.questionId),
      answers: scoredAnswers.map(({ questionId, selectedAnswer, isCorrect, marksObtained }) => ({
        questionId,
        selectedAnswer,
        isCorrect,
        marksObtained,
      })),
      score,
      totalMarks,
      percentage,
      passed,
      timeTakenSeconds: timeTakenSeconds || 0,
      completedAt: new Date(),
    })

    // 2. Update student's SkillResult
    let skillDoc = await SkillResult.findOne({ studentId: req.user._id })
    if (!skillDoc) {
      skillDoc = new SkillResult({
        studentId: req.user._id,
        skills: [],
        overallScore: 0,
        overallLevel: 'Beginner',
      })
    }

    const existingSkillIndex = skillDoc.skills.findIndex(
      (s) => s.topicId.toString() === topic._id.toString()
    )

    if (existingSkillIndex >= 0) {
      const prev = skillDoc.skills[existingSkillIndex]
      skillDoc.skills[existingSkillIndex] = {
        topicId: topic._id,
        topic: topic.name,
        topicName: topic.name,
        category: topic.category,
        score: Math.max(prev.score, score),
        totalMarks,
        percentage: Math.max(prev.percentage, percentage),
        level: determineSkillLevel(Math.max(prev.percentage, percentage)),
        attemptsCount: (prev.attemptsCount || 1) + 1,
        lastAttemptAt: new Date(),
      }
    } else {
      skillDoc.skills.push({
        topicId: topic._id,
        topic: topic.name,
        topicName: topic.name,
        category: topic.category,
        score,
        totalMarks,
        percentage,
        level,
        attemptsCount: 1,
        lastAttemptAt: new Date(),
      })
    }

    // Recalculate overall metrics
    if (skillDoc.skills.length > 0) {
      const sumPercentage = skillDoc.skills.reduce((acc, s) => acc + s.percentage, 0)
      skillDoc.overallScore = Math.round(sumPercentage / skillDoc.skills.length)
      skillDoc.overallLevel = determineSkillLevel(skillDoc.overallScore)
    }

    await skillDoc.save()

    res.json({
      attemptId: attempt._id,
      score,
      totalMarks,
      percentage,
      passed,
      level,
      timeTakenSeconds: attempt.timeTakenSeconds,
      detailedAnswers: scoredAnswers,
      skillSummary: skillDoc,
    })
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/assessment/attempts
 */
export async function getMyAttempts(req, res, next) {
  try {
    const attempts = await AssessmentAttempt.find({ studentId: req.user._id })
      .populate('topicId', 'name category')
      .sort({ completedAt: -1 })
      .lean()

    res.json({ attempts })
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/assessment/attempts/:id
 */
export async function getAttemptById(req, res, next) {
  try {
    const attempt = await AssessmentAttempt.findById(req.params.id)
      .populate('topicId', 'name category')
      .populate('answers.questionId', 'question options correctAnswer explanation')
      .lean()

    if (!attempt) {
      return res.status(404).json({ error: 'Attempt not found' })
    }

    if (req.user.role !== 'admin' && attempt.studentId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Unauthorized to view this attempt' })
    }

    res.json({ attempt })
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/assessment/results/me
 */
export async function getMySkillResults(req, res, next) {
  try {
    let result = await SkillResult.findOne({ studentId: req.user._id }).lean()
    if (!result) {
      result = {
        studentId: req.user._id,
        skills: [],
        overallScore: 0,
        overallLevel: 'Beginner',
      }
    }
    res.json({ result })
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/assessment/results/all (admin)
 */
export async function getAllStudentResults(req, res, next) {
  try {
    const results = await SkillResult.find()
      .populate('studentId', 'name email enrollmentNo fieldMark')
      .sort({ overallScore: -1 })
      .lean()

    res.json({ results })
  } catch (err) {
    next(err)
  }
}
