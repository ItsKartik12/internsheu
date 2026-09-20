/**
 * offlineDb.js
 * 
 * Production-grade native IndexedDB storage for InternSetu Offline Sync.
 * Zero external database dependencies.
 * 
 * Database: InternSetuOfflineDB (v2)
 * Stores:
 *   - profile: Local profile state per userId (keyPath: 'userId')
 *   - syncQueue: Persistent queue of synchronization operations (keyPath: 'operationId')
 *   - dashboard: Cached student dashboard data per userId (keyPath: 'userId')
 *   - internships: Cached internships list (keyPath: 'id')
 *   - assessmentQuestions: Cached topics & questions (keyPath: 'topicId')
 *   - assessmentAttempts: Local in-progress & offline attempts (keyPath: 'attemptKey')
 *   - assessmentResults: Cached student skill results & attempts (keyPath: 'userId')
 */

const DB_NAME = 'InternSetuOfflineDB'
const DB_VERSION = 3

const STORE_PROFILE = 'profile'
const STORE_SYNC_QUEUE = 'syncQueue'
const STORE_DASHBOARD = 'dashboard'
const STORE_INTERNSHIPS = 'internships'
const STORE_ASSESSMENT_QUESTIONS = 'assessmentQuestions'
const STORE_ASSESSMENT_ATTEMPTS = 'assessmentAttempts'
const STORE_ASSESSMENT_RESULTS = 'assessmentResults'
const STORE_VERIFIED_COURSES = 'verifiedCourses'
const STORE_CAREER_JOBS = 'careerJobs'
const STORE_INDUSTRY_TESTS = 'industryTests'
const STORE_INDUSTRY_ASSESSMENTS = 'industryAssessments'
const STORE_INDUSTRY_MATRIX = 'industryMatrix'
const STORE_AI_INTERVIEW = 'aiInterview'
const STORE_LEARNING_CENTER = 'learningCenter'
const STORE_APPLICATIONS = 'applications'

let dbPromise = null

/**
 * Open or upgrade the IndexedDB database.
 * Returns a Promise that resolves with the IDBDatabase instance.
 */
