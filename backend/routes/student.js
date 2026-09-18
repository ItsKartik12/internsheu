import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import StudentProfile from '../models/StudentProfile.js'
import Internship from '../models/Internship.js'
import JobLink from '../models/JobLink.js'
import Job from '../models/Job.js'

const router = Router()

// GET /api/student/dashboard
// Serves the logged-in student's real profile from MongoDB, with real matched
// opportunities from the database.
router.get('/dashboard', authenticate, async (req, res, next) => {
  try {
    const profile = await StudentProfile.findOne({ userId: req.user._id }).lean()

    let studentData
    const studentSkillNames = new Set()

    if (profile) {
      // Build dashboard-compatible shape from real profile
      const primaryEducation = profile.education?.[0] || {}
      const allSkills = []
      if (profile.skills) {
        const categories = {
          programmingLanguages: 'Programming Language',
          frontend: 'Frontend',
          backend: 'Backend',
          database: 'Database',
          tools: 'Tools',
          cloudDevOps: 'Cloud & DevOps',
          aiMl: 'AI/ML',
        }
        for (const [key, category] of Object.entries(categories)) {
          if (Array.isArray(profile.skills[key])) {
            profile.skills[key].forEach((name, i) => {
              allSkills.push({
                id: `${key}-${i}`,
                name,
                category,
                proficiency: 70,
              })
              studentSkillNames.add(name.toLowerCase().trim())
            })
          }
        }
      }

      studentData = {
        id: profile.userId.toString(),
        name: profile.basicInfo?.fullName || req.user.name,
        enrollmentNo: req.user.enrollmentNo || '',
        email: profile.basicInfo?.professionalEmail || req.user.email,
        institute: primaryEducation.college || '',
        branch: primaryEducation.branch || req.user.fieldMark || '',
        cgpa: primaryEducation.cgpa || 0,
        degree: primaryEducation.degree || '',
        graduationYear: primaryEducation.graduationYear || '',
        targetRole: profile.careerTarget?.targetJobRole || '',
        city: profile.basicInfo?.city || '',
        skills: allSkills,
        achievements: profile.achievements || [],
        internships: profile.internships || [],
        hackathons: profile.hackathons || [],
        certifications: profile.certifications || [],
        projects: profile.projects || [],
        completionPercentage: StudentProfile.computeCompletion(profile),
        profileExists: true,
      }
    } else {
      // No profile yet — return minimal data from User model
      studentData = {
        id: req.user._id.toString(),
        name: req.user.name,
        enrollmentNo: req.user.enrollmentNo || '',
        email: req.user.email,
        institute: '',
        branch: req.user.fieldMark || '',
        cgpa: 0,
        degree: '',
        graduationYear: '',
        targetRole: '',
        city: '',
        skills: [],
        achievements: [],
        internships: [],
        hackathons: [],
        certifications: [],
        projects: [],
        completionPercentage: 0,
        profileExists: false,
      }
    }

    // Fetch real active opportunities from MongoDB
    const [realInternships, realJobLinks, realJobs] = await Promise.all([
      Internship.find({ isActive: true }).limit(5).lean(),
      JobLink.find({ isActive: true }).limit(5).lean(),
      Job.find({ isActive: true }).limit(5).lean(),
    ])

    const allRealOpportunities = [
      ...realInternships.map((int) => ({
        id: int._id.toString(),
        type: 'internship',
        title: int.title,
        company: int.company,
        location: int.location,
        stipend: int.stipend || 'Competitive Stipend',
        applicationUrl: int.applicationUrl,
        skills: int.skills || [],
      })),
      ...realJobLinks.map((jl) => ({
        id: jl._id.toString(),
        type: 'job',
        title: jl.title,
        company: jl.company,
        location: jl.location,
        stipend: jl.jobType || 'Full-time',
        jobUrl: jl.jobUrl,
        skills: jl.skills || [],
      })),
      ...realJobs.map((j) => ({
        id: j._id.toString(),
        type: 'job',
        title: j.title,
        company: j.company,
        location: j.location,
        stipend: j.salary || 'Best in Industry',
        jobUrl: j.jobUrl,
        skills: j.skills || [],
      })),
    ]

    // Calculate match scores against student's real skills
    const matchedOpportunities = allRealOpportunities.map((opp) => {
      let matchScore = 65 // base
      if (opp.skills && opp.skills.length > 0 && studentSkillNames.size > 0) {
        const matches = opp.skills.filter((sk) => studentSkillNames.has(sk.toLowerCase().trim())).length
        matchScore = Math.min(98, Math.max(45, Math.round((matches / opp.skills.length) * 100)))
      }
      return {
        ...opp,
        matchScore,
      }
    }).sort((a, b) => b.matchScore - a.matchScore)

    res.json({
      student: studentData,
      matchedOpportunities,
    })
  } catch (err) {
    next(err)
  }
})

export default router
