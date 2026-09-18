import mongoose from 'mongoose'

const { Schema } = mongoose

const industryQuestionSchema = new Schema(
  {
    question: {
      type: String,
      required: true,
      trim: true,
    },
    options: {
      type: [String],
      required: true,
      validate: [(val) => Array.isArray(val) && val.length >= 2, 'Must have at least 2 options'],
    },
    correctAnswer: {
      type: Number,
      required: true,
    },
    marks: {
      type: Number,
      default: 2,
    },
    negativeMarks: {
      type: Number,
      default: 0,
    },
    topic: {
      type: String,
      default: 'General',
      trim: true,
    },
    difficulty: {
      type: String,
      enum: ['Easy', 'Medium', 'Hard'],
      default: 'Medium',
    },
    explanation: {
      type: String,
      default: '',
    },
  },
  { _id: true }
)

const industryAssessmentSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    role: {
      type: String,
      default: 'Software Engineer',
      trim: true,
    },
    company: {
      type: String,
      required: true,
      trim: true,
    },
    industryId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    durationMinutes: {
      type: Number,
      required: true,
      default: 30,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
    },
    eligibility: {
      type: String,
      default: 'Open to all students',
      trim: true,
    },
    maxAttempts: {
      type: Number,
      default: 1,
    },
    passingScore: {
      type: Number,
      default: 60, // percentage
    },
    status: {
      type: String,
      enum: ['Draft', 'Published', 'Paused', 'Ended'],
      default: 'Draft',
      index: true,
    },
    questions: [industryQuestionSchema],
    attemptsCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
)

industryAssessmentSchema.index({ industryId: 1, createdAt: -1 })

export default mongoose.model('IndustryAssessment', industryAssessmentSchema, 'industryassessments')
