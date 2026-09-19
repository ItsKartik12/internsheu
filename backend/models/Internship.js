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
    candidatesRequired: {
      type: Number,
      required: true,
      default: 1,
      min: [1, 'Number of candidates required must be at least 1'],
    },
    monthlyStipend: {
      type: Number,
      min: [0, 'Monthly stipend cannot be negative'],
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
