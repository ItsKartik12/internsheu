import 'dotenv/config'
import mongoose from 'mongoose'
import { connectDB } from '../config/db.js'
import Internship from '../models/Internship.js'
import Job from '../models/Job.js'
import app from '../app.js'
import http from 'http'

async function runPhase3RouteVerification() {
  console.log('============================================================')
  console.log('PHASE 3 ROUTE & CACHE VERIFICATION')
  console.log('============================================================\n')

  await connectDB()

  const server = http.createServer(app)
  await new Promise((resolve) => server.listen(0, resolve))
  const port = server.address().port
  const baseUrl = `http://localhost:${port}`

  try {
    // 1. Dynamic Sitemap headers
    const sitemapRes = await fetch(`${baseUrl}/api/sitemap.xml`)
    const sitemapCc = sitemapRes.headers.get('cache-control')
    console.log(`[Sitemap] Status: ${sitemapRes.status}, Cache-Control: ${sitemapCc}`)
    if (!sitemapCc || sitemapCc.includes('immutable')) {
      throw new Error('Sitemap should not be cached with immutable header')
    }

    // 2. Health endpoint
    const healthRes = await fetch(`${baseUrl}/api/health`)
    const healthData = await healthRes.json()
    console.log(`[Health] Status: ${healthRes.status}, Service: ${healthData.service}`)

    // 3. API 404 for invalid route
    const invalidApiRes = await fetch(`${baseUrl}/api/invalid-route-xyz`)
    console.log(`[Invalid API] Status: ${invalidApiRes.status}`)
    if (invalidApiRes.status !== 404) {
      throw new Error('Invalid API route must return 404')
    }

    // 4. Sample opportunity detail endpoint
    const sampleInt = await Internship.findOne({ isActive: true }).lean()
    if (sampleInt) {
      const intRes = await fetch(`${baseUrl}/api/internships/${sampleInt._id}`)
      console.log(`[Internship Detail API] Status: ${intRes.status}, Title: "${sampleInt.title}"`)
    }

    console.log('\n✓ All Phase 3 Route & Caching checks passed successfully!')
  } finally {
    server.close()
    await mongoose.disconnect()
  }
}

runPhase3RouteVerification().catch((err) => {
  console.error('Phase 3 verification failed:', err)
  process.exit(1)
})
