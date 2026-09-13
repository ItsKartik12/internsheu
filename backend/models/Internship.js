import mongoose from 'mongoose'

const { Schema } = mongoose

const internshipSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
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
    description: {
      type: String,
      required: true,
    },
    skills: [{
      type: String,
      trim: true,
    }],
    location: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['Full-time', 'Part-time', 'Remote', 'Hybrid', 'On-site'],
      default: 'Remote',
    },
    stipend: {
      type: String,
      default: 'Competitive Stipend',
    },
    duration: {
      type: String,
      default: '3 Months',
    },
    deadline: {
      type: Date,
    },
    openings: {
      type: Number,
      default: 1,
    },
    applicantsCount: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
)

// Index for skill searches
internshipSchema.index({ skills: 1 })

export default mongoose.model('Internship', internshipSchema)
