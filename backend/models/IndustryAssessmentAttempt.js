import mongoose from 'mongoose'

const { Schema } = mongoose

const industryAnswerSchema = new Schema(
  {
    questionId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    selectedAnswer: {
      type: Number, // index 0-3
      required: true,
    },
    isCorrect: {
      type: Boolean,
      required: true,
    },
    marksObtained: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
)

const industryAssessmentAttemptSchema = new Schema(
  {
    assessmentId: {
      type: Schema.Types.ObjectId,
      ref: 'IndustryAssessment',
      required: true,
      index: true,
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    industryId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    answers: [industryAnswerSchema],
    score: {
      type: Number,
      required: true,
      default: 0,
    },
    totalMarks: {
      type: Number,
      required: true,
      default: 0,
    },
    percentage: {
      type: Number,
      required: true,
      default: 0,
    },
    passed: {
      type: Boolean,
      default: false,
    },
    timeTakenSeconds: {
      type: Number,
      default: 0,
    },
    completedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
)

industryAssessmentAttemptSchema.index({ assessmentId: 1, studentId: 1 })
industryAssessmentAttemptSchema.index({ studentId: 1, createdAt: -1 })

export default mongoose.model(
  'IndustryAssessmentAttempt',
  industryAssessmentAttemptSchema,
  'industryassessmentattempts'
)
