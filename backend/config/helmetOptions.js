/**
 * Helmet.js configuration for HTTP security headers.
 *
 * Exports:
 *   - buildCspHeader(trustedOrigins): pure function for building a CSP script-src directive string
 *   - helmetOptions: configuration object for helmet(helmetOptions)
 */

/**
 * Builds a CSP `script-src` directive string from an array of trusted origins.
 * Always includes `'self'` as the first source.
 *
 * @param {string[]} trustedOrigins - Array of additional trusted origin strings
 * @returns {string} Space-separated CSP script-src directive value
 */
export function buildCspHeader(trustedOrigins = []) {
  return ["'self'", ...trustedOrigins].join(' ')
}

const cdnOrigins = (process.env.TRUSTED_CDN_ORIGINS || '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean)

export const helmetOptions = {
  contentSecurityPolicy: {
    directives: {
      'script-src': ["'self'", ...cdnOrigins],
    },
  },
  frameguard: { action: 'deny' },
  noSniff: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  hsts: process.env.NODE_ENV === 'production'
    ? { maxAge: 31536000, includeSubDomains: true }
    : false,
}
