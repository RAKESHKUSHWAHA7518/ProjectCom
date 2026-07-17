# Requirements Document

## Introduction

SkillSwap is a full-stack skill-bartering web application (React + Vite frontend, Express + MongoDB backend, Socket.IO real-time) that is feature-complete and ready for production launch hardening. This document captures the requirements to make SkillSwap secure, reliable, observable, and deployable for real users. The scope covers security hardening, user-facing auth flows (email verification, password reset, welcome emails, password change), infrastructure readiness (health checks, logging, DB indexes, image optimization), deployment packaging (Docker, Nginx), and admin/trust tooling (admin dashboard, abuse reporting).

---

## Glossary

- **API**: The Express-based HTTP backend, currently running on port 5000.
- **Auth_Service**: The component responsible for user registration, login, Google OAuth, token issuance, and password management.
- **Email_Service**: The component responsible for sending transactional emails (verification, password reset, welcome).
- **Validation_Middleware**: Express middleware that validates and sanitizes incoming request bodies and parameters.
- **Rate_Limiter**: Express middleware that throttles requests per IP to prevent abuse.
- **CORS_Policy**: The Cross-Origin Resource Sharing configuration that controls which origins may call the API.
- **Security_Headers**: HTTP response headers that protect against common browser-based attacks, applied via Helmet.js.
- **Error_Handler**: Global Express error-handling middleware that catches unhandled errors and returns a structured response.
- **Logger**: The application-level structured logging component (Winston) and HTTP request logger (Morgan).
- **Health_Check**: The `/api/health` endpoint that reports service and database status.
- **Refresh_Token**: A long-lived (7-day) JWT stored in an HttpOnly cookie used to issue new access tokens.
- **Access_Token**: A short-lived (15-minute) JWT sent in the Authorization header for authenticated requests.
- **Admin_User**: A user with the `role: 'admin'` field set on their User document.
- **Upload_Service**: The component that handles avatar and file uploads via Multer.
- **Image_Optimizer**: The component (sharp) that resizes and compresses uploaded images.
- **Config_Validator**: Startup code that checks required environment variables are present before the server starts.
- **Docker_Image**: A containerized build artifact for the backend or frontend service.
- **Nginx_Proxy**: The reverse proxy that terminates TLS, serves the frontend static assets, and forwards `/api` requests to the backend.
- **Report**: A user-submitted abuse or content-flag record stored in the database.
- **Admin_Dashboard**: A protected frontend UI and corresponding API routes accessible only to Admin_Users.

---

## Requirements

### Requirement 1: HTTP Security Headers

**User Story:** As a security-conscious operator, I want all HTTP responses to include standard security headers, so that browsers are protected against XSS, clickjacking, MIME sniffing, and other common attacks.

#### Acceptance Criteria

1. THE API SHALL apply Helmet.js middleware globally, before any route handler, so that every HTTP response includes all security headers configured in criteria 2–7.
2. THE API SHALL set a `Content-Security-Policy` header that restricts `script-src` to `'self'` and any origins listed in the `TRUSTED_CDN_ORIGINS` environment variable (comma-separated, defaults to empty — only `'self'` when unset).
3. THE API SHALL set `X-Frame-Options: DENY` on all responses to prevent clickjacking.
4. THE API SHALL set `X-Content-Type-Options: nosniff` on all responses to prevent MIME-type sniffing.
5. THE API SHALL set `Referrer-Policy: strict-origin-when-cross-origin` on all responses.
6. IF `NODE_ENV` is `production`, THEN THE API SHALL set `Strict-Transport-Security: max-age=31536000; includeSubDomains` on all responses.
7. IF `NODE_ENV` is not `production`, THEN THE API SHALL NOT set the `Strict-Transport-Security` header.

---

### Requirement 2: CORS Lockdown

**User Story:** As a security-conscious operator, I want the API to reject cross-origin requests from unauthorized origins, so that third-party sites cannot make credentialed requests on behalf of users.

#### Acceptance Criteria

