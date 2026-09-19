import mongoose from 'mongoose'

const { Schema } = mongoose

const postingPaymentSchema = new Schema(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    companyName: {
      type: String,
      required: true,
      trim: true,
    },
    postingType: {
      type: String,
      enum: ['internship', 'job'],
      required: true,
      default: 'internship',
    },
    postingId: {
      type: Schema.Types.ObjectId,
      refPath: 'postingModel',
    },
    postingModel: {
      type: String,
      enum: ['Internship', 'JobLink', 'Job'],
      default: 'Internship',
    },
    postingTitle: {
      type: String,
      required: true,
      trim: true,
    },
    monthlyStipend: {
      type: Number,
      required: true,
      min: [1, 'Monthly stipend must be greater than 0'],
    },
    candidatesRequired: {
      type: Number,
      required: true,
      min: [1, 'Number of candidates required must be at least 1'],
      validate: {
        validator: Number.isInteger,
        message: 'Candidates required must be an integer',
      },
    },
    platformFeePercentage: {
      type: Number,
      default: 1,
    },
    platformFeeAmount: {
      type: Number,
      required: true,
      min: [1, 'Platform fee must be at least ₹1'],
    },
    currency: {
      type: String,
      default: 'INR',
    },
    paymentOrderId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    paymentTransactionId: {
      type: String,
      trim: true,
    },
    paymentSignature: {
      type: String,
      trim: true,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed'],
      default: 'pending',
      index: true,
    },
    paymentVerifiedAt: {
      type: Date,
    },
    postingPublished: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
)

postingPaymentSchema.index({ companyId: 1, createdAt: -1 })
postingPaymentSchema.index({ paymentOrderId: 1, paymentStatus: 1 })

export default mongoose.model('PostingPayment', postingPaymentSchema, 'posting_payments')
