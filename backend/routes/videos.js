import { Router } from 'express'
import {
  getVideos,
  getVideoById,
  createVideo,
  updateVideo,
  deleteVideo,
} from '../controllers/videoController.js'
import { authenticate, authorize } from '../middleware/auth.js'

const router = Router()

// Public / Authenticated read
router.get('/', getVideos)
router.get('/:id', getVideoById)

// Admin-only mutations
router.post('/', authenticate, authorize('admin'), createVideo)
router.put('/:id', authenticate, authorize('admin'), updateVideo)
router.delete('/:id', authenticate, authorize('admin'), deleteVideo)

export default router
