# Implementation Plan: Production Launch Hardening

## Overview

This plan hardens SkillSwap for a real-user production launch. Tasks follow the dependency
chain from foundational infrastructure (env validation, logging, error handling) through
security middleware, database schema updates, new auth flows, input validation, image
optimization, admin tooling, frontend changes, and finally Docker/Nginx packaging. Property-
based tests using fast-check are co-located with the code they verify. The final task wires
everything together in `server.js`.

All code is JavaScript (ES Modules, `"type": "module"`). Backend runtime: Node 20 + Express 5
+ Mongoose 9. Frontend: React 19 + Vite.

---

## Tasks

- [x] 1. Foundation — env validation, logger, Morgan, global error handler
  - [x] 1.1 Create `backend/config/validateEnv.js`
    - Export a `validateEnv()` function that runs synchronously before `server.listen`
    - Check for presence and non-empty value of: `JWT_SECRET`, `JWT_REFRESH_SECRET`, `MONGO_URI`, `ALLOWED_ORIGINS`, `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_FROM`
    - Validate `JWT_SECRET` and `JWT_REFRESH_SECRET` are each ≥ 32 characters
    - Validate `MONGO_URI` begins with `mongodb://` or `mongodb+srv://`
    - Validate `EMAIL_PORT` is numeric and in range 1–65535
    - Validate each comma-separated entry in `ALLOWED_ORIGINS` begins with `http://` or `https://`
    - If any check fails, log all failing variable names to `stderr` and call `process.exit(1)`
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7_

  - [x] 1.2 Create `backend/utils/logger.js`
    - Install `winston` (already listed for install in task 4.1 — consume here)
    - Export a singleton Winston logger instance
    - In `production` (`NODE_ENV === 'production'`): write newline-delimited JSON to `stdout`
    - In non-production: write human-readable colorized output to `stdout`
    - Minimum level: `info` in production, `debug` in development
    - Support levels: `error`, `warn`, `info`, `debug`
    - _Requirements: 12.2, 12.3, 12.4_

  - [x] 1.3 Create `backend/middleware/errorHandler.js`
    - Export `globalErrorHandler(err, req, res, next)` — this MUST be registered last in `server.js`
    - Log every error via the Winston logger with `error` level, including `message`, `stack`, and `req.path`
    - Map `err.statusCode` (if 400–599) to response status; default to 500
    - In `production`: omit `stack` from the response body
    - In non-production: include `stack` in the response body as a `stack` field
    - Handle Mongoose `ValidationError` → HTTP 422 with `{ errors: [{field, message}] }` array
    - Handle MongoDB `CastError` on `/api/auth/` paths → HTTP 401 `{ error: 'Not authorized' }`
    - Handle MongoDB `CastError` on all other paths (including `/api/users/`) → HTTP 400 `{ error: 'Invalid ID format' }`
    - All responses include a top-level `error` field with a human-readable string message
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8_

  - [ ]* 1.4 Write property test for error handler status code mapping (Property 6)
    - File: `backend/__tests__/unit/errorHandler.test.js`
    - **Property 6: Error Handler Status Code Mapping**
    - **Validates: Requirements 4.2**
    - Use `fc.integer({ min: 400, max: 599 })` to generate valid `statusCode` values and assert the response status matches
    - Use `fc.oneof(fc.integer({ min: 100, max: 399 }), fc.integer({ min: 600, max: 999 }), fc.constant(undefined))` for non-error codes and assert the response status is 500
    - Each case asserts the response body always contains a non-empty string `error` field
    - Run with `numRuns: 100`

- [ ] 2. Security middleware — Helmet, CORS, rate limiting
  - [x] 2.1 Create `backend/config/corsOptions.js`
    - Parse `ALLOWED_ORIGINS` env var as a comma-separated list of fully-qualified origin strings
    - Export a `corsOptions` object suitable for passing to the `cors()` middleware
    - Allow credentials for listed origins; reject all others (do not pass `Access-Control-Allow-Origin` for unlisted origins)
    - Allow methods: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `OPTIONS`
    - Allow headers: `Content-Type`, `Authorization`, `Cookie`
    - Treat wildcard `*` as no match — never allow `*` as an origin
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [ ]* 2.2 Write property test for CORS origin filtering (Property 2)
    - File: `backend/__tests__/unit/corsOptions.test.js`
    - **Property 2: CORS Origin Filtering**
    - **Validates: Requirements 2.1, 2.2**
    - Use `fc.array(fc.webUrl(), { minLength: 1, maxLength: 10 })` to generate random allowed-origin sets
    - Use `fc.webUrl()` to generate an arbitrary test origin
    - For any origin IN the allowed set: assert `Access-Control-Allow-Origin` would be set to that origin
    - For any origin NOT IN the allowed set: assert the CORS callback passes an error (denied)
    - Run with `numRuns: 100`

  - [x] 2.3 Add Helmet.js configuration in `backend/config/helmetOptions.js`
    - Export a `helmetOptions` object for `helmet(helmetOptions)` in `server.js`
    - Build CSP `script-src` from `'self'` + any comma-separated origins in `TRUSTED_CDN_ORIGINS` env var (defaults to empty — only `'self'` when unset)
    - Set `X-Frame-Options: DENY`
    - Set `X-Content-Type-Options: nosniff`
    - Set `Referrer-Policy: strict-origin-when-cross-origin`
    - Enable HSTS only when `NODE_ENV === 'production'`: `max-age=31536000; includeSubDomains`
    - Export a separate pure function `buildCspHeader(trustedOrigins: string[]): string` used to construct the CSP value (needed for property test)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_

  - [ ]* 2.4 Write property test for CSP directive construction (Property 1)
    - File: `backend/__tests__/unit/cspBuilder.test.js`
    - **Property 1: CSP Directive Construction**
    - **Validates: Requirements 1.2**
    - Import and test the `buildCspHeader(origins)` pure function
    - Use `fc.array(fc.webUrl(), { minLength: 0, maxLength: 10 })` to generate trusted CDN origin lists
    - Parse the returned CSP string and extract the `script-src` directive values
    - Assert: the extracted set equals `new Set(["'self'", ...origins])` — exactly `'self'` plus each provided origin, no more, no fewer
    - Run with `numRuns: 100`

  - [x] 2.5 Update rate-limiting configuration in `backend/routes/authRoutes.js`
    - Add a `forgotPasswordLimiter`: 5 requests per hour per IP (`POST /api/auth/forgot-password`)
    - Add a `resendVerificationLimiter` per-email: 3 requests per hour per email — key generator reads `req.body.email`
    - Existing `authLimiter` (15 req/15 min) stays on `/register`, `/login`, `/google`
    - _Requirements: 6.7, 7.3_

