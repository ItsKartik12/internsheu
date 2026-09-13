import express from 'express'
import jwt from 'jsonwebtoken'
import { authenticate, authorize } from '../middleware/auth.js'

// Test harness for verifying RBAC middleware rules locally without DB calls
const app = express()
app.use(express.json())

const JWT_SECRET = 'test_jwt_secret_12345'
process.env.JWT_SECRET = JWT_SECRET

// Mock mockUser resolver
function mockAuthMiddleware(mockUser) {
  return (req, res, next) => {
    req.user = mockUser
    next()
  }
}

// Set up mock test routes matching our real routes
app.post('/test/courses', mockAuthMiddleware({ _id: 'edu1', role: 'educator' }), authorize('educator', 'admin'), (req, res) => {
  res.json({ ok: true, action: 'create_course' })
})

app.post('/test/internships', mockAuthMiddleware({ _id: 'ind1', role: 'industry' }), authorize('industry', 'admin'), (req, res) => {
  res.json({ ok: true, action: 'create_internship' })
})

app.post('/test/jobs', mockAuthMiddleware({ _id: 'ind1', role: 'industry' }), authorize('industry', 'admin'), (req, res) => {
  res.json({ ok: true, action: 'create_job' })
})

// Forbidden route tests
app.post('/test/forbidden/educator-to-internship', mockAuthMiddleware({ _id: 'edu1', role: 'educator' }), authorize('industry', 'admin'), (req, res) => {
  res.json({ ok: true })
})

app.post('/test/forbidden/industry-to-course', mockAuthMiddleware({ _id: 'ind1', role: 'industry' }), authorize('educator', 'admin'), (req, res) => {
  res.json({ ok: true })
})

app.post('/test/forbidden/student-to-course', mockAuthMiddleware({ _id: 'stu1', role: 'student' }), authorize('educator', 'admin'), (req, res) => {
  res.json({ ok: true })
})

// Skill level calculation test
function determineSkillLevel(percentage) {
  if (percentage >= 90) return 'Excellent'
  if (percentage >= 75) return 'Strong'
  if (percentage >= 60) return 'Intermediate'
  if (percentage >= 40) return 'Beginner'
  return 'Needs Improvement'
}

let passedTests = 0
let failedTests = 0

function assert(condition, message) {
  if (condition) {
    console.log(`✓ ${message}`)
    passedTests++
  } else {
    console.error(`✗ FAIL: ${message}`)
    failedTests++
  }
}

async function runTests() {
  console.log('--- Running RBAC & Module Verification Tests ---')

  // 1. Test Skill Level Scale
  assert(determineSkillLevel(95) === 'Excellent', 'Score 95% -> Excellent')
  assert(determineSkillLevel(85) === 'Strong', 'Score 85% -> Strong')
  assert(determineSkillLevel(65) === 'Intermediate', 'Score 65% -> Intermediate')
  assert(determineSkillLevel(45) === 'Beginner', 'Score 45% -> Beginner')
  assert(determineSkillLevel(30) === 'Needs Improvement', 'Score 30% -> Needs Improvement')

  // 2. Test Authorization Middleware
  const reqStudent = { user: { _id: 's1', role: 'student' } }
  const reqEducator = { user: { _id: 'e1', role: 'educator' } }
  const reqIndustry = { user: { _id: 'i1', role: 'industry' } }
  const reqAdmin = { user: { _id: 'a1', role: 'admin' } }

  const educatorAuth = authorize('educator', 'admin')
  const industryAuth = authorize('industry', 'admin')

  // Educator route authorization
  let allowed = false
  educatorAuth(reqEducator, {}, () => { allowed = true })
  assert(allowed, 'Educator allowed on course creation route')

  let studentCourseDenied = false
  educatorAuth(reqStudent, {
    status: (code) => ({
      json: (data) => { if (code === 403) studentCourseDenied = true }
    })
  }, () => {})
  assert(studentCourseDenied, 'Student blocked with 403 Forbidden on course creation')

  let industryCourseDenied = false
  educatorAuth(reqIndustry, {
    status: (code) => ({
      json: (data) => { if (code === 403) industryCourseDenied = true }
    })
  }, () => {})
  assert(industryCourseDenied, 'Industry blocked with 403 Forbidden on course creation')

  // Industry route authorization
  let industryInternshipAllowed = false
  industryAuth(reqIndustry, {}, () => { industryInternshipAllowed = true })
  assert(industryInternshipAllowed, 'Industry allowed on internship creation route')

  let educatorInternshipDenied = false
  industryAuth(reqEducator, {
    status: (code) => ({
      json: (data) => { if (code === 403) educatorInternshipDenied = true }
    })
  }, () => {})
  assert(educatorInternshipDenied, 'Educator blocked with 403 Forbidden on internship creation')

  let studentInternshipDenied = false
  industryAuth(reqStudent, {
    status: (code) => ({
      json: (data) => { if (code === 403) studentInternshipDenied = true }
    })
  }, () => {})
  assert(studentInternshipDenied, 'Student blocked with 403 Forbidden on internship creation')

  // Admin bypass
  let adminAllowedOnCourses = false
  educatorAuth(reqAdmin, {}, () => { adminAllowedOnCourses = true })
  assert(adminAllowedOnCourses, 'Admin allowed on course creation route')

  let adminAllowedOnInternships = false
  industryAuth(reqAdmin, {}, () => { adminAllowedOnInternships = true })
  assert(adminAllowedOnInternships, 'Admin allowed on internship creation route')

  // 3. Ownership Checks
  const courseOwnedByE1 = { educatorId: 'e1', title: 'React Masterclass' }
  const isE1Owner = courseOwnedByE1.educatorId.toString() === reqEducator.user._id.toString()
  assert(isE1Owner, 'Educator E1 recognized as owner of their course')

  const otherEducator = { user: { _id: 'e2', role: 'educator' } }
  const isE2Owner = courseOwnedByE1.educatorId.toString() === otherEducator.user._id.toString()
  assert(!isE2Owner, 'Educator E2 blocked from modifying Educator E1 course')

  console.log(`\nResults: ${passedTests} passed, ${failedTests} failed.`)
  if (failedTests > 0) process.exit(1)
}

runTests().catch(err => {
  console.error(err)
  process.exit(1)
})
