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
const PORT = process.env.PORT || 5000
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173'

app.use(cors({ origin: CORS_ORIGIN }))
app.use(express.json())

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'internsheu-api', timestamp: new Date().toISOString() })
})

// Routes
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
  res.status(500).json({ error: 'Internal server error' })
})

async function start() {
  try {
    await connectDB()
  } catch (err) {
    console.warn(`[db] MongoDB note: ${err.message}. To connect to Cluster0/internsetu, configure MONGODB_URI in backend/.env`)
  }
  app.listen(PORT, () => {
    console.log(`internsheu API listening on http://localhost:${PORT}`)
  })
}

start()
