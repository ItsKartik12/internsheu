import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../.env') })

import mongoose from 'mongoose'
import { connectDB } from '../config/db.js'
import User from '../models/User.js'
import Job from '../models/Job.js'
import JobLink from '../models/JobLink.js'
import JobApplication from '../models/JobApplication.js'
import InternshipApplication from '../models/InternshipApplication.js'
import {
  applyJob,
  trackVisitJobPortal,
  getMyJobApplications,
} from '../controllers/jobApplicationController.js'

async function runTest() {
  console.log('=== STARTING JOB APPLICATION END-TO-END TEST ===\n')

  await connectDB()
  console.log('✓ Connected to MongoDB:', mongoose.connection.name)

  // 1. Find or create two test students
  let student1 = await User.findOne({ role: 'student' })
  if (!student1) {
    student1 = await User.create({
      name: 'Test Student 1',
      email: `student1_${Date.now()}@test.com`,
      password: 'password123',
      role: 'student',
    })
  }
  console.log('✓ Student 1:', student1.name, `(${student1._id})`)

  let student2 = await User.findOne({ role: 'student', _id: { $ne: student1._id } })
  if (!student2) {
    student2 = await User.create({
      name: 'Test Student 2 Isolation',
      email: `student2_${Date.now()}@test.com`,
      password: 'password123',
      role: 'student',
    })
  }
  console.log('✓ Student 2 (Isolation Check):', student2.name, `(${student2._id})`)

  // 2. Find or create a test job/jobLink
  let testJob = await Job.findOne({ isActive: true })
  if (!testJob) {
    testJob = await JobLink.findOne({ isActive: true })
  }
  if (!testJob) {
    testJob = await Job.create({
      title: 'Senior Cloud Architect',
      company: 'Nexus Tech Global',
      industryId: student1._id,
      description: 'Design and deploy scalable cloud systems.',
      location: 'Bengaluru, India',
      type: 'Full-time',
      experienceLevel: 'Senior Level',
      salary: '₹24 - 30 LPA',
      jobUrl: 'https://careers.nexustech.example.com/jobs/cloud-architect',
      workMode: 'Hybrid',
      isActive: true,
    })
  }
  console.log('✓ Target Job for Test:', testJob.title, `at ${testJob.company} (${testJob._id})`)

  // Clean previous test application if any
  await JobApplication.deleteOne({ jobId: testJob._id, studentId: student1._id })
  await JobApplication.deleteOne({ jobId: testJob._id, studentId: student2._id })

  // 3. Test Apply Job: Status = APPLIED_INTERNSETU
  console.log('\n--- Step 3: Student 1 applies to Job ---')
  const applyReq = {
    params: { id: testJob._id.toString() },
    user: student1,
  }
  let applyResData = null
  const applyRes = {
    status: (code) => ({
      json: (data) => {
        applyResData = data
      },
    }),
    json: (data) => {
      applyResData = data
    },
  }

  await applyJob(applyReq, applyRes, (err) => {
    if (err) throw err
  })

  console.log('Apply Response Message:', applyResData?.message)
  console.log('Created Application ID:', applyResData?.application?._id)
  console.log('Status after Apply:', applyResData?.application?.status)
  if (applyResData?.application?.status !== 'APPLIED_INTERNSETU') {
    throw new Error('Expected status APPLIED_INTERNSETU')
  }

  // 4. Test External Portal Visit: Status = VISITED_COMPANY_APPLICATION
  console.log('\n--- Step 4: Student 1 visits external portal ---')
  const visitReq = {
    params: { id: testJob._id.toString() },
    user: student1,
  }
  let visitResData = null
  const visitRes = {
    json: (data) => {
      visitResData = data
    },
  }

  await trackVisitJobPortal(visitReq, visitRes, (err) => {
    if (err) throw err
  })

  console.log('Visit Response Message:', visitResData?.message)
  console.log('Status after Visit:', visitResData?.application?.status)
  console.log('externalPortalVisited:', visitResData?.application?.externalPortalVisited)
  console.log('visitedAt:', visitResData?.application?.visitedAt)

  if (visitResData?.application?.status !== 'VISITED_COMPANY_APPLICATION') {
    throw new Error('Expected status VISITED_COMPANY_APPLICATION')
  }
  if (!visitResData?.application?.externalPortalVisited) {
    throw new Error('Expected externalPortalVisited to be true')
  }

  // 5. Test Persistence & Fetching My Job Applications
  console.log('\n--- Step 5: Fetch Student 1 Job Applications ---')
  let myAppsData = null
  const myAppsRes = {
    json: (data) => {
      myAppsData = data
    },
  }
  await getMyJobApplications({ user: student1 }, myAppsRes, (err) => {
    if (err) throw err
  })

  console.log(`Student 1 Applications Count: ${myAppsData?.applications?.length}`)
  const savedApp = myAppsData?.applications?.find((a) => a.jobId.toString() === testJob._id.toString())
  if (!savedApp) {
    throw new Error('Saved application not returned in getMyJobApplications')
  }
  console.log('✓ Found application in Student 1 records:')
  console.log('  Job Title:', savedApp.jobTitle)
  console.log('  Company:', savedApp.companyName)
  console.log('  Location:', savedApp.location)
  console.log('  Work Mode:', savedApp.workMode)
  console.log('  Job Type:', savedApp.jobType)
  console.log('  Status:', savedApp.status)
  console.log('  External Portal Visited:', savedApp.externalPortalVisited)
  console.log('  Portal URL:', savedApp.applicationUrl)

  // 6. Test RBAC Isolation: Student 2 cannot see Student 1's applications
  console.log('\n--- Step 6: Verify RBAC Isolation (Student 2) ---')
  let student2AppsData = null
  const student2Res = {
    json: (data) => {
      student2AppsData = data
    },
  }
  await getMyJobApplications({ user: student2 }, student2Res, (err) => {
    if (err) throw err
  })

  const leak = student2AppsData?.applications?.some((a) => a.studentId?.toString() === student1._id.toString())
  if (leak) {
    throw new Error('SECURITY VIOLATION: Student 2 received Student 1 applications!')
  }
  console.log('✓ Student 2 cannot access Student 1 applications. Security isolation verified.')

  // 7. Verify collection exists in MongoDB
  const colls = await mongoose.connection.db.listCollections().toArray()
  const hasJobAppsColl = colls.some((c) => c.name === 'jobapplications')
  console.log('\n✓ MongoDB collection "jobapplications" exists:', hasJobAppsColl)

  // 8. Verify existing InternshipApplication model still works
  const internAppsCount = await InternshipApplication.countDocuments()
  console.log('✓ Existing Internship Applications in MongoDB:', internAppsCount)

  console.log('\n=== ALL TESTS PASSED SUCCESSFULLY ===')
  await mongoose.disconnect()
  process.exit(0)
}

runTest().catch((err) => {
  console.error('Test Failed:', err)
  process.exit(1)
})
