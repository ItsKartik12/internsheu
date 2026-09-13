import mongoose from 'mongoose'

const { Schema } = mongoose

const assessmentQuestionSchema = new Schema(
  {
    topicId: {
      type: Schema.Types.ObjectId,
      ref: 'AssessmentTopic',
      required: true,
      index: true,
    },
    question: {
      type: String,
      required: true,
      trim: true,
    },
    options: {
      type: [String],
      required: true,
      validate: [
        (val) => Array.isArray(val) && val.length >= 2,
        'Question must have at least 2 options',
      ],
    },
    correctAnswer: {
      type: Number, // 0-based index of options array
      required: true,
    },
    explanation: {
      type: String,
      default: '',
    },
    marks: {
      type: Number,
      default: 1,
    },
    difficulty: {
      type: String,
      enum: ['Easy', 'Medium', 'Hard'],
      default: 'Medium',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
)

export default mongoose.model('AssessmentQuestion', assessmentQuestionSchema, 'assessmentquestions')
