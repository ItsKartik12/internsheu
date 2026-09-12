import mongoose from 'mongoose'
import { FIELD_MARKS } from './User.js'

const { Schema } = mongoose

const curatedContentSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    publisher: {
      type: String,
      required: true,
      trim: true,
    },
    youtubeId: {
      type: String,
      required: true,
      trim: true,
    },
    duration: {
      type: String, // display string, e.g. "18 min" — kept simple for admin entry
      required: true,
    },
    // Free-form labels for fine-grained topics ("Cloud", "DSA", "Interview Prep").
    // Used for search/filtering within the Learning Center — NOT what the
    // field-mark matching query below runs against.
    tags: {
      type: [String],
      default: [],
      index: true,
    },
    // The field(s) this content is relevant to. This is an ARRAY, not a
    // scalar — one video can serve multiple branches (e.g. "Database
    // Modeling" is relevant to both Computer Science and Information
    // Technology). This is the field the matching query filters on.
    fieldMarks: {
      type: [String],
      required: true,
      enum: FIELD_MARKS,
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length > 0,
        message: 'A video must be tagged with at least one fieldMark.',
      },
    },
    status: {
      type: String,
      enum: ['Published', 'Draft'],
      default: 'Published',
      index: true,
    },
  },
  { timestamps: true }
)

// Compound index: every matching query filters by fieldMarks + status
// together (see services/contentMatching.js), so a compound index serves
// that exact access pattern instead of two separate single-field indexes.
// Mongo can use this for both the equality match on `status` and the
// multikey match on `fieldMarks` in one index scan.
curatedContentSchema.index({ fieldMarks: 1, status: 1, createdAt: -1 })

export default mongoose.model('CuratedContent', curatedContentSchema)
