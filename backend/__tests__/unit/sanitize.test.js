import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeMiddleware, sanitizeObject, sanitizeText, sanitizeHtml } from '../../middleware/sanitize.js';

describe('sanitizeMiddleware Unit Tests', () => {
  it('sanitizes req.body, req.query, and req.params', (t, done) => {
    const middleware = sanitizeMiddleware({
      htmlFields: ['bio'],
      textFields: ['name'],
    });

    const req = {
      body: { name: '<b>Alice</b>', bio: '<p>Hello <script>bad()</script></p>' },
      query: { search: '<b>term</b>' },
      params: { id: '<i>123</i>' },
    };

    middleware(req, {}, (err) => {
      assert.ifError(err);
      assert.equal(req.body.name, 'Alice');
      assert.equal(req.body.bio, '<p>Hello </p>');
      assert.equal(req.query.search, 'term');
      assert.equal(req.params.id, '123');
      done();
    });
  });

  it('handles getter-only req.query without throwing (Express 5 compatibility)', (t, done) => {
    const middleware = sanitizeMiddleware();
    const req = {
      body: { name: 'Test' },
    };

    // Simulate Express 5 / Node.js IncomingMessage where query has a getter but no setter
    Object.defineProperty(req, 'query', {
      get() {
        return { search: '<script>alert(1)</script>' };
      },
      enumerable: true,
      configurable: true,
    });

    middleware(req, {}, (err) => {
      assert.ifError(err);
      assert.equal(req.query.search, '');
      done();
    });
  });
});
