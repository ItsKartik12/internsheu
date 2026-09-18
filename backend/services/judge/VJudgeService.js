import { JudgeProvider } from './JudgeProvider.js'

/**
 * VJudgeService — Implementation of JudgeProvider for VJudge (Virtual Judge).
 * 
 * VJUDGE CAPABILITIES & INTEGRATION LIMITATIONS:
 * --------------------------------------------------
 * 1. VJudge is a virtual judge aggregator (supporting Codeforces, AtCoder, POJ, etc.)
 *    designed primarily for web interface usage.
 * 2. VJudge does NOT provide an official, documented public REST/GraphQL API for:
 *    - Programmatic contest creation
 *    - Automated headless code submissions without reverse-engineering / scraping
 * 3. Safest supported workflow implemented:
 *    - Problem Library mappings: generate safe external problem links (https://vjudge.net/problem/{externalProblemId}).
 *    - Contests: InternSetu manages contest lifecycle (Draft, Scheduled, Live, Ended)
 *      and links to external VJudge contests when an externalContestId/URL is configured.
 *    - Student flow: Students read problems, write code inside InternSetu, can test/solve
 *      via direct VJudge problem link, and submit solutions/run IDs.
 *    - Results & Standings: Normalized into InternSetu ContestResult. When automatic
 *      retrieval is pending or delayed, status is marked "Result Sync Pending" rather than
 *      fabricating verdicts or rankings.
 */
export class VJudgeService extends JudgeProvider {
  constructor() {
    super('vjudge')
    this.baseUrl = process.env.VJUDGE_BASE_URL || 'https://vjudge.net'
    // Credentials remain strictly internal in backend env
    this.username = process.env.VJUDGE_USERNAME || ''
    this.password = process.env.VJUDGE_PASSWORD || ''
  }

  /**
   * Helper to format problem URL on VJudge
   */
  getProblemUrl(externalProblemId) {
    if (!externalProblemId) return ''
    if (externalProblemId.startsWith('http')) return externalProblemId
    return `${this.baseUrl}/problem/${encodeURIComponent(externalProblemId)}`
  }

  /**
   * Helper to format contest URL on VJudge
   */
  getContestUrl(externalContestId) {
    if (!externalContestId) return ''
    if (externalContestId.startsWith('http')) return externalContestId
    return `${this.baseUrl}/contest/${encodeURIComponent(externalContestId)}`
  }

  /**
   * Validate if problem mapping identifier format is valid
   */
  validateProblemMapping(externalProblemId) {
    if (!externalProblemId || typeof externalProblemId !== 'string') {
      return { valid: false, message: 'External problem ID is required' }
    }
    const clean = externalProblemId.trim()
    // Standard format is OJ-ProblemID or direct URL
    const isValidFormat = /^[A-Za-z0-9_]+-[A-Za-z0-9_-]+$/.test(clean) || /^https?:\/\//i.test(clean)
    return {
      valid: isValidFormat,
      formattedId: clean,
      url: this.getProblemUrl(clean),
      message: isValidFormat ? 'Valid VJudge problem reference format' : 'Recommended format: {OJ}-{ProblemNumber} (e.g. POJ-1000, CodeForces-4A)',
    }
  }

  /**
   * createContest — Uses InternSetu local contest management.
   * If external contest URL/ID is provided, validates mapping.
   */
  async createContest(contestData) {
    const externalContestId = contestData.externalContestId?.trim() || ''
    return {
      externalProvider: 'vjudge',
      externalContestId,
      externalContestUrl: externalContestId ? this.getContestUrl(externalContestId) : '',
      status: 'Ready',
      notes: 'Contest orchestrated via InternSetu with VJudge problem federation.',
    }
  }

  /**
   * runCode — Dry-run user code against sample test cases.
   * VJudge does not offer an official public API for arbitrary dry-runs without a full submission.
   * As required, instead of fabricating execution results or claiming code passed,
   * we clearly return 'Run unavailable with current judge integration'.
   */
  async runCode({ externalProblemId, language, code, sampleCases = [] }) {
    if (!code || !code.trim()) {
      throw new Error('Solution code is required')
    }

    const cases = sampleCases && sampleCases.length > 0
      ? sampleCases
      : [{ input: 'N/A', output: 'N/A', explanation: '' }]

    return {
      supported: false,
      message: 'Run unavailable with current judge integration',
      status: 'Run unavailable with current judge integration',
      testCases: cases.map((sc, idx) => ({
        caseNumber: idx + 1,
        input: sc.input || 'N/A',
        expectedOutput: sc.output || 'N/A',
        actualOutput: 'Run unavailable with current judge integration',
        status: 'Run unavailable with current judge integration',
      })),
    }
  }

  /**
   * submitSolution — Records solution submission in InternSetu.
   * If externalRunId is supplied by student, tracks against VJudge.
   */
  async submitSolution({ externalContestId, externalProblemId, language, code, studentId, externalRunId }) {
    if (!code || !code.trim()) {
      throw new Error('Solution code is required')
    }

    return {
      externalProvider: 'vjudge',
      externalProblemId,
      externalProblemUrl: this.getProblemUrl(externalProblemId),
      language,
      submittedAt: new Date(),
      status: 'SUBMITTED',
      verdict: externalRunId ? 'Verdict Sync Pending' : 'Recorded',
      externalRunId: externalRunId || null,
      message: 'Code submitted to InternSetu contest engine.',
    }
  }

  /**
   * syncResults — Safely synchronizes results.
   * Marks "Result Sync Pending" if external automated sync cannot be confirmed.
   */
  async syncResults(contestId, externalContestId) {
    if (!externalContestId) {
      return {
        syncStatus: 'Manual',
        message: 'No external VJudge contest ID linked; contest results managed internally in InternSetu.',
      }
    }

    // Since VJudge does not offer an official public API for standings,
    // we document the limitation and mark safe status
    return {
      syncStatus: 'Result Sync Pending',
      externalContestId,
      externalContestUrl: this.getContestUrl(externalContestId),
      message: 'External VJudge contest linked. Standings pending official synchronization or manual verification.',
    }
  }
}

export const vjudgeService = new VJudgeService()
export default vjudgeService
