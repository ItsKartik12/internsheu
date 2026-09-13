import { Router } from 'express'
import {
  getInternships,
  getInternshipById,
  createInternship,
  updateInternship,
  deleteInternship,
  applyInternship,
} from '../controllers/internshipController.js'
import { authenticate, authorize } from '../middleware/auth.js'

const router = Router()

router.use(authenticate)

router.get('/', getInternships)
router.get('/:id', getInternshipById)
router.post('/', authorize('industry', 'admin'), createInternship)
router.put('/:id', authorize('industry', 'admin'), updateInternship)
router.delete('/:id', authorize('industry', 'admin'), deleteInternship)
router.post('/:id/apply', authorize('student'), applyInternship)

export default router
