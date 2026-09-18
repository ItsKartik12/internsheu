import { Router } from 'express'
import { getStudentIndustryMatrix } from '../controllers/candidateMatrixController.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

router.use(authenticate)

router.get('/', getStudentIndustryMatrix)

export default router