- [x] 3. Database — User model additions, Report model, all indexes
  - [x] 3.1 Update `backend/models/User.js` — add new auth/account fields
    - Add to schema (after existing fields, do NOT remove any existing fields):
      ```js
      emailVerified:            { type: Boolean, default: false }
      emailVerificationToken:   { type: String,  default: null }
      emailVerificationExpiry:  { type: Date,    default: null }
      passwordResetToken:       { type: String,  default: null }
      passwordResetExpiry:      { type: Date,    default: null }
      refreshTokenHash:         { type: String,  default: null }
      isActive:                 { type: Boolean, default: true }
      role:                     { type: String,  enum: ['user','admin'], default: 'user' }
      ```
    - Add explicit unique index on `email` field (it already has `unique: true` on the field — add `userSchema.index({ email: 1 }, { unique: true })` explicitly)
    - _Requirements: 5.2, 5.4, 6.1, 6.8, 7.1, 13.1, 18.1, 18.3_

  - [x] 3.2 Create `backend/models/Report.js`
    - Fields: `reporterId` (ObjectId, required, ref User), `reportedUserId` (ObjectId, required, ref User), `reason` (String, required, enum: `['spam','harassment','inappropriate_content','fake_profile','other']`), `details` (String, maxlength 500, default `''`), `status` (String, enum: `['open','resolved','dismissed']`, default `'open'`), `resolvedBy` (ObjectId, ref User, default null), `resolvedAt` (Date, default null)
    - Enable `timestamps: true`
    - Add indexes: `{ status: 1, createdAt: -1 }` and `{ reportedUserId: 1 }`
    - _Requirements: 19.2, 18.5, 19.6, 19.7_

  - [x] 3.3 Add missing indexes to existing models
    - `Skill` model (`backend/models/Skill.js`): add `skillSchema.index({ user: 1, type: 1 })` and `skillSchema.index({ name: 'text', category: 'text' })`
    - `Session` model (`backend/models/Session.js`): add `sessionSchema.index({ participants: 1 })` (note: Session uses `mentor`/`learner` separately; add index on both fields) and `sessionSchema.index({ scheduledAt: 1 })`
    - `Message` model (`backend/models/Message.js`): add `messageSchema.index({ conversation: 1, createdAt: 1 })`
    - `Notification` model (`backend/models/Notification.js`): add `notificationSchema.index({ user: 1, read: 1 })`
    - `Review` model (`backend/models/Review.js`): add `reviewSchema.index({ reviewee: 1 })` (the existing unique index on `{ session, reviewer }` is preserved)
    - _Requirements: 13.2, 13.3, 13.4, 13.5, 13.6, 13.7_

- [x] 4. Install new backend dependencies
  - [x] 4.1 Run `npm install` in `backend/` to add all required new production packages
    - Install: `helmet@^8.0.0`, `morgan@^1.10.0`, `winston@^3.17.0`, `nodemailer@^6.9.0`, `sharp@^0.34.0`, `express-validator@^7.2.0`
    - Verify all packages appear in `backend/package.json` under `dependencies` with pinned minor versions
    - Install dev dependency for tests: `fast-check@^3.23.0`, `mongodb-memory-server@^10.1.0`
    - Verify the project still starts after install (`node --check server.js`)
    - _Requirements: 1.1 (Helmet), 12.1 (Morgan), 12.2 (Winston), 8.1 (Nodemailer), 14.2 (sharp), 3.1 (express-validator)_

- [x] 5. Email service — Nodemailer transporter + 4 template functions
  - [x] 5.1 Create `backend/services/emailService.js`
    - Create the Nodemailer transporter once at module load using `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`; set `secure: true` only when port is 465; set `connectionTimeout: 10_000` and `greetingTimeout: 10_000`
    - Implement `sendVerificationEmail(user, plainToken)`: send HTML email with a verification URL `${FRONTEND_URL}/verify-email?token=<plainToken>` valid 24 h; log send errors at `warn` level; do NOT propagate errors to callers
    - Implement `sendWelcomeEmail(user)`: send HTML email with user's `name`, a link to `FRONTEND_URL`, and a call-to-action button linking to `${FRONTEND_URL}/profile`; complete (succeed or fail) within 10 s; log errors at `warn`
    - Implement `sendPasswordResetEmail(user, plainToken)`: send HTML email with reset URL `${FRONTEND_URL}/reset-password?token=<plainToken>` valid 1 h; log errors at `warn`
    - Implement `sendPasswordResetConfirmEmail(user)`: send HTML confirmation notice; log errors at `warn`
    - All four functions are async and wrapped individually in try/catch
    - _Requirements: 6.2, 6.3, 7.1, 7.7, 8.1, 8.2, 8.3_

