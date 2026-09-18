/**
 * Schema.org JSON-LD Generators for InternSetu Opportunities
 * Complies strictly with Schema.org JobPosting and BreadcrumbList specifications.
 * No fabricated salary, dates, locations, or placeholder values.
 */

export function generateJobPostingSchema({
  title,
  company,
  companyWebsite,
  description,
  location,
  workMode,
  employmentType,
  createdAt,
  deadline,
  salary,
  isInternship = false,
}) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: title || 'Opportunity',
    description: description ? description.replace(/<[^>]*>?/gm, ' ').trim() : (title || 'Opportunity details'),
    hiringOrganization: {
      '@type': 'Organization',
      name: company || 'Hiring Organization',
      ...(companyWebsite ? { sameAs: companyWebsite } : {}),
    },
  }

  if (createdAt) {
    try {
      const d = new Date(createdAt)
      if (!isNaN(d.getTime())) {
        schema.datePosted = d.toISOString()
      }
    } catch {
      // Omit invalid date
    }
  }

  if (deadline) {
    try {
      const d = new Date(deadline)
      if (!isNaN(d.getTime())) {
        schema.validThrough = d.toISOString()
      }
    } catch {
      // Omit invalid date
    }
  }

  if (isInternship) {
    schema.employmentType = 'INTERN'
  } else if (employmentType) {
    const norm = String(employmentType).toLowerCase()
    if (norm.includes('full')) schema.employmentType = 'FULL_TIME'
    else if (norm.includes('part')) schema.employmentType = 'PART_TIME'
    else if (norm.includes('contract')) schema.employmentType = 'CONTRACTOR'
    else if (norm.includes('intern')) schema.employmentType = 'INTERN'
  }

  const isRemote =
    (workMode && String(workMode).toLowerCase() === 'remote') ||
    (location && String(location).toLowerCase() === 'remote')

  if (isRemote) {
    schema.jobLocationType = 'TELECOMMUTE'
    schema.applicantLocationRequirements = {
      '@type': 'Country',
      name: 'India',
    }
  }

  if (location && String(location).toLowerCase() !== 'remote') {
    schema.jobLocation = {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: location,
        addressCountry: 'IN',
      },
    }
  }

  // Only include baseSalary if genuine numerical salary data exists.
  // Never fabricate or use placeholder text like "Best in Industry" or "Competitive".
  if (salary && typeof salary === 'string') {
    const cleanSalary = salary.replace(/,/g, '')
    const match = cleanSalary.match(/(?:₹|INR|Rs\.?)\s*(\d+)/i)
    if (match) {
      const amount = parseInt(match[1], 10)
      if (!isNaN(amount) && amount > 0) {
        schema.baseSalary = {
          '@type': 'MonetaryAmount',
          currency: 'INR',
          value: {
            '@type': 'QuantitativeValue',
            value: amount,
            unitText:
              cleanSalary.toLowerCase().includes('year') || cleanSalary.toLowerCase().includes('lpa')
                ? 'YEAR'
                : 'MONTH',
          },
        }
      }
    }
  }

  return schema
}

export function generateBreadcrumbSchema(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
}
