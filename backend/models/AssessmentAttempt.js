import mongoose from 'mongoose'

const { Schema } = mongoose

const answerSchema = new Schema({
  questionId: {
    type: Schema.Types.ObjectId,
    ref: 'AssessmentQuestion',
    required: true,
  },
  selectedAnswer: {
    type: Number,
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
})

const assessmentAttemptSchema = new Schema(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    topicId: {
      type: Schema.Types.ObjectId,
      ref: 'AssessmentTopic',
      required: true,
      index: true,
    },
    questionIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'AssessmentQuestion',
      },
    ],
    answers: [answerSchema],
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

export default mongoose.model('AssessmentAttempt', assessmentAttemptSchema, 'assessmentattempts')
