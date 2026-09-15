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

router.use(authenticate)

router.get('/', getJobLinks)
router.get('/:id', getJobLinkById)
router.post('/', authorize('industry', 'admin'), createJobLink)
router.put('/:id', authorize('industry', 'admin'), updateJobLink)
router.delete('/:id', authorize('industry', 'admin'), deleteJobLink)

export default router
