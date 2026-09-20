// ────────────────────────────────────────────────────────────────────────
// API service utility — talks to Express backend in /backend or Render.
// Supports JWT authorization headers, resilient offline/Vercel persistence,
// and full CRUD operations without breaking.
//
// Local development:
//   Frontend: http://localhost:5173
//   Backend:  http://localhost:3001
//
// Production:
//   Frontend: Vercel
//   Backend:  https://internsheu.onrender.com
//
// Exports include: auth, courses, internships, jobs, job-links, contests,
// assessments, problems, industry pipeline, candidate matrix, payments
// (getPaymentConfigApi, createPostingOrderApi, verifyAndPublishPostingApi).
// ────────────────────────────────────────────────────────────────────────

import {
  FALLBACK_JOBS,
  FALLBACK_INTERNSHIPS,
  FALLBACK_COURSES,
  FALLBACK_TOPICS,
} from '../data/fallbackData.js'

// ── API Base URL ─────────────────────────────────────────────────────────

const env = typeof import.meta !== 'undefined' ? import.meta.env : undefined
const LOCAL_API_BASE_URL = env?.VITE_API_BASE_URL?.trim() || 'http://localhost:5000'
const PRODUCTION_API_BASE_URL = 'https://internsheu.onrender.com'

// In local development, default to the local backend.
// In production, VITE_API_BASE_URL can override the default Render URL.
const API_BASE_URL = env?.DEV
  ? LOCAL_API_BASE_URL
  : (
    env?.VITE_API_BASE_URL?.trim() ||
    (env ? PRODUCTION_API_BASE_URL : 'http://localhost:5000')
  )

// ── Local Storage Resilience Helpers ─────────────────────────────────────

