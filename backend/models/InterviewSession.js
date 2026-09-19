import mongoose from 'mongoose'

const { Schema } = mongoose

// One turn of the conversation: either an interviewer question or a
// candidate answer. skillTag records which selected skill the question
// probed (used later to decide which skills were actually assessed).
const turnSchema = new Schema({
  speaker: {
    type: String,
    enum: ['interviewer', 'candidate'],
    required: true,
  },
  text: { type: String, default: '' },
  questionType: { type: String, default: '' },
  skillTag: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
}, { _id: false })

// A skill that the interview actually tested and Gemini scored.
const assessedSkillSchema = new Schema({
  skill: { type: String, required: true },
  score: { type: Number, min: 0, max: 100 },
  level: { type: String, default: '' },
  strengths: [{ type: String }],
  weaknesses: [{ type: String }],
  evidence: { type: String, default: '' },
}, { _id: false })

// A skill the candidate selected but the interview never actually tested.
// These must NEVER receive a score — they are recorded only so the result
// can honestly explain why they are missing.
const notAssessedSkillSchema = new Schema({
  skill: { type: String, required: true },
  reason: { type: String, default: 'Not tested during this interview' },
}, { _id: false })

const evaluationSchema = new Schema({
  overallScore: { type: Number, min: 0, max: 100, default: 0 },
  demonstratedLevel: { type: String, default: '' },
  assessedSkills: [assessedSkillSchema],
  notAssessedSkills: [notAssessedSkillSchema],
  communication: {
    score: { type: Number, min: 0, max: 100, default: 0 },
    assessment: { type: String, default: '' },
    evidence: { type: String, default: '' },
  },
  problemSolving: {
    score: { type: Number, min: 0, max: 100, default: 0 },
    assessment: { type: String, default: '' },
    evidence: { type: String, default: '' },
  },
  overallStrengths: [{ type: String }],
  overallWeaknesses: [{ type: String }],
  summary: { type: String, default: '' },
}, { _id: false })

const interviewSessionSchema = new Schema(
  {
    // Ownership — every query filters by this. Same pattern as
    // AssessmentAttempt.studentId.
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    // Step 1 configuration
    role: { type: String, trim: true },
    company: { type: String, trim: true },
    level: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced'],
      default: 'Intermediate',
    },

    // Step 2 configuration — the intended skill scope. Whether each of
    // these was actually tested is decided by the evaluation.
    selectedSkills: [{ type: String, trim: true }],

    status: {
      type: String,
      enum: ['Pre', 'InProgress', 'Done'],
      default: 'Pre',
      index: true,
    },

    // Short AI-generated title describing the actual conversation
    // (e.g. "Backend API debugging"). Only set at completion.
    title: { type: String, default: '' },

    // Full transcript: interviewer questions + candidate answers
    turns: [turnSchema],

    evaluation: evaluationSchema,

    // Snapshot of interview configuration (difficulty targets, profile
    // summary used for personalization, etc.) so results stay explainable.
    config: { type: Schema.Types.Mixed, default: {} },

    completedAt: { type: Date },
  },
  { timestamps: true }
)

// Fast listing for the Previous Interviews panel
interviewSessionSchema.index({ userId: 1, createdAt: -1 })

export default mongoose.model('InterviewSession', interviewSessionSchema, 'interviewsessions')
