import mongoose from 'mongoose'

const { Schema } = mongoose

const contestSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      trim: true,
      default: 'Software Engineer',
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
    description: {
      type: String,
      default: '',
    },
    problems: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Problem',
      },
    ],
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    durationMinutes: {
      type: Number,
      required: true,
      default: 60,
    },
    eligibility: {
      type: String,
      default: 'Open to all students',
      trim: true,
    },
    maxParticipants: {
      type: Number,
      default: 200,
    },
    allowedLanguages: {
      type: [String],
      default: ['C++', 'Java', 'Python', 'JavaScript'],
    },
    status: {
      type: String,
      enum: ['Draft', 'Scheduled', 'Live', 'Ended', 'Results Syncing', 'Results Available', 'Archived'],
      default: 'Draft',
      index: true,
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    externalProvider: {
      type: String,
      default: 'vjudge',
    },
    externalContestId: {
      type: String,
      default: '',
      trim: true,
    },
    externalContestUrl: {
      type: String,
      default: '',
      trim: true,
    },
    participantsCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
)

/**
 * Helper to compute live status based on server time
 */
contestSchema.methods.computeLiveStatus = function () {
  if (!this.isPublished || this.status === 'Draft' || this.status === 'Archived') {
    return this.status
  }
  const now = new Date()
  if (now < this.startDate) {
    return 'Scheduled'
  }
  if (now >= this.startDate && now <= this.endDate) {
    return 'Live'
  }
  if (now > this.endDate) {
    if (this.status === 'Results Available') return 'Results Available'
    return 'Ended'
  }
  return this.status
}

contestSchema.index({ industryId: 1, startDate: -1 })
contestSchema.index({ status: 1, startDate: 1 })

export default mongoose.model('Contest', contestSchema, 'contests')
