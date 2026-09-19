// Deepgram temporary-token service. Ported from
// ai-interviewer/apps/backend/index.ts (getDeepgramTemporaryKey), adapted to
// plain ESM JavaScript for InternSetu.
//
// The permanent DEEPGRAM_API_KEY stays backend-only; the browser only ever
// receives a 600-second scoped temporary key.

let cachedProjectId = null

async function getProjectId(masterKey) {
  if (cachedProjectId) return cachedProjectId

  const projectResponse = await fetch('https://api.deepgram.com/v1/projects', {
    method: 'GET',
    headers: { Authorization: `Token ${masterKey}` },
    signal: AbortSignal.timeout(7000),
  })

  if (!projectResponse.ok) {
    const errText = await projectResponse.text()
    throw new Error(
      `Failed to list Deepgram projects (${projectResponse.status}): ${errText.slice(0, 150)}`
    )
  }

  const projectData = await projectResponse.json()
  const firstProject = projectData?.projects?.[0]
  if (!firstProject?.project_id) {
    throw new Error('No Deepgram project found for this API key.')
  }

  cachedProjectId = firstProject.project_id
  return cachedProjectId
}

/**
 * Mint a short-lived Deepgram key (600s TTL, usage:write scope only).
 */
export async function getDeepgramTemporaryKey() {
  const masterKey = process.env.DEEPGRAM_API_KEY
  if (!masterKey || !masterKey.trim()) {
    throw new Error('DEEPGRAM_API_KEY is not configured on the backend.')
  }

  const key = masterKey.trim()
  const projectId = await getProjectId(key)

  const keyResponse = await fetch(`https://api.deepgram.com/v1/projects/${projectId}/keys`, {
    method: 'POST',
    headers: {
      Authorization: `Token ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      comment: 'InternSetu temporary interview voice session',
      scopes: ['usage:write'],
      time_to_live_in_seconds: 600,
    }),
    signal: AbortSignal.timeout(7000),
  })

  if (!keyResponse.ok) {
    // Cached project ID may have become invalid — clear it for next attempt.
    cachedProjectId = null
    const errText = await keyResponse.text()
    throw new Error(
      `Failed to generate temporary Deepgram key (${keyResponse.status}): ${errText.slice(0, 150)}`
    )
  }

  const keyData = await keyResponse.json()
  if (!keyData?.key || typeof keyData.key !== 'string') {
    throw new Error('Deepgram did not return a valid temporary key.')
  }
  return keyData.key
}

/**
 * Map a Deepgram error to a client-friendly message + HTTP status,
 * following the reference implementation's classification.
 */
export function classifyDeepgramError(error) {
  const msg = String(error?.message || '')
  const causeMsg = String(error?.cause?.message || '')
  const isDnsError =
    error?.code === 'ENOTFOUND' ||
    error?.cause?.code === 'ENOTFOUND' ||
    msg.includes('ENOTFOUND') ||
    causeMsg.includes('ENOTFOUND')
  const isTimeout = error?.name === 'TimeoutError' || error?.name === 'AbortError'

  if (msg.includes('not configured')) {
    return { status: 500, message: 'Deepgram is not configured on the backend.' }
  }
  if (isDnsError) {
    return {
      status: 503,
      message: 'Unable to reach the speech recognition service. Check network connectivity.',
    }
  }
  if (isTimeout) {
    return { status: 504, message: 'Speech service request timed out. Please try again.' }
  }
  return { status: 502, message: msg.slice(0, 200) || 'Failed to generate voice session token.' }
}
