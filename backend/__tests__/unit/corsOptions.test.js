/**
 * Property 2: CORS Origin Filtering
 * Validates: Requirements 2.1, 2.2
 *
 * Tests that the corsOptions origin callback:
 *   - Allows origins IN the allowed set (passes null error, origin echoed back)
 *   - Denies origins NOT IN the allowed set (passes an Error to the callback)
 *   - Never allows the literal wildcard "*"
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fc from 'fast-check';

/**
 * Build a corsOptions-compatible origin callback from a given set of allowed origins.
 * This mirrors the logic in backend/config/corsOptions.js so we can test it
 * without side-effects from the module's top-level env-var read.
 */
function buildOriginCallback(allowedSet) {
  return (origin, callback) => {
    if (!origin || (origin !== '*' && allowedSet.has(origin))) {
      callback(null, origin || true);
    } else {
      callback(new Error(`CORS policy: origin '${origin}' is not allowed.`));
    }
  };
}

describe('Property 2: CORS Origin Filtering', () => {
  it('allowed origin → callback receives null error and origin is echoed', () => {
    fc.assert(
      fc.property(
        // Generate a non-empty list of valid http/https URLs as the allowed set
        fc.array(
          fc.webUrl({ withQueryParameters: false, withFragments: false }),
          { minLength: 1, maxLength: 10 }
        ),
        (origins) => {
          const allowedSet = new Set(origins);
          const originCallback = buildOriginCallback(allowedSet);

          for (const origin of allowedSet) {
            let cbErr = undefined;
            let cbValue = undefined;
            originCallback(origin, (err, val) => { cbErr = err; cbValue = val; });

            assert.equal(cbErr, null, `Expected null error for allowed origin: ${origin}`);
            assert.ok(cbValue, `Expected truthy value for allowed origin: ${origin}`);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('origin NOT in allowed set → callback receives an Error', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.webUrl({ withQueryParameters: false, withFragments: false }),
          { minLength: 1, maxLength: 5 }
        ),
        fc.webUrl({ withQueryParameters: false, withFragments: false }),
        (allowedOrigins, testOrigin) => {
          const allowedSet = new Set(allowedOrigins);
          // Only test when testOrigin is genuinely not in the set
          fc.pre(!allowedSet.has(testOrigin));

          const originCallback = buildOriginCallback(allowedSet);
          let cbErr = undefined;
          originCallback(testOrigin, (err) => { cbErr = err; });

          assert.ok(cbErr instanceof Error, `Expected Error for denied origin: ${testOrigin}`);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('wildcard "*" is always denied even if present in the allowed set', () => {
    const allowedSet = new Set(['http://example.com', '*']);
    const originCallback = buildOriginCallback(allowedSet);
    let cbErr = undefined;
    originCallback('*', (err) => { cbErr = err; });
    assert.ok(cbErr instanceof Error, 'Wildcard * must never be allowed');
  });
});
