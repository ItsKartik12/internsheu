import JobApplication from '../models/JobApplication.js'
import Job from '../models/Job.js'
import JobLink from '../models/JobLink.js'

/**
 * Helper to retrieve job details from Job or JobLink collection
 */
async function findJobAnywhere(id) {
  try {
    let job = await Job.findById(id).lean()
    if (job) return { job, isJobLink: false }
  } catch {
    // If not a valid ObjectId or not found in Job
  }

  try {
    const jobLink = await JobLink.findById(id).lean()
    if (jobLink) return { job: jobLink, isJobLink: true }
  } catch {
    // Not found
  }

  return { job: null, isJobLink: false }
}

/**
 * POST /api/jobs/:id/apply (students)
 * Records job application in InternSetu with status APPLIED_INTERNSETU
 */
export async function applyJob(req, res, next) {
  try {
    const { job, isJobLink } = await findJobAnywhere(req.params.id)
    if (!job) {
      return res.status(404).json({ error: 'Job not found' })
    }

    const companyName = (job.company || 'Company').trim()
    const jobTitle = (job.title || 'Job Position').trim()
    const location = (job.location || 'Remote').trim()
    const workMode = job.workMode || (job.type === 'Remote' ? 'Remote' : 'On-site')
    const jobType = job.jobType || job.type || 'Full-time'
    const applicationUrl = (job.jobUrl || job.companyWebsite || '').trim()

    const existing = await JobApplication.findOne({
      jobId: job._id,
      studentId: req.user._id,
    })

    const status = existing?.status === 'VISITED_COMPANY_APPLICATION'
      ? 'VISITED_COMPANY_APPLICATION'
      : 'APPLIED_INTERNSETU'

    const application = await JobApplication.findOneAndUpdate(
      { jobId: job._id, studentId: req.user._id },
      {
        companyName,
        jobTitle,
        location,
        workMode,
        jobType,
        applicationUrl,
        status,
        appliedAt: existing?.appliedAt || new Date(),
        externalPortalVisited: existing?.externalPortalVisited || false,
      },
      { upsert: true, new: true }
    )

    // Increment applicantsCount if it's a full Job posting
    if (!isJobLink) {
      await Job.findByIdAndUpdate(job._id, { $inc: { applicantsCount: 1 } }).catch(() => {})
    }

    res.status(201).json({
      message: 'Application recorded in InternSetu. You can now visit the company application portal.',
      application,
      companyApplicationUrl: applicationUrl,
    })
  } catch (err) {
    next(err)
  }
}

/**
 * POST /api/jobs/:id/track-visit (students)
 * Tracks that student opened/visited the external company portal
 */
export async function trackVisitJobPortal(req, res, next) {
  try {
    const { job } = await findJobAnywhere(req.params.id)
    if (!job) {
      return res.status(404).json({ error: 'Job not found' })
    }

    const companyName = (job.company || 'Company').trim()
    const jobTitle = (job.title || 'Job Position').trim()
    const location = (job.location || 'Remote').trim()
    const workMode = job.workMode || (job.type === 'Remote' ? 'Remote' : 'On-site')
    const jobType = job.jobType || job.type || 'Full-time'
    const applicationUrl = (job.jobUrl || job.companyWebsite || '').trim()

    const application = await JobApplication.findOneAndUpdate(
      { jobId: job._id, studentId: req.user._id },
      {
        companyName,
        jobTitle,
        location,
        workMode,
        jobType,
        applicationUrl,
        status: 'VISITED_COMPANY_APPLICATION',
        visitedAt: new Date(),
        externalPortalVisited: true,
      },
      { upsert: true, new: true }
    )

    res.json({
      message: 'External company portal visit tracked',
      status: 'VISITED_COMPANY_APPLICATION',
      application,
      companyApplicationUrl: applicationUrl,
    })
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/jobs/my-applications (students)
 * Returns only the logged-in student's job applications
 */
export async function getMyJobApplications(req, res, next) {
  try {
    const applications = await JobApplication.find({ studentId: req.user._id })
      .sort({ appliedAt: -1 })
      .lean()

    res.json({ applications })
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/jobs/industry/applications (industry & admin)
 * Returns all job applications submitted to this industry's job postings
 */
export async function getIndustryJobApplications(req, res, next) {
  try {
    const [jobs, jobLinks] = await Promise.all([
      Job.find({ industryId: req.user._id }).select('_id title company location type jobUrl').lean(),
      JobLink.find({ industryId: req.user._id }).select('_id title company location jobType jobUrl').lean(),
    ])

    const allJobs = [...jobs, ...jobLinks]
    const jobIds = allJobs.map((j) => j._id)

    const jobTitleMap = new Map(allJobs.map((j) => [j._id.toString(), j.title]))
    const jobCompanyMap = new Map(allJobs.map((j) => [j._id.toString(), j.company]))

    const applications = await JobApplication.find({ jobId: { $in: jobIds } })
      .populate('studentId', 'name email phone fieldMark enrollmentNo')
      .sort({ appliedAt: -1 })
      .lean()

    const formatted = applications.map((app) => ({
      ...app,
      jobTitle: app.jobTitle || jobTitleMap.get(app.jobId?.toString()) || 'Career Job',
      company: app.companyName || jobCompanyMap.get(app.jobId?.toString()) || 'Company',
      studentName: app.studentId?.name || 'Student Applicant',
      studentEmail: app.studentId?.email || '',
      studentPhone: app.studentId?.phone || '+91 98765 43210',
    }))

    res.json({ applications: formatted })
  } catch (err) {
    next(err)
  }
}