- [x] 6. Auth flows — refresh token rotation, email verification, forgot/reset password, password change
  - [x] 6.1 Refactor token generation helpers in `backend/controllers/authController.js`
    - Change `generateRefreshToken(id)` to use `JWT_REFRESH_SECRET` (currently incorrectly uses `JWT_SECRET`)
    - Add `crypto.randomBytes(32).toString('hex')` as the `jti` claim in the refresh token JWT payload (defense-in-depth randomness)
    - Add helper `hashToken(token)`: returns `crypto.createHash('sha256').update(token).digest('hex')`
    - Update `generateToken(id)` to use `JWT_SECRET` and 15 m expiry (already correct, verify)
    - _Requirements: 5.1, 5.2, 5.6_

  - [x] 6.2 Implement refresh token rotation in `registerUser`, `loginUser`, `googleLogin`, and `refreshToken`
    - In `registerUser`: after creating user, call `generateRefreshToken`, hash it, save `refreshTokenHash` on the user doc atomically, set cookie, return access token; also call `sendVerificationEmail` and `sendWelcomeEmail` (non-blocking); set `emailVerified: false` (default); for Google OAuth set `emailVerified: true`
    - In `loginUser`: check `user.isActive === false` → HTTP 403 "Your account has been deactivated"; check `user.emailVerified === false` → HTTP 403 "Please verify your email address"; on success generate + hash + store new refresh token
    - In `googleLogin`: set `emailVerified: true` on new user creation; generate + hash + store refresh token; call `sendWelcomeEmail` (non-blocking)
    - In `refreshToken` controller: verify cookie JWT with `JWT_REFRESH_SECRET`; find user; compute hash of incoming token; compare to `refreshTokenHash`; if mismatch (reuse attack) → null-out `refreshTokenHash`, clear cookie, return HTTP 401 "Invalid or expired session"; if match → generate new access + refresh tokens, hash + store new refresh token atomically using `findOneAndUpdate` with current hash in query filter, set new cookie
    - In `logoutUser`: null-out `refreshTokenHash` on the user doc; set `jwt_refresh` cookie `Max-Age=0`
    - Also update `authMiddleware.js`: after finding the user, check `user.isActive === false` → return HTTP 403 "Your account has been deactivated"
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 6.1, 6.6, 6.8, 8.1, 18.3_

  - [x] 6.3 Implement email verification endpoints (`verifyEmail`, `resendVerification`)
    - In `authController.js`, add `verifyEmail(req, res)`:
      - Accept `GET /api/auth/verify-email?token=<plainToken>`
      - Hash the incoming token; find a user where `emailVerificationToken` matches and `emailVerificationExpiry > now`
      - If found: set `emailVerified: true`, null-out token + expiry, save → HTTP 200 `{ message: 'Email verified successfully' }`
      - If not found or expired: HTTP 400 "Verification link expired or already used"
    - Add `resendVerification(req, res)`:
      - Accept `POST /api/auth/resend-verification` with `{ email }` in body
      - Find user by email; if user does not exist or is already verified → HTTP 200 (no info leak)
      - Generate new 32-byte random token, hash it, set `emailVerificationToken` + `emailVerificationExpiry` (now + 24 h), save
      - Call `sendVerificationEmail(user, plainToken)` (non-blocking)
      - Return HTTP 200 `{ message: 'Verification email sent if account exists' }`
    - Register both routes in `authRoutes.js`: `GET /verify-email` and `POST /resend-verification` (with `resendVerificationLimiter`)
    - _Requirements: 6.3, 6.4, 6.5, 6.7_

  - [x] 6.4 Implement forgot password and reset password endpoints
    - Add `forgotPassword(req, res)` in `authController.js`:
      - Accept `POST /api/auth/forgot-password` with `{ email }`
      - Always return HTTP 200 `{ message: "If that email exists, a reset link has been sent." }` regardless of whether the email is registered (no info leak)
      - If user found: generate 32-byte crypto token, hash it, store `passwordResetToken` + `passwordResetExpiry` (now + 1 h) on user, call `sendPasswordResetEmail(user, plainToken)` (non-blocking)
    - Add `resetPassword(req, res)` in `authController.js`:
      - Accept `POST /api/auth/reset-password` with `{ token, newPassword }`
      - Hash incoming token; find user where `passwordResetToken` matches and `passwordResetExpiry > now`
      - If not found/expired: HTTP 400 "Reset link is invalid or has expired"
      - Atomically: (a) hash + store new password, (b) clear `passwordResetToken` + `passwordResetExpiry`, (c) null-out `refreshTokenHash`; if any step throws, return HTTP 500
      - Call `sendPasswordResetConfirmEmail(user)` (non-blocking, log warn on failure)
      - Return HTTP 200 `{ message: 'Password reset successful' }`
    - Register routes in `authRoutes.js`: `POST /forgot-password` (with `forgotPasswordLimiter`) and `POST /reset-password`
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_

  - [x] 6.5 Implement password change endpoint (`changePassword`)
    - Add `changePassword(req, res)` in `authController.js`:
      - Accept `PUT /api/auth/change-password` — protected by `protect` middleware
      - Body: `{ currentPassword, newPassword }`
      - Verify `currentPassword` matches stored bcrypt hash via `user.matchPassword()`; if not → HTTP 401 "Current password is incorrect"
      - If `newPassword === currentPassword` → HTTP 422 "New password must differ from current password"
      - Atomically update stored password hash and null-out `refreshTokenHash`; on any failure roll back and return HTTP 500
      - On success: HTTP 200 `{ message: 'Password updated successfully' }`
    - Register route in `authRoutes.js`: `PUT /change-password` (protected)
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7_

  - [ ]* 6.6 Write property test for refresh token rotation and reuse detection (Property 7)
    - File: `backend/__tests__/integration/authRotation.test.js`
    - **Property 7: Refresh Token Rotation and Reuse Detection**
    - **Validates: Requirements 5.1, 5.4**
    - Use `mongodb-memory-server` for an isolated in-memory MongoDB
    - Use `fc.integer({ min: 1, max: 50 })` to vary the number of successful rotation cycles
    - Property (a): after N successful rotations, the (N-1)th token must be rejected with HTTP 401
    - Property (b): the Nth (current) token must still be accepted
    - Property (c): if the (N-1)th rotated token is presented a second time, the response is HTTP 401 AND `user.refreshTokenHash` is null
    - Run with `numRuns: 100`

  - [ ]* 6.7 Write property test for token expiry invariant (Property 8)
    - File: `backend/__tests__/integration/authRotation.test.js` (add to same file)
    - **Property 8: Token Expiry Invariant**
    - **Validates: Requirements 6.3, 7.1**
    - For email verification tokens: use `fc.date()` to generate creation timestamps; assert token accepted before TTL (24 h), rejected at or after TTL
    - For password reset tokens: assert token accepted before 1 h TTL, rejected at or after
    - Run with `numRuns: 100`

  - [ ]* 6.8 Write property test for email verification round-trip (Property 9)
    - File: `backend/__tests__/integration/authRotation.test.js` (add to same file)
    - **Property 9: Email Verification Round-Trip**
    - **Validates: Requirements 6.4, 6.5**
    - Generate arbitrary user registrations via fast-check arbitraries
    - Assert: presenting the correct token before expiry sets `emailVerified: true`
    - Assert: presenting the same token a second time returns HTTP 400
    - Run with `numRuns: 100`

  - [ ]* 6.9 Write property test for password change pre-check invariant (Property 10)
    - File: `backend/__tests__/integration/authRotation.test.js` (add to same file)
    - **Property 10: Password Change Pre-Check Invariant**
    - **Validates: Requirements 9.2, 9.3**
    - Use `fc.string({ minLength: 1, maxLength: 72 })` to generate arbitrary incorrect `currentPassword` values
    - Filter out any that actually match the stored hash (extremely unlikely with random strings)
    - Assert: any non-matching `currentPassword` → HTTP 401, and the stored password hash in the DB is byte-for-byte identical before and after the request
    - Run with `numRuns: 100`