export function openDb() {
  if (dbPromise) return dbPromise

  dbPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      console.warn('[OfflineSync] IndexedDB is not available in this environment')
      return resolve(null)
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = (event) => {
      const db = event.target.result

      // 1. Profile Store: stores latest profile snapshot for the user
      if (!db.objectStoreNames.contains(STORE_PROFILE)) {
        db.createObjectStore(STORE_PROFILE, { keyPath: 'userId' })
      }

      // 2. Sync Queue Store: stores pending/syncing/completed/failed operations
      if (!db.objectStoreNames.contains(STORE_SYNC_QUEUE)) {
        const queueStore = db.createObjectStore(STORE_SYNC_QUEUE, { keyPath: 'operationId' })
        queueStore.createIndex('status', 'status', { unique: false })
        queueStore.createIndex('userId', 'userId', { unique: false })
        queueStore.createIndex('createdAt', 'createdAt', { unique: false })
      }

      // 3. Dashboard Store: stores student dashboard data per userId
      if (!db.objectStoreNames.contains(STORE_DASHBOARD)) {
        db.createObjectStore(STORE_DASHBOARD, { keyPath: 'userId' })
      }

      // 4. Internships Store: stores internships list
      if (!db.objectStoreNames.contains(STORE_INTERNSHIPS)) {
        db.createObjectStore(STORE_INTERNSHIPS, { keyPath: 'id' })
      }

      // 5. Assessment Questions Store: stores questions per topicId
      if (!db.objectStoreNames.contains(STORE_ASSESSMENT_QUESTIONS)) {
        db.createObjectStore(STORE_ASSESSMENT_QUESTIONS, { keyPath: 'topicId' })
      }

      // 6. Assessment Attempts Store: stores in-progress and submitted offline attempts
      if (!db.objectStoreNames.contains(STORE_ASSESSMENT_ATTEMPTS)) {
        const attemptStore = db.createObjectStore(STORE_ASSESSMENT_ATTEMPTS, { keyPath: 'attemptKey' })
        attemptStore.createIndex('status', 'status', { unique: false })
        attemptStore.createIndex('userId', 'userId', { unique: false })
      }

      // 7. Assessment Results Store: stores evaluated skill matrix and attempts per userId
      if (!db.objectStoreNames.contains(STORE_ASSESSMENT_RESULTS)) {
        db.createObjectStore(STORE_ASSESSMENT_RESULTS, { keyPath: 'userId' })
      }

      // 8. Verified Courses Store: stores course catalog
      if (!db.objectStoreNames.contains(STORE_VERIFIED_COURSES)) {
        db.createObjectStore(STORE_VERIFIED_COURSES, { keyPath: 'id' })
      }

      // 9. Career Jobs Store: stores jobs list
      if (!db.objectStoreNames.contains(STORE_CAREER_JOBS)) {
        db.createObjectStore(STORE_CAREER_JOBS, { keyPath: 'id' })
      }

      // 10. Industry Tests Store: stores contests, problem details and code drafts
      if (!db.objectStoreNames.contains(STORE_INDUSTRY_TESTS)) {
        db.createObjectStore(STORE_INDUSTRY_TESTS, { keyPath: 'id' })
      }

      // 11. Industry Assessments Store: stores assessment metadata, questions and drafts
      if (!db.objectStoreNames.contains(STORE_INDUSTRY_ASSESSMENTS)) {
        db.createObjectStore(STORE_INDUSTRY_ASSESSMENTS, { keyPath: 'id' })
      }

      // 12. Industry Matrix Store: stores candidate recruitment screening matrix per userId
      if (!db.objectStoreNames.contains(STORE_INDUSTRY_MATRIX)) {
        db.createObjectStore(STORE_INDUSTRY_MATRIX, { keyPath: 'userId' })
      }

      // 13. AI Interview Store: stores past interview sessions per userId
      if (!db.objectStoreNames.contains(STORE_AI_INTERVIEW)) {
        db.createObjectStore(STORE_AI_INTERVIEW, { keyPath: 'userId' })
      }

      // 14. Learning Center Store: stores video learning modules
      if (!db.objectStoreNames.contains(STORE_LEARNING_CENTER)) {
        db.createObjectStore(STORE_LEARNING_CENTER, { keyPath: 'id' })
      }

      // 15. Student Applications Store: stores applied internships and jobs per userId
      if (!db.objectStoreNames.contains(STORE_APPLICATIONS)) {
        db.createObjectStore(STORE_APPLICATIONS, { keyPath: 'userId' })
      }
    }

    request.onsuccess = (event) => {
      const db = event.target.result
      // Reset dbPromise on unexpected close
      db.onclose = () => {
        dbPromise = null
      }
      resolve(db)
    }

    request.onerror = (event) => {
      console.error('[OfflineSync] Failed to open IndexedDB:', event.target.error)
      dbPromise = null
      reject(event.target.error)
    }
  })

  return dbPromise
}

// ── Profile Store Operations (Preserved) ───────────────────────────────────

export async function getLocalProfile(userId) {
  if (!userId) return null
  const db = await openDb()
  if (!db) return null

  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(STORE_PROFILE, 'readonly')
      const store = tx.objectStore(STORE_PROFILE)
      const req = store.get(String(userId))

      req.onsuccess = () => resolve(req.result || null)
      req.onerror = () => reject(req.error)
    } catch (err) {
      reject(err)
    }
  })
}

