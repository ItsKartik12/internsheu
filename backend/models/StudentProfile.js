import mongoose from 'mongoose'

const { Schema } = mongoose

// ── Sub-schemas for dynamic array sections ──

const educationSchema = new Schema({
  degree: { type: String, trim: true },
  branch: { type: String, trim: true },
  college: { type: String, trim: true },
  cgpa: { type: Number, min: 0, max: 10 },
  graduationYear: { type: Number },
  class12Percentage: { type: Number, min: 0, max: 100 },
  class10Percentage: { type: Number, min: 0, max: 100 },
  relevantCoursework: [{ type: String, trim: true }],
}, { _id: true })

const projectSchema = new Schema({
  name: { type: String, trim: true },
  description: { type: String, trim: true },
  problemSolved: { type: String, trim: true },
  role: { type: String, trim: true },
  technologiesUsed: [{ type: String, trim: true }],
  githubUrl: { type: String, trim: true },
  liveDemoUrl: { type: String, trim: true },
  startDate: { type: String, trim: true },
  endDate: { type: String, trim: true },
  teamSize: { type: Number },
  contribution: { type: String, trim: true },
  numberOfUsers: { type: String, trim: true },
  numberOfRecords: { type: String, trim: true },
  accuracy: { type: String, trim: true },
  performanceImprovement: { type: String, trim: true },
  responseTime: { type: String, trim: true },
  numberOfFeatures: { type: String, trim: true },
  numberOfApis: { type: String, trim: true },
  deploymentDetails: { type: String, trim: true },
}, { _id: true })

const internshipSchema = new Schema({
  companyName: { type: String, trim: true },
  role: { type: String, trim: true },
  startDate: { type: String, trim: true },
  endDate: { type: String, trim: true },
  employmentType: { type: String, trim: true },
  location: { type: String, trim: true },
  technologiesUsed: [{ type: String, trim: true }],
  responsibilities: { type: String, trim: true },
  projectsWorkedOn: { type: String, trim: true },
  achievements: { type: String, trim: true },
  contribution: { type: String, trim: true },
}, { _id: true })

const hackathonSchema = new Schema({
  name: { type: String, trim: true },
  position: { type: String, trim: true },
  year: { type: Number },
  teamSize: { type: Number },
  problemStatement: { type: String, trim: true },
  solution: { type: String, trim: true },
  technologiesUsed: [{ type: String, trim: true }],
  contribution: { type: String, trim: true },
  githubUrl: { type: String, trim: true },
  demoUrl: { type: String, trim: true },
}, { _id: true })

const achievementSchema = new Schema({
  title: { type: String, trim: true },
  description: { type: String, trim: true },
  organization: { type: String, trim: true },
  dateOrYear: { type: String, trim: true },
  credentialUrl: { type: String, trim: true },
}, { _id: true })

const certificationSchema = new Schema({
  name: { type: String, trim: true },
  issuingOrganization: { type: String, trim: true },
  date: { type: String, trim: true },
  credentialId: { type: String, trim: true },
  credentialUrl: { type: String, trim: true },
  skillsCovered: [{ type: String, trim: true }],
}, { _id: true })

const codingProfileSchema = new Schema({
  platform: { type: String, trim: true },
  username: { type: String, trim: true },
  profileUrl: { type: String, trim: true },
  problemsSolved: { type: String, trim: true },
  rating: { type: String, trim: true },
  contestRating: { type: String, trim: true },
}, { _id: true })

const openSourceSchema = new Schema({
  projectName: { type: String, trim: true },
  repositoryUrl: { type: String, trim: true },
  contributionDescription: { type: String, trim: true },
  pullRequests: { type: String, trim: true },
  issuesSolved: { type: String, trim: true },
  majorContributions: { type: String, trim: true },
}, { _id: true })

const leadershipSchema = new Schema({
  position: { type: String, trim: true },
  organization: { type: String, trim: true },
  duration: { type: String, trim: true },
  responsibilities: { type: String, trim: true },
  achievements: { type: String, trim: true },
}, { _id: true })

