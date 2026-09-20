import StudentProfile from '../models/StudentProfile.js'

/**
 * GET /api/profile
 * Fetch the authenticated user's complete student profile.
 * If no profile exists yet, returns an empty shell with 0% completion.
 */
export async function getProfile(req, res, next) {
  try {
    let profile = await StudentProfile.findOne({ userId: req.user._id }).lean()

    if (!profile) {
      // Return an empty profile shell — don't force creation until user saves
      const emptyProfile = {
        userId: req.user._id,
        basicInfo: {
          fullName: req.user.name || '',
          professionalEmail: req.user.email || '',
          phone: '',
          city: '',
          linkedinUrl: '',
          githubUrl: '',
          portfolioUrl: '',
        },
        careerTarget: {
          targetJobRole: '',
          preferredIndustry: '',
          preferredLocation: '',
          workPreference: '',
          internshipDuration: '',
          availability: '',
        },
        education: [],
        skills: {
          programmingLanguages: [],
          frontend: [],
          backend: [],
          database: [],
          tools: [],
          cloudDevOps: [],
          aiMl: [],
        },
        projects: [],
        internships: [],
        hackathons: [],
        achievements: [],
        certifications: [],
        codingProfiles: [],
        openSource: [],
        leadership: [],
      }

      return res.json({
        profile: emptyProfile,
        completionPercentage: 0,
        isNew: true,
      })
    }

    const completionPercentage = StudentProfile.computeCompletion(profile)

    res.json({
      profile,
      completionPercentage,
      isNew: false,
    })
  } catch (err) {
    next(err)
  }
}

/**
 * PUT /api/profile
 * Create or fully update the authenticated user's student profile.
 * The userId is always derived from the JWT — never from the request body.
 */
export async function updateProfile(req, res, next) {
  try {
    const userId = req.user._id
    const updateData = { ...req.body }

    // Security: never allow userId to be set from the request body
    delete updateData.userId
    delete updateData._id
    delete updateData.__v
    delete updateData.createdAt
    delete updateData.updatedAt
    delete updateData.operationId

    // Server-side validation
    const errors = []

    // Validate email format if provided
    if (updateData.basicInfo?.professionalEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(updateData.basicInfo.professionalEmail)) {
        errors.push('Invalid email format')
      }
    }

    // Validate CGPA range in education entries
    if (updateData.education && Array.isArray(updateData.education)) {
      updateData.education.forEach((edu, i) => {
        if (edu.cgpa !== undefined && edu.cgpa !== null && edu.cgpa !== '') {
          const cgpa = Number(edu.cgpa)
          if (isNaN(cgpa) || cgpa < 0 || cgpa > 10) {
            errors.push(`Education entry ${i + 1}: CGPA must be between 0 and 10`)
          }
        }
        if (edu.class12Percentage !== undefined && edu.class12Percentage !== null && edu.class12Percentage !== '') {
          const pct = Number(edu.class12Percentage)
          if (isNaN(pct) || pct < 0 || pct > 100) {
            errors.push(`Education entry ${i + 1}: Class 12 percentage must be between 0 and 100`)
          }
        }
        if (edu.class10Percentage !== undefined && edu.class10Percentage !== null && edu.class10Percentage !== '') {
          const pct = Number(edu.class10Percentage)
          if (isNaN(pct) || pct < 0 || pct > 100) {
            errors.push(`Education entry ${i + 1}: Class 10 percentage must be between 0 and 100`)
          }
        }
      })
    }

    // Validate URLs (loose check — must start with http:// or https:// if provided)
    const urlFields = [
      { path: 'basicInfo.linkedinUrl', label: 'LinkedIn URL' },
      { path: 'basicInfo.githubUrl', label: 'GitHub URL' },
      { path: 'basicInfo.portfolioUrl', label: 'Portfolio URL' },
    ]
    for (const { path, label } of urlFields) {
      const parts = path.split('.')
      let val = updateData
      for (const p of parts) val = val?.[p]
      if (val && typeof val === 'string' && val.trim() !== '') {
        if (!/^https?:\/\//i.test(val.trim())) {
          errors.push(`${label} must start with http:// or https://`)
        }
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({ error: 'Validation failed', details: errors })
    }

    // Upsert: create if doesn't exist, update if it does
    const profile = await StudentProfile.findOneAndUpdate(
      { userId },
      { $set: { ...updateData, userId } },
      { new: true, upsert: true, runValidators: true }
    ).lean()

    const completionPercentage = StudentProfile.computeCompletion(profile)

    res.json({
      profile,
      completionPercentage,
      message: 'Profile saved successfully',
    })
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Validation failed',
        details: Object.values(err.errors).map((e) => e.message),
      })
    }
    next(err)
  }
}
