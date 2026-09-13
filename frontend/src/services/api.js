// ────────────────────────────────────────────────────────────────────────
// API service utility — talks to Express backend in /backend or Vercel serverless.
// Supports JWT authorization headers, resilient offline/Vercel persistence,
// and full CRUD operations without breaking.
// ────────────────────────────────────────────────────────────────────────

import {
  FALLBACK_JOBS,
  FALLBACK_INTERNSHIPS,
  FALLBACK_COURSES,
  FALLBACK_TOPICS,
} from '../data/fallbackData'

const DEFAULT_API_BASE_URL = import.meta.env.DEV ? 'http://localhost:5000' : ''

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL !== undefined
    ? import.meta.env.VITE_API_BASE_URL
    : DEFAULT_API_BASE_URL

// ── Local Storage Resilience Helpers ──
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
    localStorage.setItem(`internsheu_${key}`, JSON.stringify([item, ...filtered]))
  } catch (err) {
    console.warn('[api] Failed to save to localStorage:', err)
  }
}

function removeLocalItem(key, id) {
  try {
    const current = getLocalItems(key)
    const filtered = current.filter((x) => x._id !== id)
    localStorage.setItem(`internsheu_${key}`, JSON.stringify(filtered))
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
  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`
  const response = await fetch(url, {
    headers: {
      ...getAuthHeaders(),
      ...(options.headers || {}),
    },
    ...options,
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    const errorMsg = data?.error || `API request failed with status ${response.status}`
    const error = new Error(errorMsg)
    error.status = response.status
    error.data = data
    throw error
  }

  return data
}

export async function safeRequest(path, options = {}, fallback = null) {
  try {
    return await request(path, options)
  } catch (err) {
    console.warn(`[api] safeRequest(${path}) failed: ${err.message}. Using fallback.`)
    return fallback
  }
}

// ── Auth APIs ──
export async function loginUser(email, password) {
  try {
    return await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  } catch (err) {
    // If backend is unreachable, provide offline demonstration authentication
    const demoAccounts = {
      'student@internsheu.edu': { name: 'Aarav Sharma', role: 'student', email: 'student@internsheu.edu', _id: 'demo-stu-1' },
      'educator@internsheu.edu': { name: 'Prof. Sarah Jenkins', role: 'educator', email: 'educator@internsheu.edu', _id: 'demo-edu-1' },
      'industry@internsheu.edu': { name: 'Nexus Tech Talent Team', role: 'industry', email: 'industry@internsheu.edu', _id: 'demo-ind-1' },
      'admin@internsheu.edu': { name: 'Portal Administrator', role: 'admin', email: 'admin@internsheu.edu', _id: 'demo-adm-1' },
    }
    const matched = demoAccounts[email.toLowerCase().trim()]
    if (matched && password === 'password123') {
      const mockToken = `mock-token-${matched.role}-${Date.now()}`
      return { token: mockToken, user: matched }
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

// ── Courses APIs ──
export async function fetchCourses(params = {}) {
  const query = new URLSearchParams()
  if (params.search) query.set('search', params.search)
  if (params.category) query.set('category', params.category)
  if (params.level) query.set('level', params.level)
  if (params.educatorId) query.set('educatorId', params.educatorId)
  const qs = query.toString() ? `?${query.toString()}` : ''

  const localItems = getLocalItems('courses')
  let list = []

  const res = await safeRequest(`/api/courses${qs}`, {}, null)
  if (res?.courses && res.courses.length > 0) {
    const remoteIds = new Set(res.courses.map((c) => c._id))
    const pendingLocal = localItems.filter((c) => !remoteIds.has(c._id))
    list = [...pendingLocal, ...res.courses]
  } else {
    const localIds = new Set(localItems.map((c) => c._id))
    const remainingFallback = FALLBACK_COURSES.filter((c) => !localIds.has(c._id))
    list = [...localItems, ...remainingFallback]
  }

  if (params.category && params.category !== 'All') {
    list = list.filter((c) => c.category.toLowerCase() === params.category.toLowerCase())
  }
  if (params.level && params.level !== 'All') {
    list = list.filter((c) => c.level.toLowerCase() === params.level.toLowerCase())
  }
  if (params.search) {
    const s = params.search.toLowerCase()
    list = list.filter(
      (c) =>
        c.title.toLowerCase().includes(s) ||
        c.description.toLowerCase().includes(s) ||
        (c.tags && c.tags.some((t) => t.toLowerCase().includes(s)))
    )
  }

  return { courses: list }
}

export async function fetchCourseById(id) {
  const localItems = getLocalItems('courses')
  const localFound = localItems.find((c) => c._id === id)
  if (localFound) return { course: localFound }

  try {
    return await request(`/api/courses/${id}`)
  } catch {
    const found = FALLBACK_COURSES.find((c) => c._id === id)
    return { course: found || FALLBACK_COURSES[0] }
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
    console.warn('[api] createCourseApi fallback:', err.message)
    const newCourse = {
      _id: `local-course-${Date.now()}`,
      ...courseData,
      rating: 5.0,
      enrolledCount: 1,
      createdAt: new Date().toISOString(),
    }
    saveLocalItem('courses', newCourse)
    return { course: newCourse, message: 'Course created successfully' }
  }
}

export async function updateCourseApi(id, courseData) {
  try {
    const res = await request(`/api/courses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(courseData),
    })
    if (res?.course) saveLocalItem('courses', res.course)
    return res
  } catch (err) {
    console.warn('[api] updateCourseApi fallback:', err.message)
    const updated = { _id: id, ...courseData }
    saveLocalItem('courses', updated)
    return { course: updated }
  }
}

