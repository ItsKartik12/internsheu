import { JudgeProvider } from './JudgeProvider.js'

/**
 * Judge0Service — Real sandboxed code execution via Judge0 CE API.
 *
 * DESIGN NOTES:
 * - Judge0 handles actual compilation and execution in an isolated sandbox.
 * - Student code is NEVER executed locally (no child_process / exec / spawn).
 * - API credentials remain backend-only (JUDGE0_BASE_URL, JUDGE0_API_KEY).
 * - VJudge remains responsible for contest/submission flow; Judge0 is for [Run] only.
 *
 * Judge0 CE Public Instance: https://judge0-ce.p.rapidapi.com  (RapidAPI key)
 *   OR self-hosted instance:  http://your-judge0-host
 *
 * Docs: https://docs.judge0.com/
 */

// ── Language ID mapping (Judge0 CE) ──────────────────────────────────────
const LANGUAGE_IDS = {
  'C':          50,
  'C++':        54,
  'Java':       62,
  'Python':     71,
  'Python3':    71,
  'JavaScript': 63,
  'TypeScript': 74,
  'Go':         60,
  'Rust':       73,
  'C#':         51,
  'PHP':        68,
  'Ruby':       72,
  'Swift':      83,
  'Kotlin':     78,
  'Bash':       46,
}

// Judge0 status ID → human-readable label + color category
const STATUS_MAP = {
  1:  { label: 'In Queue',                  color: 'pending' },
  2:  { label: 'Processing',                color: 'pending' },
  3:  { label: 'Accepted',                  color: 'accepted' },
  4:  { label: 'Wrong Answer',              color: 'wrong' },
  5:  { label: 'Time Limit Exceeded',       color: 'tle' },
  6:  { label: 'Compilation Error',         color: 'error' },
  7:  { label: 'Runtime Error (SIGSEGV)',   color: 'error' },
  8:  { label: 'Runtime Error (SIGXFSZ)',   color: 'error' },
  9:  { label: 'Runtime Error (SIGFPE)',    color: 'error' },
  10: { label: 'Runtime Error (SIGABRT)',   color: 'error' },
  11: { label: 'Runtime Error (NZEC)',      color: 'error' },
  12: { label: 'Runtime Error (Other)',     color: 'error' },
  13: { label: 'Internal Error',            color: 'error' },
  14: { label: 'Exec Format Error',         color: 'error' },
}

/**
 * Normalize output for comparison:
 * - Trim trailing whitespace on each line
 * - Trim leading/trailing blank lines
 * - Preserve meaningful content differences
 */
function normalizeOutput(str) {
  if (!str) return ''
  return str
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n')
    .trim()
}

export class Judge0Service extends JudgeProvider {
  constructor() {
    super('judge0')
    this.baseUrl = (process.env.JUDGE0_BASE_URL || '').replace(/\/$/, '')
    this.apiKey = process.env.JUDGE0_API_KEY || ''
    this.defaultCpuTimeLimit = 5      // seconds
    this.defaultMemoryLimit = 128000  // KB (128 MB)
    this.pollIntervalMs = 600         // ms between poll attempts
    this.maxPollAttempts = 20         // 20 x 600ms = 12s max wait
  }

  get isConfigured() {
    return Boolean(this.baseUrl)
  }

