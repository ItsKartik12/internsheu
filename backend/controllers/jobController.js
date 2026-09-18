import mongoose from 'mongoose'
import Job from '../models/Job.js'
import JobLink from '../models/JobLink.js'

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

    const [jobs, jobLinks] = await Promise.all([
      Job.find(filter).populate('industryId', 'name email').sort({ createdAt: -1 }).lean(),
      JobLink.find(
        industryId ? { industryId, isActive: true } : { isActive: true }
      ).populate('industryId', 'name email').sort({ createdAt: -1 }).lean(),
    ])

    // Format job links to match job card representation
    const formattedLinks = jobLinks.map((link) => ({
      _id: link._id,
      title: link.title,
      company: link.company,
      industryId: link.industryId,
      location: link.location,
      type: link.jobType || link.workMode || 'Full-time',
      experienceLevel: 'Entry Level',
      salary: 'External Opportunity',
      skills: link.skills || [],
      description: link.description || '',
      jobUrl: link.jobUrl,
      companyWebsite: link.companyWebsite || '',
      deadline: link.deadline,
      isJobLink: true,
      createdAt: link.createdAt,
      updatedAt: link.updatedAt,
    }))

    res.json({ jobs: [...formattedLinks, ...jobs] })
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/jobs/:id
 */
export async function getJobById(req, res, next) {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ error: 'Job not found' })
    }

    let job = await Job.findById(req.params.id)
      .populate('industryId', 'name email')
      .lean()

    if (!job) {
      // Fallback search in JobLink
      const jobLink = await JobLink.findById(req.params.id)
        .populate('industryId', 'name email')
        .lean()
      if (jobLink) {
        job = {
          ...jobLink,
          type: jobLink.jobType || 'Full-time',
          isJobLink: true,
        }
      }
    }

    if (!job) {
      return res.status(404).json({ error: 'Job not found' })
    }

    res.json({ job })
  } catch (err) {
    next(err)
  }
}

/**
 * POST /api/jobs (admin only)
 */
export async function createJob(req, res, next) {
  try {
    if (req.user.role === 'industry') {
      return res.status(403).json({
        error: 'Industry Partners do not have permission to create full job postings. Please use Add Job Link.',
      })
    }

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