export async function saveLocalProfile(userId, profile, isPendingSync = false, completionPercentage = 0) {
  if (!userId) return null
  const db = await openDb()
  if (!db) return null

  const record = {
    userId: String(userId),
    profile,
    completionPercentage: Number(completionPercentage) || 0,
    isPendingSync: Boolean(isPendingSync),
    updatedAt: Date.now(),
  }

  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(STORE_PROFILE, 'readwrite')
      const store = tx.objectStore(STORE_PROFILE)
      const req = store.put(record)

      req.onsuccess = () => {
        console.log(`[OfflineSync] Profile saved locally in IndexedDB for user: ${userId} (isPendingSync: ${isPendingSync})`)
        resolve(record)
      }
      req.onerror = () => reject(req.error)
    } catch (err) {
      reject(err)
    }
  })
}

export async function clearLocalProfile(userId) {
  if (!userId) return
  const db = await openDb()
  if (!db) return

  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(STORE_PROFILE, 'readwrite')
      const store = tx.objectStore(STORE_PROFILE)
      const req = store.delete(String(userId))
      req.onsuccess = () => resolve()
      req.onerror = () => reject(req.error)
    } catch (err) {
      reject(err)
    }
  })
}

// ── Sync Queue Operations (Preserved & Enhanced) ───────────────────────────

export async function addToSyncQueue(userId, type = 'UPDATE_PROFILE', payload = {}) {
  if (!userId) throw new Error('userId is required to queue operation')
  const db = await openDb()
  if (!db) throw new Error('IndexedDB unavailable')

  const operationId = `op_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`

  const queueItem = {
    operationId,
    type,
    userId: String(userId),
    payload,
    status: 'pending', // 'pending' | 'syncing' | 'completed' | 'failed'
    retryCount: 0,
    error: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }

  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(STORE_SYNC_QUEUE, 'readwrite')
      const store = tx.objectStore(STORE_SYNC_QUEUE)
      const req = store.add(queueItem)

      req.onsuccess = () => {
        console.log(`[OfflineSync] Operation queued: ${type} (ID: ${operationId})`)
        resolve(queueItem)
      }
      req.onerror = () => reject(req.error)
    } catch (err) {
      reject(err)
    }
  })
}

export async function getPendingOperations(userId = null) {
  const db = await openDb()
  if (!db) return []

  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(STORE_SYNC_QUEUE, 'readonly')
      const store = tx.objectStore(STORE_SYNC_QUEUE)
      const req = store.getAll()

      req.onsuccess = () => {
        const all = req.result || []
        const filtered = all.filter((item) => {
          const matchUser = !userId || item.userId === String(userId)
          const isPending = item.status === 'pending' || item.status === 'failed'
          return matchUser && isPending
        })
        filtered.sort((a, b) => a.createdAt - b.createdAt)
        resolve(filtered)
      }
      req.onerror = () => reject(req.error)
    } catch (err) {
      reject(err)
    }
  })
}

export async function updateQueueItem(operationId, updates = {}) {
  const db = await openDb()
  if (!db) return null

  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(STORE_SYNC_QUEUE, 'readwrite')
      const store = tx.objectStore(STORE_SYNC_QUEUE)
      const getReq = store.get(operationId)

      getReq.onsuccess = () => {
        const item = getReq.result
        if (!item) {
          return resolve(null)
        }

        const updatedItem = {
          ...item,
          ...updates,
          updatedAt: Date.now(),
        }

        const putReq = store.put(updatedItem)
        putReq.onsuccess = () => resolve(updatedItem)
        putReq.onerror = () => reject(putReq.error)
      }
      getReq.onerror = () => reject(getReq.error)
    } catch (err) {
      reject(err)
    }
  })
}

export async function hasPendingSync(userId) {
  if (!userId) return false
  const pending = await getPendingOperations(userId)
  return pending.length > 0
}

export async function getAllQueueItems(userId = null) {
  const db = await openDb()
  if (!db) return []

  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(STORE_SYNC_QUEUE, 'readonly')
      const store = tx.objectStore(STORE_SYNC_QUEUE)
      const req = store.getAll()

      req.onsuccess = () => {
        let all = req.result || []
        if (userId) {
          all = all.filter((item) => item.userId === String(userId))
        }
        all.sort((a, b) => b.createdAt - a.createdAt)
        resolve(all)
      }
      req.onerror = () => reject(req.error)
    } catch (err) {
      reject(err)
    }
  })
}

