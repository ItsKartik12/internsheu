import mongoose from 'mongoose'

const { Schema } = mongoose

const lessonSchema = new Schema({
  title: { type: String, required: true, trim: true },
  duration: { type: String, default: '15 mins' },
  contentUrl: { type: String, default: '' },
  description: { type: String, default: '' },
})

const courseSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    level: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced', 'All Levels'],
      default: 'Beginner',
    },
    educatorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    educatorName: {
      type: String,
      default: '',
    },
    thumbnail: {
      type: String,
      default: '',
    },
    duration: {
      type: String,
      default: '4 Weeks',
    },
    tags: [{ type: String, trim: true }],
    lessons: [lessonSchema],
    enrolledCount: {
      type: Number,
      default: 0,
    },
    rating: {
      type: Number,
      default: 4.8,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
)

export default mongoose.model('Course', courseSchema, 'courses')
