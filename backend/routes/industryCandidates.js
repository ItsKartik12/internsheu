import { Router } from 'express'
import {
  getCandidateMatrix,
  getCandidateProfile,
  updateCandidatePipeline,
  getTalentPipelineCandidates,
  unlockCandidateContact,
  bulkUnlockShortlistedCandidates,
  getIndustryRequirements,
  createIndustryRequirement,
} from '../controllers/candidateMatrixController.js'
import { authenticate, authorize } from '../middleware/auth.js'

const router = Router()

router.use(authenticate)

// Identity boundary (same as the interview router): the offline demo bridge
// issues a non-ObjectId demo identity when MongoDB is unreachable. The
// candidate-matrix endpoints query documents whose industryId/companyId are
// real ObjectIds, so a demo identity must never reach those queries.
function requireRealUser(req, res, next) {
  if (req.user?.isDemoIdentity) {
    return res.status(503).json({
      error: 'This feature requires a signed-in account with the database available. Demo/offline sessions cannot be used here.',
      dbUnavailable: true,
    })
  }
  next()
}

router.use(requireRealUser)

router.get('/', authorize('industry', 'admin'), getCandidateMatrix)
router.get('/requirements', authorize('industry', 'admin'), getIndustryRequirements)
router.post('/requirements', authorize('industry', 'admin'), createIndustryRequirement)

// Talent Pipeline routes (must be placed before /:studentId)
router.get('/pipeline', authorize('industry', 'admin'), getTalentPipelineCandidates)
router.post('/pipeline', authorize('industry', 'admin'), updateCandidatePipeline)
router.post('/pipeline/unlock-contact', authorize('industry', 'admin'), unlockCandidateContact)
router.post('/pipeline/bulk-unlock', authorize('industry', 'admin'), bulkUnlockShortlistedCandidates)

router.get('/:studentId', authorize('industry', 'admin'), getCandidateProfile)

export default router
