import mongoose from 'mongoose'

const { Schema } = mongoose

const assessmentTopicSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    category: {
      type: String,
      default: 'General',
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    icon: {
      type: String,
      default: 'Code',
    },
    questionCount: {
      type: Number,
      default: 0,
    },
    timeLimitMinutes: {
      type: Number,
      default: 15,
    },
    passPercentage: {
      type: Number,
      default: 60,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
)

export default mongoose.model('AssessmentTopic', assessmentTopicSchema)