1. THE CORS_Policy SHALL parse the `ALLOWED_ORIGINS` environment variable as a comma-separated list of fully-qualified origin strings (e.g. `https://app.example.com,https://www.example.com`) and allow requests only from origins in that list; a wildcard `*` value SHALL be treated as no match.
2. WHEN a request arrives from an origin not in the `ALLOWED_ORIGINS` list, THE CORS_Policy SHALL reject it with HTTP 403.
3. THE CORS_Policy SHALL allow credentials (`withCredentials`) for listed origins.
4. THE CORS_Policy SHALL allow the HTTP methods `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, and `OPTIONS` and SHALL include `Content-Type`, `Authorization`, and `Cookie` in the `Access-Control-Allow-Headers` preflight response.
5. IF the `ALLOWED_ORIGINS` environment variable is not set or is absent from the environment, THEN THE Config_Validator SHALL log a fatal error listing the missing variable and SHALL exit the process with code 1.
6. IF the `ALLOWED_ORIGINS` environment variable is set but resolves to an empty string after trimming, THEN THE API SHALL start and SHALL allow all cross-origin requests to proceed (no origin filtering applied when the list is empty).

---

### Requirement 3: Input Validation on All API Endpoints

**User Story:** As a security-conscious operator, I want all API endpoints to validate and sanitize incoming data, so that malformed or malicious input cannot corrupt the database or trigger server errors.

#### Acceptance Criteria

1. THE Validation_Middleware SHALL validate the request body, query parameters, and route parameters for every API route before the controller executes; WHEN any validation fails, THE Validation_Middleware SHALL block the request entirely and SHALL NOT pass it to the controller.
2. IF the Validation_Middleware fails to initialize or throws during setup, THE API SHALL block the request entirely and return HTTP 500 before calling any controller.
3. IF the request body is absent or null on an endpoint that requires a body, THEN THE Validation_Middleware SHALL return HTTP 422 with the message "Request body is required".
4. WHEN a validation rule is violated, THE Validation_Middleware SHALL return HTTP 422 with a JSON body containing an `errors` array where each element has a `field` property and a `message` property.
5. THE Validation_Middleware SHALL strip fields not declared in the validation schema before passing the request to the controller (unknown-field stripping).
6. THE API SHALL validate that email fields match the RFC 5321 format.
7. THE API SHALL validate that password fields are at least 8 and at most 72 characters, and contain at least one uppercase letter, one lowercase letter, and one digit.
8. THE API SHALL validate that string fields subject to database storage have a maximum length of 1000 characters unless a higher limit is explicitly declared in that field's validation schema.
9. THE API SHALL sanitize string inputs to remove HTML tags and HTML-encoded entities (e.g. `&lt;`, `&#60;`) before storage.

---

### Requirement 4: Global Error Handling Middleware

**User Story:** As an operator, I want all unhandled errors to be caught centrally and returned as structured JSON responses, so that no internal stack trace is ever exposed to clients and all errors are consistently logged.

#### Acceptance Criteria

1. THE Error_Handler SHALL be registered as the last middleware in the Express application, after all routes and other middleware.
2. WHEN an unhandled error reaches THE Error_Handler, it SHALL set the HTTP status code on the response to the error's `statusCode` property if present, or 500 if absent, and return a JSON body with an `error` field containing a human-readable message.
3. IF `NODE_ENV` is `production`, THEN THE Error_Handler SHALL NOT include the error stack trace in the response body.
4. IF `NODE_ENV` is not `production`, THEN THE Error_Handler SHALL include the error stack trace in the `stack` field of the response body.
5. THE Error_Handler SHALL log every unhandled error using THE Logger at the `error` severity level, including the error message, stack trace, and request path.
6. WHEN a Mongoose `ValidationError` reaches THE Error_Handler, it SHALL return HTTP 422 with a JSON body containing an `errors` array with field-level details.
7. WHEN a MongoDB `CastError` (invalid ObjectId) reaches THE Error_Handler on a route not under `/api/auth/`, it SHALL return HTTP 400 with the message "Invalid ID format" — this includes routes under `/api/users/`.
8. WHEN a MongoDB `CastError` reaches THE Error_Handler on a route under `/api/auth/`, it SHALL return HTTP 401.