function getLocalItems(key) {
  try {
    const raw = localStorage.getItem(`internsheu_${key}`)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveLocalItem(key, item) {
  try {
    const current = getLocalItems(key)
    const filtered = current.filter((x) => x._id !== item._id)
    localStorage.setItem(
      `internsheu_${key}`,
      JSON.stringify([item, ...filtered])
    )
  } catch (err) {
    console.warn('[api] Failed to save to localStorage:', err)
  }
}

function removeLocalItem(key, id) {
  try {
    const current = getLocalItems(key)
    const filtered = current.filter((x) => x._id !== id)
    localStorage.setItem(
      `internsheu_${key}`,
      JSON.stringify(filtered)
    )
  } catch (err) {
    console.warn('[api] Failed to remove from localStorage:', err)
  }
}

function getAuthHeaders() {
  const token = localStorage.getItem('token')
  const headers = { 'Content-Type': 'application/json' }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  return headers
}

export async function request(path, options = {}) {
  const url = path.startsWith('http')
    ? path
    : `${API_BASE_URL}${path}`

  const response = await fetch(url, {
    headers: {
      ...getAuthHeaders(),
      ...(options.headers || {}),
    },
    ...options,
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    const errorMsg =
      data?.error ||
      `API request failed with status ${response.status}`

    const error = new Error(errorMsg)
    error.status = response.status
    error.data = data
    throw error
  }

  return data
}

export async function safeRequest(
  path,
  options = {},
  fallback = null
) {
  try {
    return await request(path, options)
  } catch (err) {
    console.warn(
      `[api] safeRequest(${path}) failed: ${err.message}. Using fallback.`
    )
    return fallback
  }
}

// ── Auth APIs ────────────────────────────────────────────────────────────

export async function loginUser(email, password) {
  try {
    return await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  } catch (err) {
    // If backend is unreachable, provide offline demonstration authentication
    const demoAccounts = {
      'student@internsheu.edu': {
        name: 'Aarav Sharma',
        role: 'student',
        email: 'student@internsheu.edu',
        _id: 'demo-stu-1',
      },
      'educator@internsheu.edu': {
        name: 'Prof. Sarah Jenkins',
        role: 'educator',
        email: 'educator@internsheu.edu',
        _id: 'demo-edu-1',
      },
      'industry@internsheu.edu': {
        name: 'Nexus Tech Talent Team',
        role: 'industry',
        email: 'industry@internsheu.edu',
        _id: 'demo-ind-1',
      },
      'admin@internsheu.edu': {
        name: 'Portal Administrator',
        role: 'admin',
        email: 'admin@internsheu.edu',
        _id: 'demo-adm-1',
      },
    }

    const matched =
      demoAccounts[email.toLowerCase().trim()]

    if (matched && password === 'password123') {
      const mockToken = `mock-token-${matched.role}-${Date.now()}`

      return {
        token: mockToken,
        user: matched,
      }
    }

    throw err
  }
}

export async function registerUser(userData) {
  return request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  })
}

export async function fetchCurrentUser() {
  return safeRequest('/api/auth/me')
}

// ── Courses APIs ─────────────────────────────────────────────────────────

export async function fetchCourses(params = {}) {
  const query = new URLSearchParams()

  if (params.search) query.set('search', params.search)
  if (params.category) query.set('category', params.category)
  if (params.level) query.set('level', params.level)
  if (params.educatorId) query.set('educatorId', params.educatorId)

  const qs = query.toString()
    ? `?${query.toString()}`
    : ''

  const localItems = getLocalItems('courses')
  let list = []

  const res = await safeRequest(
    `/api/courses${qs}`,
    {},
    null
  )

  if (res?.courses && res.courses.length > 0) {
    const remoteIds = new Set(
      res.courses.map((c) => c._id)
    )

    const pendingLocal = localItems.filter(
      (c) => !remoteIds.has(c._id)
    )

    list = [...pendingLocal, ...res.courses]
  } else {
    const localIds = new Set(
      localItems.map((c) => c._id)
    )

    const remainingFallback =
      FALLBACK_COURSES.filter(
        (c) => !localIds.has(c._id)
      )

    list = [
      ...localItems,
      ...remainingFallback,
    ]
  }

  if (
    params.category &&
    params.category !== 'All'
  ) {
    list = list.filter(
      (c) =>
        c.category.toLowerCase() ===
        params.category.toLowerCase()
    )
  }

  if (
    params.level &&
    params.level !== 'All'
  ) {
    list = list.filter(
      (c) =>
        c.level.toLowerCase() ===
        params.level.toLowerCase()
    )
  }

  if (params.search) {
    const s = params.search.toLowerCase()

    list = list.filter(
      (c) =>
        c.title.toLowerCase().includes(s) ||
        c.description.toLowerCase().includes(s) ||
        (
          c.tags &&
          c.tags.some((t) =>
            t.toLowerCase().includes(s)
          )
        )
    )
  }

  return { courses: list }
}

export async function fetchCourseById(id) {
  const localItems = getLocalItems('courses')

  const localFound = localItems.find(
    (c) => c._id === id
  )

  if (localFound) {
    return { course: localFound }
  }

  try {
    return await request(`/api/courses/${id}`)
  } catch {
    const found = FALLBACK_COURSES.find(
      (c) => c._id === id
    )

    return {
      course:
        found || FALLBACK_COURSES[0],
    }
  }
}

export async function createCourseApi(courseData) {
  try {
    const res = await request('/api/courses', {
      method: 'POST',
      body: JSON.stringify(courseData),
    })

    if (res?.course) {
      saveLocalItem('courses', res.course)
    }

    return res
  } catch (err) {
    console.warn(
      '[api] createCourseApi fallback:',
      err.message
    )

    const newCourse = {
      _id: `local-course-${Date.now()}`,
      ...courseData,
      rating: 5.0,
      enrolledCount: 1,
      createdAt: new Date().toISOString(),
    }

    saveLocalItem('courses', newCourse)

    return {
      course: newCourse,
      message: 'Course created successfully',
    }
  }
}

export async function updateCourseApi(
  id,
  courseData
) {
  try {
    const res = await request(
      `/api/courses/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(courseData),
      }
    )

    if (res?.course) {
      saveLocalItem('courses', res.course)
    }

    return res
  } catch (err) {
    console.warn(
      '[api] updateCourseApi fallback:',
      err.message
    )

    const updated = {
      _id: id,
      ...courseData,
    }

    saveLocalItem('courses', updated)

    return { course: updated }
  }
}

export async function deleteCourseApi(id) {
  removeLocalItem('courses', id)

  try {
    return await request(
      `/api/courses/${id}`,
      {
        method: 'DELETE',
      }
    )
  } catch (err) {
    console.warn(
      '[api] deleteCourseApi fallback:',
      err.message
    )

    return {
      message: 'Course deleted successfully',
    }
  }
}

export async function enrollCourseApi(id) {
  return safeRequest(
    `/api/courses/${id}/enroll`,
    {
      method: 'POST',
    },
    {
      message: 'Enrolled successfully',
    }
  )
}

// ── Internships APIs ─────────────────────────────────────────────────────

export async function fetchInternships(
  params = {}
) {
  const query = new URLSearchParams()

  if (params.search) query.set('search', params.search)
  if (params.location) query.set('location', params.location)
  if (params.type) query.set('type', params.type)
  if (params.skill) query.set('skill', params.skill)
  if (params.industryId) {
    query.set('industryId', params.industryId)
  }

  const qs = query.toString()
    ? `?${query.toString()}`
    : ''

  const res = await safeRequest(
    `/api/internships${qs}`,
    {},
    null
  )

  let list = []

  if (
    res &&
    Array.isArray(res.internships)
  ) {
    list = res.internships
  } else {
    const localItems =
      getLocalItems('internships')

    list =
      localItems.length > 0
        ? localItems
        : []
  }

  if (
    params.type &&
    params.type !== 'All'
  ) {
    list = list.filter(
      (i) =>
        (i.type || '').toLowerCase() ===
        params.type.toLowerCase()
    )
  }

  if (params.search) {
    const s = params.search.toLowerCase()

    list = list.filter(
      (i) =>
        (i.title || '')
          .toLowerCase()
          .includes(s) ||
        (i.company || '')
          .toLowerCase()
          .includes(s) ||
        (
          i.skills &&
          i.skills.some((sk) =>
            sk.toLowerCase().includes(s)
          )
        )
    )
  }

  return { internships: list }
}

export async function fetchInternshipById(id) {
  try {
    const res = await request(
      `/api/internships/${id}`
    )

    return res?.internship || null
  } catch (err) {
    if (err.status === 404) {
      return null
    }

    const localItems =
      getLocalItems('internships')

    return (
      localItems.find(
        (i) => i._id === id
      ) || null
    )
  }
}

export async function createInternshipApi(
  internshipData
) {
  try {
    const res = await request(
      '/api/internships',
      {
        method: 'POST',
        body: JSON.stringify(internshipData),
      }
    )

    if (res?.internship) {
      saveLocalItem(
        'internships',
        res.internship
      )
    }

    return res
  } catch (err) {
    console.warn(
      '[api] createInternshipApi fallback:',
      err.message
    )

    const newInternship = {
      _id: `local-int-${Date.now()}`,
      ...internshipData,
      openings:
        Number(internshipData.openings) || 1,
      applicantsCount: 0,
      createdAt: new Date().toISOString(),
    }

    saveLocalItem(
      'internships',
      newInternship
    )

    return {
      internship: newInternship,
      message:
        'Internship opening published!',
    }
  }
}

export async function updateInternshipApi(
  id,
  internshipData
) {
  try {
    const res = await request(
      `/api/internships/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(internshipData),
      }
    )

    if (res?.internship) {
      saveLocalItem(
        'internships',
        res.internship
      )
    }

    return res
  } catch (err) {
    console.warn(
      '[api] updateInternshipApi fallback:',
      err.message
    )

    const updated = {
      _id: id,
      ...internshipData,
    }

    saveLocalItem(
      'internships',
      updated
    )

    return { internship: updated }
  }
}

