import Internship from '../models/Internship.js'

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
    const { title, company, description, skills, location, type, stipend, duration, deadline, openings } = req.body

    if (!title || !description || !location) {
      return res.status(400).json({ error: 'Title, description, and location are required' })
    }

    const internship = await Internship.create({
      title: title.trim(),
      company: (company || req.user.name).trim(),
      industryId: req.user._id,
      description: description.trim(),
      skills: Array.isArray(skills) ? skills.map((s) => s.trim()) : [],
      location: location.trim(),
      type: type || 'Remote',
      stipend: stipend || 'Competitive Stipend',
      duration: duration || '3 Months',
      deadline: deadline ? new Date(deadline) : undefined,
      openings: openings || 1,
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

    const updatableFields = ['title', 'company', 'description', 'skills', 'location', 'type', 'stipend', 'duration', 'deadline', 'openings', 'isActive']
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