---

### Requirement 5: Refresh Token Rotation

**User Story:** As a user, I want my session to stay alive silently as long as I am active, so that I am not abruptly logged out after 15 minutes.

#### Acceptance Criteria

1. WHEN THE Auth_Service receives a valid Refresh_Token at `POST /api/auth/refresh`, it SHALL issue a new Access_Token and a new Refresh_Token, set the new Refresh_Token in the `jwt_refresh` HttpOnly cookie, and invalidate the previous Refresh_Token in one atomic operation.
2. THE Auth_Service SHALL store a hashed (SHA-256) version of the current valid Refresh_Token on the User document; no plaintext token SHALL be persisted.
3. IF the `jwt_refresh` cookie is absent, expired as a JWT, or does not match the stored hash, THEN THE Auth_Service SHALL return HTTP 401 with the message "Invalid or expired session".
4. WHEN a Refresh_Token that has already been rotated is presented (token reuse), THE Auth_Service SHALL return HTTP 401, clear the `jwt_refresh` cookie, and null-out the stored token hash on the User document.
5. WHEN a user calls `POST /api/auth/logout`, THE Auth_Service SHALL null-out the stored Refresh_Token hash on the User document and set the `jwt_refresh` cookie with `Max-Age=0` to expire it.
6. THE Auth_Service SHALL generate each Refresh_Token by combining a JWT payload with at least 32 bytes of cryptographically random data (via `crypto.randomBytes`).

---

### Requirement 6: Email Verification on Signup

**User Story:** As an operator, I want new users to verify their email address before accessing the platform, so that fake or mistyped email accounts are prevented.

#### Acceptance Criteria

1. WHEN a new user registers via `POST /api/auth/register`, THE Auth_Service SHALL create the account with `emailVerified: false` and SHALL attempt to send a verification email via THE Email_Service before returning the registration response.
2. IF THE Email_Service fails to send the verification email, THE Auth_Service SHALL log the error at `warn` level and SHALL return the registration success response anyway; the user will be able to request a resend.
3. THE Email_Service SHALL send a verification email containing a URL with a unique, SHA-256-hashed token stored on the User document, expiring 24 hours from creation.
4. WHEN a user presents a valid, unexpired, unused token at `GET /api/auth/verify-email?token=<token>`, THE Auth_Service SHALL set `emailVerified: true` on the User document and mark the token as used.
5. IF the token is expired or has already been used, THEN THE Auth_Service SHALL return HTTP 400 with the message "Verification link expired or already used".
6. WHEN a user attempts to log in and `emailVerified` is `false`, THE Auth_Service SHALL return HTTP 403 with the message "Please verify your email address".
7. THE API SHALL expose `POST /api/auth/resend-verification`, accessible only to unauthenticated users with an unverified email; it SHALL be rate-limited to 3 requests per hour per email address.
8. WHERE Google OAuth is used for signup, THE Auth_Service SHALL set `emailVerified: true` automatically.
9. WHEN a request lacking a valid Access_Token reaches a protected endpoint, THE API SHALL return HTTP 401 before any business logic executes.

---

### Requirement 7: Forgot Password / Reset Password Flow

**User Story:** As a user, I want to reset my password via email if I forget it, so that I can regain access to my account without contacting support.

#### Acceptance Criteria

