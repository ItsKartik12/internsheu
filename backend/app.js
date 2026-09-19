import 'dotenv/config'

import express from 'express'

import cors from 'cors'

import { connectDB } from './config/db.js'

import studentRoutes from './routes/student.js'

import authRoutes from './routes/auth.js'

import courseRoutes from './routes/courses.js'

import internshipRoutes from './routes/internships.js'

import jobRoutes from './routes/jobs.js'

import assessmentRoutes from './routes/assessment.js'

import profileRoutes from './routes/profile.js'

import jobLinkRoutes from './routes/jobLinks.js'

import videoRoutes from './routes/videos.js'

import adminRoutes from './routes/admin.js'

import problemRoutes from './routes/problems.js'

import industryContestRoutes from './routes/industryContests.js'

import industryAssessmentRoutes from './routes/industryAssessments.js'

import industryCandidateRoutes from './routes/industryCandidates.js'

import studentIndustryTestRoutes from './routes/studentIndustryTests.js'

import studentIndustryAssessmentRoutes from './routes/studentIndustryAssessments.js'

import studentIndustryMatrixRoutes from './routes/studentIndustryMatrix.js'

import sitemapRoutes from './routes/sitemap.js'

import seoCrawlerRoutes from './routes/seoCrawler.js'

import paymentRoutes from './routes/paymentRoutes.js'

import interviewRoutes from './routes/interview.js'

const app = express()

// Dynamic CORS to support localhost in dev and Vercel domains in production

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, serverless)
      if (!origin) return callback(null, true)
      return callback(null, true)
    },
    credentials: true,
  })
)

app.use(express.json())

// Ensure MongoDB is connected for every incoming request in serverless/Express

app.use(async (req, res, next) => {
  try {
    await connectDB()
  } catch (err) {
    console.warn('[db] Middleware connect error:', err.message)
  }
  next()
})

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'internsetu-api',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  })
})

// API Routes

app.use('/api/auth', authRoutes)

app.use('/api/student', studentRoutes)

app.use('/api/courses', courseRoutes)

app.use('/api/internships', internshipRoutes)

app.use('/api/jobs', jobRoutes)

app.use('/api/assessment', assessmentRoutes)

app.use('/api/profile', profileRoutes)

app.use('/api/job-links', jobLinkRoutes)

app.use('/api/videos', videoRoutes)

app.use('/api/admin', adminRoutes)

app.use('/api/payments', paymentRoutes)

// New Industry & Problem Library Routes

app.use('/api/problems', problemRoutes)

app.use('/api/industry/contests', industryContestRoutes)

app.use('/api/industry/assessments', industryAssessmentRoutes)

app.use('/api/industry/candidates', industryCandidateRoutes)

// Direct alias for /api/industry/pipeline
// e.g. POST /api/industry/pipeline/unlock-contact

app.use('/api/industry/pipeline', (req, res, next) => {
  req.url = '/pipeline' + req.url
  industryCandidateRoutes(req, res, next)
})

// New Student Industry Screening Routes

app.use('/api/student/industry-tests', studentIndustryTestRoutes)

app.use('/api/student/industry-assessments', studentIndustryAssessmentRoutes)

app.use('/api/student/industry-matrix', studentIndustryMatrixRoutes)

// AI Interviewer Routes

app.use('/api/interview', interviewRoutes)

// Public Dynamic Sitemap Route

app.use('/sitemap.xml', sitemapRoutes)

app.use('/api/sitemap.xml', sitemapRoutes)

// Public SEO Detail Pre-rendering for Crawlers & Social Bots

app.use(seoCrawlerRoutes)

// Fallback 404 for unmatched API routes

app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Not found', path: req.originalUrl })
})

// Global error handler

app.use((err, req, res, _next) => {
  console.error('Unhandled error:', err)
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
  })
})

export default app