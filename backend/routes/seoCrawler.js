import { Router } from 'express'
import mongoose from 'mongoose'
import Internship from '../models/Internship.js'
import Job from '../models/Job.js'
import JobLink from '../models/JobLink.js'

const router = Router()

function escapeHtml(str) {
  if (!str) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function stripTags(str) {
  if (!str) return ''
  return String(str).replace(/<[^>]*>?/gm, ' ').trim()
}

/**
 * Server-rendered crawler & social preview handler for /internships/:id
 */
router.get('/internships/:id', async (req, res) => {
  const { id } = req.params
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Internship Not Found | InternSetu</title>
  <meta name="robots" content="noindex" />
</head>
<body>
  <h1>404 - Internship Not Found</h1>
  <p>The requested internship does not exist or has been removed.</p>
  <a href="/internships">Browse all active internships on InternSetu</a>
</body>
</html>`)
  }

  try {
    const item = await Internship.findById(id).lean()
    if (!item || item.isActive === false) {
      return res.status(404).send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Internship Not Found | InternSetu</title>
  <meta name="robots" content="noindex" />
</head>
<body>
  <h1>404 - Internship Not Found</h1>
  <p>The requested internship does not exist or has been removed.</p>
  <a href="/internships">Browse all active internships on InternSetu</a>
</body>
</html>`)
    }

    const canonicalUrl = `https://internsetu.vercel.app/internships/${item._id}`
    const title = `${escapeHtml(item.title)} at ${escapeHtml(item.company)} | InternSetu`
    const rawDesc = stripTags(item.description) || `${item.title} at ${item.company}`
    const metaDesc = escapeHtml(rawDesc.slice(0, 155))

    const jobPostingJsonLd = {
      '@context': 'https://schema.org',
      '@type': 'JobPosting',
      title: item.title,
      description: rawDesc,
      datePosted: item.createdAt ? new Date(item.createdAt).toISOString() : undefined,
      validThrough: item.deadline ? new Date(item.deadline).toISOString() : undefined,
      employmentType: 'INTERN',
      hiringOrganization: {
        '@type': 'Organization',
        name: item.company,
        ...(item.companyWebsite ? { sameAs: item.companyWebsite } : {}),
      },
    }

    const isRemote =
      (item.workMode && item.workMode.toLowerCase() === 'remote') ||
      (item.location && item.location.toLowerCase() === 'remote')

    if (isRemote) {
      jobPostingJsonLd.jobLocationType = 'TELECOMMUTE'
      jobPostingJsonLd.applicantLocationRequirements = {
        '@type': 'Country',
        name: 'India',
      }
    }

    if (item.location && item.location.toLowerCase() !== 'remote') {
      jobPostingJsonLd.jobLocation = {
        '@type': 'Place',
        address: {
          '@type': 'PostalAddress',
          addressLocality: item.location,
          addressCountry: 'IN',
        },
      }
    }

    // Only include baseSalary if real numerical stipend exists
    if (item.stipend && typeof item.stipend === 'string') {
      const clean = item.stipend.replace(/,/g, '')
      const match = clean.match(/(?:₹|INR|Rs\.?)\s*(\d+)/i)
      if (match) {
        const amount = parseInt(match[1], 10)
        if (!isNaN(amount) && amount > 0) {
          jobPostingJsonLd.baseSalary = {
            '@type': 'MonetaryAmount',
            currency: 'INR',
            value: {
              '@type': 'QuantitativeValue',
              value: amount,
              unitText: clean.toLowerCase().includes('year') ? 'YEAR' : 'MONTH',
            },
          }
        }
      }
    }

    const breadcrumbJsonLd = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: 'https://internsetu.vercel.app/',
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Internships',
          item: 'https://internsetu.vercel.app/internships',
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: item.title,
          item: canonicalUrl,
        },
      ],
    }

    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <meta name="description" content="${metaDesc}" />
  <link rel="canonical" href="${canonicalUrl}" />
  <meta property="og:type" content="article" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${metaDesc}" />
  <meta property="og:url" content="${canonicalUrl}" />
  <meta property="og:site_name" content="InternSetu" />
  <meta name="twitter:card" content="summary" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${metaDesc}" />
  <script type="application/ld+json">${JSON.stringify(jobPostingJsonLd)}</script>
  <script type="application/ld+json">${JSON.stringify(breadcrumbJsonLd)}</script>
