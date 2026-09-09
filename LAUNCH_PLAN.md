# SkillSwap — Market Launch Readiness Plan

> **Generated:** September 2026
> **Scope:** Full-stack audit (frontend + backend) to identify what blocks a real-user launch.
> **Verdict:** The app is a strong **MVP/demo** but is **NOT safe to launch** to real users yet. Several critical security, data-integrity, and legal blockers exist.

---

## 🔴 P0 — Critical Security (launch-blocking)

These must be fixed before exposing the app to any real user or public URL.

| # | Issue | Where | Risk | Fix |
|---|-------|-------|------|-----|
| 1.1 | **Real secrets committed to git** — MongoDB Atlas password, Resend API key, JWT secrets are in `backend/.env` and `.env` is tracked | `backend/.env` (tracked in repo) | Full DB takeover, email abuse | Rotate ALL keys NOW. Remove `.env` from git (`git rm --cached backend/.env`), add to `.gitignore`, use `.env.example` templates |
| 1.2 | **Hardcoded weak JWT secrets** — `supersecretjwtkey_override_in_production` (36 chars but a known public string) | `backend/.env:4,15` | Token forgery → full account takeover | Generate 64-char random secrets via `openssl rand -hex 64`, inject via env, never commit |
| 1.3 | **Google OAuth token NOT verified** — `else { payload = jwt.decode(credential) }` runs when `GOOGLE_CLIENT_ID` missing; decodes without signature check | `backend/controllers/authController.js:155-164` | Anyone can forge a Google identity and log in as any user | Remove dev fallback. Require `GOOGLE_CLIENT_ID` + `verifyIdToken()` in production; add env validation |
| 1.4 | **`VITE_GOOGLE_CLIENT_ID` empty** — Google login button will never work in prod | `frontend/.env:5` | Broken social login | Set real client ID; configure authorized origins |
| 1.5 | **`VITE_SENTRY_DSN` empty** — no production error visibility | `frontend/.env:3` | Silent prod failures (you saw "motion is not defined" type errors only in console) | Create Sentry project, add DSN, wire upload-sourcemaps |
| 1.6 | **Avatar uploads to local disk** — `uploads/` via multer won't persist/work on Vercel/serverless or multi-instance | `backend/uploads/`, `server.js:52` | Images lost, broken avatars in prod | Move to S3 / Cloudinary / Cloudflare R2 |
| 1.7 | **No brute-force / abuse protection on refresh-token reuse detection beyond DB flag** — OK but in-memory rate limiter won't scale | `middleware/rateLimiter.js` (default MemoryStore) | Rate limits reset per instance; bypass on restart | Use `rate-limit-redis` store for horizontal scaling |

---

## 🟠 P1 — Broken / Incomplete Features (launch-blocking)

Features that are half-built: the frontend sends data the backend ignores, or the backend has no matching endpoint. Real users will hit these immediately.

| # | Issue | Evidence | Fix |
|---|-------|----------|-----|
| 2.1 | **Dev commit shows completed but many features are frontend-only** — no dispute route, no block/unblock endpoint, no search-alerts endpoint | `routes/` has no `disputeRoutes.js`; `reportStore.blockUser` calls `/users/:id/block` (no backend); `DisputeModal` calls `/disputes` (no backend) | Build `Dispute` model + controller + routes; add `POST/DELETE /api/users/:id/block` |
| 2.2 | **Recurring sessions ignored** — frontend sends `isRecurring`, `recurrenceRule`, `recurrenceEnd`, `duration`, `template` but `Session` model only stores `notes`/`scheduledAt` | `backend/models/Session.js` vs `frontend/components/SessionScheduler.jsx` | Add fields to Session model + series creation logic |
| 2.3 | **Credits are never deducted/verified server-side** — `bookSession` deducts locally in the frontend only | `backend/controllers/sessionController.js:createSession` has no credit logic; `sessionStore.js` deducts client-side | Implement server-side credit ledger (atomic), reject booking when balance insufficient |
| 2.4 | **Mentor "explore" filter fields (`instantBook`, `verifiedOnly`, `price`, `sessionLength`, `language`) have no backend support** — `userController` explore doesn't filter by them | `frontend/pages/Explore.jsx` params vs backend | Add matching query filters or remove UI until backed |
| 2.5 | **Notifications 500 loop** — treated as endpoint error; frontend now swallows it, hiding the real failure | `notificationController` + the earlier browser 500s | Reproduce and fix root cause; the store silently returning `[]` masks issues |
| 2.6 | **No admin queue for reports/reviews/disputes** — report/flag/dispute are fire-and-forget with no moderation UI completion | `backend/controllers/reportController.js` (860 bytes), `adminController.js` | Complete admin moderation flow: list → resolved/action → notify reporter+target |
| 2.7 | **Session templates, duration, buffer-time conflicts** are UI-only | `SessionScheduler.jsx` (frontend) | Persist template/duration; add conflict detection query on booking |

