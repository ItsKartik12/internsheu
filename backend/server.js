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
  app.listen(PORT, () => {
    console.log(`internsheu API listening on http://localhost:${PORT}`)
  })
}

start()
