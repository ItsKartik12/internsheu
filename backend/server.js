import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import studentRoutes from './routes/student.js'

const app = express()
const PORT = process.env.PORT || 5000
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173'

app.use(cors({ origin: CORS_ORIGIN }))
app.use(express.json())

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'internsheu-api', timestamp: new Date().toISOString() })
})

app.use('/api/student', studentRoutes)

// Fallback 404 for unmatched API routes
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Not found', path: req.originalUrl })
})

app.listen(PORT, () => {
  console.log(`internsheu API listening on http://localhost:${PORT}`)
})
