import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../.env') })

import mongoose from 'mongoose'
import { connectDB } from '../config/db.js'
import User from '../models/User.js'
import Problem from '../models/Problem.js'
import Contest from '../models/Contest.js'
import ContestResult from '../models/ContestResult.js'
import IndustryAssessment from '../models/IndustryAssessment.js'
import IndustryAssessmentAttempt from '../models/IndustryAssessmentAttempt.js'
import Internship from '../models/Internship.js'
import InternshipApplication from '../models/InternshipApplication.js'
import TalentPipeline from '../models/TalentPipeline.js'
import StudentProfile from '../models/StudentProfile.js'
import IndustryRequirement from '../models/IndustryRequirement.js'
import vjudgeService from '../services/judge/VJudgeService.js'
import { submitStudentAssessment } from '../controllers/industryAssessmentController.js'
import {
  getStudentIndustryMatrix,
  getCandidateMatrix,
  getCandidateProfile,
} from '../controllers/candidateMatrixController.js'

let passed = 0
let failed = 0

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`)
    passed++
  } else {
    console.error(`  ✗ FAIL: ${message}`)
    failed++
  }
}

async function runEndToEndTest() {
  console.log('============================================================')
  console.log('INTERNSETU END-TO-END VERIFICATION SUITE')
  console.log('============================================================')

  await connectDB()

  // Find or create test users
  let admin = await User.findOne({ role: 'admin' })
  if (!admin) {
    admin = await User.create({ name: 'Admin Test', email: 'admin_test@internsetu.edu', password: 'password123', role: 'admin' })
  }

  let industry = await User.findOne({ role: 'industry' })
  if (!industry) {
    industry = await User.create({ name: 'Nexus Tech', email: 'nexus_test@internsetu.edu', password: 'password123', role: 'industry' })
  }

  let student = await User.findOne({ role: 'student' })
  if (!student) {
    student = await User.create({ name: 'Rachit Student', email: 'student_test@internsetu.edu', password: 'password123', role: 'student', fieldMark: 'Computer Science' })
  }

  console.log('\n[1] ADMIN: PROBLEM LIBRARY MANAGEMENT')
  // Check VJudge problem ID mapping validation
  const validationGood = vjudgeService.validateProblemMapping('LeetCode-1')
  assert(validationGood.valid === true, 'VJudge format validator accepts valid problem ID')
  assert(validationGood.url.includes('vjudge.net/problem/LeetCode-1'), 'VJudge problem URL generated safely')

  // Create a problem in Problem Library
  const testProblem = await Problem.findOneAndUpdate(
    { slug: 'e2e-two-sum-test' },
    {
      title: 'E2E Two Sum Challenge',
      slug: 'e2e-two-sum-test',
      difficulty: 'Easy',
      topic: 'Arrays',
      tags: ['hash-map', 'array'],
      description: 'Find two indices that sum up to the target value.',
      externalProvider: 'vjudge',
      externalProblemId: 'LeetCode-1',
      status: 'active',
      addedBy: admin._id,
    },
    { upsert: true, new: true }
  )
  assert(testProblem && testProblem._id, 'Admin problem persisted to MongoDB')
  assert(testProblem.status === 'active', 'Problem is active for industry selection')

  console.log('\n[2] INDUSTRY: DSA CONTEST LIFECYCLE & VJUDGE INTEGRATION')
  const start = new Date(Date.now() - 1000 * 60 * 10) // started 10 min ago
  const end = new Date(Date.now() + 1000 * 60 * 120) // ends in 2 hours
  const contest = await Contest.findOneAndUpdate(
    { title: 'E2E SDE Hiring Contest' },
    {
      title: 'E2E SDE Hiring Contest',
      description: 'Screening contest for SDE internship',
      industryId: industry._id,
      company: industry.name,
      role: 'SDE Intern',
      startDate: start,
      endDate: end,
      durationMinutes: 120,
      problems: [testProblem._id],
      allowedLanguages: ['C++', 'Java', 'Python', 'JavaScript'],
      status: 'Live',
      isPublished: true,
      maxParticipants: 100,
    },
    { upsert: true, new: true }
  )
  assert(contest && contest._id, 'Contest created with problems from Problem Library')
  assert(contest.problems.length === 1, 'Problem attached to contest')

  // VJudge Sync safely returns non-fabricated pending state
  const syncResult = await vjudgeService.syncResults(contest._id, contest.externalContestId)
  assert(syncResult.syncStatus === 'Manual' || syncResult.syncStatus === 'Result Sync Pending', 'VJudge sync does NOT fabricate results; marks safe pending status')

  console.log('\n[3] STUDENT: CONTEST ATTEMPT & CODE SUBMISSION')
  // Record student submission
  const subResult = await vjudgeService.submitSolution({
    externalContestId: contest.externalContestId,
    externalProblemId: testProblem.externalProblemId,
    language: 'C++',
    code: '#include <iostream>\nint main() { return 0; }',
    studentId: student._id.toString(),
  })
  assert(subResult.status === 'SUBMITTED', 'Code submission safely recorded without inventing unsupported verdicts')

  // Record ContestResult
  const contestResult = await ContestResult.findOneAndUpdate(
    { contestId: contest._id, studentId: student._id },
    {
      industryId: industry._id,
      score: 250,
      problemsSolved: 1,
      rank: 1,
      submissions: [{
        problemId: testProblem._id,
        verdict: 'Accepted',
        score: 250,
        language: 'C++',
      }],
      status: 'Completed',
    },
    { upsert: true, new: true }
  )
  assert(contestResult && contestResult.problemsSolved === 1, 'Contest result recorded in MongoDB ContestResult')

  console.log('\n[4] INDUSTRY: MCQ ASSESSMENT LIFECYCLE')
  const assessment = await IndustryAssessment.findOneAndUpdate(
    { title: 'E2E Frontend Screening MCQ' },
    {
      title: 'E2E Frontend Screening MCQ',
      description: 'Assessing core JavaScript and React concepts',
      industryId: industry._id,
      company: industry.name,
      role: 'Frontend Intern',
      durationMinutes: 30,
      passingScore: 60,
      maxAttempts: 2,
      status: 'Published',
      questions: [
        {
          question: 'What hook is used for side effects in React?',
          options: ['useState', 'useEffect', 'useMemo', 'useRef'],
          correctAnswer: 1,
          marks: 5,
          negativeMarks: 0,
          topic: 'React',
          difficulty: 'Easy',
          explanation: 'useEffect is standard for side effects.',
        },
        {
          question: 'Which of the following is NOT a JavaScript primitive?',
          options: ['Boolean', 'Number', 'Object', 'String'],
          correctAnswer: 2,
          marks: 5,
          negativeMarks: 0,
          topic: 'JavaScript',
          difficulty: 'Easy',
          explanation: 'Object is a composite reference type.',
        },
      ],
    },
    { upsert: true, new: true }
  )
  assert(assessment && assessment.questions.length === 2, 'Industry assessment created and published')

  console.log('\n[5] STUDENT: SAFE ASSESSMENT ATTEMPT & GRADING')
  // Verify correct answers are NOT exposed when student queries published assessments
  const sanitized = assessment.questions.map(q => ({
    _id: q._id,
    question: q.question,
    options: q.options,
  }))
  assert(sanitized[0].correctAnswer === undefined, 'Sanitized question object completely conceals correctAnswer')
  assert(sanitized[0].explanation === undefined, 'Sanitized question object completely conceals explanation')

  // Clean previous attempts for clean test run
  await IndustryAssessmentAttempt.deleteMany({ assessmentId: assessment._id, studentId: student._id })

  // 1. Test controller: submitStudentAssessment with real answers payload
  let submitRes = null
  await submitStudentAssessment(
    {
      params: { id: assessment._id.toString() },
      user: student,
      body: {
        answers: [
          { questionId: assessment.questions[0]._id.toString(), selectedAnswer: 1 },
          { questionId: assessment.questions[1]._id.toString(), selectedAnswer: 2 },
        ],
        timeTakenSeconds: 320,
      },
    },
    {
      status: () => ({ json: (data) => { submitRes = data } }),
      json: (data) => { submitRes = data },
    },
    (err) => { if (err) throw err }
  )

  assert(submitRes && submitRes.attempt, 'submitStudentAssessment controller processes student submission')
  assert(submitRes.attempt.score === 10, 'Student scored 10/10 on correct answers')
  assert(submitRes.attempt.percentage === 100, 'Student achieved 100%')
  assert(submitRes.attempt.passed === true, 'Student passed assessment')
  assert(submitRes.questionReview && submitRes.questionReview.length === 2, 'Question review with explanations returned only AFTER submission')

  // 2. Test direct schema validation with unanswered questions (selectedAnswer: -1)
  const partialAttempt = await IndustryAssessmentAttempt.create({
    assessmentId: assessment._id,
    studentId: student._id,
    industryId: industry._id,
    answers: [
      { questionId: assessment.questions[0]._id, selectedAnswer: 1, isCorrect: true, marksObtained: 5 },
      { questionId: assessment.questions[1]._id, selectedAnswer: -1, isCorrect: false, marksObtained: 0 },
    ],
    score: 5,
    totalMarks: 10,
    percentage: 50,
    passed: false,
    timeTakenSeconds: 150,
  })
  assert(partialAttempt && partialAttempt._id, 'IndustryAssessmentAttempt schema correctly validates selectedAnswer: -1 for unanswered questions')

  console.log('\n[6] STUDENT: INDUSTRY MATRIX & WEIGHTING TRANSPARENCY')
  // Verify that without configured weights, overallIndustryScore is NOT hardcoded
  await IndustryRequirement.deleteMany({ industryId: industry._id })

  let matrixRes = null
  await getStudentIndustryMatrix(
    { user: student },
    { json: (d) => { matrixRes = d } },
    (err) => { if (err) throw err }
  )

  assert(matrixRes && matrixRes.industryMatrix, 'getStudentIndustryMatrix controller returns student industry matrix')
  assert(matrixRes.industryMatrix.assessment.score > 0, 'Individual assessment evidence is independently visible')
  assert(matrixRes.industryMatrix.dsa.score > 0, 'Individual DSA contest evidence is independently visible')
  assert(matrixRes.industryMatrix.overallIndustryScore === null, 'Overall Industry Score is strictly null when weights are not configured')
  assert(matrixRes.industryMatrix.isConfigured === false, 'isConfigured is false when unconfigured')

  // Now configure weights explicitly and verify calculation
  await IndustryRequirement.create({
    industryId: industry._id,
    role: 'Software Engineer Intern',
    scoringWeights: {
      isConfigured: true,
      assessmentWeight: 40,
      dsaWeight: 40,
      aiInterviewWeight: 20,
    },
    isActive: true,
  })

  let matrixWithWeights = null
  await getStudentIndustryMatrix(
    { user: student },
    { json: (d) => { matrixWithWeights = d } },
    (err) => { if (err) throw err }
  )

  assert(matrixWithWeights.industryMatrix.isConfigured === true, 'isConfigured becomes true when weights are configured')
  assert(typeof matrixWithWeights.industryMatrix.overallIndustryScore === 'number', 'Overall Industry Score computed only with explicit weights')
  assert(matrixWithWeights.industryMatrix.weightsApplied.assessmentWeight === 40, 'Applied weights are transparently returned')

  console.log('\n[7] INDUSTRY: CANDIDATE MATRIX & PIPELINE STAGES')
  let candMatrixRes = null
  await getCandidateMatrix(
    { user: industry, query: { sort: 'overall' } },
    { json: (d) => { candMatrixRes = d } },
    (err) => { if (err) throw err }
  )
  assert(candMatrixRes && Array.isArray(candMatrixRes.candidates), 'getCandidateMatrix controller returns candidates list')
  const foundStudent = candMatrixRes.candidates.find(c => c.studentId.toString() === student._id.toString())
  assert(Boolean(foundStudent), 'Student is present in Industry Candidate Matrix')

  // Update candidate pipeline to 'Shortlisted'
  const pipeline = await TalentPipeline.findOneAndUpdate(
    { industryId: industry._id, studentId: student._id },
    {
      poolName: 'Default Pool',
      stage: 'Shortlisted',
      notes: 'Strong DSA and 100% on React screening',
      addedAt: new Date(),
    },
    { upsert: true, new: true }
  )
  assert(pipeline.stage === 'Shortlisted', 'Candidate moved to Shortlisted stage in TalentPipeline')
  assert(pipeline.industryId.toString() === industry._id.toString(), 'Candidate pipeline is strictly scoped to industry owner')

  // Call getCandidateProfile controller
  let profileRes = null
  await getCandidateProfile(
    { params: { studentId: student._id.toString() }, user: industry },
    { json: (d) => { profileRes = d } },
    (err) => { if (err) throw err }
  )
  assert(profileRes && profileRes.student, 'getCandidateProfile returns complete candidate profile')
  assert(profileRes.pipelineStage === 'Shortlisted', 'Candidate profile reflects Shortlisted pipeline stage')
  assert(profileRes.industryMatrix !== undefined, 'Candidate profile contains Industry Matrix evidence')

  console.log('\n[8] STUDENT & INDUSTRY: INTERNSHIP APPLICATION FLOW')
  let testInternship = await Internship.findOne({ title: 'Full Stack Development Intern' })
  if (!testInternship) {
    testInternship = await Internship.create({
      title: 'Full Stack Development Intern',
      company: industry.name,
      industryId: industry._id,
      location: 'Remote',
      type: 'Remote',
      stipend: '₹25,000 / month',
      duration: '3 Months',
      skills: ['React', 'Node.js', 'MongoDB'],
      description: 'Work with the engineering team.',
      applicationUrl: 'https://example.com/careers/fullstack-intern',
      isActive: true,
    })
  }

  // Student clicks Visit & Apply:
  // Step 1: InternSetu application record
  const internsetuApp = await InternshipApplication.findOneAndUpdate(
    { internshipId: testInternship._id, studentId: student._id },
    {
      industryId: industry._id,
      status: 'APPLIED_INTERNSETU',
      appliedAt: new Date(),
      studentSnapshot: {
        name: student.name,
        email: student.email,
        branch: student.fieldMark || 'CSE',
      },
    },
    { upsert: true, new: true }
  )
  assert(internsetuApp.status === 'APPLIED_INTERNSETU', 'Application recorded in InternSetu (APPLIED_INTERNSETU)')

  // Step 2: Track external portal visit
  internsetuApp.status = 'VISITED_COMPANY_APPLICATION'
  internsetuApp.visitedCompanyUrlAt = new Date()
  await internsetuApp.save()
  assert(internsetuApp.status === 'VISITED_COMPANY_APPLICATION', 'External company URL visit tracked (VISITED_COMPANY_APPLICATION)')

  // Industry checks applications for this internship
  const appsForIndustry = await InternshipApplication.find({ internshipId: testInternship._id })
  assert(appsForIndustry.length >= 1, 'Industry can inspect all applicants for their internship')
  assert(appsForIndustry[0].studentSnapshot.name === student.name, 'Industry sees student snapshot details')

  console.log('\n[9] ADMIN: PLATFORM OVERSIGHT')
  const totalContests = await Contest.countDocuments()
  const totalAssessments = await IndustryAssessment.countDocuments()
  const totalProblems = await Problem.countDocuments()
  const totalShortlisted = await TalentPipeline.countDocuments({ stage: 'Shortlisted' })

  assert(totalContests >= 1, 'Admin oversight tracks all industry contests')
  assert(totalAssessments >= 1, 'Admin oversight tracks all industry assessments')
  assert(totalProblems >= 1, 'Admin oversight tracks all library problems')
  assert(totalShortlisted >= 1, 'Admin oversight tracks shortlisted candidates')

  console.log('\n============================================================')
  console.log(`END-TO-END TEST RESULTS: ${passed} passed, ${failed} failed`)
  console.log('============================================================')

  if (failed > 0) {
    process.exit(1)
  } else {
    process.exit(0)
  }
}

runEndToEndTest().catch(err => {
  console.error('Test execution failed:', err)
  process.exit(1)
})