</head>
<body>
  <nav aria-label="Breadcrumb">
    <a href="/">Home</a> &gt;
    <a href="/internships">Internships</a> &gt;
    <span>${escapeHtml(item.title)}</span>
  </nav>
  <main>
    <article>
      <h1>${escapeHtml(item.title)}</h1>
      <p><strong>Company:</strong> ${escapeHtml(item.company)}</p>
      ${item.location ? `<p><strong>Location:</strong> ${escapeHtml(item.location)}</p>` : ''}
      ${item.workMode ? `<p><strong>Work Mode:</strong> ${escapeHtml(item.workMode)}</p>` : ''}
      ${item.stipend ? `<p><strong>Stipend:</strong> ${escapeHtml(item.stipend)}</p>` : ''}
      ${item.duration ? `<p><strong>Duration:</strong> ${escapeHtml(item.duration)}</p>` : ''}
      ${item.description ? `<section><h2>Role Overview</h2><p>${escapeHtml(item.description)}</p></section>` : ''}
      ${item.responsibilities ? `<section><h2>Key Responsibilities</h2><p>${escapeHtml(item.responsibilities)}</p></section>` : ''}
      ${item.eligibility ? `<section><h2>Eligibility Criteria</h2><p>${escapeHtml(item.eligibility)}</p></section>` : ''}
      ${item.qualifications ? `<section><h2>Required Qualifications</h2><p>${escapeHtml(item.qualifications)}</p></section>` : ''}
      ${item.applicationUrl ? `<p><a href="${escapeHtml(item.applicationUrl)}" rel="nofollow noopener noreferrer">Visit &amp; Apply</a></p>` : ''}
      <p><a href="/internships">Back to Internships</a></p>
    </article>
  </main>
