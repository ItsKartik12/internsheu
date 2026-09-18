import { Router } from 'express'
import { getAdminStats, getAdminIndustryOverview } from '../controllers/adminController.js'
import { authenticate, authorize } from '../middleware/auth.js'

const router = Router()

router.get('/stats', authenticate, authorize('admin'), getAdminStats)
router.get('/industry-overview', authenticate, authorize('admin'), getAdminIndustryOverview)

export default router
