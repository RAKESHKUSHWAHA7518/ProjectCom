/**
 * validateEnv.js
 * Validates required environment variables before the server starts.
 * Call this synchronously before server.listen().
 */

const REQUIRED_VARS = [
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'MONGO_URI',
  'ALLOWED_ORIGINS',
  'EMAIL_HOST',
  'EMAIL_PORT',
  'EMAIL_USER',
  'EMAIL_PASS',
  'EMAIL_FROM',
];

export function validateEnv() {
  const errors = [];

  // 1. Presence and non-empty check for all required variables
  for (const varName of REQUIRED_VARS) {
    const value = process.env[varName];
    if (value === undefined || value === null || value.trim() === '') {
      errors.push(`${varName}: missing or empty`);
    }
  }

  // Only run deeper validations for variables that are present and non-empty
  const get = (name) => (process.env[name] ?? '').trim();

  // 2. JWT_SECRET must be >= 32 characters
  const jwtSecret = get('JWT_SECRET');
  if (jwtSecret.length > 0 && jwtSecret.length < 32) {
    errors.push(`JWT_SECRET: must be at least 32 characters (got ${jwtSecret.length})`);
  }

  // 3. JWT_REFRESH_SECRET must be >= 32 characters
  const jwtRefreshSecret = get('JWT_REFRESH_SECRET');
  if (jwtRefreshSecret.length > 0 && jwtRefreshSecret.length < 32) {
    errors.push(`JWT_REFRESH_SECRET: must be at least 32 characters (got ${jwtRefreshSecret.length})`);
  }

  // 4. MONGO_URI must start with mongodb:// or mongodb+srv://
  const mongoUri = get('MONGO_URI');
  if (mongoUri.length > 0 && !mongoUri.startsWith('mongodb://') && !mongoUri.startsWith('mongodb+srv://')) {
    errors.push(`MONGO_URI: must begin with "mongodb://" or "mongodb+srv://" (got "${mongoUri}")`);
  }

  // 5. EMAIL_PORT must be numeric and in range 1–65535
  const emailPort = get('EMAIL_PORT');
  if (emailPort.length > 0) {
    const portNum = Number(emailPort);
    if (!Number.isInteger(portNum) || portNum < 1 || portNum > 65535) {
      errors.push(`EMAIL_PORT: must be a numeric integer in range 1–65535 (got "${emailPort}")`);
    }
  }

  // 6. Each comma-separated entry in ALLOWED_ORIGINS must begin with http:// or https://
  //    (skip if ALLOWED_ORIGINS is empty string)
  const allowedOrigins = get('ALLOWED_ORIGINS');
  if (allowedOrigins.length > 0) {
    const origins = allowedOrigins.split(',').map((o) => o.trim()).filter((o) => o.length > 0);
    for (const origin of origins) {
      if (!origin.startsWith('http://') && !origin.startsWith('https://')) {
        errors.push(`ALLOWED_ORIGINS: entry "${origin}" must begin with "http://" or "https://"`);
      }
    }
  }

  if (errors.length > 0) {
    process.stderr.write(
      `[validateEnv] Server startup aborted — environment configuration errors:\n${errors.map((e) => `  - ${e}`).join('\n')}\n`
    );
    process.exit(1);
  }
}
