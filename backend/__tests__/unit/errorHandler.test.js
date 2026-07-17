/**
 * Property 6: Error Handler Status Code Mapping
 * Validates: Requirements 4.2
 *
 * Uses fast-check to verify that:
 *   - Any error with statusCode 400–599 → response status matches
 *   - Any error with statusCode outside that range (or undefined) → response status is 500
 *   - All responses include a non-empty string `error` field
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fc from 'fast-check';

// Minimal mock of req/res/next to exercise globalErrorHandler without Express
function makeRes() {
  const res = { _status: null, _body: null };
  res.status = (code) => { res._status = code; return res; };
  res.json = (body) => { res._body = body; return res; };
  return res;
}

function makeReq(path = '/api/users/123') {
  return { path, method: 'GET' };
}

// Silence the logger during tests
process.env.NODE_ENV = 'test';

describe('Property 6: Error Handler Status Code Mapping', async () => {
  // Import after setting env
  const { globalErrorHandler } = await import('../../middleware/errorHandler.js');

  it('valid statusCode (400–599) → response status matches', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 400, max: 599 }),
        fc.string({ minLength: 1, maxLength: 100 }),
        (statusCode, message) => {
          const err = Object.assign(new Error(message), { statusCode });
          const req = makeReq();
          const res = makeRes();
          globalErrorHandler(err, req, res, () => {});

          assert.equal(res._status, statusCode, `Expected status ${statusCode}`);
          assert.ok(
            typeof res._body.error === 'string' && res._body.error.length > 0,
            'body.error must be a non-empty string'
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  it('statusCode outside 400–599 (or undefined) → response status is 500', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.integer({ min: 100, max: 399 }),
          fc.integer({ min: 600, max: 999 }),
          fc.constant(undefined)
        ),
        fc.string({ minLength: 1, maxLength: 100 }),
        (statusCode, message) => {
          const err = new Error(message);
          if (statusCode !== undefined) err.statusCode = statusCode;
          const req = makeReq();
          const res = makeRes();
          globalErrorHandler(err, req, res, () => {});

          assert.equal(res._status, 500, `Expected 500 for statusCode=${statusCode}`);
          assert.ok(
            typeof res._body.error === 'string' && res._body.error.length > 0,
            'body.error must be a non-empty string'
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});
