import { Router } from 'express'
import {
  getIndustryAssessments,
  getAssessmentById,
  createAssessment,
  updateAssessment,
  deleteAssessment,
  getAssessmentResults,
} from '../controllers/industryAssessmentController.js'
import { authenticate, authorize } from '../middleware/auth.js'

const router = Router()

router.use(authenticate)

router.get('/', authorize('industry', 'admin'), getIndustryAssessments)
router.get('/:id', authorize('industry', 'admin'), getAssessmentById)
router.post('/', authorize('industry', 'admin'), createAssessment)
router.put('/:id', authorize('industry', 'admin'), updateAssessment)
router.delete('/:id', authorize('industry', 'admin'), deleteAssessment)
router.get('/:id/results', authorize('industry', 'admin'), getAssessmentResults)

export default router
