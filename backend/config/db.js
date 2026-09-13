import dns from 'node:dns'
import mongoose from 'mongoose'

// Ensure Node resolves MongoDB Atlas SRV records reliably
try {
  dns.setServers(['8.8.8.8', '1.1.1.1'])
} catch {
  // fallback to system resolver
}

let cachedConnection = null

export async function connectDB() {
  if (mongoose.connection.readyState >= 1) {
    return mongoose.connection
  }

  const uri = process.env.MONGODB_URI
  if (!uri) {
    console.warn('[db] MONGODB_URI is not set.')
    return null
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
