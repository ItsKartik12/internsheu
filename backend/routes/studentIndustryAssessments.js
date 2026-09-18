import { Router } from 'express'
import {
  getStudentIndustryAssessments,
  startStudentAssessment,
  submitStudentAssessment,
} from '../controllers/industryAssessmentController.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

router.use(authenticate)

router.get('/', getStudentIndustryAssessments)
router.post('/:id/start', startStudentAssessment)
router.post('/:id/submit', submitStudentAssessment)

export default router
