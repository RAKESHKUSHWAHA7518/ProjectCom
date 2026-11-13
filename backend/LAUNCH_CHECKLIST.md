# ProjectCom Backend - Launch Checklist

## ✅ Already Built (Production-Ready)

| Module | Status | Key Features |
|--------|--------|--------------|
| **Auth** | ✅ Complete | Register, login, JWT + refresh rotation, email verification, password reset, Google OAuth |
| **User Profiles** | ✅ Complete | Skills (teach/learn), availability, settings, verification, badges, social links |
| **Sessions** | ✅ Complete | Booking, recurring (RRULE), conflict detection, credits, WebRTC rooms, notes |
| **Matching** | ✅ Complete | Skill relevance + swap bonus + social proof + rating + reliability |
| **Chat** | ✅ Complete | Real-time, conversations, typing indicators, file uploads |
| **Notifications** | ✅ Complete | In-app + email + socket.io push, read status |
| **Communities** | ✅ Complete | Posts, replies, likes, categories, membership |
| **Reviews/Disputes** | ✅ Complete | Post-session reviews, dispute resolution, reporting |
| **Challenges/Stats** | ✅ Complete | Weekly challenges, personal/platform analytics, leaderboards |
| **Search/Alerts** | ✅ Complete | Global search, saved alerts with frequency |
| **Admin/Moderation** | ✅ Complete | Admin panel, user management, pagination |
| **Security** | ✅ Complete | Helmet, CORS, rate limiting, sanitization, input validation |

---

## 🔴 Critical for Launch (Do This Week)

### 1. Email Templates (2 hours)
**File:** `services/emailService.js`
- Current: Plain text / minimal HTML
- Need: Branded HTML templates for:
  - Welcome email
  - Session request/confirmation/reminder
  - Password reset
  - Verification
  - Review request

### 2. Payment Integration (1-2 days)
**Files:** New `services/paymentService.js`, `routes/paymentRoutes.js`
- Stripe integration for:
  - Buy skill credits
  - Mentor payouts (Stripe Connect)
  - Webhook handling
- Model updates: Add `stripeCustomerId`, `stripeAccountId` to User

### 3. TURN Server for WebRTC (4 hours)
**Required for video calls to work behind NAT/firewalls**

| Option | Cost | Setup |
|--------|------|-------|
| **Twilio Network Traversal** | $0.004/min | 30 min |
| **coturn on VPS** | $5/mo | 2 hrs |
| **Cloudflare Calls** | Free (beta) | 1 hr |

**Update in `server.js`:**
```javascript
const io = new Server(server, {
  cors: { ... },
  // Add ICE servers for WebRTC
  // Client will need these in RTCPeerConnection config
});
```

### 4. Production Environment (30 min)
```bash
cp .env.example .env.production
```
**Required vars:**
```env
NODE_ENV=production
MONGO_URI=mongodb+srv://...
JWT_SECRET=64-char-hex
JWT_REFRESH_SECRET=64-char-hex
ALLOWED_ORIGINS=https://yourdomain.com
EMAIL_HOST=smtp.resend.com
EMAIL_PASS=re_xxx
CLOUDINARY_CLOUD_NAME=xxx
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx
REDIS_URL=rediss://...
FRONTEND_URL=https://yourdomain.com
```

### 5. Health Checks (1 hour)
**Endpoint:** `GET /api/health` (exists)
- Add: MongoDB ping, Redis ping, disk space, memory
- Return: `{ status: 'ok', checks: { db: true, redis: true } }`

### 6. Error Tracking (30 min)
**Add Sentry (free tier):**
```bash
npm install @sentry/node
```
```javascript
// server.js top
import * as Sentry from '@sentry/node';
Sentry.init({ dsn: process.env.SENTRY_DSN, environment: process.env.NODE_ENV });
```

---

## 🟡 High Value (Week 1 Post-Launch)

| Feature | File | Effort | Impact |
|---------|------|--------|--------|
| **Semantic Search** | `controllers/searchController.js` | 4 hrs | Better discovery than regex |
| **Onboarding Guide** | New `controllers/onboardingController.js` | 3 hrs | Higher profile completion |
| **Match Explanations** | `controllers/matchController.js` | 2 hrs | Trust/transparency |
| **Session Reminders** | New cron job / worker | 3 hrs | Reduce no-shows |
| **Review Prompts** | `controllers/sessionController.js` | 1 hr | More reviews |

---

## 🟢 Nice to Have (Later)

| Feature | Trigger |
|---------|---------|
| Calendar Sync (Google/Outlook) | 100+ active users |
| Mentor Payouts (Stripe Connect) | Mentors earning $ |
| Mobile Push (Expo/FCM) | Mobile app exists |
| AI Session Summaries | 1K+ sessions/month |
| Referral Program | Growth phase |

---

## Minimum Viable Launch Commands

```bash
# 1. Run tests
npm run test:integration
npm run test:unit

# 2. Build production
npm ci --production

# 3. Deploy (Render/Railway/Fly.io)
# - Set env vars from .env.production
# - Add Redis addon
# - Configure custom domain

# 4. Verify
curl https://api.yourdomain.com/api/health
# Should return: {"status":"ok","checks":{"db":true,"redis":true}}
```

---

## Architecture Notes for Scale

| Component | Current | Scale Plan |
|-----------|---------|------------|
| **Database** | MongoDB Atlas | Sharding by userId at 1M users |
| **Cache** | Redis (rate limits) | Cluster mode at 10K concurrent |
| **WebSocket** | Single server | Redis adapter + multiple workers |
| **File Upload** | Cloudinary | Direct upload + CDN |
| **Email** | Resend | Dedicated IP at 100K emails/mo |
| **Video** | Peer-to-peer + TURN | SFU (MediaSoup) at 100 concurrent calls |

---

## Quick Wins (30 min each)

- [ ] Add `X-Response-Time` header middleware
- [ ] Add request ID logging (correlation IDs)
- [ ] Add API versioning (`/api/v1/...`)
- [ ] Add robots.txt / security.txt
- [ ] Add rate limit headers to responses
- [ ] Add DB indexes for common queries (check `explain()`)

---

## Decision: Launch Now vs Wait

**Launch now if:**
- Core loop works: discover → match → book → meet → review
- You can handle support manually for first 50 users
- Payment can be manual (Stripe dashboard) for first month

**Wait if:**
- WebRTC fails without TURN (test on mobile + different networks)
- Email delivery fails (test Resend domain verification)
- Any integration test fails

---

## Post-Launch Metrics to Track

| Metric | Target (Month 1) |
|--------|------------------|
| Signup → Profile Complete | > 40% |
| Profile Complete → First Session | > 20% |
| Session Completion Rate | > 85% |
| 7-day Retention | > 30% |
| Avg Sessions/User | > 2 |
| Match → Booking Conversion | > 15% |

---

## Files to Create for Launch

```
backend/
├── services/
│   ├── paymentService.js      # Stripe integration
│   └── emailTemplates/        # HTML email templates
├── routes/
│   └── paymentRoutes.js       # POST /api/payments/*
├── jobs/
│   └── sessionReminders.js    # Cron: 24h/1h before sessions
└── .env.production            # Real credentials
```

---

**Bottom line**: You have a complete MVP. Add payments + TURN + email templates this week → launch → iterate based on real users.