  /** Build request headers. Supports both RapidAPI and self-hosted Judge0. */
  _headers() {
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    }
    if (this.apiKey) {
      // RapidAPI style — also valid as X-Auth-Token for self-hosted CE
      headers['X-RapidAPI-Key'] = this.apiKey
      try {
        headers['X-RapidAPI-Host'] = new URL(this.baseUrl).hostname
      } catch (_) {}
      headers['X-Auth-Token'] = this.apiKey
    }
    return headers
  }

  /** Resolve Judge0 language ID. Returns null for unknown language. */
  _getLanguageId(language) {
    return LANGUAGE_IDS[language] ?? null
  }

  /**
   * POST /submissions — create a Judge0 submission.
   * Returns the submission token.
   */
  async _createSubmission({ source_code, language_id, stdin, expected_output, cpu_time_limit, memory_limit }) {
    const url = `${this.baseUrl}/submissions?base64_encoded=false&wait=false`
    const body = {
      source_code,
      language_id,
      stdin: stdin || '',
      expected_output: expected_output !== null && expected_output !== undefined ? expected_output : null,
      cpu_time_limit: cpu_time_limit ?? this.defaultCpuTimeLimit,
      memory_limit: memory_limit ?? this.defaultMemoryLimit,
    }

    let response
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: this._headers(),
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(15000),
      })
    } catch (err) {
      throw new Error(`Code execution service unavailable: ${err.message}`)
    }

    if (!response.ok) {
      const text = await response.text().catch(() => '')
      throw new Error(`Judge0 submission failed (${response.status}): ${text}`)
    }

    const data = await response.json()
    if (!data.token) {
      throw new Error('Judge0 returned no submission token')
    }
    return data.token
  }

  /**
   * GET /submissions/:token — poll until execution is complete (status.id > 2).
   */
  async _pollSubmission(token) {
    const fields = 'token,status,stdout,stderr,compile_output,message,time,memory,exit_code'
    const url = `${this.baseUrl}/submissions/${token}?base64_encoded=false&fields=${fields}`

    for (let attempt = 0; attempt < this.maxPollAttempts; attempt++) {
      let response
      try {
        response = await fetch(url, {
          headers: this._headers(),
          signal: AbortSignal.timeout(10000),
        })
      } catch (err) {
        throw new Error(`Code execution service unavailable: ${err.message}`)
      }

      if (!response.ok) {
        throw new Error(`Judge0 poll failed (${response.status})`)
      }

      const data = await response.json()
      const statusId = data.status?.id ?? 0

      // Status IDs 1 and 2 = In Queue / Processing — keep polling
      if (statusId <= 2) {
        await new Promise((resolve) => setTimeout(resolve, this.pollIntervalMs))
        continue
      }

      return data
    }

    throw new Error('Code execution service timed out. Try again later.')
  }

  /**
   * Execute one test case via Judge0 sandbox.
   */
  async _executeOne({ source_code, language_id, stdin, expected_output, cpuTimeLimit, memoryLimit, caseNumber }) {
    const token = await this._createSubmission({
      source_code,
      language_id,
      stdin,
      expected_output,
      cpu_time_limit: cpuTimeLimit,
      memory_limit: memoryLimit,
    })

    const result = await this._pollSubmission(token)
    const statusId = result.status?.id ?? 0
    const statusInfo = STATUS_MAP[statusId] || {
      label: result.status?.description || 'Unknown',
      color: 'error',
    }

    const stdout = result.stdout || ''
    const stderr = result.stderr || ''
    const compileOutput = result.compile_output || ''
    const normalizedActual = normalizeOutput(stdout)
    const normalizedExpected = expected_output !== null && expected_output !== undefined
      ? normalizeOutput(expected_output)
      : null

    // Verdict: if Judge0 says Accepted, verify with our normalization
    let verdict = statusInfo.label
    let statusColor = statusInfo.color
    if (statusId === 3 && normalizedExpected !== null) {
      if (normalizedActual === normalizedExpected) {
        verdict = 'Accepted'
        statusColor = 'accepted'
      } else {
        verdict = 'Wrong Answer'
        statusColor = 'wrong'
      }
    } else if (statusId === 3 && normalizedExpected === null) {
      // No expected output provided — just show execution succeeded
      verdict = 'Executed'
      statusColor = 'accepted'
    }

    return {
      caseNumber,
      input: stdin || '',
      expectedOutput: expected_output || '',
      actualOutput: stdout,
      stderr: stderr || '',
      compileOutput: compileOutput || '',
      status: verdict,
      statusColor,
      time: result.time != null ? `${result.time}s` : null,
      memory: result.memory != null ? `${result.memory} KB` : null,
    }
  }

  /**
   * runCode — execute student code against sample test cases via Judge0 sandbox.
   * NEVER executes code locally. NEVER fabricates results.
   */
  async runCode({ language, code, sampleCases = [], cpuTimeLimit, memoryLimit }) {
    if (!this.isConfigured) {
      return {
        supported: false,
        message: 'Code execution service unavailable. JUDGE0_BASE_URL is not configured.',
        status: 'Unavailable',
        testCases: [],
      }
    }

    const languageId = this._getLanguageId(language)
    if (!languageId) {
      return {
        supported: false,
        message: `Language "${language}" is not supported by the execution service.`,
        status: 'Unsupported Language',
        testCases: [],
      }
    }

    if (!code || !code.trim()) {
      throw new Error('Source code is required')
    }

    const cases = sampleCases && sampleCases.length > 0
      ? sampleCases
      : [{ input: '', output: null, explanation: '' }]

    // Run all sample cases sequentially to avoid overwhelming rate limits
    const testCaseResults = []
    for (let i = 0; i < cases.length; i++) {
      const sc = cases[i]
      try {
        const result = await this._executeOne({
          source_code: code,
          language_id: languageId,
          stdin: sc.input || '',
          expected_output: sc.output ?? null,
          cpuTimeLimit: cpuTimeLimit ?? this.defaultCpuTimeLimit,
          memoryLimit: memoryLimit ?? this.defaultMemoryLimit,
          caseNumber: i + 1,
        })
        testCaseResults.push(result)
      } catch (execErr) {
        testCaseResults.push({
          caseNumber: i + 1,
          input: sc.input || '',
          expectedOutput: sc.output || '',
          actualOutput: '',
          stderr: execErr.message,
          compileOutput: '',
          status: 'Execution Error',
          statusColor: 'error',
          time: null,
          memory: null,
        })
      }
    }

    const allAccepted = testCaseResults.every(
      (tc) => tc.status === 'Accepted' || tc.status === 'Executed'
    )
    const firstFailed = testCaseResults.find(
      (tc) => tc.status !== 'Accepted' && tc.status !== 'Executed'
    )
    const overallStatus = allAccepted ? 'All Accepted' : firstFailed?.status || 'Failed'

    return {
      supported: true,
      message: allAccepted
        ? `All ${testCaseResults.length} sample case(s) passed!`
        : `${overallStatus} on Case ${firstFailed?.caseNumber || 1}`,
      status: overallStatus,
      language,
      languageId,
      testCases: testCaseResults,
    }
  }
}

export const judge0Service = new Judge0Service()
export default judge0Service
