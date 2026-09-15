import { Router } from 'express'
import { getAdminStats } from '../controllers/adminController.js'
import { authenticate, authorize } from '../middleware/auth.js'

const router = Router()

router.get('/stats', authenticate, authorize('admin'), getAdminStats)

export default router