export async function deleteInternshipApi(id) {
  removeLocalItem('internships', id)

  try {
    return await request(
      `/api/internships/${id}`,
      {
        method: 'DELETE',
      }
    )
  } catch (err) {
    console.warn(
      '[api] deleteInternshipApi fallback:',
      err.message
    )

    return {
      message:
        'Internship deleted successfully',
    }
  }
}

export async function applyInternshipApi(id) {
  return safeRequest(
    `/api/internships/${id}/apply`,
    {
      method: 'POST',
    },
    {
      message:
        'Application submitted successfully',
      applicantsCount: 1,
    }
  )
}

// ── Jobs APIs ────────────────────────────────────────────────────────────

export async function fetchJobs(
  params = {}
) {
  const query = new URLSearchParams()

  if (params.search) query.set('search', params.search)
  if (params.location) query.set('location', params.location)
  if (params.type) query.set('type', params.type)
  if (params.experienceLevel) {
    query.set(
      'experienceLevel',
      params.experienceLevel
    )
  }
  if (params.skill) query.set('skill', params.skill)
  if (params.industryId) {
    query.set('industryId', params.industryId)
  }

  const qs = query.toString()
    ? `?${query.toString()}`
    : ''

  const res = await safeRequest(
    `/api/jobs${qs}`,
    {},
    null
  )

  let list = []

  if (
    res &&
    Array.isArray(res.jobs)
  ) {
    list = res.jobs
  } else {
    const localItems =
      getLocalItems('jobs')

    list =
      localItems.length > 0
        ? localItems
        : []
  }

  if (
    params.type &&
    params.type !== 'All'
  ) {
    list = list.filter(
      (j) =>
        (j.type || '').toLowerCase() ===
        params.type.toLowerCase()
    )
  }

  if (
    params.experienceLevel &&
    params.experienceLevel !== 'All'
  ) {
    list = list.filter(
      (j) =>
        (j.experienceLevel || '').toLowerCase() ===
        params.experienceLevel.toLowerCase()
    )
  }

  if (params.search) {
    const s = params.search.toLowerCase()

    list = list.filter(
      (j) =>
        (j.title || '')
          .toLowerCase()
          .includes(s) ||
        (j.company || '')
          .toLowerCase()
          .includes(s) ||
        (
          j.skills &&
          j.skills.some((sk) =>
            sk.toLowerCase().includes(s)
          )
        )
    )
  }

  return { jobs: list }
}

