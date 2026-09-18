import { Router } from 'express'
import {
  getTopics,
  createTopic,
  updateTopic,
  deleteTopic,
  getQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  startAssessment,
  submitAssessment,
  getMyAttempts,
  getAttemptById,
  getMySkillResults,
  getAllStudentResults,
} from '../controllers/assessmentController.js'
import { authenticate, authorize } from '../middleware/auth.js'

const router = Router()

// Topic routes - public read, admin mutations
router.get('/topics', getTopics)
router.post('/topics', authenticate, authorize('admin'), createTopic)
router.put('/topics/:id', authenticate, authorize('admin'), updateTopic)
router.delete('/topics/:id', authenticate, authorize('admin'), deleteTopic)

// Question routes (admin only)
router.get('/questions', authenticate, authorize('admin'), getQuestions)
router.post('/questions', authenticate, authorize('admin'), createQuestion)
router.put('/questions/:id', authenticate, authorize('admin'), updateQuestion)
router.delete('/questions/:id', authenticate, authorize('admin'), deleteQuestion)

// Student assessment execution
router.post('/start', authenticate, authorize('student', 'admin'), startAssessment)
router.post('/submit', authenticate, authorize('student', 'admin'), submitAssessment)

// Attempts & results
router.get('/attempts', authenticate, authorize('student', 'admin'), getMyAttempts)
router.get('/attempts/:id', authenticate, getAttemptById)
router.get('/results/me', authenticate, authorize('student'), getMySkillResults)
router.get('/results/all', authenticate, authorize('admin'), getAllStudentResults)

export default router