export async function clearCompletedQueueItems(userId = null, maxAgeMs = 24 * 60 * 60 * 1000) {
  const db = await openDb()
  if (!db) return

  const cutoff = Date.now() - maxAgeMs
  const all = await getAllQueueItems(userId)

  for (const item of all) {
    if (item.status === 'completed' && item.updatedAt < cutoff) {
      try {
        const tx = db.transaction(STORE_SYNC_QUEUE, 'readwrite')
        tx.objectStore(STORE_SYNC_QUEUE).delete(item.operationId)
      } catch {}
    }
  }
}

// ── Dashboard Store Operations ─────────────────────────────────────────────

export async function getCachedDashboard(userId) {
  if (!userId) return null
  const db = await openDb()
  if (!db) return null

  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(STORE_DASHBOARD, 'readonly')
      const store = tx.objectStore(STORE_DASHBOARD)
      const req = store.get(String(userId))
      req.onsuccess = () => resolve(req.result?.data || null)
      req.onerror = () => reject(req.error)
    } catch (err) {
      reject(err)
    }
  })
}

export async function saveCachedDashboard(userId, data) {
  if (!userId || !data) return
  const db = await openDb()
  if (!db) return

  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(STORE_DASHBOARD, 'readwrite')
      const store = tx.objectStore(STORE_DASHBOARD)
      const record = {
        userId: String(userId),
        data,
        updatedAt: Date.now(),
      }
      const req = store.put(record)
      req.onsuccess = () => resolve(record)
      req.onerror = () => reject(req.error)
    } catch (err) {
      reject(err)
    }
  })
}

// ── Internships Store Operations ───────────────────────────────────────────

export async function getCachedInternships(id = 'default_list') {
  const db = await openDb()
  if (!db) return []

  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(STORE_INTERNSHIPS, 'readonly')
      const store = tx.objectStore(STORE_INTERNSHIPS)
      const req = store.get(id)
      req.onsuccess = () => resolve(req.result?.items || [])
      req.onerror = () => reject(req.error)
    } catch (err) {
      reject(err)
    }
  })
}

export async function saveCachedInternships(items, id = 'default_list') {
  if (!Array.isArray(items)) return
  const db = await openDb()
  if (!db) return

  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(STORE_INTERNSHIPS, 'readwrite')
      const store = tx.objectStore(STORE_INTERNSHIPS)
      const record = {
        id,
        items,
        updatedAt: Date.now(),
      }
      const req = store.put(record)
      req.onsuccess = () => resolve(record)
      req.onerror = () => reject(req.error)
    } catch (err) {
      reject(err)
    }
  })
}

// ── Assessment Questions & Topics Operations ───────────────────────────────

export async function getCachedTopics() {
  const res = await getCachedQuestions('__all_topics__')
  return res?.topics || []
}

export async function saveCachedTopics(topics) {
  if (!Array.isArray(topics)) return
  return saveCachedQuestions('__all_topics__', null, null, topics)
}

export async function getCachedQuestions(topicId) {
  if (!topicId) return null
  const db = await openDb()
  if (!db) return null

  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(STORE_ASSESSMENT_QUESTIONS, 'readonly')
      const store = tx.objectStore(STORE_ASSESSMENT_QUESTIONS)
      const req = store.get(String(topicId))
      req.onsuccess = () => resolve(req.result || null)
      req.onerror = () => reject(req.error)
    } catch (err) {
      reject(err)
    }
  })
}

export async function saveCachedQuestions(topicId, topic, questions, topics = null) {
  if (!topicId) return
  const db = await openDb()
  if (!db) return

  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(STORE_ASSESSMENT_QUESTIONS, 'readwrite')
      const store = tx.objectStore(STORE_ASSESSMENT_QUESTIONS)
      const record = {
        topicId: String(topicId),
        topic,
        questions: questions || [],
        topics: topics || null,
        updatedAt: Date.now(),
      }
      const req = store.put(record)
      req.onsuccess = () => resolve(record)
      req.onerror = () => reject(req.error)
    } catch (err) {
      reject(err)
    }
  })
}

