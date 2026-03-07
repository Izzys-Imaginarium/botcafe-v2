/**
 * Extract subdomain from a Host header value.
 * Returns null for bare domains (e.g., "botcafe.ai", "localhost").
 */
export function getSubdomain(host: string): string | null {
  // Remove port if present
  const hostname = host.split(':')[0]

  // localhost subdomains (e.g., backrooms.localhost)
  if (hostname.endsWith('.localhost')) {
    const parts = hostname.split('.')
    if (parts.length >= 2 && parts[0] !== 'www') {
      return parts[0]
    }
    return null
  }

  // Production domains (e.g., backrooms.botcafe.ai)
  const parts = hostname.split('.')
  // Need at least 3 parts for a subdomain (sub.domain.tld)
  if (parts.length >= 3 && parts[0] !== 'www') {
    return parts[0]
  }

  return null
}

/**
 * Check if the given host is the backrooms subdomain.
 */
export function isBackrooms(host: string): boolean {
  return getSubdomain(host) === 'backrooms'
}
