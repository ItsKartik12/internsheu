import mongoose from 'mongoose'

const { Schema } = mongoose

const contactUnlockSchema = new Schema(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    candidateId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    candidateEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    unlockedAt: {
      type: Date,
      default: Date.now,
    },
    amount: {
      type: Number,
      default: 50,
    },
    paymentStatus: {
      type: String,
      enum: ['PAID', 'PENDING'],
      default: 'PAID',
    },
    opportunityTitle: {
      type: String,
      default: 'General Pool',
    },
  },
  { timestamps: true }
)

// Unique constraint to prevent duplicate unlock records per company + candidate
contactUnlockSchema.index({ companyId: 1, candidateId: 1 }, { unique: true })

export default mongoose.model('ContactUnlock', contactUnlockSchema, 'contactunlocks')