1. WHEN a `POST /api/auth/forgot-password` request is received with a registered email, THE Auth_Service SHALL generate a 32-byte cryptographically random reset token, store its SHA-256 hash and a 1-hour expiry on the User document, and send a reset email containing the plaintext token in a URL link.
2. IF the email is not registered, THEN THE Auth_Service SHALL return HTTP 200 with the response body `{ "message": "If that email exists, a reset link has been sent." }` — identical to the success response.
3. THE `POST /api/auth/forgot-password` endpoint SHALL be rate-limited to 5 requests per hour per IP address; WHEN the limit is exceeded, THE Rate_Limiter SHALL return HTTP 429.
4. WHEN `POST /api/auth/reset-password` is called with a valid token and new password, THE Auth_Service SHALL atomically: (a) hash and store the new password, (b) clear the reset token and expiry, and (c) rotate the Refresh_Token. IF any step fails, all three changes SHALL be rolled back and the endpoint SHALL return HTTP 500.
5. IF the reset token is expired, already used, or does not match any stored hash, THEN THE Auth_Service SHALL return HTTP 400 with the message "Reset link is invalid or has expired".
6. THE Auth_Service SHALL enforce the password validation rules from Requirement 3, criterion 7 on the new password.
7. WHEN a password reset completes successfully, THE Auth_Service SHALL attempt to send a confirmation email; IF sending fails, THE Auth_Service SHALL log the error at `warn` level and SHALL NOT fail the reset response.

---

### Requirement 8: Welcome Email After Registration

**User Story:** As a new user, I want to receive a welcome email after successfully registering, so that I feel onboarded and know how to get started.

#### Acceptance Criteria

1. WHEN a new user's account is created via email registration or Google OAuth, THE Email_Service SHALL send a welcome email to the user's registered email address; the send attempt SHALL complete (succeed or fail) within 10 seconds.
2. THE welcome email SHALL include the user's display name, a link to the platform's home URL, and at least one call-to-action linking to the profile completion page.
3. IF THE Email_Service encounters any error (connection failure, timeout after 10 seconds, or SMTP error) when sending the welcome email, THE Auth_Service SHALL log the error at `warn` level and SHALL return the registration success response to the client without error.

---

### Requirement 9: Password Change from Profile

**User Story:** As a logged-in user, I want to change my password from my profile settings, so that I can update my credentials without logging out.

#### Acceptance Criteria

1. THE Auth_Service SHALL expose a `PUT /api/auth/change-password` endpoint protected by authentication middleware; unauthenticated requests SHALL receive HTTP 401.
2. WHEN a user submits `{ currentPassword, newPassword }`, THE Auth_Service SHALL verify `currentPassword` against the stored bcrypt hash before making any changes.
3. IF `currentPassword` does not match, THEN THE Auth_Service SHALL return HTTP 401 with the message "Current password is incorrect" without modifying any data.
4. IF `newPassword` is identical to `currentPassword`, THEN THE Auth_Service SHALL return HTTP 422 with the message "New password must differ from current password".
5. THE Auth_Service SHALL enforce the password validation rules from Requirement 3, criterion 7 on `newPassword`.
6. WHEN the password change is requested, THE Auth_Service SHALL atomically update the stored password hash and rotate the Refresh_Token. IF either operation fails, both changes SHALL be rolled back and the endpoint SHALL return HTTP 500.
7. WHEN the password change completes successfully (both atomic operations succeed), THE Auth_Service SHALL return HTTP 200 with `{ "message": "Password updated successfully" }`; IF the atomic operation fails, THE Auth_Service SHALL return HTTP 500 and SHALL NOT return HTTP 200.

---

### Requirement 10: Environment Configuration Validation

**User Story:** As an operator, I want the server to fail immediately on startup if required environment variables are missing, so that misconfigured deployments are caught before they serve traffic.

#### Acceptance Criteria

1. THE Config_Validator SHALL execute synchronously before the Express server calls `server.listen()`; WHEN all validations pass, THE server SHALL proceed to bind its port.
2. THE Config_Validator SHALL check for the presence and non-empty value of: `JWT_SECRET`, `JWT_REFRESH_SECRET`, `MONGO_URI`, `ALLOWED_ORIGINS`, `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_FROM`.
3. IF any required variable is missing or empty, THEN THE Config_Validator SHALL log to `stderr` a fatal error message listing every missing variable name and SHALL call `process.exit(1)`.
4. THE Config_Validator SHALL validate that `JWT_SECRET` and `JWT_REFRESH_SECRET` are each at least 32 characters long.
5. THE Config_Validator SHALL validate that `MONGO_URI` begins with `mongodb://` or `mongodb+srv://`.
6. THE Config_Validator SHALL validate that `EMAIL_PORT` is a numeric string representing an integer in the range 1–65535.
7. THE Config_Validator SHALL validate that each entry in `ALLOWED_ORIGINS` (comma-separated) begins with `http://` or `https://`.

