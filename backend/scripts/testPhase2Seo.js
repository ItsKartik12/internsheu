import 'dotenv/config'
import mongoose from 'mongoose'
import { connectDB } from '../config/db.js'
import Internship from '../models/Internship.js'
import Job from '../models/Job.js'
import JobLink from '../models/JobLink.js'
import app from '../app.js'
import http from 'http'

async function runPhase2Tests() {
  console.log('============================================================')
  console.log('PHASE 2 SEO, GEO & DETAIL ROUTE VERIFICATION SUITE')
  console.log('============================================================\n')

  await connectDB()

  // Find a sample internship and job from MongoDB
  const sampleInternship = await Internship.findOne({ isActive: true }).lean()
  const sampleJob = (await Job.findOne({ isActive: true }).lean()) || (await JobLink.findOne({ isActive: true }).lean())

  if (!sampleInternship) {
    throw new Error('No active internship found in MongoDB to test')
  }
  if (!sampleJob) {
    throw new Error('No active job found in MongoDB to test')
  }

  console.log(`[Sample Data] Internship: "${sampleInternship.title}" (${sampleInternship._id})`)
  console.log(`[Sample Data] Job: "${sampleJob.title}" (${sampleJob._id})\n`)

  // Start temporary server to test Express endpoints
  const server = http.createServer(app)
  await new Promise((resolve) => server.listen(0, resolve))
  const port = server.address().port
  const baseUrl = `http://localhost:${port}`

  try {
    // 1. Verify /api/sitemap.xml
    console.log('[1] VERIFY DYNAMIC SITEMAP')
    const sitemapRes = await fetch(`${baseUrl}/api/sitemap.xml`)
    if (sitemapRes.status !== 200) {
      throw new Error(`Sitemap returned status ${sitemapRes.status}`)
    }
    const sitemapXml = await sitemapRes.text()
    if (!sitemapXml.includes('<loc>https://internsetu.vercel.app/</loc>')) {
      throw new Error('Sitemap missing root URL')
    }
    if (!sitemapXml.includes('<loc>https://internsetu.vercel.app/internships</loc>')) {
      throw new Error('Sitemap missing /internships')
    }
    if (!sitemapXml.includes('<loc>https://internsetu.vercel.app/jobs</loc>')) {
      throw new Error('Sitemap missing /jobs')
    }
    if (!sitemapXml.includes('<loc>https://internsetu.vercel.app/courses</loc>')) {
      throw new Error('Sitemap missing /courses')
    }
    if (!sitemapXml.includes(`/internships/${sampleInternship._id}`)) {
      throw new Error('Sitemap missing sample internship URL')
    }
    if (!sitemapXml.includes(`/jobs/${sampleJob._id}`)) {
      throw new Error('Sitemap missing sample job URL')
    }
    // Verify no private routes
    const privateRoutes = ['/admin', '/industry', '/dashboard', '/profile', '/applications', '/login']
    for (const pr of privateRoutes) {
      if (sitemapXml.includes(`<loc>https://internsetu.vercel.app${pr}</loc>`)) {
        throw new Error(`Sitemap illegally contains private route: ${pr}`)
      }
    }
    console.log('  ✓ Dynamic sitemap contains all public base URLs')
    console.log('  ✓ Dynamic sitemap contains real MongoDB internship and job detail URLs')
    console.log('  ✓ Dynamic sitemap strictly excludes all private routes\n')

    // 2. Verify Internship API endpoint & 404 handling
    console.log('[2] VERIFY INTERNSHIP DETAIL API & 404 HANDLING')
    const validIntRes = await fetch(`${baseUrl}/api/internships/${sampleInternship._id}`)
    if (validIntRes.status !== 200) {
      throw new Error(`Valid internship returned status ${validIntRes.status}`)
    }
    const validIntData = await validIntRes.json()
    if (validIntData.internship?.title !== sampleInternship.title) {
      throw new Error('Valid internship returned incorrect title')
    }
    console.log('  ✓ Valid internship ID returns 200 with real database fields')

    const invalidIntRes = await fetch(`${baseUrl}/api/internships/invalid-id-12345`)
    if (invalidIntRes.status !== 404) {
      throw new Error(`Invalid internship ID returned status ${invalidIntRes.status} (expected 404)`)
    }
    console.log('  ✓ Malformed / invalid internship ID returns 404')

    const nonExistentIntId = new mongoose.Types.ObjectId()
    const missingIntRes = await fetch(`${baseUrl}/api/internships/${nonExistentIntId}`)
    if (missingIntRes.status !== 404) {
      throw new Error(`Non-existent internship ID returned status ${missingIntRes.status} (expected 404)`)
    }
    console.log('  ✓ Non-existent internship ObjectId returns 404\n')

    // 3. Verify Job API endpoint & 404 handling
    console.log('[3] VERIFY JOB DETAIL API & 404 HANDLING')
    const validJobRes = await fetch(`${baseUrl}/api/jobs/${sampleJob._id}`)
    if (validJobRes.status !== 200) {
      throw new Error(`Valid job returned status ${validJobRes.status}`)
    }
    const validJobData = await validJobRes.json()
    if (validJobData.job?.title !== sampleJob.title) {
      throw new Error('Valid job returned incorrect title')
    }
    console.log('  ✓ Valid job ID returns 200 with real database fields')

    const invalidJobRes = await fetch(`${baseUrl}/api/jobs/invalid-id-99999`)
    if (invalidJobRes.status !== 404) {
      throw new Error(`Invalid job ID returned status ${invalidJobRes.status} (expected 404)`)
    }
    console.log('  ✓ Malformed / invalid job ID returns 404')

    const nonExistentJobId = new mongoose.Types.ObjectId()
    const missingJobRes = await fetch(`${baseUrl}/api/jobs/${nonExistentJobId}`)
    if (missingJobRes.status !== 404) {
      throw new Error(`Non-existent job ID returned status ${missingJobRes.status} (expected 404)`)
    }
    console.log('  ✓ Non-existent job ObjectId returns 404\n')

    // 4. Verify Server-Rendered Crawler Detail Pages
    console.log('[4] VERIFY SERVER CRAWLER PRE-RENDERING & STRUCTURED DATA')
    const crawlerIntRes = await fetch(`${baseUrl}/internships/${sampleInternship._id}`)
    if (crawlerIntRes.status !== 200) {
      throw new Error(`Crawler internship returned status ${crawlerIntRes.status}`)
    }
    const crawlerIntHtml = await crawlerIntRes.text()
    if (!crawlerIntHtml.includes('<title>') || !crawlerIntHtml.includes(sampleInternship.title)) {
      throw new Error('Crawler HTML missing title')
    }
    if (!crawlerIntHtml.includes('JobPosting') || !crawlerIntHtml.includes('BreadcrumbList')) {
      throw new Error('Crawler HTML missing JSON-LD schema')
    }
    if (!crawlerIntHtml.includes(`https://internsetu.vercel.app/internships/${sampleInternship._id}`)) {
      throw new Error('Crawler HTML missing canonical URL')
    }
    console.log('  ✓ Crawler internship page returns 200 with complete HTML, meta, and JSON-LD')

    const crawlerJobRes = await fetch(`${baseUrl}/jobs/${sampleJob._id}`)
    if (crawlerJobRes.status !== 200) {
      throw new Error(`Crawler job returned status ${crawlerJobRes.status}`)
    }
    const crawlerJobHtml = await crawlerJobRes.text()
    if (!crawlerJobHtml.includes('<title>') || !crawlerJobHtml.includes(sampleJob.title)) {
      throw new Error('Crawler HTML missing title')
    }
    if (!crawlerJobHtml.includes('JobPosting') || !crawlerJobHtml.includes('BreadcrumbList')) {
      throw new Error('Crawler HTML missing JSON-LD schema')
    }
    if (!crawlerJobHtml.includes(`https://internsetu.vercel.app/jobs/${sampleJob._id}`)) {
      throw new Error('Crawler HTML missing canonical URL')
    }
    console.log('  ✓ Crawler job page returns 200 with complete HTML, meta, and JSON-LD')

    const crawlerInvalidRes = await fetch(`${baseUrl}/internships/bad-id-123`)
    if (crawlerInvalidRes.status !== 404) {
      throw new Error(`Crawler invalid internship returned ${crawlerInvalidRes.status} (expected 404)`)
    }
    console.log('  ✓ Crawler invalid opportunity URL returns HTTP 404\n')

    console.log('============================================================')
    console.log('ALL PHASE 2 VERIFICATIONS PASSED!')
    console.log('============================================================')
  } finally {
    server.close()
    await mongoose.disconnect()
  }
}

runPhase2Tests().catch((err) => {
  console.error('Phase 2 test failure:', err)
  process.exit(1)
})
