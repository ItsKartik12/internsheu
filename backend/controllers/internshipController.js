import Internship from '../models/Internship.js'
import { isValidUrl } from '../utils/validateUrl.js'

/**
 * GET /api/internships
 */
export async function getInternships(req, res, next) {
  try {
    const { search, location, type, skill, industryId } = req.query
    const filter = { isActive: true }

    if (industryId) {
      filter.industryId = industryId
    }
    if (type && type !== 'All') {
      filter.type = type
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

    const internships = await Internship.find(filter)
      .populate('industryId', 'name email')
      .sort({ createdAt: -1 })
      .lean()

    res.json({ internships })
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/internships/:id
 */
export async function getInternshipById(req, res, next) {
  try {
    const internship = await Internship.findById(req.params.id)
      .populate('industryId', 'name email')
      .lean()

    if (!internship) {
      return res.status(404).json({ error: 'Internship not found' })
    }

    res.json({ internship })
  } catch (err) {
    next(err)
  }
}

/**
 * POST /api/internships (industry, admin)
 */
export async function createInternship(req, res, next) {
  try {
    const {
      title,
      company,
      description,
      skills,
      location,
      type,
      stipend,
      duration,
      deadline,
      openings,
      applicationUrl,
      workMode,
      eligibility,
      responsibilities,
      qualifications,
      companyWebsite,
      contactEmail,
    } = req.body

    if (!title || !description || !location) {
      return res.status(400).json({ error: 'Title, description, and location are required' })
    }

    if (!applicationUrl || typeof applicationUrl !== 'string' || !applicationUrl.trim()) {
      return res.status(400).json({ error: 'Application URL is required' })
    }

    if (!isValidUrl(applicationUrl)) {
      return res.status(400).json({
        error: 'Invalid Application URL. Must be a valid web address starting with http:// or https://',
      })
    }

    const internship = await Internship.create({
      title: title.trim(),
      company: (company || req.user.name).trim(),
      industryId: req.user._id,
      description: description.trim(),
      skills: Array.isArray(skills) ? skills.map((s) => s.trim()) : [],
      location: location.trim(),
      type: type || 'Remote',
      workMode: workMode || 'Remote',
      stipend: stipend || 'Competitive Stipend',
      duration: duration || '3 Months',
      eligibility: eligibility ? eligibility.trim() : '',
      responsibilities: responsibilities ? responsibilities.trim() : '',
      qualifications: qualifications ? qualifications.trim() : '',
      companyWebsite: companyWebsite ? companyWebsite.trim() : '',
      contactEmail: contactEmail ? contactEmail.trim() : '',
      deadline: deadline ? new Date(deadline) : undefined,
      openings: openings || 1,
      applicationUrl: applicationUrl.trim(),
    })

    res.status(201).json({ internship })
  } catch (err) {
    next(err)
  }
}

/**
 * PUT /api/internships/:id (owner industry, admin)
 */
export async function updateInternship(req, res, next) {
  try {
    const internship = await Internship.findById(req.params.id)
    if (!internship) {
      return res.status(404).json({ error: 'Internship not found' })
    }

    if (req.user.role !== 'admin' && internship.industryId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'You do not have permission to edit this internship' })
    }

    if (req.body.applicationUrl !== undefined) {
      if (!req.body.applicationUrl || !isValidUrl(req.body.applicationUrl)) {
        return res.status(400).json({
          error: 'Invalid Application URL. Must be a valid web address starting with http:// or https://',
        })
      }
    }

    const updatableFields = [
      'title',
      'company',
      'description',
      'skills',
      'location',
      'type',
      'workMode',
      'stipend',
      'duration',
      'eligibility',
      'responsibilities',
      'qualifications',
      'companyWebsite',
      'contactEmail',
      'deadline',
      'openings',
      'applicationUrl',
      'isActive',
    ]
    for (const field of updatableFields) {
      if (req.body[field] !== undefined) {
        internship[field] = req.body[field]
      }
    }

    await internship.save()
    res.json({ internship })
  } catch (err) {
    next(err)
  }
}

/**
 * DELETE /api/internships/:id (owner industry, admin)
 */
export async function deleteInternship(req, res, next) {
  try {
    const internship = await Internship.findById(req.params.id)
    if (!internship) {
      return res.status(404).json({ error: 'Internship not found' })
    }

    if (req.user.role !== 'admin' && internship.industryId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'You do not have permission to delete this internship' })
    }

    await Internship.findByIdAndDelete(req.params.id)
    res.json({ message: 'Internship deleted successfully' })
  } catch (err) {
    next(err)
  }
}

/**
 * POST /api/internships/:id/apply (students)
 */
export async function applyInternship(req, res, next) {
  try {
    const internship = await Internship.findById(req.params.id)
    if (!internship) {
      return res.status(404).json({ error: 'Internship not found' })
    }

    internship.applicantsCount = (internship.applicantsCount || 0) + 1
    await internship.save()

    res.json({ message: 'Application submitted successfully', applicantsCount: internship.applicantsCount })
  } catch (err) {
    next(err)
  }
}
