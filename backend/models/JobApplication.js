import mongoose from 'mongoose'

const { Schema } = mongoose

const jobApplicationSchema = new Schema(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    jobId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    companyName: {
      type: String,
      required: true,
      trim: true,
    },
    jobTitle: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: String,
      default: 'Remote',
      trim: true,
    },
    workMode: {
      type: String,
      default: 'Remote',
      trim: true,
    },
    jobType: {
      type: String,
      default: 'Full-time',
      trim: true,
    },
    applicationUrl: {
      type: String,
      default: '',
      trim: true,
    },
    appliedAt: {
      type: Date,
      default: Date.now,
    },
    visitedAt: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['APPLIED_INTERNSETU', 'VISITED_COMPANY_APPLICATION'],
      default: 'APPLIED_INTERNSETU',
      index: true,
    },
    externalPortalVisited: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
)

// Ensure one record per student per job
jobApplicationSchema.index({ jobId: 1, studentId: 1 }, { unique: true })

export default mongoose.model('JobApplication', jobApplicationSchema, 'jobapplications')
