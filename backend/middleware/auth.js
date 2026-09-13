import jwt from 'jsonwebtoken'
import User from '../models/User.js'

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
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    const user = await User.findById(decoded.id).select('-passwordHash').lean()
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