// ── Assessment Attempts Operations ─────────────────────────────────────────

export async function getAssessmentAttempt(attemptKey) {
  if (!attemptKey) return null
  const db = await openDb()
  if (!db) return null

  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(STORE_ASSESSMENT_ATTEMPTS, 'readonly')
      const store = tx.objectStore(STORE_ASSESSMENT_ATTEMPTS)
      const req = store.get(attemptKey)
      req.onsuccess = () => resolve(req.result || null)
      req.onerror = () => reject(req.error)
    } catch (err) {
      reject(err)
    }
  })
}

export async function saveAssessmentAttempt(attempt) {
  if (!attempt || !attempt.attemptKey) return
  const db = await openDb()
  if (!db) return

  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(STORE_ASSESSMENT_ATTEMPTS, 'readwrite')
      const store = tx.objectStore(STORE_ASSESSMENT_ATTEMPTS)
      const record = {
        ...attempt,
        updatedAt: Date.now(),
      }
      const req = store.put(record)
      req.onsuccess = () => resolve(record)
      req.onerror = () => reject(req.error)
    } catch (err) {
      reject(err)
    }
  })
}

export async function clearAssessmentAttempt(attemptKey) {
  if (!attemptKey) return
  const db = await openDb()
  if (!db) return

  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(STORE_ASSESSMENT_ATTEMPTS, 'readwrite')
      const store = tx.objectStore(STORE_ASSESSMENT_ATTEMPTS)
      const req = store.delete(attemptKey)
      req.onsuccess = () => resolve()
      req.onerror = () => reject(req.error)
    } catch (err) {
      reject(err)
    }
  })
}

// ── Assessment Results Operations ──────────────────────────────────────────

export async function getCachedAssessmentResults(userId) {
  if (!userId) return null
  const db = await openDb()
  if (!db) return null

  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(STORE_ASSESSMENT_RESULTS, 'readonly')
      const store = tx.objectStore(STORE_ASSESSMENT_RESULTS)
      const req = store.get(String(userId))
      req.onsuccess = () => resolve(req.result?.data || null)
      req.onerror = () => reject(req.error)
    } catch (err) {
      reject(err)
    }
  })
}

export async function saveCachedAssessmentResults(userId, data) {
  if (!userId || !data) return
  const db = await openDb()
  if (!db) return

  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(STORE_ASSESSMENT_RESULTS, 'readwrite')
      const store = tx.objectStore(STORE_ASSESSMENT_RESULTS)
      const record = {
        userId: String(userId),
        data,
        updatedAt: Date.now(),
      }
      const req = store.put(record)
      req.onsuccess = () => resolve(record)
      req.onerror = () => reject(req.error)
    } catch (err) {
      reject(err)
    }
  })
}

// ── Verified Courses Store Operations ───────────────────────────────────────

export async function getCachedCourses(id = 'default_list') {
  const db = await openDb()
  if (!db) return []

  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(STORE_VERIFIED_COURSES, 'readonly')
      const store = tx.objectStore(STORE_VERIFIED_COURSES)
      const req = store.get(id)
      req.onsuccess = () => resolve(req.result?.items || [])
      req.onerror = () => reject(req.error)
    } catch (err) {
      reject(err)
    }
  })
}

export async function saveCachedCourses(items, id = 'default_list') {
  if (!Array.isArray(items)) return
  const db = await openDb()
  if (!db) return

  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(STORE_VERIFIED_COURSES, 'readwrite')
      const store = tx.objectStore(STORE_VERIFIED_COURSES)
      const record = {
        id,
        items,
        updatedAt: Date.now(),
      }
      const req = store.put(record)
      req.onsuccess = () => resolve(record)
      req.onerror = () => reject(req.error)
    } catch (err) {
      reject(err)
    }
  })
}

