import mongoose from 'mongoose'

const { Schema } = mongoose

const sampleCaseSchema = new Schema(
  {
    input: { type: String, default: '' },
    output: { type: String, default: '' },
    explanation: { type: String, default: '' },
  },
  { _id: false }
)

const problemSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    topic: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    difficulty: {
      type: String,
      enum: ['Easy', 'Medium', 'Hard'],
      default: 'Medium',
      index: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    externalProvider: {
      type: String,
      default: 'vjudge',
      trim: true,
    },
    externalProblemId: {
      type: String,
      required: true,
      trim: true,
    },
    externalUrl: {
      type: String,
      trim: true,
      default: '',
    },
    supportedLanguages: {
      type: [String],
      default: ['C++', 'Java', 'Python', 'JavaScript'],
    },
    sampleCases: [sampleCaseSchema],
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
)

problemSchema.index({ topic: 1, difficulty: 1, status: 1 })

export default mongoose.model('Problem', problemSchema, 'problems')
