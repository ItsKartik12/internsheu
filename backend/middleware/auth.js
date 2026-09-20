import mongoose from 'mongoose'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'

/**
 * requireRealDbAndUser — guards routes requiring MongoDB persistence.
 * Rejects demo identities and offline DB states BEFORE any Mongoose query can run.
 */
export function requireRealDbAndUser(req, res, next) {
  if (
    mongoose.connection.readyState !== 1 ||
    req.user?.isDemoIdentity ||
    !mongoose.Types.ObjectId.isValid(req.user?._id)
  ) {
    return res.status(503).json({
      error: 'Database unavailable. Please try again later.',
      dbUnavailable: true,
    })
  }
  next()
}

/**
 * authenticate — verifies the JWT from the Authorization header and attaches
 * the full user document (minus passwordHash) to `req.user`.
 */
export async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const token = header.split(' ')[1]

    // Support offline/demo token session bridging to MongoDB
    if (token && token.startsWith('mock-token-')) {
      const role = token.split('-')[2] || 'student'
      const demoEmail = `${role}@internsheu.edu`
      let user = null
      if (mongoose.connection.readyState === 1) {
        try {
          user = await User.findOne({ email: demoEmail }).select('-passwordHash').lean()
        } catch {
          user = null
        }
      }
      if (!user) {
        user = {
          _id: `demo-${role}-1`,
          name: role === 'student' ? 'Aarav Sharma' : 'Demo User',
          email: demoEmail,
          role,
          isActive: true,
          // Explicit demo flag — downstream guards use this to keep demo
          // identities OUT of MongoDB ObjectId queries instead of crashing with a CastError.
          isDemoIdentity: true,
        }
      }
      req.user = user
      return next()
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        error: 'Database is unavailable. Please try again shortly.',
        dbUnavailable: true,
      })
    }

    let user
    try {
      user = await User.findById(decoded.id).select('-passwordHash').lean()
    } catch (dbErr) {
      console.warn('[auth] DB lookup failed for real-token auth:', dbErr.message)
      return res.status(503).json({
        error: 'Database is unavailable. Please try again shortly.',
        dbUnavailable: true,
      })
    }
    if (!user) {
      return res.status(401).json({ error: 'User no longer exists' })
    }
    if (!user.isActive) {
      return res.status(401).json({ error: 'Account is deactivated' })
    }

    req.user = user
    next()
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Invalid or expired token' })
    }
    next(err)
  }
}

/**
 * authorize — factory that returns middleware restricting access to users
 * whose role is in the provided list.
 *
 * Usage:
 *   router.post('/courses', authenticate, authorize('educator', 'admin'), createCourse)
 */
export function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' })
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        requiredRoles: allowedRoles,
        yourRole: req.user.role,
      })
    }
    next()
  }
}
