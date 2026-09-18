import { Router } from 'express'
import {
  getStudentIndustryTests,
  getLiveContestShortcut,
  getStudentContestDetails,
  submitStudentSolution,
  getContestStandings,
  runStudentCode,
} from '../controllers/industryContestController.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

router.use(authenticate)

router.get('/', getStudentIndustryTests)
router.get('/live-shortcut', getLiveContestShortcut)
router.get('/:id', getStudentContestDetails)
router.post('/:id/run', runStudentCode)
router.post('/:id/submit', submitStudentSolution)
router.get('/:id/standings', getContestStandings)

export default router
