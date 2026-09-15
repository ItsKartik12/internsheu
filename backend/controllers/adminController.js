import User from '../models/User.js'
import Internship from '../models/Internship.js'
import JobLink from '../models/JobLink.js'
import AssessmentAttempt from '../models/AssessmentAttempt.js'
import SkillResult from '../models/SkillResult.js'

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
