import 'dotenv/config'
import mongoose from 'mongoose'
import { connectDB } from '../config/db.js'
import StudentProfile from '../models/StudentProfile.js'
import User from '../models/User.js'

async function runTest() {
  console.log('Connecting to MongoDB Atlas...')
  await connectDB()
  console.log('Connected successfully!')

  // 1. Find or create a test student user
  let user = await User.findOne({ email: 'test.student@internsheu.edu' })
  if (!user) {
    user = await User.create({
      name: 'Rachit Student',
      email: 'test.student@internsheu.edu',
      password: 'hashedPassword123',
      role: 'student',
      enrollmentNo: 'ENROLL2024CS',
      fieldMark: 'Computer Science',
    })
    console.log('Created test student user:', user._id)
  } else {
    console.log('Found existing test student user:', user._id)
  }

  // 2. Upsert profile directly using model to simulate PUT /api/profile
  const profilePayload = {
    userId: user._id,
    basicInfo: {
      fullName: 'Rachit Arora',
      professionalEmail: 'rachit.arora@internsheu.edu',
      phone: '+91 9876543210',
      city: 'Delhi',
      linkedinUrl: 'https://linkedin.com/in/rachit-arora',
      githubUrl: 'https://github.com/rachitarora006-arch',
      portfolioUrl: 'https://rachitarora.dev',
    },
    careerTarget: {
      targetJobRole: 'Full Stack Developer',
      preferredIndustry: 'FinTech',
      preferredLocation: 'Bangalore',
      workPreference: 'Hybrid',
      internshipDuration: '6 Months',
      availability: 'Immediate',
    },
    education: [
      {
        degree: 'B.Tech',
        branch: 'Computer Science & Engineering',
        college: 'Delhi Technological University',
        startYear: '2021',
        graduationYear: '2025',
        cgpa: 8.9,
        relevantCoursework: ['Data Structures & Algorithms', 'DBMS', 'Operating Systems', 'Web Development'],
      },
    ],
    skills: {
      programmingLanguages: ['JavaScript', 'TypeScript', 'Python', 'C++'],
      frontend: ['React', 'Next.js', 'Tailwind CSS'],
      backend: ['Node.js', 'Express.js'],
      database: ['MongoDB', 'PostgreSQL', 'Redis'],
      tools: ['Git', 'GitHub', 'Docker', 'VS Code'],
      cloudDevOps: ['AWS', 'CI/CD'],
      aiMl: ['OpenAI API'],
    },
    projects: [
      {
        name: 'InternSetu Academia-Industry Portal',
        tagline: 'Bridging academia and industry through skill verification',
        description: 'Comprehensive portal enabling students to build verified portfolios and find internships.',
        techStack: ['React', 'Node.js', 'Express', 'MongoDB', 'Tailwind CSS'],
        liveUrl: 'https://internsetu.com',
        githubUrl: 'https://github.com/rachitarora006-arch/internsetu-main',
        featured: true,
      },
    ],
    internships: [
      {
        companyName: 'Tech Innovations Labs',
        role: 'Full Stack Developer Intern',
        location: 'Remote',
        startDate: '2024-01-01',
        endDate: '2024-06-30',
        currentlyWorking: false,
        keyContributions: ['Built REST APIs', 'Optimized database queries by 40%'],
      },
    ],
    achievements: [
      {
        title: 'First Place - National Hackathon 2024',
        organization: 'TechIndia',
        year: '2024',
      },
    ],
    certifications: [
      {
        name: 'AWS Certified Cloud Practitioner',
        issuer: 'Amazon Web Services',
        issueDate: '2024-03-01',
      },
    ],
    codingProfiles: [
      {
        platform: 'LeetCode',
        profileUrl: 'https://leetcode.com/u/rachit',
        rating: '1850',
      },
    ],
  }

  const savedProfile = await StudentProfile.findOneAndUpdate(
    { userId: user._id },
    { $set: profilePayload },
    { new: true, upsert: true, runValidators: true }
  ).lean()

  console.log('Saved profile to MongoDB successfully!')
  const completionPercentage = StudentProfile.computeCompletion(savedProfile)
  console.log('Computed completion percentage:', completionPercentage, '%')

  // 3. Verify fetch profile returns this real data
  const fetched = await StudentProfile.findOne({ userId: user._id }).lean()
  if (fetched && fetched.basicInfo.fullName === 'Rachit Arora' && fetched.projects.length === 1) {
    console.log('SUCCESS: Real student profile persisted and fetched from MongoDB!')
  } else {
    throw new Error('Profile verification failed!')
  }

  // 4. Clean up test record so we don't pollute database
  await StudentProfile.deleteOne({ userId: user._id })
  await User.deleteOne({ _id: user._id })
  console.log('Cleaned up test data.')

  await mongoose.disconnect()
  console.log('ALL TESTS PASSED SUCCESSFULLY!')
}

runTest().catch((err) => {
  console.error('Test error:', err)
  process.exit(1)
})