- [x] 7. Input validation — express-validator chains for all auth routes + report route
  - [x] 7.1 Create `backend/validators/authValidators.js`
    - Export named validator arrays for each auth endpoint using `express-validator`:
      - `validateRegister`: `name` (non-empty, ≤ 1000 chars, strip HTML), `email` (RFC 5321 format), `password` (8–72 chars, ≥ 1 uppercase, ≥ 1 lowercase, ≥ 1 digit)
      - `validateLogin`: `email` (valid format), `password` (non-empty)
      - `validateForgotPassword`: `email` (valid format)
      - `validateResetPassword`: `token` (non-empty), `newPassword` (same rules as password above)
      - `validateChangePassword`: `currentPassword` (non-empty), `newPassword` (same password rules)
      - `validateResendVerification`: `email` (valid format)
    - Each validator uses `.trim().escape()` on string fields to strip HTML tags and encoded entities (Requirement 3.9)
    - Add a shared `handleValidationErrors(req, res, next)` middleware that runs `validationResult(req)` and returns HTTP 422 `{ errors: [{field, message}] }` if errors exist; calls `next()` otherwise
    - _Requirements: 3.1, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9_

  - [x] 7.2 Create `backend/validators/reportValidators.js`
    - Export `validateReport`: `reportedUserId` (non-empty, valid MongoDB ObjectId), `reason` (required, one of `['spam','harassment','inappropriate_content','fake_profile','other']`), `details` (optional, max 500 chars, strip HTML)
    - Import and re-export `handleValidationErrors` from `authValidators.js`
    - _Requirements: 3.1, 3.4, 3.9, 19.1_

  - [x] 7.3 Wire validators into `backend/routes/authRoutes.js`
    - Import `validateRegister`, `validateLogin`, `validateForgotPassword`, `validateResetPassword`, `validateChangePassword`, `validateResendVerification`, and `handleValidationErrors` from `../validators/authValidators.js`
    - Add validator middleware arrays (then `handleValidationErrors`) to the appropriate routes:
      - `POST /register` → `[authLimiter, ...validateRegister, handleValidationErrors, registerUser]`
      - `POST /login` → `[authLimiter, ...validateLogin, handleValidationErrors, loginUser]`
      - `POST /forgot-password` → `[forgotPasswordLimiter, ...validateForgotPassword, handleValidationErrors, forgotPassword]`
      - `POST /reset-password` → `[...validateResetPassword, handleValidationErrors, resetPassword]`
      - `PUT /change-password` → `[protect, ...validateChangePassword, handleValidationErrors, changePassword]`
      - `POST /resend-verification` → `[resendVerificationLimiter, ...validateResendVerification, handleValidationErrors, resendVerification]`
    - _Requirements: 3.1, 3.4_

  - [ ]* 7.4 Write property tests for validation error response shape, email/password validators, and HTML sanitization (Properties 3, 4, 5)
    - File: `backend/__tests__/unit/validators.test.js`
    - **Property 3: Validation Error Response Shape** — **Validates: Requirements 3.4**
      - Use `fc.record({ field: fc.string({ minLength: 1 }), message: fc.string({ minLength: 1 }) })` to generate arrays of error objects
      - For any request that fails one or more validator rules, assert: response is HTTP 422, body has `errors` array, every element has non-empty `field` and non-empty `message`
    - **Property 4: Email and Password Field Validation** — **Validates: Requirements 3.6, 3.7**
      - Email: use `fc.emailAddress()` for valid inputs (assert accepted) and `fc.string()` filtered to contain no `@` for invalid (assert rejected)
      - Password: use `fc.stringMatching(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).{8,72}$/)` for valid (assert accepted); use `fc.oneof(fc.stringMatching(/.{0,7}/), fc.stringMatching(/.{73,}/))` for length-violating strings (assert rejected)
    - **Property 5: HTML Sanitization Invariant** — **Validates: Requirements 3.9**
      - Use `fc.string()` augmented with HTML tag injection (e.g., appending `<script>`) to generate dirty inputs
      - Run the sanitized value through the validator chain and assert the output contains no `<`, `>`, or HTML entity patterns
    - Run each property with `numRuns: 100`

