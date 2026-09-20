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

// Identity boundary: every interview query (StudentProfile, InterviewSession,
// Skill Matrix aggregation) filters by the real MongoDB User _id. The offline
// demo bridge (mock-token) issues a non-ObjectId demo identity when MongoDB
// is unreachable — letting it reach those ObjectId queries would crash with a
// CastError. Reject it early with a clear, controlled error instead.
function requireRealUser(req, res, next) {
  if (req.user?.isDemoIdentity) {
    return res.status(503).json({
      error: 'Interviews require a signed-in account with the database available. Demo/offline sessions cannot be used here.',
      dbUnavailable: true,
    })
  }
  next()
}

router.use(requireRealUser)

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
