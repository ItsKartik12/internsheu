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

// All routes require authentication
router.use(authenticate)

router.get('/', getCourses)
router.get('/:id', getCourseById)
router.post('/', authorize('educator', 'admin'), createCourse)
router.put('/:id', authorize('educator', 'admin'), updateCourse)
router.delete('/:id', authorize('educator', 'admin'), deleteCourse)
router.post('/:id/enroll', authorize('student'), enrollCourse)

export default router
