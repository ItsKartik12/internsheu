import { Router } from 'express'
import {
  getIndustryContests,
  getContestById,
  createContest,
  updateContest,
  publishContest,
  deleteContest,
  getContestStandings,
  triggerResultSync,
} from '../controllers/industryContestController.js'
import { authenticate, authorize } from '../middleware/auth.js'

const router = Router()

router.use(authenticate)

// Industry contest routes
router.get('/', authorize('industry', 'admin'), getIndustryContests)
router.get('/:id', authorize('industry', 'admin'), getContestById)
router.post('/', authorize('industry', 'admin'), createContest)
router.put('/:id', authorize('industry', 'admin'), updateContest)
router.post('/:id/publish', authorize('industry', 'admin'), publishContest)
router.delete('/:id', authorize('industry', 'admin'), deleteContest)
router.get('/:id/standings', authorize('industry', 'admin'), getContestStandings)
router.post('/:id/sync-results', authorize('industry', 'admin'), triggerResultSync)

export default router
