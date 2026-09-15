import { Router } from 'express'
import { getProfile, updateProfile } from '../controllers/profileController.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

// GET /api/profile — fetch authenticated user's profile
router.get('/', authenticate, getProfile)

// PUT /api/profile — create or update authenticated user's profile
router.put('/', authenticate, updateProfile)

export default router
