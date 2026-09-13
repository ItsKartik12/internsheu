import mongoose from 'mongoose'

const { Schema } = mongoose

// The controlled vocabulary for `fieldMark`. Keeping this as an enum (rather
// than a free-text string) is what makes the matching query in
// services/contentMatching.js reliable — a video tagged "Computer Science"
// will only ever match users whose fieldMark is exactly that string, with
// no risk of "CS" vs "Computer Science" vs "computer science" drift.
export const FIELD_MARKS = [
  'Computer Science',
  'Information Technology',
  'Electrical Engineering',
  'Electronics & Communication',
  'Mechanical Engineering',
  'Civil Engineering',
]

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    passwordHash: {
      type: String,
      // Not required so legacy mock records without passwords still load.
      // Real registrations always set this via the auth controller.
    },
    enrollmentNo: {
      type: String,
      // Optional — only students have enrollment numbers.
      // Sparse index ensures uniqueness only among documents that have it.
      unique: true,
      sparse: true,
      trim: true,
      index: true,
    },
    // Assigned once during onboarding and treated as immutable afterwards —
    // this is the attribute the matching logic keys off of. It is a single
    // scalar value (a student belongs to exactly one field), not an array.
    // Optional — only relevant for students.
    fieldMark: {
      type: String,
      enum: FIELD_MARKS,
      index: true, // supports the reverse lookup: "everyone in this field"
    },
    role: {
      type: String,
      enum: ['student', 'educator', 'industry', 'admin'],
      default: 'student',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
)

export default mongoose.model('User', userSchema)