// ── Career Jobs Store Operations ────────────────────────────────────────────

export async function getCachedJobs(id = 'default_list') {
  const db = await openDb()
  if (!db) return []

  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(STORE_CAREER_JOBS, 'readonly')
      const store = tx.objectStore(STORE_CAREER_JOBS)
      const req = store.get(id)
      req.onsuccess = () => resolve(req.result?.items || [])
      req.onerror = () => reject(req.error)
    } catch (err) {
      reject(err)
    }
  })
}

export async function saveCachedJobs(items, id = 'default_list') {
  if (!Array.isArray(items)) return
  const db = await openDb()
  if (!db) return

  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(STORE_CAREER_JOBS, 'readwrite')
      const store = tx.objectStore(STORE_CAREER_JOBS)
      const record = {
        id,
        items,
        updatedAt: Date.now(),
      }
      const req = store.put(record)
      req.onsuccess = () => resolve(record)
      req.onerror = () => reject(req.error)
    } catch (err) {
      reject(err)
    }
  })
}

// ── Industry Tests Store Operations ─────────────────────────────────────────

export async function getCachedIndustryTests(id = 'default_list') {
  const db = await openDb()
  if (!db) return []

  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(STORE_INDUSTRY_TESTS, 'readonly')
      const store = tx.objectStore(STORE_INDUSTRY_TESTS)
      const req = store.get(id)
      req.onsuccess = () => resolve(req.result?.items || [])
      req.onerror = () => reject(req.error)
    } catch (err) {
      reject(err)
    }
  })
}

export async function saveCachedIndustryTests(items, id = 'default_list') {
  if (!Array.isArray(items)) return
  const db = await openDb()
  if (!db) return

  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(STORE_INDUSTRY_TESTS, 'readwrite')
      const store = tx.objectStore(STORE_INDUSTRY_TESTS)
      const record = {
        id,
        items,
        updatedAt: Date.now(),
      }
      const req = store.put(record)
      req.onsuccess = () => resolve(record)
      req.onerror = () => reject(req.error)
    } catch (err) {
      reject(err)
    }
  })
}

export async function getCachedIndustryTestDetails(contestId) {
  if (!contestId) return null
  const db = await openDb()
  if (!db) return null

  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(STORE_INDUSTRY_TESTS, 'readonly')
      const store = tx.objectStore(STORE_INDUSTRY_TESTS)
      const req = store.get(`detail_${contestId}`)
      req.onsuccess = () => resolve(req.result?.data || null)
      req.onerror = () => reject(req.error)
    } catch (err) {
      reject(err)
    }
  })
}

export async function saveCachedIndustryTestDetails(contestId, data) {
  if (!contestId || !data) return
  const db = await openDb()
  if (!db) return

  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(STORE_INDUSTRY_TESTS, 'readwrite')
      const store = tx.objectStore(STORE_INDUSTRY_TESTS)
      const record = {
        id: `detail_${contestId}`,
        data,
        updatedAt: Date.now(),
      }
      const req = store.put(record)
      req.onsuccess = () => resolve(record)
      req.onerror = () => reject(req.error)
    } catch (err) {
      reject(err)
    }
  })
}

export async function getCachedIndustryTestDraft(key) {
  if (!key) return null
  const db = await openDb()
  if (!db) return null

  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(STORE_INDUSTRY_TESTS, 'readonly')
      const store = tx.objectStore(STORE_INDUSTRY_TESTS)
      const req = store.get(`draft_${key}`)
      req.onsuccess = () => resolve(req.result?.code || null)
      req.onerror = () => reject(req.error)
    } catch (err) {
      reject(err)
    }
  })
}

export async function saveCachedIndustryTestDraft(key, code) {
  if (!key) return
  const db = await openDb()
  if (!db) return

  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(STORE_INDUSTRY_TESTS, 'readwrite')
      const store = tx.objectStore(STORE_INDUSTRY_TESTS)
      const record = {
        id: `draft_${key}`,
        code,
        updatedAt: Date.now(),
      }
      const req = store.put(record)
      req.onsuccess = () => resolve(record)
      req.onerror = () => reject(req.error)
    } catch (err) {
      reject(err)
    }
  })
}

