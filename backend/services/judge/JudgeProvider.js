/**
 * JudgeProvider — Abstract base class for coding contest and judging engines.
 * All judge integrations (VJudge, DOMjudge, etc.) must extend this interface.
 * This guarantees the core InternSetu business logic, database models, and UI
 * remain completely decoupled from any single external judge.
 */
export class JudgeProvider {
  constructor(name) {
    if (new.target === JudgeProvider) {
      throw new TypeError('Cannot construct JudgeProvider instances directly')
    }
    this.name = name
  }

  /**
   * Create an external contest if supported by the provider.
   * @param {Object} contestData
   * @returns {Promise<{ externalContestId: string, externalContestUrl: string, status: string }>}
   */
  async createContest(contestData) {
    throw new Error(`createContest is not implemented for ${this.name}`)
  }

  /**
   * Update an external contest if supported by the provider.
   * @param {string} externalContestId
   * @param {Object} contestData
   */
  async updateContest(externalContestId, contestData) {
    throw new Error(`updateContest is not implemented for ${this.name}`)
  }

  /**
   * Get external contest details.
   * @param {string} externalContestId
   */
  async getContest(externalContestId) {
    throw new Error(`getContest is not implemented for ${this.name}`)
  }

  /**
   * Get problems from the provider library or external repository.
   * @param {Object} filter
   */
  async getProblems(filter = {}) {
    throw new Error(`getProblems is not implemented for ${this.name}`)
  }

  /**
   * Add problem references to a contest.
   * @param {string} externalContestId
   * @param {string[]} problemIds
   */
  async addProblems(externalContestId, problemIds) {
    throw new Error(`addProblems is not implemented for ${this.name}`)
  }

  /**
   * Register a student participant for the contest.
   * @param {string} externalContestId
   * @param {Object} participantData
   */
  async registerParticipant(externalContestId, participantData) {
    throw new Error(`registerParticipant is not implemented for ${this.name}`)
  }

  /**
   * Run student code against sample test cases (dry run / test execution).
   * @param {Object} runRequest
   * @param {string} runRequest.externalProblemId
   * @param {string} runRequest.language
   * @param {string} runRequest.code
   * @param {Array} [runRequest.sampleCases]
   * @returns {Promise<{ supported: boolean, message: string, status: string, testCases?: Array }>}
   */
  async runCode(runRequest) {
    throw new Error(`runCode is not implemented for ${this.name}`)
  }

  /**
   * Submit student code for judging.
   * @param {Object} submission
   * @param {string} submission.externalContestId
   * @param {string} submission.externalProblemId
   * @param {string} submission.language
   * @param {string} submission.code
   * @param {string} submission.studentId
   * @param {string} [submission.externalUserId]
   */
  async submitSolution(submission) {
    throw new Error(`submitSolution is not implemented for ${this.name}`)
  }

  /**
   * Get single submission status and verdict.
   * @param {string} submissionId
   */
  async getSubmission(submissionId) {
    throw new Error(`getSubmission is not implemented for ${this.name}`)
  }

  /**
   * Get multiple submissions for a contest or user.
   * @param {Object} filter
   */
  async getSubmissions(filter = {}) {
    throw new Error(`getSubmissions is not implemented for ${this.name}`)
  }

  /**
   * Get contest leaderboard / standings.
   * @param {string} externalContestId
   */
  async getContestStandings(externalContestId) {
    throw new Error(`getContestStandings is not implemented for ${this.name}`)
  }

  /**
   * Synchronize contest results back into InternSetu normalized structures.
   * @param {string} contestId
   */
  async syncResults(contestId) {
    throw new Error(`syncResults is not implemented for ${this.name}`)
  }
}

export default JudgeProvider