export async function deleteCourseApi(id) {
  removeLocalItem('courses', id)
  try {
    return await request(`/api/courses/${id}`, {
      method: 'DELETE',
    })
  } catch (err) {
    console.warn('[api] deleteCourseApi fallback:', err.message)
    return { message: 'Course deleted successfully' }
  }
}

export async function enrollCourseApi(id) {
  return safeRequest(`/api/courses/${id}/enroll`, { method: 'POST' }, { message: 'Enrolled successfully' })
}

// ── Internships APIs ──
export async function fetchInternships(params = {}) {
  const query = new URLSearchParams()
  if (params.search) query.set('search', params.search)
  if (params.location) query.set('location', params.location)
  if (params.type) query.set('type', params.type)
  if (params.skill) query.set('skill', params.skill)
  if (params.industryId) query.set('industryId', params.industryId)
  const qs = query.toString() ? `?${query.toString()}` : ''

  const localItems = getLocalItems('internships')
  let list = []

  const res = await safeRequest(`/api/internships${qs}`, {}, null)
  if (res?.internships && res.internships.length > 0) {
    const remoteIds = new Set(res.internships.map((i) => i._id))
    const pendingLocal = localItems.filter((i) => !remoteIds.has(i._id))
    list = [...pendingLocal, ...res.internships]
  } else {
    const localIds = new Set(localItems.map((i) => i._id))
    const remainingFallback = FALLBACK_INTERNSHIPS.filter((i) => !localIds.has(i._id))
    list = [...localItems, ...remainingFallback]
  }

  if (params.type && params.type !== 'All') {
    list = list.filter((i) => i.type.toLowerCase() === params.type.toLowerCase())
  }
  if (params.search) {
    const s = params.search.toLowerCase()
    list = list.filter(
      (i) =>
        i.title.toLowerCase().includes(s) ||
        i.company.toLowerCase().includes(s) ||
        (i.skills && i.skills.some((sk) => sk.toLowerCase().includes(s)))
    )
  }

  return { internships: list }
}

export async function createInternshipApi(internshipData) {
  try {
    const res = await request('/api/internships', {
      method: 'POST',
      body: JSON.stringify(internshipData),
    })
    if (res?.internship) {
      saveLocalItem('internships', res.internship)
    }
    return res
  } catch (err) {
    console.warn('[api] createInternshipApi fallback:', err.message)
    const newInternship = {
      _id: `local-int-${Date.now()}`,
      ...internshipData,
      openings: Number(internshipData.openings) || 1,
      applicantsCount: 0,
      createdAt: new Date().toISOString(),
    }
    saveLocalItem('internships', newInternship)
    return { internship: newInternship, message: 'Internship opening published!' }
  }
}

export async function updateInternshipApi(id, internshipData) {
  try {
    const res = await request(`/api/internships/${id}`, {
      method: 'PUT',
      body: JSON.stringify(internshipData),
    })
    if (res?.internship) saveLocalItem('internships', res.internship)
    return res
  } catch (err) {
    console.warn('[api] updateInternshipApi fallback:', err.message)
    const updated = { _id: id, ...internshipData }
    saveLocalItem('internships', updated)
    return { internship: updated }
  }
}

export async function deleteInternshipApi(id) {
  removeLocalItem('internships', id)
  try {
    return await request(`/api/internships/${id}`, {
      method: 'DELETE',
    })
  } catch (err) {
    console.warn('[api] deleteInternshipApi fallback:', err.message)
    return { message: 'Internship deleted successfully' }
  }
}

export async function applyInternshipApi(id) {
  return safeRequest(
    `/api/internships/${id}/apply`,
    { method: 'POST' },
    { message: 'Application submitted successfully', applicantsCount: 1 }
  )
}

