import { Router } from 'express'
import { studentProfile, matchedOpportunities } from '../data/studentDashboard.js'

const router = Router()

// GET /api/student/dashboard
// Serves the logged-in student's profile, skill proficiencies, and matched
// opportunities in one payload — currently backed by mock data, structured
// so a real DB-backed query can drop in without changing the response shape.
router.get('/dashboard', (req, res) => {
  res.json({
    student: studentProfile,
    matchedOpportunities,
  })
})

export default router