---

### Requirement 11: Health Check Endpoint

**User Story:** As an operator, I want a `/api/health` endpoint, so that load balancers, container orchestrators, and uptime monitors can determine whether the service is healthy.

#### Acceptance Criteria

1. THE API SHALL expose a `GET /api/health` endpoint that does not require authentication and is not subject to rate limiting.
2. IF the MongoDB connection state is `connected`, THEN THE Health_Check SHALL return HTTP 200 with a JSON body: `{ "status": "ok", "uptime": <integer seconds>, "timestamp": "<ISO 8601 UTC>", "db": "connected", "version": "<package.json version>" }`.
3. IF the MongoDB connection state is `disconnected` or `error`, THEN THE Health_Check SHALL return HTTP 503 with a JSON body: `{ "status": "error", "db": "disconnected", "version": "<package.json version>" }`.
4. THE `version` field in both response shapes SHALL be read from the `version` field of `package.json` at startup and cached; it SHALL NOT trigger a file-system read on each request.

---

### Requirement 12: HTTP Request Logging and Application Logging

**User Story:** As an operator, I want structured request and application logs, so that I can diagnose production issues and monitor usage patterns.

#### Acceptance Criteria

1. THE API SHALL apply Morgan HTTP request logging middleware before all route handlers, outputting for each request: HTTP method, URL path, status code, response time in milliseconds, and remote IP address.
2. IF `NODE_ENV` is `production`, THEN THE Logger SHALL write all log entries as newline-delimited JSON objects to `stdout`; this format SHALL be strictly enforced based on `NODE_ENV` with no configuration overrides permitted.
3. IF `NODE_ENV` is not `production`, THEN THE Logger SHALL write log entries in a human-readable, colorized format to `stdout`; this format SHALL be strictly enforced based on `NODE_ENV` with no configuration overrides permitted and no JSON output option available in development.
4. THE Logger SHALL support the severity levels `error`, `warn`, `info`, and `debug`, with `info` as the default minimum level in production and `debug` as the default minimum level in development.
5. THE API SHALL emit an `info`-level log entry on successful startup that includes: bound port, `NODE_ENV` value, and MongoDB connection URI host (not credentials).
6. THE Error_Handler SHALL use THE Logger for all error-level log entries, including the error message, stack trace, and originating request path.

---

### Requirement 13: MongoDB Indexes

**User Story:** As an operator, I want indexes on frequently-queried fields, so that API response times remain acceptable as the dataset grows.

#### Acceptance Criteria

1. THE User model SHALL define a unique index on the `email` field.
2. THE Skill model SHALL define a compound index on `{ user: 1, type: 1 }`.
3. THE Skill model SHALL define a text index on the `name` and `category` fields to support full-text search queries.
4. THE Session model SHALL define an index on `participants` and a separate index on `scheduledAt`.
5. THE Message model SHALL define a compound index on `{ conversation: 1, createdAt: 1 }` to support paginated message retrieval ordered by time.
6. THE Notification model SHALL define a compound index on `{ user: 1, read: 1 }`.
7. THE Review model SHALL define an index on `reviewee`.

---

### Requirement 14: Image Optimization for Uploaded Avatars

**User Story:** As a user, I want my uploaded avatar to be stored efficiently, so that profile pages load quickly and storage costs are minimized.

#### Acceptance Criteria

