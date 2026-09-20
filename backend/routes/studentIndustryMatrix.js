import { Router } from 'express'
import { getStudentIndustryMatrix } from '../controllers/candidateMatrixController.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

router.use(authenticate)

// Identity boundary (same as the interview router): the offline demo bridge
// issues a non-ObjectId demo identity when MongoDB is unreachable. The matrix
// aggregation queries InterviewSession/StudentProfile by the real User _id,
// so a demo identity must never reach those ObjectId queries.
function requireRealUser(req, res, next) {
  if (req.user?.isDemoIdentity) {
    return res.status(503).json({
      error: 'The Skill Matrix requires a signed-in account with the database available. Demo/offline sessions cannot be used here.',
      dbUnavailable: true,
    })
  }
  next()
}

router.use(requireRealUser)

router.get('/', getStudentIndustryMatrix)

export default router
