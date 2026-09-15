/**
 * Validates whether a string is a valid HTTP or HTTPS URL.
 * Rejects javascript:, data:, ftp:, and malformed URLs.
 */
export function isValidUrl(url) {
  if (!url || typeof url !== 'string') return false
  const trimmed = url.trim()
  if (!/^https?:\/\//i.test(trimmed)) return false
  try {
    const parsed = new URL(trimmed)
    return (parsed.protocol === 'http:' || parsed.protocol === 'https:') && Boolean(parsed.hostname)
  } catch {
    return false
  }
}
