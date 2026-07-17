/**
 * Properties 7, 8, 9, 10: Auth Token Rotation and Security Invariants
 * Validates: Requirements 5.1, 5.4, 6.3, 7.1, 6.4, 6.5, 9.2, 9.3
 *
 * Property 7  — Refresh token rotation & reuse detection
 * Property 8  — Token expiry invariant (verify/reset TTLs)
 * Property 9  — Email verification round-trip
 * Property 10 — Password change pre-check invariant
 */

import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import fc from 'fast-check';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { mongoSetup, mongoTeardown, clearDatabase } from '../setup.js';
import User from '../../models/User.js';
import { hashToken } from '../../controllers/authController.js';
import {
  refreshToken as refreshTokenController,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  changePassword,
} from '../../controllers/authController.js';

// ── Test JWT env setup ─────────────────────────────────────────────────────
process.env.JWT_SECRET          = process.env.JWT_SECRET          || 'test-jwt-secret-at-least-32-chars-long!!';
process.env.JWT_REFRESH_SECRET  = process.env.JWT_REFRESH_SECRET  || 'test-refresh-secret-at-least-32-chars!!';
process.env.FRONTEND_URL        = process.env.FRONTEND_URL        || 'http://localhost:3000';

before(mongoSetup);
after(mongoTeardown);
beforeEach(clearDatabase);

// ── Helpers ─────────────────────────────────────────────────────────────────

function makeRes() {
  const cookies = {};
  const res = { _status: 200, _body: null, cookies };
  res.status = (code) => { res._status = code; return res; };
  res.json   = (body) => { res._body  = body; return res; };
  res.cookie = (name, val) => { cookies[name] = val; return res; };
  res.clearCookie = (name) => { cookies[name] = null; return res; };
  return res;
}

function makeRefreshReq(refreshTokenValue) {
  return { cookies: { jwt_refresh: refreshTokenValue } };
}

/** Generate a raw refresh JWT for a user id. */
function genRefreshToken(userId) {
  return jwt.sign(
    { id: userId.toString(), jti: crypto.randomBytes(32).toString('hex') },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
}

/** Create a minimal User document. */
async function createUser(overrides = {}) {
  const hashedPw = await bcrypt.hash('Validpass1!', 10);
  return User.create({
    name: 'Test User',
    email: `test-${Date.now()}-${Math.random()}@example.com`,
    password: hashedPw,
    emailVerified: true,
    isActive: true,
    role: 'user',
    ...overrides,
  });
}

// ── Property 7: Refresh Token Rotation & Reuse Detection ──────────────────
describe('Property 7: Refresh Token Rotation and Reuse Detection', () => {
  it('(N-1)th token rejected after N rotations; reuse nulls out refreshTokenHash', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 10 }), // keep small for speed
        async (N) => {
          await clearDatabase();
          const user = await createUser();

          // Seed the first refresh token
          let currentToken = genRefreshToken(user._id);
          await User.findByIdAndUpdate(user._id, { refreshTokenHash: hashToken(currentToken) });

          const rotationHistory = [currentToken];

          // Perform N rotations
          for (let i = 0; i < N; i++) {
            const req = makeRefreshReq(currentToken);
            const res = makeRes();
            await refreshTokenController(req, res);

            assert.equal(res._status, 200, `Rotation ${i + 1} should succeed`);
            currentToken = res.cookies['jwt_refresh'];
            assert.ok(currentToken, 'New refresh token must be set in cookie');
            rotationHistory.push(currentToken);
          }

          // Property (a) + (b): current token accepted, (N-1)th rejected
          if (N >= 1) {
            const staleToken = rotationHistory[rotationHistory.length - 2]; // (N-1)th
            const req = makeRefreshReq(staleToken);
            const res = makeRes();
            await refreshTokenController(req, res);
            assert.equal(res._status, 401, 'Stale token must be rejected with 401');

            // Property (c): after reuse, refreshTokenHash must be null
            const dbUser = await User.findById(user._id);
            assert.equal(dbUser.refreshTokenHash, null, 'refreshTokenHash must be null after reuse attack');
          }
        }
      ),
      { numRuns: 50 }
    );
  });
});