</body>
</html>`)
  } catch (err) {
    res.status(500).send('Internal Server Error')
  }
})

/**
 * Server-rendered crawler & social preview handler for /jobs/:id
 */
router.get('/jobs/:id', async (req, res) => {
  const { id } = req.params
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Job Not Found | InternSetu</title>
  <meta name="robots" content="noindex" />
</head>
<body>
  <h1>404 - Job Not Found</h1>
  <p>The requested career opportunity does not exist or has expired.</p>
  <a href="/jobs">Browse all active jobs on InternSetu</a>
</body>
</html>`)
  }

  try {
    let job = await Job.findById(id).lean()
    if (!job) {
      const jobLink = await JobLink.findById(id).lean()
      if (jobLink) {
        job = {
          ...jobLink,
          type: jobLink.jobType || 'Full-time',
        }
      }
    }

    if (!job || job.isActive === false) {
      return res.status(404).send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Job Not Found | InternSetu</title>
  <meta name="robots" content="noindex" />
</head>
<body>
  <h1>404 - Job Not Found</h1>
  <p>The requested career opportunity does not exist or has expired.</p>
  <a href="/jobs">Browse all active jobs on InternSetu</a>
</body>
</html>`)
    }

    const canonicalUrl = `https://internsetu.vercel.app/jobs/${job._id}`
    const title = `${escapeHtml(job.title)} at ${escapeHtml(job.company)} | InternSetu`
    const rawDesc = stripTags(job.description) || `${job.title} at ${job.company}`
    const metaDesc = escapeHtml(rawDesc.slice(0, 155))

    let empType = 'FULL_TIME'
    if (job.type) {
      const norm = job.type.toLowerCase()
      if (norm.includes('part')) empType = 'PART_TIME'
      else if (norm.includes('contract')) empType = 'CONTRACTOR'
      else if (norm.includes('intern')) empType = 'INTERN'
    }

    const jobPostingJsonLd = {
      '@context': 'https://schema.org',
      '@type': 'JobPosting',
      title: job.title,
      description: rawDesc,
      datePosted: job.createdAt ? new Date(job.createdAt).toISOString() : undefined,
      validThrough: job.deadline ? new Date(job.deadline).toISOString() : undefined,
      employmentType: empType,
      hiringOrganization: {
        '@type': 'Organization',
        name: job.company,
        ...(job.companyWebsite ? { sameAs: job.companyWebsite } : {}),
      },
    }

    const isRemote =
      (job.workMode && job.workMode.toLowerCase() === 'remote') ||
      (job.location && job.location.toLowerCase() === 'remote')

    if (isRemote) {
      jobPostingJsonLd.jobLocationType = 'TELECOMMUTE'
      jobPostingJsonLd.applicantLocationRequirements = {
        '@type': 'Country',
        name: 'India',
      }
    }

    if (job.location && job.location.toLowerCase() !== 'remote') {
      jobPostingJsonLd.jobLocation = {
        '@type': 'Place',
        address: {
          '@type': 'PostalAddress',
          addressLocality: job.location,
          addressCountry: 'IN',
        },
      }
    }

    if (job.salary && typeof job.salary === 'string') {
      const clean = job.salary.replace(/,/g, '')
      const match = clean.match(/(?:₹|INR|Rs\.?)\s*(\d+)/i)
      if (match) {
        const amount = parseInt(match[1], 10)
        if (!isNaN(amount) && amount > 0) {
          jobPostingJsonLd.baseSalary = {
            '@type': 'MonetaryAmount',
            currency: 'INR',
            value: {
              '@type': 'QuantitativeValue',
              value: amount,
              unitText:
                clean.toLowerCase().includes('year') || clean.toLowerCase().includes('lpa')
                  ? 'YEAR'
                  : 'MONTH',
            },
          }
        }
      }
    }

    const breadcrumbJsonLd = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: 'https://internsetu.vercel.app/',
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Jobs',
          item: 'https://internsetu.vercel.app/jobs',
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: job.title,
          item: canonicalUrl,
        },
      ],
    }

    const appUrl = job.jobUrl || job.applicationUrl

    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <meta name="description" content="${metaDesc}" />
  <link rel="canonical" href="${canonicalUrl}" />
  <meta property="og:type" content="article" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${metaDesc}" />
  <meta property="og:url" content="${canonicalUrl}" />
  <meta property="og:site_name" content="InternSetu" />
  <meta name="twitter:card" content="summary" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${metaDesc}" />
  <script type="application/ld+json">${JSON.stringify(jobPostingJsonLd)}</script>
  <script type="application/ld+json">${JSON.stringify(breadcrumbJsonLd)}</script>
</head>
<body>
  <nav aria-label="Breadcrumb">
    <a href="/">Home</a> &gt;
    <a href="/jobs">Jobs</a> &gt;
    <span>${escapeHtml(job.title)}</span>
  </nav>
  <main>
    <article>
      <h1>${escapeHtml(job.title)}</h1>
      <p><strong>Company:</strong> ${escapeHtml(job.company)}</p>
      ${job.location ? `<p><strong>Location:</strong> ${escapeHtml(job.location)}</p>` : ''}
      ${job.type ? `<p><strong>Employment Type:</strong> ${escapeHtml(job.type)}</p>` : ''}
      ${job.experienceLevel ? `<p><strong>Experience:</strong> ${escapeHtml(job.experienceLevel)}</p>` : ''}
      ${job.salary ? `<p><strong>Compensation:</strong> ${escapeHtml(job.salary)}</p>` : ''}
      ${job.description ? `<section><h2>Job Description</h2><p>${escapeHtml(job.description)}</p></section>` : ''}
      ${job.responsibilities ? `<section><h2>Key Responsibilities</h2><p>${escapeHtml(job.responsibilities)}</p></section>` : ''}
      ${job.eligibility ? `<section><h2>Eligibility Criteria</h2><p>${escapeHtml(job.eligibility)}</p></section>` : ''}
      ${job.qualifications ? `<section><h2>Qualifications</h2><p>${escapeHtml(job.qualifications)}</p></section>` : ''}
      ${appUrl ? `<p><a href="${escapeHtml(appUrl)}" rel="nofollow noopener noreferrer">Visit &amp; Apply</a></p>` : ''}
      <p><a href="/jobs">Back to Jobs</a></p>
    </article>
  </main>
</body>
</html>`)
  } catch (err) {
    res.status(500).send('Internal Server Error')
  }
})

export default router