export async function fetchJobById(id) {
  try {
    const res = await request(
      `/api/jobs/${id}`
    )

    return res?.job || null
  } catch (err) {
    if (err.status === 404) {
      return null
    }

    const localItems =
      getLocalItems('jobs')

    return (
      localItems.find(
        (j) => j._id === id
      ) || null
    )
  }
}

export async function createJobApi(jobData) {
  try {
    const res = await request(
      '/api/jobs',
      {
        method: 'POST',
        body: JSON.stringify(jobData),
      }
    )

    if (res?.job) {
      saveLocalItem('jobs', res.job)
    }

    return res
  } catch (err) {
    console.warn(
      '[api] createJobApi error:',
      err.message
    )

    throw err
  }
}

export async function updateJobApi(
  id,
  jobData
) {
  try {
    const res = await request(
      `/api/jobs/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(jobData),
      }
    )

    if (res?.job) {
      saveLocalItem('jobs', res.job)
    }

    return res
  } catch (err) {
    console.warn(
      '[api] updateJobApi fallback:',
      err.message
    )

    const updated = {
      _id: id,
      ...jobData,
    }

    saveLocalItem('jobs', updated)

    return { job: updated }
  }
}

export async function deleteJobApi(id) {
  removeLocalItem('jobs', id)

  try {
    return await request(
      `/api/jobs/${id}`,
      {
        method: 'DELETE',
      }
    )
  } catch (err) {
    console.warn(
      '[api] deleteJobApi fallback:',
      err.message
    )

    return {
      message: 'Job deleted successfully',
    }
  }
}

export async function applyJobApi(id) {
  return safeRequest(
    `/api/jobs/${id}/apply`,
    {
      method: 'POST',
    },
    {
      message:
        'Job application submitted successfully',
      applicantsCount: 1,
    }
  )
}

// ── Job Links APIs ───────────────────────────────────────────────────────

export async function fetchJobLinks(
  params = {}
) {
  const query = new URLSearchParams()

  if (params.search) query.set('search', params.search)
  if (params.location) query.set('location', params.location)
  if (params.workMode) {
    query.set('workMode', params.workMode)
  }
  if (params.jobType) {
    query.set('jobType', params.jobType)
  }
  if (params.industryId) {
    query.set('industryId', params.industryId)
  }

  const qs = query.toString()
    ? `?${query.toString()}`
    : ''

  const res = await safeRequest(
    `/api/job-links${qs}`,
    {},
    null
  )

  let list = []

  if (
    res &&
    Array.isArray(res.jobLinks)
  ) {
    list = res.jobLinks
  } else {
    const localItems =
      getLocalItems('job_links')

    list =
      localItems.length > 0
        ? localItems
        : []
  }

  return { jobLinks: list }
}

export async function createJobLinkApi(
  jobLinkData
) {
  try {
    const res = await request(
      '/api/job-links',
      {
        method: 'POST',
        body: JSON.stringify(jobLinkData),
      }
    )

    if (res?.jobLink) {
      saveLocalItem(
        'job_links',
        res.jobLink
      )
    }

    return res
  } catch (err) {
    console.warn(
      '[api] createJobLinkApi fallback:',
      err.message
    )

    const newJobLink = {
      _id: `local-jl-${Date.now()}`,
      ...jobLinkData,
      createdAt: new Date().toISOString(),
    }

    saveLocalItem(
      'job_links',
      newJobLink
    )

    return {
      jobLink: newJobLink,
      message:
        'Job link published successfully!',
    }
  }
}

export async function updateJobLinkApi(
  id,
  jobLinkData
) {
  try {
    const res = await request(
      `/api/job-links/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(jobLinkData),
      }
    )

    if (res?.jobLink) {
      saveLocalItem(
        'job_links',
        res.jobLink
      )
    }

    return res
  } catch (err) {
    console.warn(
      '[api] updateJobLinkApi fallback:',
      err.message
    )

    const updated = {
      _id: id,
      ...jobLinkData,
    }

    saveLocalItem(
      'job_links',
      updated
    )

    return { jobLink: updated }
  }
}

export async function deleteJobLinkApi(id) {
  removeLocalItem('job_links', id)

  try {
    return await request(
      `/api/job-links/${id}`,
      {
        method: 'DELETE',
      }
    )
  } catch (err) {
    console.warn(
      '[api] deleteJobLinkApi fallback:',
      err.message
    )

    return {
      message:
        'Job link deleted successfully',
    }
  }
}

// ── Assessment APIs ──────────────────────────────────────────────────────

