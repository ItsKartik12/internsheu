import mongoose from 'mongoose'

const { Schema } = mongoose

const jobLinkSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Job title is required'],
      trim: true,
    },
    company: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
    },
    industryId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    location: {
      type: String,
      trim: true,
      default: 'Remote',
    },
    workMode: {
      type: String,
      enum: ['Remote', 'Hybrid', 'On-site'],
      default: 'Remote',
    },
    jobType: {
      type: String,
      default: 'Full-time',
      trim: true,
    },
    skills: [{
      type: String,
      trim: true,
    }],
    description: {
      type: String,
      trim: true,
      default: '',
    },
    jobUrl: {
      type: String,
      required: [true, 'Job URL is required'],
      trim: true,
      validate: {
        validator: function (v) {
          return /^https?:\/\/.+/i.test(v)
        },
        message: 'Please provide a valid Job URL starting with http:// or https://',
      },
    },
    companyWebsite: {
      type: String,
      trim: true,
      default: '',
    },
    deadline: {
      type: Date,
    },
    candidatesRequired: {
      type: Number,
      default: 1,
      min: [1, 'Number of candidates required must be at least 1'],
    },
    monthlySalary: {
      type: Number,
      min: [0, 'Monthly salary cannot be negative'],
    },
    platformFeePercentage: {
      type: Number,
      default: 1,
    },
    platformFeeAmount: {
      type: Number,
      default: 0,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed'],
      default: 'pending',
      index: true,
    },
    paymentOrderId: {
      type: String,
      trim: true,
    },
    paymentTransactionId: {
      type: String,
      trim: true,
    },
    paymentVerifiedAt: {
      type: Date,
    },
    isTestPayment: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
)

// Indexes for skill searches and active listing
jobLinkSchema.index({ skills: 1 })
jobLinkSchema.index({ isActive: 1, createdAt: -1 })

export default mongoose.model('JobLink', jobLinkSchema, 'job_links')
