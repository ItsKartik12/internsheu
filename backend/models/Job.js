import mongoose from 'mongoose'

const { Schema } = mongoose

const jobSchema = new Schema(
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
      enum: ['Full-time', 'Part-time', 'Contract', 'Remote', 'Hybrid'],
      default: 'Full-time',
    },
    experienceLevel: {
      type: String,
      enum: ['Entry Level', 'Mid Level', 'Senior Level', 'Lead'],
      default: 'Entry Level',
    },
    salary: {
      type: String,
      default: 'Best in Industry',
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
    jobUrl: {
      type: String,
      trim: true,
    },
    companyWebsite: {
      type: String,
      trim: true,
    },
    workMode: {
      type: String,
      enum: ['Remote', 'Hybrid', 'On-site'],
      default: 'Remote',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
)

// Indexes for search and listing performance
jobSchema.index({ skills: 1 })
jobSchema.index({ isActive: 1, createdAt: -1 })

export default mongoose.model('Job', jobSchema, 'jobs')
