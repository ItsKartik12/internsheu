import 'dotenv/config'
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import User from '../models/User.js'
import Course from '../models/Course.js'
import Internship from '../models/Internship.js'
import Job from '../models/Job.js'
import AssessmentTopic from '../models/AssessmentTopic.js'
import AssessmentQuestion from '../models/AssessmentQuestion.js'
import { ASSESSMENT_TOPICS_SEED } from '../data/assessmentSeedData.js'

const DEMO_PASSWORD = 'password123'

async function seed() {
  const uri = process.env.MONGODB_URI
  if (!uri) {
    console.error('MONGODB_URI environment variable is required to run seed script.')
    console.error('Please configure MONGODB_URI in backend/.env pointing to Cluster0 -> internsetu.')
    process.exit(1)
  }

  console.log('Connecting to MongoDB database: internsetu...')
  await mongoose.connect(uri)
  console.log('Connected successfully.')

  // 1. Seed or Update Demo Users (Preserving existing collections)
  console.log('\n--- 1. Seeding Users (Preserving existing users) ---')
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12)

  const usersData = [
    {
      name: 'Aarav Sharma',
      email: 'student@internsheu.edu',
      passwordHash,
      role: 'student',
      enrollmentNo: '2024CS001',
      fieldMark: 'Computer Science',
      isActive: true,
    },
    {
      name: 'Prof. Sarah Jenkins',
      email: 'educator@internsheu.edu',
      passwordHash,
      role: 'educator',
      isActive: true,
    },
    {
      name: 'Nexus Tech Talent Team',
      email: 'industry@internsheu.edu',
      passwordHash,
      role: 'industry',
      isActive: true,
    },
    {
      name: 'Portal Administrator',
      email: 'admin@internsheu.edu',
      passwordHash,
      role: 'admin',
      isActive: true,
    },
  ]

  const createdUsers = {}
  for (const u of usersData) {
    let user = await User.findOne({ email: u.email })
    if (user) {
      user.name = u.name
      user.passwordHash = u.passwordHash
      user.role = u.role
      if (u.enrollmentNo) user.enrollmentNo = u.enrollmentNo
      if (u.fieldMark) user.fieldMark = u.fieldMark
      user.isActive = true
      await user.save()
      console.log(`Updated user: ${u.email} (${u.role})`)
    } else {
      user = await User.create(u)
      console.log(`Created user: ${u.email} (${u.role})`)
    }
    createdUsers[u.role] = user
  }

  // 2. Seed Courses (collection: courses)
  console.log('\n--- 2. Seeding Courses (educatorId linked to user) ---')
  const educator = createdUsers.educator
  const coursesData = [
    {
      title: 'Full Stack MERN Architecture',
      description: 'Master production-grade React, Node.js, Express, and MongoDB with modern authentication and clean architecture.',
      category: 'Web Development',
      level: 'Intermediate',
      duration: '8 Weeks',
      educatorId: educator._id,
      educatorName: educator.name,
      tags: ['React', 'Node.js', 'MongoDB', 'Express', 'JWT'],
      lessons: [
        { title: 'Modern React Component Patterns', duration: '45 mins' },
        { title: 'RESTful API Design & Express Middlewares', duration: '60 mins' },
        { title: 'MongoDB Schema Optimization & Indexing', duration: '50 mins' },
        { title: 'JWT Authentication & Role-Based Access Control', duration: '55 mins' },
      ],
      enrolledCount: 142,
      rating: 4.9,
    },
    {
      title: 'Applied Machine Learning with Python',
      description: 'Hands-on practical machine learning covering regression, classification, clustering, and neural network foundations.',
      category: 'AI & Data Science',
      level: 'Beginner',
      duration: '6 Weeks',
      educatorId: educator._id,
      educatorName: educator.name,
      tags: ['Python', 'Scikit-Learn', 'Pandas', 'NumPy', 'Data Science'],
      lessons: [
        { title: 'Data Cleaning & Exploratory Analysis', duration: '40 mins' },
        { title: 'Supervised Learning: Regressors & Classifiers', duration: '65 mins' },
        { title: 'Unsupervised Learning & Dimensionality Reduction', duration: '45 mins' },
        { title: 'Model Evaluation Metrics & Cross Validation', duration: '50 mins' },
      ],
      enrolledCount: 95,
      rating: 4.8,
    },
    {
      title: 'Cloud Native & DevOps Fundamentals',
      description: 'Learn Docker containerization, CI/CD pipelines, and cloud deployment principles for modern applications.',
      category: 'Cloud & DevOps',
      level: 'Intermediate',
      duration: '5 Weeks',
      educatorId: educator._id,
      educatorName: educator.name,
      tags: ['Docker', 'CI/CD', 'AWS', 'DevOps', 'Kubernetes'],
      lessons: [
        { title: 'Docker Containers & Multi-stage Builds', duration: '50 mins' },
        { title: 'Continuous Integration with GitHub Actions', duration: '45 mins' },
        { title: 'Cloud Infrastructure & Deployments', duration: '60 mins' },
      ],
      enrolledCount: 78,
      rating: 4.7,
    },
    {
      title: 'Advanced Data Structures & Competitive Coding',
      description: 'Master binary trees, dynamic programming, graph theory, and interview patterns.',
      category: 'Core CS',
      level: 'Advanced',
      duration: '10 Weeks',
      educatorId: educator._id,
      educatorName: educator.name,
      tags: ['DSA', 'Algorithms', 'Trees', 'Dynamic Programming', 'C++'],
      lessons: [
        { title: 'Trees, Heaps & Tries in Depth', duration: '60 mins' },
        { title: 'Graph Algorithms: BFS, DFS & Shortest Path', duration: '75 mins' },
        { title: 'Dynamic Programming Patterns', duration: '90 mins' },
      ],
      enrolledCount: 110,
      rating: 4.9,
    },
  ]

  for (const c of coursesData) {
    await Course.findOneAndUpdate(
      { title: c.title, educatorId: c.educatorId },
      c,
      { upsert: true, new: true }
    )
    console.log(`Seeded course: ${c.title}`)
  }

  // 3. Seed Internships (collection: internships)
  console.log('\n--- 3. Seeding Internships (industryId linked to user) ---')
  const industry = createdUsers.industry
  const internshipsData = [
    {
      title: 'Frontend Developer Intern (React/TypeScript)',
      company: 'Nexus Innovations',
      industryId: industry._id,
      description: 'Build responsive, accessible user interfaces using React 18, TypeScript, and modern styling libraries.',
      skills: ['React', 'TypeScript', 'TailwindCSS', 'REST APIs'],
      location: 'Remote',
      type: 'Remote',
      stipend: '₹20,000 / month',
      duration: '3 Months',
      openings: 3,
      applicantsCount: 18,
    },
    {
      title: 'Backend Engineering Intern (Node.js/Express)',
      company: 'Nexus Innovations',
      industryId: industry._id,
      description: 'Design and optimize backend APIs, integrate MongoDB queries, and implement authentication protocols.',
      skills: ['Node.js', 'Express', 'MongoDB', 'REST APIs'],
      location: 'Bengaluru / Hybrid',
      type: 'Hybrid',
      stipend: '₹25,000 / month',
      duration: '6 Months',
      openings: 2,
      applicantsCount: 24,
    },
    {
      title: 'Data Science & AI Research Intern',
      company: 'Cortex Analytics',
      industryId: industry._id,
      description: 'Assist in data preprocessing, feature engineering, and model training using PyTorch and Scikit-Learn.',
      skills: ['Python', 'Pandas', 'Machine Learning', 'Data Analysis'],
      location: 'Remote',
      type: 'Remote',
      stipend: '₹22,000 / month',
      duration: '4 Months',
      openings: 2,
      applicantsCount: 31,
    },
  ]

  for (const item of internshipsData) {
    await Internship.findOneAndUpdate(
      { title: item.title, company: item.company },
      item,
      { upsert: true, new: true }
    )
    console.log(`Seeded internship: ${item.title}`)
  }

  // 4. Seed Jobs (collection: jobs)
  console.log('\n--- 4. Seeding Jobs (industryId linked to user) ---')
  const jobsData = [
    {
      title: 'Junior Full Stack Engineer',
      company: 'Nexus Innovations',
      industryId: industry._id,
      description: 'Join our core engineering team to build scalable collaboration features across web and mobile platforms.',
      skills: ['React', 'Node.js', 'MongoDB', 'Docker', 'Git'],
      location: 'Bengaluru / Remote',
      type: 'Full-time',
      experienceLevel: 'Entry Level',
      salary: '₹7 - 10 LPA',
      openings: 2,
      applicantsCount: 52,
    },
    {
      title: 'Associate Cloud DevOps Engineer',
      company: 'Skyline Cloud Systems',
      industryId: industry._id,
      description: 'Maintain cloud infrastructure, automate deployment pipelines, and optimize container clusters.',
      skills: ['Docker', 'AWS', 'Linux', 'CI/CD', 'Python'],
      location: 'Hyderabad / Hybrid',
      type: 'Full-time',
      experienceLevel: 'Entry Level',
      salary: '₹8 - 12 LPA',
      openings: 1,
      applicantsCount: 37,
    },
  ]

  for (const j of jobsData) {
    await Job.findOneAndUpdate(
      { title: j.title, company: j.company },
      j,
      { upsert: true, new: true }
    )
    console.log(`Seeded job: ${j.title}`)
  }

  // 5. Seed 18 Assessment Topics & Questions (collections: assessmenttopics, assessmentquestions)
  console.log('\n--- 5. Seeding All 18 Assessment Topics & Questions ---')
  for (const topicData of ASSESSMENT_TOPICS_SEED) {
    const { questions, ...topicFields } = topicData
    topicFields.questionCount = questions.length

    const topic = await AssessmentTopic.findOneAndUpdate(
      { slug: topicFields.slug },
      topicFields,
      { upsert: true, new: true }
    )
    console.log(`✓ Seeded topic: ${topic.name} (${questions.length} questions)`)

    // Clear existing questions for this topic to ensure fresh, clean question pool
    await AssessmentQuestion.deleteMany({ topicId: topic._id })

    for (const q of questions) {
      await AssessmentQuestion.create({
        ...q,
        topicId: topic._id,
      })
    }
  }

  console.log('\n=============================================')
  console.log('Seed completed successfully for database: internsetu!')
  console.log('Collections populated/updated:')
  console.log('  - users (demo accounts added/updated)')
  console.log('  - courses (curricula linked to educatorId)')
  console.log('  - internships (openings linked to industryId)')
  console.log('  - jobs (vacancies linked to industryId)')
  console.log(`  - assessmenttopics (all 18 topics seeded)`)
  console.log('  - assessmentquestions (MCQs linked to topicId)')
  console.log('=============================================\n')

  await mongoose.disconnect()
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