// ── Industry Assessments Store Operations ───────────────────────────────────

export async function getCachedIndustryAssessments(id = 'default_list') {
  const db = await openDb()
  if (!db) return []

  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(STORE_INDUSTRY_ASSESSMENTS, 'readonly')
      const store = tx.objectStore(STORE_INDUSTRY_ASSESSMENTS)
      const req = store.get(id)
      req.onsuccess = () => resolve(req.result?.items || [])
      req.onerror = () => reject(req.error)
    } catch (err) {
      reject(err)
    }
  })
}

export async function saveCachedIndustryAssessments(items, id = 'default_list') {
  if (!Array.isArray(items)) return
  const db = await openDb()
  if (!db) return

  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(STORE_INDUSTRY_ASSESSMENTS, 'readwrite')
      const store = tx.objectStore(STORE_INDUSTRY_ASSESSMENTS)
      const record = {
        id,
        items,
        updatedAt: Date.now(),
      }
      const req = store.put(record)
      req.onsuccess = () => resolve(record)
      req.onerror = () => reject(req.error)
    } catch (err) {
      reject(err)
    }
  })
}

export async function getCachedIndustryAssessmentQuestions(assessmentId) {
  if (!assessmentId) return null
  const db = await openDb()
  if (!db) return null

  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(STORE_INDUSTRY_ASSESSMENTS, 'readonly')
      const store = tx.objectStore(STORE_INDUSTRY_ASSESSMENTS)
      const req = store.get(`questions_${assessmentId}`)
      req.onsuccess = () => resolve(req.result?.data || null)
      req.onerror = () => reject(req.error)
    } catch (err) {
      reject(err)
    }
  })
}

export async function saveCachedIndustryAssessmentQuestions(assessmentId, data) {
  if (!assessmentId || !data) return
  const db = await openDb()
  if (!db) return

  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(STORE_INDUSTRY_ASSESSMENTS, 'readwrite')
      const store = tx.objectStore(STORE_INDUSTRY_ASSESSMENTS)
      const record = {
        id: `questions_${assessmentId}`,
        data,
        updatedAt: Date.now(),
      }
      const req = store.put(record)
      req.onsuccess = () => resolve(record)
      req.onerror = () => reject(req.error)
    } catch (err) {
      reject(err)
    }
  })
}

export async function getCachedIndustryAssessmentAnswers(attemptKey) {
  if (!attemptKey) return null
  const db = await openDb()
  if (!db) return null

  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(STORE_INDUSTRY_ASSESSMENTS, 'readonly')
      const store = tx.objectStore(STORE_INDUSTRY_ASSESSMENTS)
      const req = store.get(`answers_${attemptKey}`)
      req.onsuccess = () => resolve(req.result?.answers || null)
      req.onerror = () => reject(req.error)
    } catch (err) {
      reject(err)
    }
  })
}

export async function saveCachedIndustryAssessmentAnswers(attemptKey, answers) {
  if (!attemptKey) return
  const db = await openDb()
  if (!db) return

  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(STORE_INDUSTRY_ASSESSMENTS, 'readwrite')
      const store = tx.objectStore(STORE_INDUSTRY_ASSESSMENTS)
      const record = {
        id: `answers_${attemptKey}`,
        answers,
        updatedAt: Date.now(),
      }
      const req = store.put(record)
      req.onsuccess = () => resolve(record)
      req.onerror = () => reject(req.error)
    } catch (err) {
      reject(err)
    }
  })
}

// ── Industry Matrix Store Operations ────────────────────────────────────────