- [x] 8. Image optimization — sharp pipeline replacing current upload middleware
  - [x] 8.1 Create `backend/utils/imageOptimizer.js`
    - Export `optimizeAvatar(inputPath, outputDir, filename)`:
      - Use `sharp` to read `inputPath`, resize to fit within 400×400 (`.resize(400, 400, { fit: 'inside' })`), convert to WebP at quality 80 (`.webp({ quality: 80 })`), write to `outputDir/<filename>.webp`
      - After successful write, delete the original `inputPath` using `fs.promises.unlink`
      - If `sharp` throws (e.g. corrupt file): delete any partial output file (if it exists), log error at `error` level via Winston logger, throw an error with message "Image processing failed"
      - Return the relative path of the saved `.webp` file (used to update `user.avatar`)
    - _Requirements: 14.1, 14.2, 14.4, 14.6_

  - [x] 8.2 Update `backend/middleware/uploadMiddleware.js`
    - Replace the current `checkFileType` function with a proper MIME type allowlist: accept only `image/jpeg`, `image/png`, `image/webp`, `image/gif`
    - For any other MIME type: call `cb(new Error('Unsupported file type. Allowed: JPEG, PNG, WebP, GIF'))` — the error should carry `statusCode: 415`
    - Add Multer `limits: { fileSize: 5 * 1024 * 1024 }` (5 MB); Multer will throw a `MulterError` with `code: 'LIMIT_FILE_SIZE'` — ensure the global error handler maps this to HTTP 413 "File too large. Maximum size is 5 MB"
    - Switch storage to `multer.memoryStorage()` or keep `diskStorage` but update `filename` to include a `.tmp` suffix so `imageOptimizer` can overwrite with the final `.webp`
    - _Requirements: 14.3, 14.5_

  - [x] 8.3 Update avatar upload handler in `backend/controllers/userController.js`
    - After Multer saves the temp file, call `optimizeAvatar(tempPath, uploadsDir, userId)` from `imageOptimizer.js`
    - On success: update `user.avatar` to the returned `.webp` path; save user
    - On HTTP 415 error from Multer `fileFilter`: propagate with `statusCode: 415`
    - On HTTP 413 error from Multer size limit: propagate with `statusCode: 413`
    - On `optimizeAvatar` failure: call `next(error)` with `statusCode: 422`
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6_

  - [ ]* 8.4 Write property tests for image resize dimension invariant and MIME type rejection (Properties 11, 12)
    - File: `backend/__tests__/unit/imageOptimizer.test.js`
    - **Property 11: Image Resize Dimension Invariant** — **Validates: Requirements 14.1, 14.2**
      - Use `fc.tuple(fc.integer({ min: 1, max: 4000 }), fc.integer({ min: 1, max: 4000 }))` to generate arbitrary (W, H) pairs
      - Create real in-memory pixel buffers with `sharp({ create: { width: W, height: H, channels: 3, background: { r: 0, g: 0, b: 0 } } })`
      - Run through `optimizeAvatar` and read the output metadata
      - Assert: output `width ≤ 400`, output `height ≤ 400`, and `|width/height − W/H| < 0.01`
    - **Property 12: Upload MIME Type Rejection** — **Validates: Requirements 14.5**
      - Use `fc.string()` filtered to exclude the four allowed MIME types
      - Assert: the Multer `fileFilter` callback is called with a non-null error before any file is written to disk
    - Run each property with `numRuns: 100`

- [x] 9. Health check endpoint
  - [x] 9.1 Create `backend/controllers/healthController.js`
    - At module load, read `version` from `package.json` and cache it in a module-level const (no per-request file read)
    - Export `getHealth(req, res)`:
      - Check `mongoose.connection.readyState === 1` (connected)
      - If connected: HTTP 200 `{ status: 'ok', uptime: Math.floor(process.uptime()), timestamp: new Date().toISOString(), db: 'connected', version }`
      - If not connected: HTTP 503 `{ status: 'error', db: 'disconnected', version }`
    - _Requirements: 11.1, 11.2, 11.3, 11.4_

  - [x] 9.2 Create `backend/routes/healthRoutes.js`
    - Single route: `GET /` → `getHealth` (no auth, no rate limiting)
    - This file is imported in `server.js` as `app.use('/api/health', healthRoutes)`
    - _Requirements: 11.1_

