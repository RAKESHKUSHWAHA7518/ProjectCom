/**
 * Property 13: Admin Pagination Result Count Invariant
 * Validates: Requirements 18.2
 *
 * For any combination of (page, pageSize) and any DB size:
 *   - response.users.length <= pageSize
 *   - response.users.length <= total (never more rows than exist)
 */

import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import fc from 'fast-check';
import mongoose from 'mongoose';
import { mongoSetup, mongoTeardown, clearDatabase } from '../setup.js';
import User from '../../models/User.js';
import { getUsers } from '../../controllers/adminController.js';

before(mongoSetup);
after(mongoTeardown);
beforeEach(clearDatabase);

/**
 * Build a minimal req/res pair for calling adminController directly.
 */
function makeReqRes(query = {}) {
  const req = { query };
  const res = { _status: 200, _body: null };
  res.status = (code) => { res._status = code; return res; };
  res.json = (body) => { res._body = body; return res; };
  return { req, res };
}

/** Seed `count` minimal User documents. */
async function seedUsers(count) {
  const docs = Array.from({ length: count }, (_, i) => ({
    name: `User ${i}`,
    email: `user${i}@test.com`,
    password: 'hashed',
    role: 'user',
    isActive: true,
    emailVerified: true,
  }));
  if (docs.length > 0) await User.insertMany(docs);
}

describe('Property 13: Admin Pagination Result Count Invariant', () => {
  it('users.length <= pageSize AND users.length <= total for any (page, pageSize, dbSize)', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 0, max: 100 }),           // db user count
        fc.integer({ min: 1, max: 20 }),             // page
        fc.integer({ min: 1, max: 100 }),            // pageSize
        async (dbSize, page, pageSize) => {
          await clearDatabase();
          await seedUsers(dbSize);

          const { req, res } = makeReqRes({
            page: String(page),
            pageSize: String(pageSize),
          });

          await getUsers(req, res);

          assert.equal(res._status, 200, 'Expected HTTP 200');
          const { users, total } = res._body;

          assert.ok(Array.isArray(users), 'users must be an array');
          assert.ok(typeof total === 'number', 'total must be a number');

          assert.ok(
            users.length <= pageSize,
            `users.length (${users.length}) exceeded pageSize (${pageSize})`
          );
          assert.ok(
            users.length <= total,
            `users.length (${users.length}) exceeded total (${total})`
          );
          assert.equal(total, dbSize, `total should equal DB size (${dbSize})`);
        }
      ),
      { numRuns: 100 }
    );
  });
});