export async function getCachedIndustryMatrix(userId) {
  if (!userId) return null
  const db = await openDb()
  if (!db) return null

  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(STORE_INDUSTRY_MATRIX, 'readonly')
      const store = tx.objectStore(STORE_INDUSTRY_MATRIX)
      const req = store.get(String(userId))
      req.onsuccess = () => resolve(req.result?.data || null)
      req.onerror = () => reject(req.error)
    } catch (err) {
      reject(err)
    }
  })
}

export async function saveCachedIndustryMatrix(userId, data) {
  if (!userId || !data) return
  const db = await openDb()
  if (!db) return

  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(STORE_INDUSTRY_MATRIX, 'readwrite')
      const store = tx.objectStore(STORE_INDUSTRY_MATRIX)
      const record = {
        userId: String(userId),
        data,
        updatedAt: Date.now(),
      }
      const req = store.put(record)
      req.onsuccess = () => resolve(record)
      req.onerror = () => reject(req.error)
    } catch (err) {
      reject(err)
    }
  })
}

// ── AI Interview Store Operations ───────────────────────────────────────────

export async function getCachedAiInterviews(userId) {
  if (!userId) return []
  const db = await openDb()
  if (!db) return []

  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(STORE_AI_INTERVIEW, 'readonly')
      const store = tx.objectStore(STORE_AI_INTERVIEW)
      const req = store.get(String(userId))
      req.onsuccess = () => resolve(req.result?.interviews || [])
      req.onerror = () => reject(req.error)
    } catch (err) {
      reject(err)
    }
  })
}

export async function saveCachedAiInterviews(userId, interviews) {
  if (!userId || !Array.isArray(interviews)) return
  const db = await openDb()
  if (!db) return

  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(STORE_AI_INTERVIEW, 'readwrite')
      const store = tx.objectStore(STORE_AI_INTERVIEW)
      const record = {
        userId: String(userId),
        interviews,
        updatedAt: Date.now(),
      }
      const req = store.put(record)
      req.onsuccess = () => resolve(record)
      req.onerror = () => reject(req.error)
    } catch (err) {
      reject(err)
    }
  })
}

// ── Learning Center Store Operations ────────────────────────────────────────

export async function getCachedLearningModules(id = 'default_list') {
  const db = await openDb()
  if (!db) return []

  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(STORE_LEARNING_CENTER, 'readonly')
      const store = tx.objectStore(STORE_LEARNING_CENTER)
      const req = store.get(id)
      req.onsuccess = () => resolve(req.result?.items || [])
      req.onerror = () => reject(req.error)
    } catch (err) {
      reject(err)
    }
  })
}

export async function saveCachedLearningModules(items, id = 'default_list') {
  if (!Array.isArray(items)) return
  const db = await openDb()
  if (!db) return

  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(STORE_LEARNING_CENTER, 'readwrite')
      const store = tx.objectStore(STORE_LEARNING_CENTER)
      const record = {
        id,
        items,
        updatedAt: Date.now(),
      }
      const req = store.put(record)
      req.onsuccess = () => resolve(record)
      req.onerror = () => reject(req.error)
    } catch (err) {
      reject(err)
    }
  })
}

// ── Student Applications Store Operations ───────────────────────────────────

export async function getCachedApplications(userId) {
  if (!userId) return null
  const db = await openDb()
  if (!db) return null

  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(STORE_APPLICATIONS, 'readonly')
      const store = tx.objectStore(STORE_APPLICATIONS)
      const req = store.get(String(userId))
      req.onsuccess = () => resolve(req.result?.data || null)
      req.onerror = () => reject(req.error)
    } catch (err) {
      reject(err)
    }
  })
}

export async function saveCachedApplications(userId, data) {
  if (!userId || !data) return
  const db = await openDb()
  if (!db) return

  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(STORE_APPLICATIONS, 'readwrite')
      const store = tx.objectStore(STORE_APPLICATIONS)
      const record = {
        userId: String(userId),
        data,
        updatedAt: Date.now(),
      }
      const req = store.put(record)
      req.onsuccess = () => resolve(record)
      req.onerror = () => reject(req.error)
    } catch (err) {
      reject(err)
    }
  })
}

