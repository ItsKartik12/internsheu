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
    enrollmentNo: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    // Assigned once during onboarding and treated as immutable afterwards —
    // this is the attribute the matching logic keys off of. It is a single
    // scalar value (a student belongs to exactly one field), not an array.
    fieldMark: {
      type: String,
      required: true,
      enum: FIELD_MARKS,
      index: true, // supports the reverse lookup: "everyone in this field"
    },
    role: {
      type: String,
      enum: ['student', 'admin'],
      default: 'student',
    },
  },
  { timestamps: true }
)

export default mongoose.model('User', userSchema)
