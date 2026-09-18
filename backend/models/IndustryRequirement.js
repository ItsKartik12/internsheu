import mongoose from 'mongoose'

const { Schema } = mongoose

const industryRequirementSchema = new Schema(
  {
    industryId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    role: {
      type: String,
      required: true,
      trim: true,
    },
    requiredSkills: [
      {
        type: String,
        trim: true,
      },
    ],
    preferredSkills: [
      {
        type: String,
        trim: true,
      },
    ],
    experience: {
      type: String,
      default: 'Fresher / Student',
    },
    education: {
      type: String,
      default: 'B.Tech / B.E. / BCA / MCA',
    },
    location: {
      type: String,
      default: 'Remote',
    },
    availability: {
      type: String,
      default: 'Immediate',
    },
    internshipDuration: {
      type: String,
      default: '3-6 Months',
    },
    minimumCgpa: {
      type: Number,
      default: 6.0,
    },
    graduationYear: {
      type: Number,
    },
    workMode: {
      type: String,
      enum: ['Remote', 'Hybrid', 'On-site', 'Any'],
      default: 'Remote',
    },
    scoringWeights: {
      assessmentWeight: { type: Number, default: 40 },
      dsaWeight: { type: Number, default: 40 },
      aiInterviewWeight: { type: Number, default: 20 },
      isConfigured: { type: Boolean, default: false },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
)

export default mongoose.model('IndustryRequirement', industryRequirementSchema, 'industryrequirements')
