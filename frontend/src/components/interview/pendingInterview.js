// Module-level handoff so the Previous Interviews panel can open a specific
// interview on the /interview page even when VideoInterview is not yet
// mounted (cross-page navigation). Consumed exactly once.
let pendingId = null

export function setPendingInterview(sessionId) {
  pendingId = sessionId
}

export function consumePendingInterview() {
  const id = pendingId
  pendingId = null
  return id
}