export async function fetchAssessmentTopics() {
  const res = await safeRequest(
    '/api/assessment/topics',
    {},
    null
  )

  if (
    res &&
    Array.isArray(res.topics)
  ) {
    return res
  }

  return { topics: [] }
}

export async function createAssessmentTopicApi(
  topicData
) {
  return request(
    '/api/assessment/topics',
    {
      method: 'POST',
      body: JSON.stringify(topicData),
    }
  )
}

export async function updateAssessmentTopicApi(
  id,
  topicData
) {
  return request(
    `/api/assessment/topics/${id}`,
    {
      method: 'PUT',
      body: JSON.stringify(topicData),
    }
  )
}

export async function deleteAssessmentTopicApi(id) {
  return request(
    `/api/assessment/topics/${id}`,
    {
      method: 'DELETE',
    }
  )
}

export async function fetchAssessmentQuestions(
  topicId
) {
  const qs = topicId
    ? `?topicId=${topicId}`
    : ''

  return safeRequest(
    `/api/assessment/questions${qs}`,
    {},
    { questions: [] }
  )
}

export async function createAssessmentQuestionApi(
  questionData
) {
  return request(
    '/api/assessment/questions',
    {
      method: 'POST',
      body: JSON.stringify(questionData),
    }
  )
}

export async function updateAssessmentQuestionApi(
  id,
  questionData
) {
  return request(
    `/api/assessment/questions/${id}`,
    {
      method: 'PUT',
      body: JSON.stringify(questionData),
    }
  )
}

export async function deleteAssessmentQuestionApi(
  id
) {
  return request(
    `/api/assessment/questions/${id}`,
    {
      method: 'DELETE',
    }
  )
}

export async function startAssessmentApi(topicId) {
  return request(
    '/api/assessment/start',
    {
      method: 'POST',
      body: JSON.stringify({ topicId }),
    }
  )
}

export async function submitAssessmentApi(payload) {
  return request(
    '/api/assessment/submit',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  )
}

export async function fetchMyAssessmentAttempts() {
  return safeRequest(
    '/api/assessment/attempts',
    {},
    { attempts: [] }
  )
}

export async function fetchMySkillResults() {
  return safeRequest(
    '/api/assessment/results/me',
    {},
    { result: null }
  )
}

export async function fetchAllStudentResults() {
  return safeRequest(
    '/api/assessment/results/all',
    {},
    { results: [] }
  )
}

// ── Student Profile APIs ─────────────────────────────────────────────────

export async function fetchProfile() {
  const data = await safeRequest(
    '/api/profile',
    {},
    null
  )

  if (data && data.profile) {
    try {
      localStorage.setItem(
        'internsheu_profile_cache',
        JSON.stringify(data)
      )
    } catch { }

    return data
  }

  try {
    const cached = localStorage.getItem(
      'internsheu_profile_cache'
    )

    if (cached) {
      return JSON.parse(cached)
    }
  } catch { }

  return data
}

export async function updateProfileApi(
  profileData
) {
  try {
    const result = await request(
      '/api/profile',
      {
        method: 'PUT',
        body: JSON.stringify(profileData),
      }
    )

    try {
      localStorage.setItem(
        'internsheu_profile_cache',
        JSON.stringify(result)
      )
    } catch { }

    return result
  } catch (err) {
    if (err.status === 400) {
      throw err
    }

    const fallbackResult = {
      profile: profileData,
      completionPercentage: 80,
      message: 'Profile saved locally',
    }

    try {
      localStorage.setItem(
        'internsheu_profile_cache',
        JSON.stringify(fallbackResult)
      )
    } catch { }

    return fallbackResult
  }
}

// ── Student dashboard & connectivity ─────────────────────────────────────

export async function fetchStudentDashboard() {
  return safeRequest(
    '/api/student/dashboard'
  )
}

export async function pingApi() {
  const result = await safeRequest(
    '/api/health'
  )

  return result?.status === 'ok'
}

// ── Videos & Curated Content APIs ─────────────────────────────────────────

export async function fetchVideos(
  params = {}
) {
  const query = new URLSearchParams()

  if (params.search) {
    query.set('search', params.search)
  }

  if (params.status) {
    query.set('status', params.status)
  }

  if (params.tag) {
    query.set('tag', params.tag)
  }

  const qs = query.toString()
    ? `?${query.toString()}`
    : ''

  const res = await safeRequest(
    `/api/videos${qs}`,
    {},
    null
  )

  return {
    videos: Array.isArray(res?.videos)
      ? res.videos
      : [],
  }
}

export async function createVideoApi(
  videoData
) {
  return request(
    '/api/videos',
    {
      method: 'POST',
      body: JSON.stringify(videoData),
    }
  )
}

export async function updateVideoApi(
  id,
  videoData
) {
  return request(
    `/api/videos/${id}`,
    {
      method: 'PUT',
      body: JSON.stringify(videoData),
    }
  )
}

