import mongoose from 'mongoose'

const { Schema } = mongoose

const talentPipelineSchema = new Schema(
  {
    industryId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    poolName: {
      type: String,
      default: 'General Pool',
      trim: true,
    },
    stage: {
      type: String,
      enum: ['Matched', 'Shortlisted', 'Contacted', 'Interviewed', 'Selected'],
      default: 'Shortlisted',
      index: true,
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },
    contactUnlocked: {
      type: Boolean,
      default: false,
      index: true,
    },
    unlockedAt: {
      type: Date,
    },
    opportunityId: {
      type: Schema.Types.ObjectId,
    },
  },
  { timestamps: true }
)

talentPipelineSchema.index({ industryId: 1, studentId: 1, poolName: 1 }, { unique: true })

export default mongoose.model('TalentPipeline', talentPipelineSchema, 'talentpipelines')
