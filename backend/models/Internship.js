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
    workMode: {
      type: String,
      enum: ['Remote', 'Hybrid', 'On-site'],
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
    eligibility: {
      type: String,
      trim: true,
      default: '',
    },
    responsibilities: {
      type: String,
      trim: true,
      default: '',
    },
    qualifications: {
      type: String,
      trim: true,
      default: '',
    },
    companyWebsite: {
      type: String,
      trim: true,
      default: '',
    },
    contactEmail: {
      type: String,
      trim: true,
      default: '',
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
    applicationUrl: {
      type: String,
      required: [true, 'Application URL is required'],
      trim: true,
      validate: {
        validator: function (v) {
          return /^https?:\/\/.+/i.test(v)
        },
        message: 'Please provide a valid application URL starting with http:// or https://',
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
)

// Indexes for performance optimization
internshipSchema.index({ skills: 1 })
internshipSchema.index({ isActive: 1, createdAt: -1 })

export default mongoose.model('Internship', internshipSchema, 'internships')
