/**
 * Property 14: Report Creation Round-Trip
 * Validates: Requirements 19.1, 19.2
 *
 * For any valid (reason, details) combination:
 *   - The created DB document has the correct reporterId, reportedUserId,
 *     reason, status='open', and createdAt within 5 s of the request.
 */

import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import fc from 'fast-check';
import mongoose from 'mongoose';
import { mongoSetup, mongoTeardown, clearDatabase } from '../setup.js';
import User from '../../models/User.js';
import Report from '../../models/Report.js';
import { createReport } from '../../controllers/reportController.js';

before(mongoSetup);
after(mongoTeardown);
beforeEach(clearDatabase);

function makeReqRes(body, user) {
  const req = { body, user };
  const res = { _status: 200, _body: null };
  res.status = (code) => { res._status = code; return res; };
  res.json = (body) => { res._body = body; return res; };
  return { req, res };
}

async function createTestUser(suffix) {
  return User.create({
    name: `Test ${suffix}`,
    email: `test${suffix}@example.com`,
    password: 'hashed-password',
    role: 'user',
    isActive: true,
    emailVerified: true,
  });
}

describe('Property 14: Report Creation Round-Trip', () => {
  it('created report doc matches submitted payload with status=open and correct timestamps', async () => {
    const reporter = await createTestUser('reporter');
    const reportee = await createTestUser('reportee');

    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('spam', 'harassment', 'inappropriate_content', 'fake_profile', 'other'),
        fc.option(fc.string({ maxLength: 500 }), { nil: undefined }),
        async (reason, details) => {
          await Report.deleteMany({});

          const requestTime = Date.now();
          const body = { reportedUserId: reportee._id.toString(), reason };
          if (details !== undefined) body.details = details;

          const { req, res } = makeReqRes(body, reporter);
          await createReport(req, res);

          assert.equal(res._status, 201, `Expected 201, got ${res._status}`);

          // Verify DB document directly
          const doc = await Report.findOne({
            reporterId: reporter._id,
            reportedUserId: reportee._id,
          }).sort({ createdAt: -1 });

          assert.ok(doc, 'Report document must exist in DB');
          assert.equal(doc.reporterId.toString(), reporter._id.toString());
          assert.equal(doc.reportedUserId.toString(), reportee._id.toString());
          assert.equal(doc.reason, reason);
          assert.equal(doc.status, 'open');

          const timeDiff = Math.abs(doc.createdAt.getTime() - requestTime);
          assert.ok(
            timeDiff < 5000,
            `createdAt (${doc.createdAt}) is more than 5s from request time`
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  it('cannot report yourself → HTTP 400', async () => {
    const user = await createTestUser('self');
    const body = { reportedUserId: user._id.toString(), reason: 'spam' };
    const { req, res } = makeReqRes(body, user);
    await createReport(req, res);
    assert.equal(res._status, 400);
  });
});
