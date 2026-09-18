import { Router } from 'express'
import {
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  enrollCourse,
} from '../controllers/courseController.js'
import { authenticate, authorize } from '../middleware/auth.js'

const router = Router()

// Public browsing
router.get('/', getCourses)
router.get('/:id', getCourseById)

// Protected actions
router.post('/', authenticate, authorize('educator', 'admin'), createCourse)
router.put('/:id', authenticate, authorize('educator', 'admin'), updateCourse)
router.delete('/:id', authenticate, authorize('educator', 'admin'), deleteCourse)
router.post('/:id/enroll', authenticate, authorize('student'), enrollCourse)

export default router
