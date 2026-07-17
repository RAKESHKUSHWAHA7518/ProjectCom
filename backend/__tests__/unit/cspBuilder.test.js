/**
 * Property 1: CSP Directive Construction
 * Validates: Requirements 1.2
 *
 * Tests that buildCspHeader(origins) always produces a string whose
 * script-src values are exactly: { "'self'", ...origins } — no more, no fewer.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fc from 'fast-check';
import { buildCspHeader } from '../../config/helmetOptions.js';

/**
 * Parse a space-separated CSP directive string into a Set of source tokens.
 * e.g. "'self' https://cdn.example.com" → Set { "'self'", "https://cdn.example.com" }
 */
function parseScriptSrc(cspString) {
  return new Set(cspString.trim().split(/\s+/).filter(Boolean));
}

describe('Property 1: CSP Directive Construction', () => {
  it("script-src is exactly { \"'self'\", ...origins } for any origin array", () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.webUrl({ withQueryParameters: false, withFragments: false }),
          { minLength: 0, maxLength: 10 }
        ),
        (origins) => {
          const cspString = buildCspHeader(origins);

          assert.ok(
            typeof cspString === 'string' && cspString.length > 0,
            'buildCspHeader must return a non-empty string'
          );

          const parsed = parseScriptSrc(cspString);
          const expected = new Set(["'self'", ...origins]);

          // Same size
          assert.equal(
            parsed.size,
            expected.size,
            `CSP token count mismatch. Got: ${[...parsed].join(' ')}, Expected: ${[...expected].join(' ')}`
          );

          // Every expected token present
          for (const token of expected) {
            assert.ok(
              parsed.has(token),
              `Missing token "${token}" in CSP: ${cspString}`
            );
          }

          // No unexpected tokens
          for (const token of parsed) {
            assert.ok(
              expected.has(token),
              `Unexpected token "${token}" in CSP: ${cspString}`
            );
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it("empty origins array → only \"'self'\" in script-src", () => {
    const cspString = buildCspHeader([]);
    const parsed = parseScriptSrc(cspString);
    assert.deepEqual(parsed, new Set(["'self'"]));
  });

  it('duplicate origins are deduplicated in output', () => {
    const origins = ['https://cdn.example.com', 'https://cdn.example.com'];
    const cspString = buildCspHeader(origins);
    const parsed = parseScriptSrc(cspString);
    // Set semantics — size should be 2: 'self' + one unique origin
    assert.equal(parsed.size, 2);
  });
});
