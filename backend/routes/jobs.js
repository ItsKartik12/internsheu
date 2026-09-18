import { Router } from 'express'
import {
  getJobs,
  getJobById,
  createJob,
  updateJob,
  deleteJob,
} from '../controllers/jobController.js'
import {
  applyJob,
  trackVisitJobPortal,
  getMyJobApplications,
} from '../controllers/jobApplicationController.js'
import { authenticate, authorize } from '../middleware/auth.js'

const router = Router()

// Student specific application routes (Must be defined before /:id)
router.get('/my-applications', authenticate, authorize('student'), getMyJobApplications)
router.post('/:id/apply', authenticate, authorize('student'), applyJob)
router.post('/:id/track-visit', authenticate, authorize('student'), trackVisitJobPortal)

// Public browsing
router.get('/', getJobs)
router.get('/:id', getJobById)

// Protected actions
router.post('/', authenticate, authorize('admin'), createJob)
router.put('/:id', authenticate, authorize('industry', 'admin'), updateJob)
router.delete('/:id', authenticate, authorize('industry', 'admin'), deleteJob)

export default router
