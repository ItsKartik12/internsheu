import User from '../models/User.js'
import Internship from '../models/Internship.js'
import JobLink from '../models/JobLink.js'
import AssessmentAttempt from '../models/AssessmentAttempt.js'
import SkillResult from '../models/SkillResult.js'
import Contest from '../models/Contest.js'
import ContestResult from '../models/ContestResult.js'
import IndustryAssessment from '../models/IndustryAssessment.js'
import IndustryAssessmentAttempt from '../models/IndustryAssessmentAttempt.js'
import Problem from '../models/Problem.js'
import TalentPipeline from '../models/TalentPipeline.js'

/**
 * GET /api/admin/stats
 * Returns real counts and metrics from MongoDB Atlas collections
 */
export async function getAdminStats(req, res, next) {
  try {
    const [
      totalStudents,
      activeInternships,
      activeJobLinks,
      partnerCompanies,
      totalAssessments,
    ] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      Internship.countDocuments({ isActive: true }),
      JobLink.countDocuments({ isActive: true }),
      User.countDocuments({ role: 'industry' }),
      AssessmentAttempt.countDocuments(),
    ])

    // Department breakdown of registered students
    const deptAgg = await User.aggregate([
      { $match: { role: 'student', fieldMark: { $exists: true, $ne: null } } },
      { $group: { _id: '$fieldMark', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ])

    const departmentBreakdown = deptAgg.map((d) => ({
      department: d._id,
      students: d.count,
      placementRate: null, // Do not invent fake placement percentages
    }))

    // Recent student assessment activities from MongoDB
    const recentAttempts = await AssessmentAttempt.find()
      .populate('studentId', 'name email')
      .populate('topicId', 'name')
      .sort({ completedAt: -1 })
      .limit(6)
      .lean()

    const recentActivity = recentAttempts.map((a) => ({
      id: a._id,
      studentName: a.studentId?.name || 'Student',
      role: a.topicId?.name ? `${a.topicId.name} Assessment` : 'Skill Assessment',
      company: a.passed ? `Passed (${a.percentage}%)` : `Attempted (${a.percentage}%)`,
      status: a.passed ? 'Offer accepted' : 'Application submitted',
      date: a.completedAt,
    }))

    res.json({
      totalStudents,
      activeInternships,
      activeJobLinks,
      partnerCompanies,
      totalAssessments,
      placementRate: null, // Real placement data not tracked yet
      departmentBreakdown,
      recentActivity,
    })
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/admin/industry-overview
 * Admin oversight into Industry Contests, Industry Assessments, Problems, and Screening
 */
export async function getAdminIndustryOverview(req, res, next) {
  try {
    const [
      totalContests,
      totalIndustryAssessments,
      totalProblems,
      totalShortlisted,
      contests,
      assessments,
    ] = await Promise.all([
      Contest.countDocuments(),
      IndustryAssessment.countDocuments(),
      Problem.countDocuments(),
      TalentPipeline.countDocuments(),
      Contest.find()
        .populate('industryId', 'name email')
        .populate('problems', 'title difficulty')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
      IndustryAssessment.find()
        .populate('industryId', 'name email')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
    ])

    res.json({
      totalContests,
      totalIndustryAssessments,
      totalProblems,
      totalShortlisted,
      contests,
      assessments,
    })
  } catch (err) {
    next(err)
  }
}
