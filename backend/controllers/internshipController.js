import mongoose from 'mongoose'
import Internship from '../models/Internship.js'
import InternshipApplication from '../models/InternshipApplication.js'
import StudentProfile from '../models/StudentProfile.js'
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
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ error: 'Internship not found' })
    }

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

/**
 * POST /api/internships/:id/apply-internsetu (students)
 * Records student application in InternSetu with student snapshot
 */
export async function applyInternsetu(req, res, next) {
  try {
    const internship = await Internship.findById(req.params.id)
    if (!internship) {
      return res.status(404).json({ error: 'Internship not found' })
    }

    const { coverNote, resumeUrl } = req.body

    // Fetch student's profile for snapshot
    const profile = await StudentProfile.findOne({ userId: req.user._id }).lean()

    const studentSkills = []
    if (profile?.skills) {
      for (const list of Object.values(profile.skills)) {
        if (Array.isArray(list)) studentSkills.push(...list)
      }
    }

    const studentSnapshot = {
      name: profile?.basicInfo?.fullName || req.user.name,
      email: profile?.basicInfo?.professionalEmail || req.user.email,
      phone: profile?.basicInfo?.phone || '',
      institute: profile?.education?.[0]?.college || '',
      branch: profile?.education?.[0]?.branch || req.user.fieldMark || '',
      cgpa: profile?.education?.[0]?.cgpa || 0,
      graduationYear: profile?.education?.[0]?.graduationYear,
      skills: studentSkills,
    }

    const application = await InternshipApplication.findOneAndUpdate(
      { internshipId: internship._id, studentId: req.user._id },
      {
        industryId: internship.industryId,
        status: 'APPLIED_INTERNSETU',
        coverNote: coverNote?.trim() || '',
        resumeUrl: resumeUrl?.trim() || profile?.basicInfo?.portfolioUrl || '',
        studentSnapshot,
        appliedAt: new Date(),
      },
      { upsert: true, new: true }
    )

    // Increment applicantsCount if newly applied
    internship.applicantsCount = (internship.applicantsCount || 0) + 1
    await internship.save()

    res.status(201).json({
      message: 'Application recorded in InternSetu. You can now visit the company application page.',
      application,
      companyApplicationUrl: internship.applicationUrl,
    })
  } catch (err) {
    next(err)
  }
}

/**
 * POST /api/internships/:id/track-visit (students)
 * Tracks that student clicked and visited company application website
 */
export async function trackVisitCompanyUrl(req, res, next) {
  try {
    const internship = await Internship.findById(req.params.id)
    if (!internship) {
      return res.status(404).json({ error: 'Internship not found' })
    }

    const application = await InternshipApplication.findOneAndUpdate(
      { internshipId: internship._id, studentId: req.user._id },
      {
        status: 'VISITED_COMPANY_APPLICATION',
        visitedCompanyUrlAt: new Date(),
      },
      { new: true }
    )

    res.json({
      message: 'Visit tracked',
      status: 'VISITED_COMPANY_APPLICATION',
      application,
      companyApplicationUrl: internship.applicationUrl,
    })
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/internships/:id/applications (industry owner, admin)
 */
export async function getInternshipApplications(req, res, next) {
  try {
    const internship = await Internship.findById(req.params.id).lean()
    if (!internship) {
      return res.status(404).json({ error: 'Internship not found' })
    }

    if (req.user.role !== 'admin' && internship.industryId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' })
    }

    const applications = await InternshipApplication.find({ internshipId: req.params.id })
      .populate('studentId', 'name email enrollmentNo fieldMark')
      .sort({ appliedAt: -1 })
      .lean()

    res.json({ applications, total: applications.length })
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/internships/my-applications (students)
 * List student's own internship applications
 */
export async function getMyApplications(req, res, next) {
  try {
    const applications = await InternshipApplication.find({ studentId: req.user._id })
      .populate('internshipId', 'title company location type stipend duration applicationUrl')
      .sort({ appliedAt: -1 })
      .lean()

    res.json({ applications })
  } catch (err) {
    next(err)
  }
}
