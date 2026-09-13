import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'

function signToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  })
}

/**
 * POST /api/auth/register
 */
export async function register(req, res, next) {
  try {
    const { name, email, password, role, enrollmentNo, fieldMark } = req.body

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'name, email, and password are required' })
    }

    const validRoles = ['student', 'educator', 'industry', 'admin']
    const userRole = validRoles.includes(role) ? role : 'student'

    // Students require enrollmentNo
    if (userRole === 'student' && !enrollmentNo) {
      return res.status(400).json({ error: 'enrollmentNo is required for students' })
    }

    // Check for duplicate email
    const existing = await User.findOne({ email: email.toLowerCase().trim() })
    if (existing) {
      return res.status(400).json({ error: 'Email already registered' })
    }

    // Check for duplicate enrollmentNo if provided
    if (enrollmentNo) {
      const existingEnroll = await User.findOne({ enrollmentNo: enrollmentNo.trim() })
      if (existingEnroll) {
        return res.status(400).json({ error: 'Enrollment number already registered' })
      }
    }

    const passwordHash = await bcrypt.hash(password, 12)

    const userData = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      role: userRole,
      isActive: true,
    }

    if (enrollmentNo) userData.enrollmentNo = enrollmentNo.trim()
    if (fieldMark) userData.fieldMark = fieldMark

    const user = await User.create(userData)

    const token = signToken(user._id)

    res.status(201).json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        enrollmentNo: user.enrollmentNo,
        isActive: user.isActive,
      },
    })
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Duplicate field value', details: err.keyValue })
    }
    next(err)
  }
}

/**
 * POST /api/auth/login
 */
export async function login(req, res, next) {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' })
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() })
    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    if (!user.isActive) {
      return res.status(401).json({ error: 'Account is deactivated' })
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash)
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    const token = signToken(user._id)

    res.json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        enrollmentNo: user.enrollmentNo,
        isActive: user.isActive,
      },
    })
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/auth/me
 */
export async function getMe(req, res) {
  res.json({ user: req.user })
}
