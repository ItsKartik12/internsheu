import JobLink from '../models/JobLink.js'
import { isValidUrl } from '../utils/validateUrl.js'

/**
 * GET /api/job-links
 */
export async function getJobLinks(req, res, next) {
  try {
    const { search, location, workMode, jobType, skill, industryId } = req.query
    const filter = { isActive: true }

    if (industryId) {
      filter.industryId = industryId
    }
    if (workMode && workMode !== 'All') {
      filter.workMode = workMode
    }
    if (jobType && jobType !== 'All') {
      filter.jobType = jobType
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

    const jobLinks = await JobLink.find(filter)
      .populate('industryId', 'name email')
      .sort({ createdAt: -1 })
      .lean()

    res.json({ jobLinks })
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/job-links/:id
 */
export async function getJobLinkById(req, res, next) {
  try {
    const jobLink = await JobLink.findById(req.params.id)
      .populate('industryId', 'name email')
      .lean()

    if (!jobLink) {
      return res.status(404).json({ error: 'Job link not found' })
    }

    res.json({ jobLink })
  } catch (err) {
    next(err)
  }
}

/**
 * POST /api/job-links (industry, admin)
 */
export async function createJobLink(req, res, next) {
  try {
    const {
      title,
      company,
      location,
      workMode,
      jobType,
      skills,
      description,
      jobUrl,
      companyWebsite,
      deadline,
    } = req.body

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Job title is required' })
    }

    if (!company || !company.trim()) {
      return res.status(400).json({ error: 'Company name is required' })
    }

    if (!jobUrl || typeof jobUrl !== 'string' || !jobUrl.trim()) {
      return res.status(400).json({ error: 'Job URL is required' })
    }

    if (!isValidUrl(jobUrl)) {
      return res.status(400).json({
        error: 'Invalid Job URL. Must be a valid web address starting with http:// or https://',
      })
    }

    if (companyWebsite && companyWebsite.trim() && !isValidUrl(companyWebsite)) {
      return res.status(400).json({
        error: 'Invalid Company Website URL. Must start with http:// or https://',
      })
    }

    const jobLink = await JobLink.create({
      title: title.trim(),
      company: company.trim(),
      industryId: req.user._id,
      location: (location || 'Remote').trim(),
      workMode: workMode || 'Remote',
      jobType: (jobType || 'Full-time').trim(),
      skills: Array.isArray(skills)
        ? skills.map((s) => s.trim()).filter(Boolean)
        : typeof skills === 'string'
        ? skills.split(',').map((s) => s.trim()).filter(Boolean)
        : [],
      description: (description || '').trim(),
      jobUrl: jobUrl.trim(),
      companyWebsite: (companyWebsite || '').trim(),
      deadline: deadline ? new Date(deadline) : undefined,
    })

    res.status(201).json({ jobLink })
  } catch (err) {
    next(err)
  }
}

/**
 * PUT /api/job-links/:id (owner industry, admin)
 */
export async function updateJobLink(req, res, next) {
  try {
    const jobLink = await JobLink.findById(req.params.id)
    if (!jobLink) {
      return res.status(404).json({ error: 'Job link not found' })
    }

    if (req.user.role !== 'admin' && jobLink.industryId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'You do not have permission to edit this job link' })
    }

    if (req.body.jobUrl !== undefined) {
      if (!req.body.jobUrl || !isValidUrl(req.body.jobUrl)) {
        return res.status(400).json({
          error: 'Invalid Job URL. Must be a valid web address starting with http:// or https://',
        })
      }
    }

    if (req.body.companyWebsite !== undefined && req.body.companyWebsite.trim() !== '') {
      if (!isValidUrl(req.body.companyWebsite)) {
        return res.status(400).json({
          error: 'Invalid Company Website URL. Must start with http:// or https://',
        })
      }
    }

    const updatableFields = [
      'title',
      'company',
      'location',
      'workMode',
      'jobType',
      'skills',
      'description',
      'jobUrl',
      'companyWebsite',
      'deadline',
      'isActive',
    ]

    for (const field of updatableFields) {
      if (req.body[field] !== undefined) {
        if (field === 'skills' && typeof req.body[field] === 'string') {
          jobLink.skills = req.body[field].split(',').map((s) => s.trim()).filter(Boolean)
        } else {
          jobLink[field] = req.body[field]
        }
      }
    }

    await jobLink.save()
    res.json({ jobLink })
  } catch (err) {
    next(err)
  }
}

/**
 * DELETE /api/job-links/:id (owner industry, admin)
 */
export async function deleteJobLink(req, res, next) {
  try {
    const jobLink = await JobLink.findById(req.params.id)
    if (!jobLink) {
      return res.status(404).json({ error: 'Job link not found' })
    }

    if (req.user.role !== 'admin' && jobLink.industryId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'You do not have permission to delete this job link' })
    }

    await JobLink.findByIdAndDelete(req.params.id)
    res.json({ message: 'Job link deleted successfully' })
  } catch (err) {
    next(err)
  }
}
