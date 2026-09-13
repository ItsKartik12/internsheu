// ────────────────────────────────────────────────────────────────────────
// API service utility — talks to the Express backend in /backend or Vercel serverless.
// Supports JWT authorization headers, fallback to seed data, and full CRUD.
// ────────────────────────────────────────────────────────────────────────

import {
  FALLBACK_JOBS,
  FALLBACK_INTERNSHIPS,
  FALLBACK_COURSES,
  FALLBACK_TOPICS,
} from '../data/fallbackData'

const DEFAULT_API_BASE_URL = import.meta.env.DEV ? 'http://localhost:5000' : ''

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL !== undefined
  ? import.meta.env.VITE_API_BASE_URL
  : DEFAULT_API_BASE_URL

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
    // If backend is unreachable or in demo mode, provide local authentication fallback
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

  const res = await safeRequest(`/api/courses${qs}`, {}, { courses: [] })
  if (!res?.courses || res.courses.length === 0) {
    let list = [...FALLBACK_COURSES]
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
  return res
}

export async function fetchCourseById(id) {
  try {
    return await request(`/api/courses/${id}`)
  } catch {
    const found = FALLBACK_COURSES.find((c) => c._id === id)
    return { course: found || FALLBACK_COURSES[0] }
  }
}

export async function createCourseApi(courseData) {
  return request('/api/courses', {
    method: 'POST',
    body: JSON.stringify(courseData),
  })
}

export async function updateCourseApi(id, courseData) {
  return request(`/api/courses/${id}`, {
    method: 'PUT',
    body: JSON.stringify(courseData),
  })
}

export async function deleteCourseApi(id) {
  return request(`/api/courses/${id}`, {
    method: 'DELETE',
  })
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

  const res = await safeRequest(`/api/internships${qs}`, {}, { internships: [] })
  if (!res?.internships || res.internships.length === 0) {
    let list = [...FALLBACK_INTERNSHIPS]
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
  return res
}

export async function createInternshipApi(internshipData) {
  return request('/api/internships', {
    method: 'POST',
    body: JSON.stringify(internshipData),
  })
}

export async function updateInternshipApi(id, internshipData) {
  return request(`/api/internships/${id}`, {
    method: 'PUT',
    body: JSON.stringify(internshipData),
  })
}

export async function deleteInternshipApi(id) {
  return request(`/api/internships/${id}`, {
    method: 'DELETE',
  })
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

  const res = await safeRequest(`/api/jobs${qs}`, {}, { jobs: [] })
  if (!res?.jobs || res.jobs.length === 0) {
    let list = [...FALLBACK_JOBS]
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
  return res
}

export async function createJobApi(jobData) {
  return request('/api/jobs', {
    method: 'POST',
    body: JSON.stringify(jobData),
  })
}

export async function updateJobApi(id, jobData) {
  return request(`/api/jobs/${id}`, {
    method: 'PUT',
    body: JSON.stringify(jobData),
  })
}

export async function deleteJobApi(id) {
  return request(`/api/jobs/${id}`, {
    method: 'DELETE',
  })
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
  const res = await safeRequest('/api/assessment/topics', {}, { topics: [] })
  if (!res?.topics || res.topics.length === 0) {
    return { topics: FALLBACK_TOPICS }
  }
  return res
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