1. WHEN a user uploads an avatar, THE Image_Optimizer SHALL resize the image to fit within a 400×400 pixel bounding box, preserving aspect ratio, regardless of the original dimensions; WHEN the original image is smaller than 400×400, THE Image_Optimizer SHALL upscale it to fill the 400×400 bounding box.
2. THE Image_Optimizer SHALL convert the resized image to WebP format at quality 80 and save it to the uploads directory with a `.webp` extension.
3. IF the uploaded file size exceeds 5 MB before any processing, THEN THE Upload_Service SHALL reject it with HTTP 413 and the message "File too large. Maximum size is 5 MB"; files under 5 MB, including 0-byte files, SHALL be accepted and processed normally.
4. THE Image_Optimizer SHALL delete the original unoptimized temporary file from disk after successfully writing the optimized file.
5. THE Upload_Service SHALL accept only the MIME types `image/jpeg`, `image/png`, `image/webp`, and `image/gif`; files with any other MIME type SHALL be rejected with HTTP 415 and the message "Unsupported file type. Allowed: JPEG, PNG, WebP, GIF".
6. IF THE Image_Optimizer throws an error during processing (e.g. corrupt file), THEN THE Upload_Service SHALL delete any partial output file, return HTTP 422 with the message "Image processing failed", and log the error at `error` level.

---

### Requirement 15: Docker and Docker Compose

**User Story:** As a DevOps operator, I want Docker images and a docker-compose configuration, so that the backend and frontend can be built and run in a reproducible containerized environment.

#### Acceptance Criteria

1. THE backend `Dockerfile` SHALL use `node:20-alpine` as its base image, install only production dependencies (`npm ci --omit=dev`), and run the Node process as a non-root user (UID ≥ 1000).
2. THE frontend `Dockerfile` SHALL use a multi-stage build: stage 1 (`node:20-alpine`) runs `npm run build`; stage 2 (`nginx:alpine`) copies the `dist/` output and serves it.
3. THE `docker-compose.yml` SHALL define three services: `backend`, `frontend`, and `mongodb`; `backend` SHALL declare `depends_on: mongodb` so Compose starts MongoDB before the backend.
4. THE `docker-compose.yml` SHALL declare a named volume (e.g. `mongo_data`) mounted at `/data/db` in the `mongodb` service to persist database state across container restarts.
5. THE `docker-compose.yml` SHALL reference a `.env` file via `env_file` on the `backend` service so all environment variables are injected at runtime without being hard-coded in the compose file.
6. WHEN `docker compose up` completes successfully, THE backend SHALL be accessible at `http://localhost:5000` and THE frontend SHALL be accessible at `http://localhost:80` from the host machine.

---

### Requirement 16: Frontend Build Optimization with Lazy Loading

**User Story:** As a user, I want the frontend to load quickly on first visit, so that I am not waiting for unnecessary JavaScript to download before seeing the page.

#### Acceptance Criteria

1. THE Frontend SHALL convert every page-level route component — `Dashboard`, `Explore`, `Profile`, `Sessions`, `Chat`, `VideoCall`, `Leaderboard`, and `Community` — to use `React.lazy()` with a dynamic `import()`.
2. WHEN a lazy-loaded route is loading, THE Frontend SHALL display a full-page loading fallback (spinner or skeleton) via a `React.Suspense` boundary wrapping the `Routes` component.
3. THE Vite production build output SHALL contain per-route JavaScript chunk files; no single lazy-loaded page chunk SHALL exceed 250 kB uncompressed.
4. WHEN a user hovers over a navigation link, THE Frontend SHALL immediately call `import()` on the corresponding route module to preload it, regardless of hover duration.

---

### Requirement 17: Nginx Reverse Proxy Configuration

**User Story:** As a DevOps operator, I want an Nginx reverse proxy configuration, so that HTTPS termination, API forwarding, and static asset serving are handled correctly in production.

#### Acceptance Criteria

1. THE Nginx_Proxy SHALL serve files from `/usr/share/nginx/html` for all requests not matched by the `/api/` or `/socket.io/` location blocks.
2. THE Nginx_Proxy SHALL proxy requests whose path begins with `/api/` to the backend at `http://backend:5000`, preserving the original `Host`, `X-Real-IP`, and `X-Forwarded-For` headers.
3. THE Nginx_Proxy SHALL proxy requests whose path begins with `/socket.io/` to the backend, including WebSocket upgrade headers (`Upgrade` and `Connection`).
4. THE Nginx_Proxy SHALL serve `index.html` (with HTTP 200) for any GET request not matched by a static file, API route, or socket route, enabling React Router's client-side routing.
5. THE Nginx_Proxy SHALL enable gzip compression (`gzip on`) for `text/html`, `text/css`, `application/javascript`, and `application/json` with a minimum length of 1024 bytes.
6. THE Nginx_Proxy SHALL set `Cache-Control: public, max-age=31536000, immutable` only for static files whose name contains a content hash (matched by the pattern `~* "\.[0-9a-f]{8,}\.(js|css|woff2?)$"`).

