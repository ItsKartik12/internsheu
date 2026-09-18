import { Router } from 'express'
import {
  getInternships,
  getInternshipById,
  createInternship,
  updateInternship,
  deleteInternship,
  applyInternship,
  applyInternsetu,
  trackVisitCompanyUrl,
  getInternshipApplications,
  getMyApplications,
} from '../controllers/internshipController.js'
import { authenticate, authorize } from '../middleware/auth.js'

const router = Router()

// Public browsing
router.get('/', getInternships)
router.get('/my-applications', authenticate, authorize('student'), getMyApplications)
router.get('/:id', getInternshipById)

// Protected actions
router.post('/', authenticate, authorize('industry', 'admin'), createInternship)
router.put('/:id', authenticate, authorize('industry', 'admin'), updateInternship)
router.delete('/:id', authenticate, authorize('industry', 'admin'), deleteInternship)
router.post('/:id/apply', authenticate, authorize('student'), applyInternship)
router.post('/:id/apply-internsetu', authenticate, authorize('student'), applyInternsetu)
router.post('/:id/track-visit', authenticate, authorize('student'), trackVisitCompanyUrl)
router.get('/:id/applications', authenticate, authorize('industry', 'admin'), getInternshipApplications)

export default router
