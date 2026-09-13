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

router.use(authenticate)

// Topic routes
router.get('/topics', getTopics)
router.post('/topics', authorize('admin'), createTopic)
router.put('/topics/:id', authorize('admin'), updateTopic)
router.delete('/topics/:id', authorize('admin'), deleteTopic)

// Question routes (admin only)
router.get('/questions', authorize('admin'), getQuestions)
router.post('/questions', authorize('admin'), createQuestion)
router.put('/questions/:id', authorize('admin'), updateQuestion)
router.delete('/questions/:id', authorize('admin'), deleteQuestion)

// Student assessment execution
router.post('/start', authorize('student', 'admin'), startAssessment)
router.post('/submit', authorize('student', 'admin'), submitAssessment)

// Attempts & results
router.get('/attempts', authorize('student', 'admin'), getMyAttempts)
router.get('/attempts/:id', getAttemptById)
router.get('/results/me', authorize('student', 'admin'), getMySkillResults)
router.get('/results/all', authorize('admin'), getAllStudentResults)

export default router
