import { Router } from 'express'
import {
  getProblems,
  getProblemById,
  createProblem,
  updateProblem,
  deleteProblem,
  validateProblemMapping,
} from '../controllers/problemController.js'
import { authenticate, authorize } from '../middleware/auth.js'

const router = Router()

// Public browsing
router.get('/', getProblems)
router.get('/:id', getProblemById)

// Admin management
router.post('/', authenticate, authorize('admin'), createProblem)
router.put('/:id', authenticate, authorize('admin'), updateProblem)
router.delete('/:id', authenticate, authorize('admin'), deleteProblem)
router.post('/validate-mapping', authenticate, authorize('admin'), validateProblemMapping)

export default router
