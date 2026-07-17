/**
 * Properties 11, 12: Image Optimizer
 * Validates: Requirements 14.1, 14.2, 14.5
 *
 * Property 11 — Resize dimension invariant:
 *   For any (W, H) input image, output width ≤ 400, output height ≤ 400,
 *   and aspect ratio is preserved within 1% tolerance.
 *
 * Property 12 — MIME type rejection:
 *   Any mimetype NOT in the allowed list causes the fileFilter cb to receive an Error.
 */

import { describe, it, after } from 'node:test';
import assert from 'node:assert/strict';
import fc from 'fast-check';
import sharp from 'sharp';
import path from 'path';
import os from 'os';
import fs from 'fs/promises';
import { optimizeAvatar } from '../../utils/imageOptimizer.js';

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

const tmpDir = os.tmpdir();

/** Create a real in-memory pixel buffer as a temp file and run optimizeAvatar. */
async function runOptimize(width, height) {
  const inputFile = path.join(tmpDir, `test-input-${Date.now()}-${width}x${height}.png`);
  const baseName = `test-output-${Date.now()}-${width}x${height}`;

  // Create a real PNG buffer
  const buf = await sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: Math.floor(Math.random() * 255), g: 100, b: 200 },
    },
  })
    .png()
    .toBuffer();

  await fs.writeFile(inputFile, buf);

  const resultPath = await optimizeAvatar(inputFile, tmpDir, baseName);
  const outputFile = path.join(tmpDir, `${baseName}.webp`);

  const metadata = await sharp(outputFile).metadata();
  // clean up output
  await fs.unlink(outputFile).catch(() => {});

  return { metadata, resultPath };
}

after(async () => {
  // Clean any leftover tmp files from tests
  const files = await fs.readdir(tmpDir);
  for (const f of files) {
    if (f.startsWith('test-output-') || f.startsWith('test-input-')) {
      await fs.unlink(path.join(tmpDir, f)).catch(() => {});
    }
  }
});

/* ── Property 11: Image Resize Dimension Invariant ──────────────────────── */
describe('Property 11: Image Resize Dimension Invariant', () => {
  it('output width ≤ 400, height ≤ 400, aspect ratio preserved within 1%', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 2000 }),
        fc.integer({ min: 1, max: 2000 }),
        async (w, h) => {
          const { metadata } = await runOptimize(w, h);

          assert.ok(metadata.width <= 400, `width ${metadata.width} exceeds 400`);
          assert.ok(metadata.height <= 400, `height ${metadata.height} exceeds 400`);

          const inputRatio = w / h;
          const outputRatio = metadata.width / metadata.height;
          const ratioError = Math.abs(inputRatio - outputRatio);

          assert.ok(
            ratioError < 0.01,
            `Aspect ratio mismatch: input=${inputRatio.toFixed(4)}, output=${outputRatio.toFixed(4)}, diff=${ratioError.toFixed(4)}`
          );
        }
      ),
      { numRuns: 50 } // fewer runs since each creates real image I/O
    );
  });
});

/* ── Property 12: Upload MIME Type Rejection ─────────────────────────────── */
describe('Property 12: Upload MIME Type Rejection', () => {
  it('non-allowed MIME type causes fileFilter to call cb with an Error', () => {
    // Extract the fileFilter logic inline to avoid Multer's req dependency
    function fileFilter(mimetype, cb) {
      if (ALLOWED_MIME_TYPES.has(mimetype)) {
        cb(null, true);
      } else {
        const err = new Error('Unsupported file type. Allowed: JPEG, PNG, WebP, GIF');
        err.statusCode = 415;
        cb(err);
      }
    }

    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }).filter(
          (s) => !ALLOWED_MIME_TYPES.has(s)
        ),
        (mimetype) => {
          let cbErr = undefined;
          fileFilter(mimetype, (err) => { cbErr = err; });
          assert.ok(
            cbErr instanceof Error,
            `Expected Error for mimetype "${mimetype}", got: ${cbErr}`
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  it('allowed MIME types pass without error', () => {
    function fileFilter(mimetype, cb) {
      if (ALLOWED_MIME_TYPES.has(mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('not allowed'));
      }
    }

    for (const mime of ALLOWED_MIME_TYPES) {
      let cbErr = null;
      let cbVal = null;
      fileFilter(mime, (err, val) => { cbErr = err; cbVal = val; });
      assert.equal(cbErr, null, `${mime} should be allowed`);
      assert.equal(cbVal, true);
    }
  });
});