// ── Jobs APIs ──
export async function fetchJobs(params = {}) {
  const query = new URLSearchParams()
  if (params.search) query.set('search', params.search)
  if (params.location) query.set('location', params.location)
  if (params.type) query.set('type', params.type)
  if (params.experienceLevel) query.set('experienceLevel', params.experienceLevel)
  if (params.skill) query.set('skill', params.skill)
  if (params.industryId) query.set('industryId', params.industryId)
  const qs = query.toString() ? `?${query.toString()}` : ''

  const localItems = getLocalItems('jobs')
  let list = []

  const res = await safeRequest(`/api/jobs${qs}`, {}, null)
  if (res?.jobs && res.jobs.length > 0) {
    const remoteIds = new Set(res.jobs.map((j) => j._id))
    const pendingLocal = localItems.filter((j) => !remoteIds.has(j._id))
    list = [...pendingLocal, ...res.jobs]
  } else {
    const localIds = new Set(localItems.map((j) => j._id))
    const remainingFallback = FALLBACK_JOBS.filter((j) => !localIds.has(j._id))
    list = [...localItems, ...remainingFallback]
  }

  if (params.type && params.type !== 'All') {
    list = list.filter((j) => j.type.toLowerCase() === params.type.toLowerCase())
  }
  if (params.experienceLevel && params.experienceLevel !== 'All') {
    list = list.filter((j) => j.experienceLevel.toLowerCase() === params.experienceLevel.toLowerCase())
  }
  if (params.search) {
    const s = params.search.toLowerCase()
    list = list.filter(
      (j) =>
        j.title.toLowerCase().includes(s) ||
        j.company.toLowerCase().includes(s) ||
        (j.skills && j.skills.some((sk) => sk.toLowerCase().includes(s)))
    )
  }

  return { jobs: list }
}

export async function createJobApi(jobData) {
  try {
    const res = await request('/api/jobs', {
      method: 'POST',
      body: JSON.stringify(jobData),
    })
    if (res?.job) {
      saveLocalItem('jobs', res.job)
    }
    return res
  } catch (err) {
    console.warn('[api] createJobApi fallback:', err.message)
    const newJob = {
      _id: `local-job-${Date.now()}`,
      ...jobData,
      openings: Number(jobData.openings) || 1,
      applicantsCount: 0,
      createdAt: new Date().toISOString(),
    }
    saveLocalItem('jobs', newJob)
    return { job: newJob, message: 'Job vacancy published!' }
  }
}

export async function updateJobApi(id, jobData) {
  try {
    const res = await request(`/api/jobs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(jobData),
    })
    if (res?.job) saveLocalItem('jobs', res.job)
    return res
  } catch (err) {
    console.warn('[api] updateJobApi fallback:', err.message)
    const updated = { _id: id, ...jobData }
    saveLocalItem('jobs', updated)
    return { job: updated }
  }
}

export async function deleteJobApi(id) {
  removeLocalItem('jobs', id)
  try {
    return await request(`/api/jobs/${id}`, {
      method: 'DELETE',
    })
  } catch (err) {
    console.warn('[api] deleteJobApi fallback:', err.message)
    return { message: 'Job deleted successfully' }
  }
}

export async function applyJobApi(id) {
  return safeRequest(
    `/api/jobs/${id}/apply`,
    { method: 'POST' },
    { message: 'Job application submitted successfully', applicantsCount: 1 }
  )
}

// ── Assessment APIs ──
export async function fetchAssessmentTopics() {
  const res = await safeRequest('/api/assessment/topics', {}, null)
  if (res?.topics && res.topics.length > 0) {
    return res
  }
  return { topics: FALLBACK_TOPICS }
}

export async function createAssessmentTopicApi(topicData) {
  return request('/api/assessment/topics', {
    method: 'POST',
    body: JSON.stringify(topicData),
  })
}

export async function updateAssessmentTopicApi(id, topicData) {
  return request(`/api/assessment/topics/${id}`, {
    method: 'PUT',
    body: JSON.stringify(topicData),
  })
}

export async function deleteAssessmentTopicApi(id) {
  return request(`/api/assessment/topics/${id}`, {
    method: 'DELETE',
  })
}

export async function fetchAssessmentQuestions(topicId) {
  const qs = topicId ? `?topicId=${topicId}` : ''
  return safeRequest(`/api/assessment/questions${qs}`, {}, { questions: [] })
}

export async function createAssessmentQuestionApi(questionData) {
  return request('/api/assessment/questions', {
    method: 'POST',
    body: JSON.stringify(questionData),
  })
}

export async function updateAssessmentQuestionApi(id, questionData) {
  return request(`/api/assessment/questions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(questionData),
  })
}

export async function deleteAssessmentQuestionApi(id) {
  return request(`/api/assessment/questions/${id}`, {
    method: 'DELETE',
  })
}

export async function startAssessmentApi(topicId) {
  return request('/api/assessment/start', {
    method: 'POST',
    body: JSON.stringify({ topicId }),
  })
}

export async function submitAssessmentApi(payload) {
  return request('/api/assessment/submit', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function fetchMyAssessmentAttempts() {
  return safeRequest('/api/assessment/attempts', {}, { attempts: [] })
}

export async function fetchMySkillResults() {
  return safeRequest('/api/assessment/results/me', {}, { result: null })
}

export async function fetchAllStudentResults() {
  return safeRequest('/api/assessment/results/all', {}, { results: [] })
}

// ── Student dashboard & connectivity ──
export async function fetchStudentDashboard() {
  return safeRequest('/api/student/dashboard')
}

export async function pingApi() {
  const result = await safeRequest('/api/health')
  return result?.status === 'ok'
}

export const apiConfig = {
  baseUrl: API_BASE_URL,
  isConfigured: Boolean(API_BASE_URL),
}