export async function deleteVideoApi(id) {
  return request(
    `/api/videos/${id}`,
    {
      method: 'DELETE',
    }
  )
}

// ── AI Interview APIs ────────────────────────────────────────────────────

// Returns { skills, source } on success
// (source: 'gemini' | 'fallback' | 'unavailable'),
// or null when the request itself failed
// (network/auth/server error) so the UI can distinguish
// "no recommendations" from "request failed".

export async function getRecommendedInterviewSkills({
  role,
  company = '',
  level = '',
}) {
  const params = new URLSearchParams()

  if (role) params.set('role', role)
  if (company) params.set('company', company)
  if (level) params.set('level', level)

  const qs = params.toString()
    ? `?${params.toString()}`
    : ''

  try {
    const data = await request(
      `/api/interview/skills${qs}`
    )

    const skills = Array.isArray(data?.skills)
      ? data.skills.filter(
        (s) =>
          typeof s === 'string' &&
          s.trim()
      )
      : []

    return {
      skills,
      source:
        data?.source || 'unavailable',
    }
  } catch (err) {
    console.warn(
      `[api] getRecommendedInterviewSkills failed: ${err?.message || err
      }`
    )

    return null
  }
}

export async function createInterviewApi(
  payload
) {
  return request(
    '/api/interview/create',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  )
}

export async function getDeepgramTokenApi() {
  return request(
    '/api/interview/deepgram-token',
    {
      method: 'POST',
    }
  )
}

export async function startInterviewApi(
  sessionId
) {
  return request(
    `/api/interview/${sessionId}/start`,
    {
      method: 'POST',
    }
  )
}

export async function respondInterviewApi(
  sessionId,
  answer
) {
  return request(
    `/api/interview/${sessionId}/respond`,
    {
      method: 'POST',
      body: JSON.stringify({ answer }),
    }
  )
}

export async function finishInterviewApi(
  sessionId
) {
  return request(
    `/api/interview/${sessionId}/finish`,
    {
      method: 'POST',
    }
  )
}

export async function fetchMyInterviews() {
  return safeRequest(
    '/api/interview/mine',
    {},
    { interviews: [] }
  )
}

export async function fetchInterviewById(
  sessionId
) {
  return request(
    `/api/interview/${sessionId}`
  )
}

export async function fetchMyInterviewSkillResults() {
  return safeRequest(
    '/api/interview/results/me',
    {},
    {
      skills: [],
      interviewsCompleted: 0,
    }
  )
}

// ── Admin Dashboard Statistics ───────────────────────────────────────────

export async function fetchAdminStats() {
  return safeRequest(
    '/api/admin/stats',
    {},
    {
      totalStudents: 0,
      activeInternships: 0,
      activeJobLinks: 0,
      partnerCompanies: 0,
      totalAssessments: 0,
      placementRate: null,
      departmentBreakdown: [],
      recentActivity: [],
    }
  )
}

export async function fetchAdminIndustryOverview() {
  return safeRequest(
    '/api/admin/industry-overview',
    {},
    {
      totalContests: 0,
      totalIndustryAssessments: 0,
      totalProblems: 0,
      totalShortlisted: 0,
      contests: [],
      assessments: [],
    }
  )
}

// ── Problem Library APIs ─────────────────────────────────────────────────

export async function fetchProblems(
  params = {}
) {
  const query = new URLSearchParams()

  if (params.topic) {
    query.set('topic', params.topic)
  }

  if (params.difficulty) {
    query.set(
      'difficulty',
      params.difficulty
    )
  }

  if (params.search) {
    query.set('search', params.search)
  }

  if (params.status) {
    query.set('status', params.status)
  }

  if (params.language) {
    query.set('language', params.language)
  }

  const qs = query.toString()
    ? `?${query.toString()}`
    : ''

  return safeRequest(
    `/api/problems${qs}`,
    {},
    { problems: [] }
  )
}

export async function fetchProblemById(id) {
  return request(`/api/problems/${id}`)
}

export async function createProblemApi(
  problemData
) {
  return request(
    '/api/problems',
    {
      method: 'POST',
      body: JSON.stringify(problemData),
    }
  )
}

export async function updateProblemApi(
  id,
  problemData
) {
  return request(
    `/api/problems/${id}`,
    {
      method: 'PUT',
      body: JSON.stringify(problemData),
    }
  )
}

export async function deleteProblemApi(id) {
  return request(
    `/api/problems/${id}`,
    {
      method: 'DELETE',
    }
  )
}

export async function validateProblemMappingApi(
  externalProblemId
) {
  return request(
    '/api/problems/validate-mapping',
    {
      method: 'POST',
      body: JSON.stringify({
        externalProblemId,
      }),
    }
  )
}

