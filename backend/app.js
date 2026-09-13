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
    service: 'internsheu-api',
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

// Fallback 404 for unmatched API routes
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Not found', path: req.originalUrl })
})

// Global error handler
app.use((err, req, res, _next) => {
  console.error('Unhandled error:', err)
  res.status(500).json({ error: 'Internal server error', message: err.message })
})

export default app
