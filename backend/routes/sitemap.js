import { Router } from 'express'
import Internship from '../models/Internship.js'
import Job from '../models/Job.js'
import JobLink from '../models/JobLink.js'

const router = Router()

export async function generateSitemapXml(req, res, next) {
  try {
    const baseUrl = 'https://internsetu.vercel.app'

    // Fetch active internships and jobs from MongoDB
    const [internships, jobs, jobLinks] = await Promise.all([
      Internship.find({ isActive: true }).select('_id updatedAt createdAt').lean(),
      Job.find({ isActive: true }).select('_id updatedAt createdAt').lean(),
      JobLink.find({ isActive: true }).select('_id updatedAt createdAt').lean(),
    ])

    const formatEntry = (path, lastmod, changefreq = 'weekly', priority = '0.7') => {
      let entry = `  <url>\n    <loc>${baseUrl}${path}</loc>\n`
      if (lastmod) {
        const dateStr = new Date(lastmod).toISOString().split('T')[0]
        entry += `    <lastmod>${dateStr}</lastmod>\n`
      }
      entry += `    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`
      return entry
    }

    const staticEntries = [
      formatEntry('/', new Date().toISOString(), 'daily', '1.0'),
      formatEntry('/internships', new Date().toISOString(), 'daily', '0.9'),
      formatEntry('/jobs', new Date().toISOString(), 'daily', '0.9'),
      formatEntry('/courses', new Date().toISOString(), 'weekly', '0.8'),
    ]

    const internshipEntries = internships.map((item) =>
      formatEntry(`/internships/${item._id}`, item.updatedAt || item.createdAt, 'weekly', '0.7')
    )

    const jobEntries = [...jobs, ...jobLinks].map((item) =>
      formatEntry(`/jobs/${item._id}`, item.updatedAt || item.createdAt, 'weekly', '0.7')
    )

    const allEntries = [...staticEntries, ...internshipEntries, ...jobEntries].join('\n')

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allEntries}
</urlset>`

    res.setHeader('Content-Type', 'application/xml; charset=utf-8')
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600')
    res.send(xml)
  } catch (err) {
    next(err)
  }
}

router.get('/sitemap.xml', generateSitemapXml)
router.get('/', generateSitemapXml)

export default router