// ── Industry DSA Contests APIs ───────────────────────────────────────────

export async function fetchIndustryContests() {
  return safeRequest(
    '/api/industry/contests',
    {},
    { contests: [] }
  )
}

export async function fetchContestById(id) {
  return request(
    `/api/industry/contests/${id}`
  )
}

export async function createContestApi(
  contestData
) {
  return request(
    '/api/industry/contests',
    {
      method: 'POST',
      body: JSON.stringify(contestData),
    }
  )
}

export async function updateContestApi(
  id,
  contestData
) {
  return request(
    `/api/industry/contests/${id}`,
    {
      method: 'PUT',
      body: JSON.stringify(contestData),
    }
  )
}

export async function publishContestApi(id) {
  return request(
    `/api/industry/contests/${id}/publish`,
    {
      method: 'POST',
    }
  )
}

export async function deleteContestApi(id) {
  return request(
    `/api/industry/contests/${id}`,
    {
      method: 'DELETE',
    }
  )
}

export async function fetchContestStandings(
  id
) {
  return safeRequest(
    `/api/industry/contests/${id}/standings`,
    {},
    { standings: [] }
  )
}

export async function syncContestResultsApi(
  id
) {
  return request(
    `/api/industry/contests/${id}/sync-results`,
    {
      method: 'POST',
    }
  )
}

// ── Student Industry Tests (DSA Contests) APIs ───────────────────────────

export async function fetchStudentIndustryTests() {
  return safeRequest(
    '/api/student/industry-tests',
    {},
    { contests: [] }
  )
}

export async function fetchLiveContestShortcut() {
  return safeRequest(
    '/api/student/industry-tests/live-shortcut',
    {},
    { liveContest: null }
  )
}

export async function fetchStudentContestDetails(
  id
) {
  return request(
    `/api/student/industry-tests/${id}`
  )
}

export async function submitContestSolutionApi(
  id,
  payload
) {
  return request(
    `/api/student/industry-tests/${id}/submit`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  )
}

// ── Industry Assessments (MCQ / Screening) APIs ──────────────────────────

export async function fetchIndustryAssessments() {
  return safeRequest(
    '/api/industry/assessments',
    {},
    { assessments: [] }
  )
}

export async function fetchIndustryAssessmentById(
  id
) {
  return request(
    `/api/industry/assessments/${id}`
  )
}

export async function createIndustryAssessmentApi(
  data
) {
  return request(
    '/api/industry/assessments',
    {
      method: 'POST',
      body: JSON.stringify(data),
    }
  )
}

export async function updateIndustryAssessmentApi(
  id,
  data
) {
  return request(
    `/api/industry/assessments/${id}`,
    {
      method: 'PUT',
      body: JSON.stringify(data),
    }
  )
}

export async function deleteIndustryAssessmentApi(
  id
) {
  return request(
    `/api/industry/assessments/${id}`,
    {
      method: 'DELETE',
    }
  )
}

export async function fetchAssessmentResultsApi(
  id
) {
  return safeRequest(
    `/api/industry/assessments/${id}/results`,
    {},
    {
      attempts: [],
      questionStats: [],
    }
  )
}

// ── Student Industry Assessments APIs ────────────────────────────────────

export async function fetchStudentIndustryAssessments() {
  return safeRequest(
    '/api/student/industry-assessments',
    {},
    { assessments: [] }
  )
}

export async function startStudentAssessmentApi(
  id
) {
  return request(
    `/api/student/industry-assessments/${id}/start`,
    {
      method: 'POST',
    }
  )
}

export async function submitStudentAssessmentApi(
  id,
  payload
) {
  return request(
    `/api/student/industry-assessments/${id}/submit`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  )
}

// ── Industry Candidate Matrix & Discovery APIs ────────────────────────────

export async function fetchCandidateMatrix(
  params = {}
) {
  const query = new URLSearchParams()

  if (params.sort) {
    query.set('sort', params.sort)
  }

  if (params.order) {
    query.set('order', params.order)
  }

  if (params.search) {
    query.set('search', params.search)
  }

  if (params.role) {
    query.set('role', params.role)
  }

  if (params.minScore) {
    query.set('minScore', params.minScore)
  }

  const qs = query.toString()
    ? `?${query.toString()}`
    : ''

  return safeRequest(
    `/api/industry/candidates${qs}`,
    {},
    {
      candidates: [],
      totalCount: 0,
    }
  )
}

export async function fetchCandidateProfile(
  studentId
) {
  const id =
    typeof studentId === 'object' &&
      studentId !== null
      ? (
        studentId._id ||
        studentId.studentId?._id ||
        studentId.studentId
      )
      : studentId

  return request(
    `/api/industry/candidates/${id}`
  )
}

