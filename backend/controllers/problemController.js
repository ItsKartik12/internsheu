import Problem from '../models/Problem.js'
import vjudgeService from '../services/judge/VJudgeService.js'

/**
 * GET /api/problems
 * List active problems for Industry contest creation and student exploration.
 * Admins can see all (including inactive) by passing status=all.
 */
export async function getProblems(req, res, next) {
  try {
    const { topic, difficulty, search, status, language } = req.query
    const filter = {}

    if (req.user?.role === 'admin' && status) {
      if (status !== 'all') filter.status = status
    } else {
      filter.status = 'active'
    }

    if (topic && topic !== 'All') {
      filter.topic = topic
    }

    if (difficulty && difficulty !== 'All') {
      filter.difficulty = difficulty
    }

    if (language && language !== 'All') {
      filter.supportedLanguages = language
    }

    if (search && search.trim()) {
      const q = search.trim()
      filter.$or = [
        { title: { $regex: q, $options: 'i' } },
        { topic: { $regex: q, $options: 'i' } },
        { tags: { $in: [new RegExp(q, 'i')] } },
        { externalProblemId: { $regex: q, $options: 'i' } },
      ]
    }

    const problems = await Problem.find(filter).sort({ createdAt: -1 }).lean()
    res.json({ problems })
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/problems/:id
 */
export async function getProblemById(req, res, next) {
  try {
    const problem = await Problem.findById(req.params.id).lean()
    if (!problem) {
      return res.status(404).json({ error: 'Problem not found' })
    }
    res.json({ problem })
  } catch (err) {
    next(err)
  }
}

/**
 * POST /api/problems (Admin only)
 */
export async function createProblem(req, res, next) {
  try {
    const {
      title,
      slug,
      topic,
      difficulty,
      description,
      tags,
      externalProvider,
      externalProblemId,
      externalUrl,
      supportedLanguages,
      sampleCases,
      status,
    } = req.body

    if (!title || !topic || !description || !externalProblemId) {
      return res.status(400).json({ error: 'Title, topic, description, and externalProblemId are required' })
    }

    const generatedSlug =
      slug?.trim() ||
      title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '')

    const existing = await Problem.findOne({ slug: generatedSlug })
    if (existing) {
      return res.status(400).json({ error: 'A problem with this slug already exists' })
    }

    const problem = await Problem.create({
      title: title.trim(),
      slug: generatedSlug,
      topic: topic.trim(),
      difficulty: difficulty || 'Medium',
      description: description.trim(),
      tags: Array.isArray(tags) ? tags.map((t) => t.trim()) : [],
      externalProvider: externalProvider || 'vjudge',
      externalProblemId: externalProblemId.trim(),
      externalUrl: externalUrl?.trim() || vjudgeService.getProblemUrl(externalProblemId.trim()),
      supportedLanguages: Array.isArray(supportedLanguages) && supportedLanguages.length > 0
        ? supportedLanguages
        : ['C++', 'Java', 'Python', 'JavaScript'],
      sampleCases: Array.isArray(sampleCases) ? sampleCases : [],
      status: status || 'active',
      createdBy: req.user._id,
    })

    res.status(201).json({ problem, message: 'Problem added to library successfully' })
  } catch (err) {
    next(err)
  }
}

/**
 * PUT /api/problems/:id (Admin only)
 */
export async function updateProblem(req, res, next) {
  try {
    const problem = await Problem.findById(req.params.id)
    if (!problem) {
      return res.status(404).json({ error: 'Problem not found' })
    }

    const updatable = [
      'title',
      'topic',
      'difficulty',
      'description',
      'tags',
      'externalProvider',
      'externalProblemId',
      'externalUrl',
      'supportedLanguages',
      'sampleCases',
      'status',
    ]

    for (const field of updatable) {
      if (req.body[field] !== undefined) {
        problem[field] = req.body[field]
      }
    }

    if (req.body.externalProblemId && !req.body.externalUrl) {
      problem.externalUrl = vjudgeService.getProblemUrl(req.body.externalProblemId)
    }

    await problem.save()
    res.json({ problem, message: 'Problem updated successfully' })
  } catch (err) {
    next(err)
  }
}

/**
 * DELETE /api/problems/:id (Admin only)
 */
export async function deleteProblem(req, res, next) {
  try {
    const problem = await Problem.findByIdAndDelete(req.params.id)
    if (!problem) {
      return res.status(404).json({ error: 'Problem not found' })
    }
    res.json({ message: 'Problem removed from library' })
  } catch (err) {
    next(err)
  }
}

/**
 * POST /api/problems/validate-mapping (Admin only)
 */
export async function validateProblemMapping(req, res) {
  const { externalProblemId } = req.body
  const result = vjudgeService.validateProblemMapping(externalProblemId)
  res.json(result)
}
