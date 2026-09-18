import dns from 'node:dns'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import mongoose from 'mongoose'
import dotenv from 'dotenv'

// Ensure environment variables from backend/.env are loaded if not already present
if (!process.env.MONGODB_URI) {
  dotenv.config()
  if (!process.env.MONGODB_URI) {
    try {
      const __dirname = path.dirname(fileURLToPath(import.meta.url))
      dotenv.config({ path: path.resolve(__dirname, '../.env') })
    } catch {}
  }
}

// Ensure Node resolves MongoDB Atlas SRV records reliably in local development
if (!process.env.VERCEL) {
  try {
    dns.setServers(['8.8.8.8', '1.1.1.1'])
  } catch {
    // fallback to system resolver
  }
}

let cachedConnection = null

export async function connectDB() {
  if (mongoose.connection.readyState >= 1) {
    return mongoose.connection
  }

  const uri = process.env.MONGODB_URI
  if (!uri) {
    console.warn('[db] MONGODB_URI is not set in environment variables.')
    throw new Error('MONGODB_URI environment variable is missing')
  }

  if (!cachedConnection) {
    cachedConnection = mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    }).catch((err) => {
      cachedConnection = null
      console.warn('[db] MongoDB connection error:', err.message)
      throw err
    })
  }

  await cachedConnection
  return mongoose.connection
}
