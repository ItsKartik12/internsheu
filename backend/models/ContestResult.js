import mongoose from 'mongoose'

const { Schema } = mongoose

const submissionEntrySchema = new Schema(
  {
    problemId: {
      type: Schema.Types.ObjectId,
      ref: 'Problem',
      required: true,
    },
    language: {
      type: String,
      required: true,
      default: 'C++',
    },
    code: {
      type: String,
      required: true,
    },
    verdict: {
      type: String,
      enum: [
        'Accepted',
        'Wrong Answer',
        'Time Limit Exceeded',
        'Memory Limit Exceeded',
        'Compilation Error',
        'Submitted',
        'Pending',
        'Recorded',
        'Verdict Sync Pending',
      ],
      default: 'Submitted',
    },
    score: {
      type: Number,
      default: 0,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    externalRunId: {
      type: String,
      default: null,
    },
  },
  { _id: true }
)

const contestResultSchema = new Schema(
  {
    contestId: {
      type: Schema.Types.ObjectId,
      ref: 'Contest',
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
      default: null,
    },
    externalProvider: {
      type: String,
      default: 'vjudge',
    },
    externalContestId: {
      type: String,
      default: '',
    },
    externalUserId: {
      type: String,
      default: '',
    },
    rank: {
      type: Number,
      default: 0,
    },
    score: {
      type: Number,
      default: 0,
    },
    problemsSolved: {
      type: Number,
      default: 0,
    },
    totalProblems: {
      type: Number,
      default: 0,
    },
    penaltyTime: {
      type: Number,
      default: 0,
    },
    submissionCount: {
      type: Number,
      default: 0,
    },
    contestStatus: {
      type: String,
      default: 'Completed',
    },
    syncStatus: {
      type: String,
      enum: ['Synced', 'Result Sync Pending', 'Sync Failed', 'Manual'],
      default: 'Result Sync Pending',
    },
    syncedAt: {
      type: Date,
    },
    submissions: [submissionEntrySchema],
  },
  { timestamps: true }
)

// Unique index to prevent duplicate result documents for a student in a contest
contestResultSchema.index({ contestId: 1, studentId: 1 }, { unique: true })

export default mongoose.model('ContestResult', contestResultSchema, 'contestresults')
