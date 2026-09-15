import { Router } from 'express'
import {
  getJobs,
  getJobById,
  createJob,
  updateJob,
  deleteJob,
  applyJob,
} from '../controllers/jobController.js'
import { authenticate, authorize } from '../middleware/auth.js'

const router = Router()

router.use(authenticate)

router.get('/', getJobs)
router.get('/:id', getJobById)
router.post('/', authorize('admin'), createJob)
router.put('/:id', authorize('industry', 'admin'), updateJob)
router.delete('/:id', authorize('industry', 'admin'), deleteJob)
router.post('/:id/apply', authorize('student'), applyJob)

export default router
