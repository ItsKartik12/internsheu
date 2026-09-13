import dns from 'node:dns'
import mongoose from 'mongoose'

// Ensure Node resolves MongoDB Atlas SRV records reliably
try {
  dns.setServers(['8.8.8.8', '1.1.1.1'])
} catch {
  // fallback to system resolver
}

// Not called from server.js yet — the app currently runs entirely on the
// mock data in data/studentDashboard.js, and that keeps working with zero
// setup. Call connectDB() from server.js once MONGODB_URI is set and you're
// ready to switch routes over to the models in ../models.
export async function connectDB() {
  const uri = process.env.MONGODB_URI
  if (!uri) {
    throw new Error('MONGODB_URI is not set — add it to your .env file')
  }

  await mongoose.connect(uri)
  console.log('MongoDB connected')
}
