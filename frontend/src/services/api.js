// ────────────────────────────────────────────────────────────────────────
// API service utility — talks to the Express backend in /backend.
//
// Every function here is safe to call even if the backend isn't running:
// on any network failure or non-2xx response it logs a warning and
// resolves to `null` instead of throwing, so calling components can fall
// back to the local mock data in `src/data/mockDatabase.js` and the demo
// keeps working with zero backend setup.
// ────────────────────────────────────────────────────────────────────────

// Your deployed Render backend. Used whenever VITE_API_BASE_URL isn't set
// (e.g. you forgot to add it in Vercel's dashboard) so production still
// points at the right place by default. Override it via VITE_API_BASE_URL
// if you ever move the backend to a different host.
console.log("Current API URL:", import.meta.env.VITE_API_BASE_URL);
const DEFAULT_API_BASE_URL = 'https://internsheu.onrender.com'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL

async function request(path, options = {}) {
  if (!API_BASE_URL) {
    throw new Error('VITE_API_BASE_URL is not set — skipping network call')
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })

  if (!response.ok) {
    throw new Error(`API request to ${path} failed with status ${response.status}`)
  }

  return response.json()
}

// Wraps `request` so every service function shares the same
// warn-and-fall-back-to-null behavior instead of repeating try/catch.
async function safeRequest(path, options) {
  try {
    return await request(path, options)
  } catch (err) {
    console.warn(`[api] ${err.message}. Falling back to local mock data.`)
    return null
  }
}

/**
 * Fetches the logged-in student's dashboard payload — profile, skills, and
 * matched opportunities — from GET /api/student/dashboard.
 *
 * @returns {Promise<{ student: object, matchedOpportunities: object[] } | null>}
 *   `null` when the backend is unreachable; callers should fall back to
 *   `getStudentById` / `getMatchedOpportunities` from mockDatabase.js.
 */
export async function fetchStudentDashboard() {
  return safeRequest('/api/student/dashboard')
}

/**
 * Basic connectivity check against GET /api/health. Useful for a "backend
 * connected" indicator in the UI without committing to a specific route.
 *
 * @returns {Promise<boolean>}
 */
export async function pingApi() {
  const result = await safeRequest('/api/health')
  return result?.status === 'ok'
}

export const apiConfig = {
  baseUrl: API_BASE_URL,
  isConfigured: Boolean(API_BASE_URL),
}
