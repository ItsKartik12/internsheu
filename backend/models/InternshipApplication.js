import mongoose from 'mongoose'

const { Schema } = mongoose

const internshipApplicationSchema = new Schema(
  {
    internshipId: {
      type: Schema.Types.ObjectId,
      ref: 'Internship',
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
    status: {
      type: String,
      enum: ['INTERESTED', 'APPLIED_INTERNSETU', 'VISITED_COMPANY_APPLICATION', 'COMPANY_APPLICATION_CONFIRMED'],
      default: 'APPLIED_INTERNSETU',
      index: true,
    },
    coverNote: {
      type: String,
      default: '',
      trim: true,
    },
    resumeUrl: {
      type: String,
      default: '',
      trim: true,
    },
    studentSnapshot: {
      name: String,
      email: String,
      phone: String,
      institute: String,
      branch: String,
      cgpa: Number,
      graduationYear: Number,
      skills: [String],
    },
    appliedAt: {
      type: Date,
      default: Date.now,
    },
    visitedCompanyUrlAt: {
      type: Date,
    },
  },
  { timestamps: true }
)

// Ensure one application record per student per internship
internshipApplicationSchema.index({ internshipId: 1, studentId: 1 }, { unique: true })

export default mongoose.model('InternshipApplication', internshipApplicationSchema, 'internshipapplications')
