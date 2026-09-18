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