- [x] 10. Admin backend — adminMiddleware, adminController, adminRoutes, reportController, reportRoutes
  - [x] 10.1 Create `backend/middleware/adminMiddleware.js`
    - Export `adminOnly(req, res, next)` middleware
    - Requires `protect` to have already run (so `req.user` is populated)
    - If `req.user.role !== 'admin'` → HTTP 403 `{ error: 'Admin access required' }`
    - Otherwise call `next()`
    - _Requirements: 18.1_

  - [x] 10.2 Create `backend/controllers/adminController.js`
    - `getUsers(req, res)`: paginated user list (`page`, `pageSize` default 20 max 100); support query params `name`, `email`, `role` as case-insensitive partial-match filters (`$regex`, `$options: 'i'`); return `{ users: [...], total, page, pageSize }` with fields: `id`, `name`, `email`, `role`, `createdAt`, `emailVerified`, `isActive`
    - `updateUserStatus(req, res)`: `PATCH /api/admin/users/:id/status` with `{ isActive: true|false }`; validate `isActive` is boolean; update the user doc; return HTTP 200 with updated user
    - `getStats(req, res)`: return `{ totalUsers, totalSkills, totalSessions, totalCommunities, newUsersLast30Days }` — use `Promise.all` for parallel aggregation queries
    - `getReports(req, res)`: paginated open reports (`status: 'open'`); include `openCount` top-level field; fields: `reporterId`, `reportedUserId`, `reason`, `details`, `createdAt`
    - `updateReport(req, res)`: `PATCH /api/admin/reports/:id` with `{ status: 'resolved'|'dismissed' }`; set `resolvedBy: req.user._id` and `resolvedAt: new Date()`
    - _Requirements: 18.2, 18.3, 18.4, 18.5, 19.6, 19.7_

  - [ ]* 10.3 Write property test for admin pagination result count invariant (Property 13)
    - File: `backend/__tests__/integration/adminPagination.test.js`
    - **Property 13: Admin Pagination Result Count Invariant**
    - **Validates: Requirements 18.2**
    - Use `mongodb-memory-server`; seed with a randomly generated count of users (via `fc.integer({ min: 0, max: 300 })`)
    - Use `fc.tuple(fc.integer({ min: 1, max: 20 }), fc.integer({ min: 1, max: 100 }))` for `(page, pageSize)` combinations
    - Assert: `response.data.users.length <= pageSize` for all combinations
    - Assert: `response.data.users.length <= total` (never returns more users than exist)
    - Run with `numRuns: 100`

  - [x] 10.4 Create `backend/controllers/reportController.js`
    - `createReport(req, res)`: protected endpoint; validate `reportedUserId !== req.user._id` (else HTTP 400 "You cannot report yourself"); look up reported user — if not found HTTP 404 "Reported user not found"; create Report document with `reporterId`, `reportedUserId`, `reason`, `details`, `status: 'open'`, `createdAt: now`; return HTTP 201 with created report
    - _Requirements: 19.1, 19.2, 19.4, 19.5_

  - [x] 10.5 Create `backend/routes/reportRoutes.js` and `backend/routes/adminRoutes.js`
    - `reportRoutes.js`: `POST /` → `[protect, reportRateLimiter, ...validateReport, handleValidationErrors, createReport]`
      - `reportRateLimiter`: 5 successful submissions per user per 24-h rolling window (key: `req.user._id.toString()`)
    - `adminRoutes.js`: all routes prefixed with `[protect, adminOnly]`
      - `GET /users` → `getUsers`
      - `PATCH /users/:id/status` → `updateUserStatus`
      - `GET /stats` → `getStats`
      - `GET /reports` → `getReports`
      - `PATCH /reports/:id` → `updateReport`
    - _Requirements: 18.1, 18.2, 18.3, 18.4, 18.5, 19.1, 19.3_

  - [ ]* 10.6 Write property test for report creation round-trip (Property 14)
    - File: `backend/__tests__/integration/reports.test.js`
    - **Property 14: Report Creation Round-Trip**
    - **Validates: Requirements 19.1, 19.2**
    - Use `mongodb-memory-server`; seed one reporter user and one reportee user
    - Use `fc.constantFrom('spam', 'harassment', 'inappropriate_content', 'fake_profile', 'other')` for reason, and `fc.option(fc.string({ maxLength: 500 }))` for details
    - For each generated valid submission, call `createReport` and query the DB directly
    - Assert: created doc has `reporterId === reporter._id`, `reportedUserId === reportee._id`, `reason === submitted reason`, `status === 'open'`, and `Math.abs(doc.createdAt - requestTime) < 5000`
    - Run with `numRuns: 100`

