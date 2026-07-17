/**
 * CORS configuration module.
 *
 * Reads the ALLOWED_ORIGINS environment variable (comma-separated fully-qualified
 * origin strings) and builds a corsOptions object suitable for the `cors()` middleware.
 *
 * Behaviour:
 *   - If ALLOWED_ORIGINS is set to a non-empty string after trimming, only those
 *     origins are permitted; wildcard "*" is treated as no match.
 *   - If ALLOWED_ORIGINS is set but resolves to an empty string after trimming,
 *     all cross-origin requests are allowed (origin: true).
 *   - Origins not in the list receive a CORS error (HTTP 403 via the cors library).
 */

const rawEnv = process.env.ALLOWED_ORIGINS ?? '';
const trimmed = rawEnv.trim();

/**
 * Parse the comma-separated ALLOWED_ORIGINS string into a Set of origin strings.
 * Returns null when the value is empty (allow-all mode).
 *
 * @param {string} raw - Raw value of the ALLOWED_ORIGINS env var.
 * @returns {Set<string>|null}
 */
function parseAllowedOrigins(raw) {
  const trimmedRaw = raw.trim();
  if (trimmedRaw === '') {
    return null; // allow-all mode
  }
  return new Set(
    trimmedRaw
      .split(',')
      .map((o) => o.trim())
      .filter((o) => o.length > 0)
  );
}

const allowedSet = parseAllowedOrigins(trimmed);

/**
 * CORS origin callback factory.
 *
 * - When allowedSet is null (empty ALLOWED_ORIGINS): permits every origin.
 * - Otherwise: permits only origins present in allowedSet; denies all others
 *   including the literal string "*".
 *
 * @param {Set<string>|null} origins
 * @returns {Function} cors origin callback (origin, callback) => void
 */
function buildOriginCallback(origins) {
  if (origins === null) {
    // Allow all cross-origin requests (origin: true behaviour).
    return (_origin, callback) => callback(null, true);
  }

  return (origin, callback) => {
    // Same-origin requests (no Origin header) or listed origins are allowed.
    // Wildcard "*" is explicitly excluded even if someone adds it to the env var.
    if (!origin || (origin !== '*' && origins.has(origin))) {
      callback(null, origin || true);
    } else {
      callback(new Error(`CORS policy: origin '${origin}' is not allowed.`));
    }
  };
}

export const corsOptions = {
  origin: buildOriginCallback(allowedSet),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
};
