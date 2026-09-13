import Job from '../models/Job.js'

/**
 * GET /api/jobs
 */
export async function getJobs(req, res, next) {
  try {
    const { search, location, type, experienceLevel, skill, industryId } = req.query
    const filter = { isActive: true }

    if (industryId) {
      filter.industryId = industryId
    }
    if (type && type !== 'All') {
      filter.type = type
    }
    if (experienceLevel && experienceLevel !== 'All') {
      filter.experienceLevel = experienceLevel
    }
    if (location && location !== 'All') {
      filter.location = { $regex: location, $options: 'i' }
    }
    if (skill) {
      filter.skills = { $in: [new RegExp(skill, 'i')] }
    }
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { skills: { $in: [new RegExp(search, 'i')] } },
      ]
    }

    const jobs = await Job.find(filter)
      .populate('industryId', 'name email')
      .sort({ createdAt: -1 })
      .lean()

    res.json({ jobs })
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/jobs/:id
 */
export async function getJobById(req, res, next) {
  try {
    const job = await Job.findById(req.params.id)
      .populate('industryId', 'name email')
      .lean()

    if (!job) {
      return res.status(404).json({ error: 'Job not found' })
    }

    res.json({ job })
  } catch (err) {
    next(err)
  }
}

/**
 * POST /api/jobs (industry, admin)
 */
export async function createJob(req, res, next) {
  try {
    const { title, company, description, skills, location, type, experienceLevel, salary, deadline, openings } = req.body

    if (!title || !description || !location) {
      return res.status(400).json({ error: 'Title, description, and location are required' })
    }

    const job = await Job.create({
      title: title.trim(),
      company: (company || req.user.name).trim(),
      industryId: req.user._id,
      description: description.trim(),
      skills: Array.isArray(skills) ? skills.map((s) => s.trim()) : [],
      location: location.trim(),
      type: type || 'Full-time',
      experienceLevel: experienceLevel || 'Entry Level',
      salary: salary || 'Best in Industry',
      deadline: deadline ? new Date(deadline) : undefined,
      openings: openings || 1,
    })

    res.status(201).json({ job })
  } catch (err) {
    next(err)
  }
}

/**
 * PUT /api/jobs/:id (owner industry, admin)
 */
export async function updateJob(req, res, next) {
  try {
    const job = await Job.findById(req.params.id)
    if (!job) {
      return res.status(404).json({ error: 'Job not found' })
    }

    if (req.user.role !== 'admin' && job.industryId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'You do not have permission to edit this job' })
    }

    const updatableFields = ['title', 'company', 'description', 'skills', 'location', 'type', 'experienceLevel', 'salary', 'deadline', 'openings', 'isActive']
    for (const field of updatableFields) {
      if (req.body[field] !== undefined) {
        job[field] = req.body[field]
      }
    }

    await job.save()
    res.json({ job })
  } catch (err) {
    next(err)
  }
}

/**
 * DELETE /api/jobs/:id (owner industry, admin)
 */
export async function deleteJob(req, res, next) {
  try {
    const job = await Job.findById(req.params.id)
    if (!job) {
      return res.status(404).json({ error: 'Job not found' })
    }

    if (req.user.role !== 'admin' && job.industryId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'You do not have permission to delete this job' })
    }

    await Job.findByIdAndDelete(req.params.id)
    res.json({ message: 'Job deleted successfully' })
  } catch (err) {
    next(err)
  }
}

/**
 * POST /api/jobs/:id/apply (students)
 */
export async function applyJob(req, res, next) {
  try {
    const job = await Job.findById(req.params.id)
    if (!job) {
      return res.status(404).json({ error: 'Job not found' })
    }

    job.applicantsCount = (job.applicantsCount || 0) + 1
    await job.save()

    res.json({ message: 'Job application submitted successfully', applicantsCount: job.applicantsCount })
  } catch (err) {
    next(err)
  }
}