// ── Property 8: Token Expiry Invariant ────────────────────────────────────
describe('Property 8: Token Expiry Invariant', () => {
  it('email verification token accepted before TTL, rejected at/after TTL', async () => {
    const user = await createUser({ emailVerified: false });

    const plainToken = crypto.randomBytes(32).toString('hex');
    const hashed = hashToken(plainToken);

    // Valid: expiry is in the future
    await User.findByIdAndUpdate(user._id, {
      emailVerificationToken: hashed,
      emailVerificationExpiry: Date.now() + 60_000, // 1 min in future
    });

    const req = { query: { token: plainToken } };
    const res = makeRes();
    await verifyEmail(req, res);
    assert.equal(res._status, 200, 'Token within TTL must be accepted');

    // Now create user with expired token
    const user2 = await createUser({ emailVerified: false });
    const plainToken2 = crypto.randomBytes(32).toString('hex');
    const hashed2 = hashToken(plainToken2);
    await User.findByIdAndUpdate(user2._id, {
      emailVerificationToken: hashed2,
      emailVerificationExpiry: Date.now() - 1, // already expired
    });

    const req2 = { query: { token: plainToken2 } };
    const res2 = makeRes();
    await verifyEmail(req2, res2);
    assert.equal(res2._status, 400, 'Expired token must be rejected');
  });

  it('password reset token accepted before TTL, rejected at/after TTL', async () => {
    // Valid
    const user = await createUser();
    const plain = crypto.randomBytes(32).toString('hex');
    await User.findByIdAndUpdate(user._id, {
      passwordResetToken: hashToken(plain),
      passwordResetExpiry: Date.now() + 60_000,
    });
    const req = { body: { token: plain, newPassword: 'Newpass1!' } };
    const res = makeRes();
    await resetPassword(req, res);
    assert.equal(res._status, 200, 'Valid reset token must succeed');

    // Expired
    const user2 = await createUser();
    const plain2 = crypto.randomBytes(32).toString('hex');
    await User.findByIdAndUpdate(user2._id, {
      passwordResetToken: hashToken(plain2),
      passwordResetExpiry: Date.now() - 1,
    });
    const req2 = { body: { token: plain2, newPassword: 'Newpass1!' } };
    const res2 = makeRes();
    await resetPassword(req2, res2);
    assert.equal(res2._status, 400, 'Expired reset token must be rejected');
  });
});

// ── Property 9: Email Verification Round-Trip ────────────────────────────
describe('Property 9: Email Verification Round-Trip', () => {
  it('correct token before expiry sets emailVerified=true; second use returns 400', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 5 }), // just vary number of users to create
        async (_n) => {
          await clearDatabase();
          const user = await createUser({ emailVerified: false });

          const plain = crypto.randomBytes(32).toString('hex');
          await User.findByIdAndUpdate(user._id, {
            emailVerificationToken: hashToken(plain),
            emailVerificationExpiry: Date.now() + 60_000,
          });

          // First use — should succeed
          const req1 = { query: { token: plain } };
          const res1 = makeRes();
          await verifyEmail(req1, res1);
          assert.equal(res1._status, 200);

          const updated = await User.findById(user._id);
          assert.equal(updated.emailVerified, true);

          // Second use — same token must be rejected
          const req2 = { query: { token: plain } };
          const res2 = makeRes();
          await verifyEmail(req2, res2);
          assert.equal(res2._status, 400, 'Second use of same token must return 400');
        }
      ),
      { numRuns: 50 }
    );
  });
});

// ── Property 10: Password Change Pre-Check Invariant ─────────────────────
describe('Property 10: Password Change Pre-Check Invariant', () => {
  it('wrong currentPassword → HTTP 401 and stored hash unchanged', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 72 }),
        async (wrongPassword) => {
          await clearDatabase();
          const correctPassword = 'CorrectPass1!';
          const user = await createUser(); // password is 'Validpass1!' hashed

          // Attach matchPassword method as mongoose would
          // Fetch fresh doc to ensure virtual methods are present
          const dbUser = await User.findById(user._id);

          // Filter out the astronomically unlikely case that the random string matches
          const matches = await bcrypt.compare(wrongPassword, dbUser.password);
          if (matches) return; // skip this sample

          const hashBefore = dbUser.password;

          const req = {
            body: { currentPassword: wrongPassword, newPassword: 'NewValid1!' },
            user: dbUser,
          };
          const res = makeRes();
          await changePassword(req, res);

          assert.equal(res._status, 401, 'Wrong password must return 401');

          const dbAfter = await User.findById(user._id);
          assert.equal(
            dbAfter.password,
            hashBefore,
            'Stored password hash must be unchanged after failed attempt'
          );
        }
      ),
      { numRuns: 50 }
    );
  });
});
