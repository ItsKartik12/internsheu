// ────────────────────────────────────────────────────────────────────────
// API service utility — talks to the Express backend in /backend.
// Supports JWT authorization headers, fallback to mock data, and full CRUD.
// ────────────────────────────────────────────────────────────────────────

const DEFAULT_API_BASE_URL = import.meta.env.DEV
  ? 'http://localhost:5000'
  : 'https://internsheu.onrender.com'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL

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
  return request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
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
  return safeRequest(`/api/courses${qs}`, {}, { courses: [] })
}

export async function fetchCourseById(id) {
  return request(`/api/courses/${id}`)
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
  return request(`/api/courses/${id}/enroll`, {
    method: 'POST',
  })
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
  return safeRequest(`/api/internships${qs}`, {}, { internships: [] })
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
  return request(`/api/internships/${id}/apply`, {
    method: 'POST',
  })
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
  return safeRequest(`/api/jobs${qs}`, {}, { jobs: [] })
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
  return request(`/api/jobs/${id}/apply`, {
    method: 'POST',
  })
}

// ── Assessment APIs ──
export async function fetchAssessmentTopics() {
  return safeRequest('/api/assessment/topics', {}, { topics: [] })
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
