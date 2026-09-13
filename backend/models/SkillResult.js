import mongoose from 'mongoose'

const { Schema } = mongoose

const topicSkillSchema = new Schema({
  topicId: {
    type: Schema.Types.ObjectId,
    ref: 'AssessmentTopic',
    required: true,
  },
  topicName: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    default: 'General',
  },
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
  level: {
    type: String,
    enum: ['Needs Improvement', 'Beginner', 'Proficient', 'Advanced', 'Expert'],
    default: 'Beginner',
  },
  attemptsCount: {
    type: Number,
    default: 1,
  },
  lastAttemptAt: {
    type: Date,
    default: Date.now,
  },
})

const skillResultSchema = new Schema(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    skills: [topicSkillSchema],
    overallScore: {
      type: Number,
      default: 0,
    },
    overallLevel: {
      type: String,
      enum: ['Needs Improvement', 'Beginner', 'Proficient', 'Advanced', 'Expert'],
      default: 'Beginner',
    },
  },
  { timestamps: true }
)

export default mongoose.model('SkillResult', skillResultSchema)