- [x] 11. Frontend — new pages (ForgotPassword, ResetPassword, VerifyEmail, AdminDashboard, AdminRoute component)
  - [x] 11.1 Create `frontend/src/pages/ForgotPassword.jsx`
    - Form with a single email input
    - On submit: `POST /api/auth/forgot-password` with `{ email }`
    - Show success message "If that email exists, a reset link has been sent." regardless of server response (mirror backend's no-info-leak behavior)
    - Show error toast on network failure
    - Link back to `/login`
    - _Requirements: 7.1, 7.2_

  - [x] 11.2 Create `frontend/src/pages/ResetPassword.jsx`
    - Read `?token=` from URL query string using `useSearchParams`
    - Form with `newPassword` and `confirmNewPassword` fields
    - Client-side: validate passwords match before submission
    - On submit: `POST /api/auth/reset-password` with `{ token, newPassword }`
    - On success: show success toast, redirect to `/login` after 2 s
    - On error: show server error message
    - _Requirements: 7.4, 7.5_

  - [x] 11.3 Create `frontend/src/pages/VerifyEmail.jsx`
    - Read `?token=` from URL query string using `useSearchParams`
    - On component mount: call `GET /api/auth/verify-email?token=<token>`
    - Show loading spinner while request is in flight
    - On success (HTTP 200): show "Email verified! Redirecting to login..." and redirect to `/login` after 2 s
    - On failure (HTTP 400): show "Verification link expired or already used." with a link to request a new one (`/resend-verification` or trigger `POST /api/auth/resend-verification`)
    - _Requirements: 6.4, 6.5_

  - [x] 11.4 Create `frontend/src/pages/AdminDashboard.jsx`
    - Fetch and display paginated user list from `GET /api/admin/users` (with `name`/`email`/`role` filter inputs)
    - Fetch and display platform stats from `GET /api/admin/stats` (`totalUsers`, `totalSkills`, `totalSessions`, `totalCommunities`, `newUsersLast30Days`)
    - Fetch and display open reports from `GET /api/admin/reports` with the `openCount` badge in the section heading
    - "Deactivate" / "Activate" buttons call `PATCH /api/admin/users/:id/status`
    - "Resolve" / "Dismiss" buttons on reports call `PATCH /api/admin/reports/:id`
    - Show loading and error states for each section independently
    - _Requirements: 18.2, 18.3, 18.4, 18.5, 19.5, 19.6, 19.7_

  - [x] 11.5 Create `frontend/src/components/AdminRoute.jsx`
    - Import `useAuthStore` from `../store/authStore`
    - If `!user` → `<Navigate to="/login" replace />` (unauthenticated users redirected to login)
    - If `user.role !== 'admin'` → render an inline access-denied error message (e.g. "Access Denied — You do not have permission to view this page") without redirecting the user
    - Otherwise render `children`
    - _Requirements: 18.6_

  - [x] 11.6 Update `frontend/src/store/authStore.js`
    - Ensure the `user` object returned by login/register endpoints includes the `role` field; store it in the Zustand state
    - Add logic to watch for 403 "Your account has been deactivated" response from the refresh endpoint: call `logout()` automatically and redirect to `/login`
    - _Requirements: 18.3, 18.6_

- [x] 12. Frontend — lazy loading + route hover preloading refactor of App.jsx
  - [x] 12.1 Refactor `frontend/src/App.jsx` — convert all page routes to `React.lazy()`
    - Remove all static page imports for: `Dashboard`, `Explore`, `Profile`, `Sessions`, `Chat`, `VideoCall`, `Leaderboard`, `Community`
    - Also lazily import all new pages: `ForgotPassword`, `ResetPassword`, `VerifyEmail`, `AdminDashboard`
    - Keep `Login` and `Register` as eager imports (they are on the critical path for unauthenticated users)
    - Wrap the entire `<Routes>` block with `<Suspense fallback={<PageLoader />}>` where `PageLoader` is a full-screen centered spinner defined in the same file or imported from `components/PageLoader.jsx`
    - Add the new routes:
      - `<Route path="/forgot-password" element={<ForgotPassword />} />`
      - `<Route path="/reset-password" element={<ResetPassword />} />`
      - `<Route path="/verify-email" element={<VerifyEmail />} />`
      - `<Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />`
    - _Requirements: 16.1, 16.2, 18.6_

  - [x] 12.2 Add hover preloading to `Navbar` in `frontend/src/App.jsx`
    - For each nav `<Link>`, add an `onMouseEnter` handler
    - On `onMouseEnter`: immediately call the matching dynamic `import()` for that route's module (same module path used in `React.lazy`) — no delay timer needed
    - The preload import map should cover: Dashboard, Explore, Profile, Sessions, Chat, Leaderboard, Community
    - _Requirements: 16.4_

- [x] 13. Docker + Nginx packaging
  - [x] 13.1 Create `backend/Dockerfile`
    - Base image: `node:20-alpine`
    - `WORKDIR /app`
    - Copy `package*.json` and run `npm ci --omit=dev`
    - Copy remaining source files
    - Run as non-root user: `USER node` (UID 1000, already present in node:alpine)
    - `EXPOSE 5000`
    - `CMD ["node", "server.js"]`
    - _Requirements: 15.1_

  - [x] 13.2 Create `frontend/Dockerfile`
    - Stage 1 (`builder`): base `node:20-alpine`; `WORKDIR /app`; copy `package*.json`; `npm ci`; copy source; `npm run build`
    - Stage 2 (`production`): base `nginx:alpine`; copy `dist/` from builder to `/usr/share/nginx/html`; copy `nginx.conf` to `/etc/nginx/conf.d/default.conf`; `EXPOSE 80`; `CMD ["nginx", "-g", "daemon off;"]`
    - _Requirements: 15.2_

  - [x] 13.3 Create `nginx.conf` at project root (or `frontend/nginx.conf`)
    - `listen 80; server_name _;`
    - Enable gzip: `gzip on; gzip_min_length 1024; gzip_types text/html text/css application/javascript application/json;`
    - Immutable cache block: `location ~* "\.[0-9a-f]{8,}\.(js|css|woff2?)$"` → `add_header Cache-Control "public, max-age=31536000, immutable"; try_files $uri =404;`
    - API proxy: `location /api/` → `proxy_pass http://backend:5000;` with `proxy_set_header Host $host; X-Real-IP $remote_addr; X-Forwarded-For $proxy_add_x_forwarded_for;`
    - Socket.IO proxy: `location /socket.io/` → `proxy_pass http://backend:5000;` with `proxy_http_version 1.1; Upgrade $http_upgrade; Connection "upgrade"; Host $host;`
    - SPA fallback: `location /` → `try_files $uri $uri/ /index.html;`
    - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5, 17.6_

  - [x] 13.4 Create `docker-compose.yml` at project root
    - Three services: `mongodb` (image `mongo:7`, volume `mongo_data:/data/db`, `restart: unless-stopped`), `backend` (build `./backend`, `env_file: ./backend/.env`, `depends_on: [mongodb]`, port `5000:5000`, `restart: unless-stopped`), `frontend` (build `./frontend`, port `80:80`, `depends_on: [backend]`)
    - Named volume `mongo_data`
    - Bridge network `app-network` attached to all three services
    - _Requirements: 15.3, 15.4, 15.5, 15.6_

- [x] 14. Property-based tests — fast-check for all remaining correctness properties
  - (Properties 1–12 and 14 are covered in tasks 1.4, 2.2, 2.4, 6.6–6.9, 7.4, 8.4, 10.6. This task covers Property 13 which was already included in 10.3.)
  - [x] 14.1 Set up the test infrastructure in `backend/`
    - Create `backend/__tests__/unit/` and `backend/__tests__/integration/` directories (as needed by earlier tasks)
    - Add test script to `backend/package.json`: `"test": "node --test --experimental-test-coverage"` (Node built-in test runner)
    - Add `"test:unit": "node --test __tests__/unit/**/*.test.js"` and `"test:integration": "node --test __tests__/integration/**/*.test.js"`
    - Create `backend/__tests__/setup.js` with shared `mongodb-memory-server` lifecycle hooks (`beforeAll`/`afterAll`) for integration tests
    - Verify all property test files from tasks 1.4, 2.2, 2.4, 6.6–6.9, 7.4, 8.4, 10.3, 10.6 exist and run without errors
    - _Requirements: All property-tested requirements (see individual property tasks)_

- [x] 15. Checkpoint — all tests pass before final wiring
  - Ensure all unit and integration tests pass: `npm test` in `backend/`
  - Verify no import errors from newly created modules: `node --check server.js` in `backend/`
  - Ask the user if any questions arise before proceeding to the final server.js wiring task.

- [x] 16. server.js wiring — final middleware stack reordering, register all new routes
  - [x] 16.1 Rewrite `backend/server.js` middleware and route registration
    - Call `validateEnv()` (from `config/validateEnv.js`) synchronously as the very first statement before any `app.use()` or `server.listen()`
    - Import and apply Winston logger for the startup log (after env validated)
    - Add `morgan` HTTP logging middleware (import format string and Winston stream) immediately after `cors`
    - Replace the current wide-open `cors({ origin: true })` with `cors(corsOptions)` from `config/corsOptions.js`
    - Add `helmet(helmetOptions)` from `config/helmetOptions.js` as the first `app.use()` call
    - Preserve the existing middleware order for `express.json`, `express.urlencoded`, `cookieParser`, and `express.static('/uploads')`
    - Register all new routes:
      - `app.use('/api/health', healthRoutes)` — no auth, no rate limit
      - `app.use('/api/reports', reportRoutes)` — protected + rate-limited
      - `app.use('/api/admin', adminRoutes)` — protected + admin-only
      - Existing auth routes now include new endpoints added in tasks 6.3–6.5
    - Register `globalErrorHandler` as the very last `app.use()`, after all routes
    - Emit startup `info` log: bound port, `NODE_ENV`, and MongoDB URI host (credentials stripped)
    - Update the Socket.IO `cors` config to use the same `ALLOWED_ORIGINS` list (no more wildcard `*`)
    - _Requirements: 1.1, 2.1, 4.1, 10.1, 11.1, 12.1, 12.5, 18.1, 19.1_

- [x] 17. Final checkpoint — end-to-end sanity check
  - Run `npm test` in `backend/` — all property-based and unit tests must pass
  - Run `node --check server.js` in `backend/` — zero syntax/import errors
  - Run `npm run build` in `frontend/` — verify Vite produces per-route chunk files with no chunk exceeding 250 kB uncompressed
  - Ensure all tests pass, ask the user if questions arise.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP — they will not be auto-implemented
- Each task references specific requirements for traceability
- Property tests use `fast-check` with `numRuns: 100` (min) and the Node built-in test runner
- Integration tests use `mongodb-memory-server` for full isolation — no shared Atlas cluster needed
- The `generateRefreshToken` function currently uses `JWT_SECRET` — task 6.1 fixes this critical bug to use `JWT_REFRESH_SECRET`
- Tasks 3.1 and 6.2 must both land before any auth endpoint tests can pass — order strictly
- Docker tasks (13.x) are purely additive and have no runtime dependencies on earlier tasks beyond the code being complete
- The `nginx.conf` file should be placed at `frontend/nginx.conf` so the frontend `Dockerfile` can `COPY nginx.conf /etc/nginx/conf.d/default.conf`

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["1.3", "2.1", "2.3", "3.1", "4.1"] },
    { "id": 2, "tasks": ["1.4", "2.2", "2.4", "2.5", "3.2", "3.3", "5.1"] },
    { "id": 3, "tasks": ["6.1", "7.1", "7.2", "9.1", "9.2", "10.1"] },
    { "id": 4, "tasks": ["6.2", "7.3", "8.1", "10.2", "10.4"] },
    { "id": 5, "tasks": ["6.3", "6.4", "6.5", "8.2", "10.3", "10.5", "10.6"] },
    { "id": 6, "tasks": ["6.6", "6.7", "6.8", "6.9", "7.4", "8.3", "11.1", "11.2", "11.3", "11.5"] },
    { "id": 7, "tasks": ["8.4", "11.4", "11.6", "14.1"] },
    { "id": 8, "tasks": ["12.1", "13.1", "13.2", "13.3"] },
    { "id": 9, "tasks": ["12.2", "13.4"] },
    { "id": 10, "tasks": ["16.1"] }
  ]
}
```