// ── Main Student Profile Schema ──

const studentProfileSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },

    // A. Basic Information
    basicInfo: {
      fullName: { type: String, trim: true },
      professionalEmail: { type: String, trim: true, lowercase: true },
      phone: { type: String, trim: true },
      city: { type: String, trim: true },
      linkedinUrl: { type: String, trim: true },
      githubUrl: { type: String, trim: true },
      portfolioUrl: { type: String, trim: true },
    },

    // B. Career Target
    careerTarget: {
      targetJobRole: { type: String, trim: true },
      preferredIndustry: { type: String, trim: true },
      preferredLocation: { type: String, trim: true },
      workPreference: {
        type: String,
        enum: ['Remote', 'Hybrid', 'On-site', ''],
        default: '',
      },
      internshipDuration: { type: String, trim: true },
      availability: { type: String, trim: true },
    },

    // C. Education (array)
    education: [educationSchema],

    // D. Technical Skills (categorized)
    skills: {
      programmingLanguages: [{ type: String, trim: true }],
      frontend: [{ type: String, trim: true }],
      backend: [{ type: String, trim: true }],
      database: [{ type: String, trim: true }],
      tools: [{ type: String, trim: true }],
      cloudDevOps: [{ type: String, trim: true }],
      aiMl: [{ type: String, trim: true }],
    },

    // E. Projects (array)
    projects: [projectSchema],

    // F. Internships / Experience (array)
    internships: [internshipSchema],

    // G. Hackathons (array)
    hackathons: [hackathonSchema],

    // H. Achievements (array)
    achievements: [achievementSchema],

    // I. Certifications (array)
    certifications: [certificationSchema],

    // J. Coding Profiles (array)
    codingProfiles: [codingProfileSchema],

    // K. Open Source (array)
    openSource: [openSourceSchema],

    // L. Leadership / Positions (array)
    leadership: [leadershipSchema],
  },
  { timestamps: true }
)

/**
 * Compute profile completion percentage based on meaningful filled sections.
 * Each section has equal weight (~8.3% each for 12 sections).
 */
studentProfileSchema.statics.computeCompletion = function (profile) {
  if (!profile) return 0

  const checks = [
    // Basic Info: at least name and email
    Boolean(profile.basicInfo?.fullName && profile.basicInfo?.professionalEmail),
    // Career Target: at least target role
    Boolean(profile.careerTarget?.targetJobRole),
    // Education: at least one entry with degree
    Boolean(profile.education?.length > 0 && profile.education[0]?.degree),
    // Skills: at least one category has items
    Boolean(
      profile.skills &&
        Object.values(profile.skills).some(
          (arr) => Array.isArray(arr) && arr.length > 0
        )
    ),
    // Projects: at least one
    Boolean(profile.projects?.length > 0 && profile.projects[0]?.name),
    // Internships: at least one
    Boolean(profile.internships?.length > 0 && profile.internships[0]?.companyName),
    // Hackathons: at least one
    Boolean(profile.hackathons?.length > 0 && profile.hackathons[0]?.name),
    // Achievements: at least one
    Boolean(profile.achievements?.length > 0 && profile.achievements[0]?.title),
    // Certifications: at least one
    Boolean(profile.certifications?.length > 0 && profile.certifications[0]?.name),
    // Coding Profiles: at least one
    Boolean(profile.codingProfiles?.length > 0 && profile.codingProfiles[0]?.platform),
    // Open Source: at least one
    Boolean(profile.openSource?.length > 0 && profile.openSource[0]?.projectName),
    // Leadership: at least one
    Boolean(profile.leadership?.length > 0 && profile.leadership[0]?.position),
  ]

  const filled = checks.filter(Boolean).length
  return Math.round((filled / checks.length) * 100)
}

export default mongoose.model('StudentProfile', studentProfileSchema)