---

## 🟡 P2 — Legal & Compliance (launch-blocking)

Required before taking money or data from real users.

| # | Requirement | Status | Action |
|---|-------------|--------|--------|
| 3.1 | **Terms of Service** | ❌ None | Draft + make click-to-accept at signup |
| 3.2 | **Privacy Policy** | ❌ None | Draft; detail data collection (email, location, session data, messages) |
| 3.3 | **Cookie/consent banner** (GDPR/CCPA) | ❌ None | Add consent banner; document analytics cookies |
| 3.4 | **Data deletion / export (right to erasure)** | ⚠️ Account delete exists, no export | Add "Download my data" endpoint |
| 3.5 | **Email sender SPF/DKIM + domain** — currently `hello@skillexchange.fun` via Resend | ✅ present | Verify domain; set up so transactional email lands in inbox not spam |
| 3.6 | **Age/gated content & safety for minors** if allowing under-18 | ❌ None | Add age gate + moderation policy |

---

## 🟢 P3 — Product & Growth (post-launch, high ROI)

Once P0–P2 are done, these drive activation/retention.

| # | Improvement | Why | Effort |
|---|-------------|-----|--------|
| 4.1 | **Landing page** — current root is an app login wall; no public marketing page with SEO/OG | First impression + organic acquisition | Medium |
| 4.2 | **SEO meta + OpenGraph + sitemap** | Discoverability | Low |
| 4.3 | **Analytics** (PostHog/Plausible) — track activation funnel (signup → profile → first session) | You can't improve what you don't measure | Medium |
| 4.4 | **Onboarding completion nudge** — many users stop after signup; measure and reduce drop-off | Activation | Medium |
| 4.5 | **Empty-state seed content** — new users see zero mentors/communities; add "featured mentors" placeholders or seed data | First 10 minutes determines retention | Low |
| 4.6 | **Referral program** | Viral growth | Medium |
| 4.7 | **Push/email notifications** (session reminders, digests) | Reduce no-shows, re-engage | Medium |
| 4.8 | **Payment/monetization** (Stripe Connect for paid sessions) — the credits barter system has no revenue | Sustainability | High |

---

## 🔵 P4 — DevOps / Reliability (ongoing)

| # | Improvement | Why |
|---|-------------|-----|
| 5.1 | **CI/CD** (GitHub Actions: lint → test → build → deploy) | Catch regressions automatically |
| 5.2 | **Real test coverage** — backend has a few unit tests; frontend has **zero** tests | Prevent silent breakage like the `Sparkles`/`Users` missing-import crashes |
| 5.3 | **API versioning** (`/api/v1`) | Safe API evolution |
| 5.4 | **Redis cache** for search/leaderboard | Scale beyond one instance |
| 5.5 | **Logger + structured logs + central collection** (already Winston) → ship to a service | Debug prod issues |
| 5.6 | **Backup strategy for MongoDB Atlas** | Data safety |
| 5.7 | **`.gitignore` hygiene** — `dist/`, `dev-dist/`, `uploads/`, `node_modules/` seen untracked/leaking | Keep repo clean |
| 5.8 | **ESLint `.eslintignore` deprecated** — migrate to `eslint.config.js` `globalIgnores` (already added `dev-dist`; remove stray `.eslintignore`) | Remove warning |

---

## 🚦 Suggested Execution Order

```
Week 1  — Rotate secrets, remove .env from git, fix Google OAuth, set Sentry + Cloudinary (P0)
Week 2  — Fix feature parity: disputes, block, credits ledger, session fields, notifications root cause (P1)
Week 3  — Legal: ToS, Privacy, consent, data export (P2)
Week 4  — Landing page + SEO + analytics + seed content (P3 quick wins)
Week 5+ — CI/CD, frontend tests, monetization
```

---

## 📋 Top 10 highest-impact items (do first)

1. **Rotate & un-commit ALL secrets** (`.env`) — `git rm --cached`, rotate Mongo password + Resend key + JWT secrets
2. **Require `GOOGLE_CLIENT_ID` verification** — remove the `jwt.decode` dev fallback
3. **Implement server-side credit ledger** — no client-side-only deductions
4. **Fix the notifications 500** root cause (don't just swallow errors)
5. **Add missing backend endpoints** — `disputes`, `block/unblock`, search alerts
6. **Persist session fields** the frontend already sends (duration, template, recurrence)
7. **Move avatar uploads to Cloudinary/S3**
8. **Legal pages** (ToS, Privacy, consent banner)
9. **Landing page + SEO + OG tags**
10. **Wire up Sentry DSN + Google Client ID**

---

*This plan supersedes the feature-by-feature `IMPROVEMENTS.md` roadmap for launch decisions. Use it as the canonical "go/no-go" checklist before exposing to real users.*