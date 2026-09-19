import { Router } from 'express'
import {
  getPaymentConfigController,
  calculateFeeController,
  createPostingOrderController,
  verifyAndPublishPostingController,
  getMyPaymentTransactionsController,
} from '../controllers/paymentController.js'
import { authenticate, authorize } from '../middleware/auth.js'

const router = Router()

// Public / client gateway configuration (safe key ID only, no secrets)
router.get('/config', getPaymentConfigController)

// Protected payment endpoints
router.post('/calculate-fee', authenticate, authorize('industry', 'admin'), calculateFeeController)
router.post('/create-posting-order', authenticate, authorize('industry', 'admin'), createPostingOrderController)
router.post('/verify-and-publish', authenticate, authorize('industry', 'admin'), verifyAndPublishPostingController)
router.get('/my-transactions', authenticate, authorize('industry', 'admin'), getMyPaymentTransactionsController)

export default router
