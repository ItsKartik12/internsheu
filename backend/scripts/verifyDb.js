import 'dotenv/config'
import dns from 'node:dns'
import mongoose from 'mongoose'

try {
  dns.setServers(['8.8.8.8', '1.1.1.1'])
} catch {
  // fallback to system resolver
}

async function verify() {
  console.log('--- 1. CONNECTING TO MONGODB ATLAS ---')
  await mongoose.connect(process.env.MONGODB_URI)
  console.log('Connected to Cluster:', mongoose.connection.host)
  console.log('Database Name:', mongoose.connection.name)

  const db = mongoose.connection.db
  let collections = await db.listCollections().toArray()
  let collNames = collections.map((c) => c.name).sort()

  // Ensure assessmentattempts and skillresults collections exist
  if (!collNames.includes('assessmentattempts')) {
    await db.createCollection('assessmentattempts')
  }
  if (!collNames.includes('skillresults')) {
    await db.createCollection('skillresults')
  }

  // Refresh collections
  collections = await db.listCollections().toArray()
  collNames = collections.map((c) => c.name).sort()

  console.log('\n--- 2. ALL COLLECTIONS IN internsetu ---')
  console.log(collNames)

  console.log('\n--- 3. DOCUMENT COUNTS PER COLLECTION ---')
  const counts = {}
  for (const name of collNames) {
    counts[name] = await db.collection(name).countDocuments()
    console.log(`  • ${name.padEnd(22)}: ${counts[name]} documents`)
  }

  console.log('\n--- 4. EXISTING COLLECTIONS CHECK ---')
  const existingCols = ['users', 'careergoals', 'educations', 'interests', 'studentprofiles']
  for (const col of existingCols) {
    const exists = collNames.includes(col)
    console.log(`  • ${col.padEnd(20)}: ${exists ? 'EXISTS & INTACT' : 'NOT FOUND'} (${counts[col] || 0} documents)`)
  }

  console.log('\n--- 5. SEEDED COLLECTIONS CHECK ---')
  const seededCols = [
    'courses',
    'internships',
    'jobs',
    'assessmenttopics',
    'assessmentquestions',
    'assessmentattempts',
    'skillresults',
  ]
  for (const col of seededCols) {
    const exists = collNames.includes(col)
    console.log(`  • ${col.padEnd(20)}: ${exists ? 'EXISTS' : 'NOT FOUND'} (${counts[col] || 0} documents)`)
  }

  console.log('\n--- 6. SAMPLE VERIFICATION OF SEEDED DATA ---')
  const users = await db.collection('users').find({}, { projection: { passwordHash: 0 } }).toArray()
  console.log(`Users in database (${users.length}):`)
  users.forEach((u) => console.log(`  - [${u.role}] ${u.name} (${u.email})`))

  const courses = await db.collection('courses').find({}, { projection: { title: 1, category: 1, educatorName: 1 } }).toArray()
  console.log(`\nCourses in database (${courses.length}):`)
  courses.forEach((c) => console.log(`  - ${c.title} [${c.category}] by ${c.educatorName}`))

  const internships = await db.collection('internships').find({}, { projection: { title: 1, company: 1, type: 1, stipend: 1 } }).toArray()
  console.log(`\nInternships in database (${internships.length}):`)
  internships.forEach((i) => console.log(`  - ${i.title} @ ${i.company} (${i.type} | ${i.stipend})`))

  const jobs = await db.collection('jobs').find({}, { projection: { title: 1, company: 1, salary: 1 } }).toArray()
  console.log(`\nJobs in database (${jobs.length}):`)
  jobs.forEach((j) => console.log(`  - ${j.title} @ ${j.company} (${j.salary})`))

  const topics = await db.collection('assessmenttopics').find({}, { projection: { name: 1, category: 1, questionCount: 1 } }).toArray()
  console.log(`\nAssessment Topics in database (${topics.length}):`)
  topics.forEach((t) => console.log(`  - ${t.name} (${t.category}, ${t.questionCount} questions)`))

  const questionCount = await db.collection('assessmentquestions').countDocuments()
  console.log(`\nTotal Assessment Questions in database: ${questionCount}`)

  await mongoose.disconnect()
  console.log('\n--- VERIFICATION FINISHED SUCCESSFULLY ---')
}

verify().catch((err) => {
  console.error('Verification failed:', err)
  process.exit(1)
})
