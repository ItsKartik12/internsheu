import { Router } from 'express'
import {
  createInterview,
  getRecommendedSkills,
  startInterview,
  respondInterview,
  finishInterview,
  getMyInterviews,
  getInterviewById,
  getMyInterviewSkillResults,
} from '../controllers/interviewController.js'
import { getDeepgramTemporaryKey, classifyDeepgramError } from '../services/deepgramService.js'
import { authenticate, authorize } from '../middleware/auth.js'

const router = Router()

// All interview routes require an authenticated InternSetu student/admin.
router.use(authenticate)
router.use(authorize('student', 'admin'))

// GET /api/interview/skills — profile-derived skill recommendations (setup step 2)
router.get('/skills', getRecommendedSkills)

// POST /api/interview/create — persist step 1 + step 2 configuration
router.post('/create', createInterview)

// Deepgram temporary token — authenticated so only logged-in users can mint
// short-lived voice credentials. The permanent key stays backend-only.
router.post('/deepgram-token', async (req, res) => {
  try {
    const token = await getDeepgramTemporaryKey()
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    res.json({ token })
  } catch (err) {
    const { status, message } = classifyDeepgramError(err)
    res.status(status).json({ error: message })
  }
})

// Interview lifecycle
router.post('/:id/start', startInterview)
router.post('/:id/respond', respondInterview)
router.post('/:id/finish', finishInterview)

// Results
router.get('/mine', getMyInterviews)
router.get('/results/me', getMyInterviewSkillResults)
router.get('/:id', getInterviewById)

export default router