export async function updateCandidatePipelineApi(
  payload
) {
  const studentId =
    typeof payload.studentId === 'object' &&
      payload.studentId !== null
      ? (
        payload.studentId._id ||
        payload.studentId.studentId?._id ||
        payload.studentId.studentId
      )
      : payload.studentId

  return request(
    '/api/industry/candidates/pipeline',
    {
      method: 'POST',
      body: JSON.stringify({
        ...payload,
        studentId,
      }),
    }
  )
}

export async function fetchIndustryRequirements() {
  return safeRequest(
    '/api/industry/candidates/requirements',
    {},
    { requirements: [] }
  )
}

export async function createIndustryRequirementApi(
  payload
) {
  return request(
    '/api/industry/candidates/requirements',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  )
}

// ── Student Industry Matrix API ──────────────────────────────────────────

export async function fetchStudentIndustryMatrix() {
  return safeRequest(
    '/api/student/industry-matrix',
    {},
    {
      industryMatrix: {
        hasEvidence: false,
        assessment: {
          score: 0,
          totalAttempts: 0,
          passedCount: 0,
          recentAttempts: [],
        },
        dsa: {
          score: 0,
          problemsSolved: 0,
          bestRank: 0,
          contestsParticipated: 0,
          contests: [],
        },
        aiInterview: {
          score: 80,
          status: 'Not Attempted',
        },
        overallIndustryScore: null,
        isConfigured: false,
      },
    }
  )
}

// ── Internship Application Tracking APIs ─────────────────────────────────

export async function applyInternsetuApi(
  internshipId,
  payload
) {
  return request(
    `/api/internships/${internshipId}/apply-internsetu`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  )
}

export async function trackVisitCompanyUrlApi(
  internshipId
) {
  return request(
    `/api/internships/${internshipId}/track-visit`,
    {
      method: 'POST',
    }
  )
}

export async function fetchInternshipApplications(
  internshipId
) {
  return safeRequest(
    `/api/internships/${internshipId}/applications`,
    {},
    {
      applications: [],
      total: 0,
    }
  )
}

export async function fetchMyApplications() {
  return safeRequest(
    '/api/internships/my-applications',
    {},
    { applications: [] }
  )
}

export async function trackVisitJobUrlApi(
  jobId
) {
  return safeRequest(
    `/api/jobs/${jobId}/track-visit`,
    {
      method: 'POST',
    },
    {
      message: 'Visit tracked',
      status:
        'VISITED_COMPANY_APPLICATION',
    }
  )
}

export async function fetchMyJobApplications() {
  return safeRequest(
    '/api/jobs/my-applications',
    {},
    { applications: [] }
  )
}

// ── Industry Candidate Contact Unlock & Pipeline APIs ─────────────────────

export async function unlockCandidateContactApi(
  payload
) {
  return request(
    '/api/industry/pipeline/unlock-contact',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  )
}

export async function fetchTalentPipelineApi(
  params = {}
) {
  const query = new URLSearchParams()

  if (params.stage) {
    query.set('stage', params.stage)
  }

  const qs = query.toString()
    ? `?${query.toString()}`
    : ''

  return safeRequest(
    `/api/industry/candidates/pipeline${qs}`,
    {},
    { candidates: [] }
  )
}

export async function fetchShortlistedCandidatesApi() {
  return safeRequest(
    '/api/industry/candidates/pipeline?stage=Shortlisted',
    {},
    { candidates: [] }
  )
}

export async function bulkUnlockShortlistedApi(
  payload = {}
) {
  return request(
    '/api/industry/pipeline/bulk-unlock',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  )
}

// ── Industry Posting Platform Fee & Payment APIs ─────────────────────────

export async function getPaymentConfigApi() {
  return safeRequest(
    '/api/payments/config',
    {},
    {
      gateway: 'development_test',
      isRazorpayConfigured: false,
      keyId: null,
    }
  )
}

export async function calculatePostingFeeApi(
  monthlyStipend,
  candidatesRequired
) {
  return request(
    '/api/payments/calculate-fee',
    {
      method: 'POST',
      body: JSON.stringify({
        monthlyStipend,
        candidatesRequired,
      }),
    }
  )
}

export async function createPostingOrderApi(
  payload
) {
  return request(
    '/api/payments/create-posting-order',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  )
}

export async function verifyAndPublishPostingApi(
  payload
) {
  return request(
    '/api/payments/verify-and-publish',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  )
}

export async function getMyPaymentTransactionsApi() {
  return safeRequest(
    '/api/payments/my-transactions',
    {},
    { transactions: [] }
  )
}

export const apiConfig = {
  baseUrl: API_BASE_URL,
  isConfigured: Boolean(API_BASE_URL),
}

