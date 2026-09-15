import 'dotenv/config'
import app from './app.js'
import { connectDB } from './config/db.js'

const PORT = process.env.PORT || 5000

async function start() {
  try {
    await connectDB()
    console.log('MongoDB connected successfully.')
  } catch (err) {
    console.warn(`[db] MongoDB note: ${err.message}. To connect to Cluster0/internsetu, configure MONGODB_URI in backend/.env`)
  }
  const server = app.listen(PORT, () => {
    console.log(`internsheu API listening on http://localhost:${PORT}`)
  })

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`[server] Port ${PORT} is already in use. Please stop the existing process or set a different PORT in .env`)
    } else {
      console.error('[server] Error starting server:', err)
    }
    process.exit(1)
  })
}

start()
