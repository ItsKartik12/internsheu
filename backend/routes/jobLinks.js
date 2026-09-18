import { Router } from 'express'
import {
  getJobLinks,
  getJobLinkById,
  createJobLink,
  updateJobLink,
  deleteJobLink,
} from '../controllers/jobLinkController.js'
import { authenticate, authorize } from '../middleware/auth.js'

const router = Router()

// Public browsing
router.get('/', getJobLinks)
router.get('/:id', getJobLinkById)

// Protected actions
router.post('/', authenticate, authorize('industry', 'admin'), createJobLink)
router.put('/:id', authenticate, authorize('industry', 'admin'), updateJobLink)
router.delete('/:id', authenticate, authorize('industry', 'admin'), deleteJobLink)

export default router