---

### Requirement 18: Admin Dashboard

**User Story:** As an Admin_User, I want an admin dashboard with user management and platform statistics, so that I can monitor the health of the platform and take action on bad actors.

#### Acceptance Criteria

1. THE API SHALL expose all admin routes under the `/api/admin/` prefix, protected by middleware that reads the authenticated user's `role`; any request where `role !== 'admin'` SHALL receive HTTP 403 before any controller logic runs.
2. THE `GET /api/admin/users` endpoint SHALL return a paginated list of users (default page size 20, maximum 100) with fields: `id`, `name`, `email`, `role`, `createdAt`, `emailVerified`, `isActive`; it SHALL support query parameters `name`, `email`, and `role` as case-insensitive partial-match filters.
3. THE `PATCH /api/admin/users/:id/status` endpoint SHALL allow an Admin_User to set `isActive: true` or `isActive: false` on a User document. WHEN `isActive` is set to `false`, THE Auth_Service SHALL return HTTP 403 with the message "Your account has been deactivated" on any subsequent login or token-refresh attempt by that user.
4. THE `GET /api/admin/stats` endpoint SHALL return: total users, total skills, total sessions, total communities, and count of users with `createdAt` within the last 30 days.
5. THE `GET /api/admin/reports` endpoint SHALL return paginated open Reports (status `"open"`), including `reporterId`, `reportedUserId`, `reason`, `details`, and `createdAt`.
6. THE Admin_Dashboard frontend page at `/admin` SHALL be accessible only to users with `role === 'admin'`; all other authenticated users SHALL be shown an access-denied error page at `/admin` without redirection, and unauthenticated users SHALL be redirected to `/login`.

---

### Requirement 19: Abuse / Report User Feature

**User Story:** As a user, I want to report another user for abusive behavior, so that the platform remains safe and the admin team is aware of misconduct.

#### Acceptance Criteria

1. THE API SHALL expose `POST /api/reports`, requiring a valid Access_Token; unauthenticated requests SHALL receive HTTP 401. The request body SHALL accept: `reportedUserId` (required, valid MongoDB ObjectId), `reason` (required, one of: `spam`, `harassment`, `inappropriate_content`, `fake_profile`, `other`), and `details` (optional string, max 500 characters).
2. WHEN a valid report is submitted, THE API SHALL create a Report document with: `reporterId` (authenticated user's ID), `reportedUserId`, `reason`, `details`, `status: "open"`, and `createdAt` set to the current UTC timestamp.
3. THE API SHALL rate-limit `POST /api/reports` to 5 successful submissions per user per 24-hour rolling window; WHEN the limit is exceeded, THE Rate_Limiter SHALL return HTTP 429 with the message "Report limit reached. Try again in 24 hours."
4. IF `reportedUserId` equals the authenticated user's own ID, THEN THE API SHALL return HTTP 400 with the message "You cannot report yourself".
5. IF `reportedUserId` does not correspond to an existing User document, THEN THE API SHALL return HTTP 404 with the message "Reported user not found".
6. WHEN an Admin_User calls `PATCH /api/admin/reports/:id` with `{ "status": "resolved" }` or `{ "status": "dismissed" }`, THE API SHALL update the Report's `status`, set `resolvedBy` to the admin's user ID, and set `resolvedAt` to the current UTC timestamp.
7. THE `GET /api/admin/reports` response (Requirement 18, criterion 5) SHALL include a top-level `openCount` field with the total number of Reports where `status === "open"`, for use as a badge count in the admin navigation.

---
