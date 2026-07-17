import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import logger from './logger.js';

/**
 * Optimize an uploaded avatar image.
 * Resizes to fit within 400×400 (upscaling small images), converts to WebP quality 80.
 * Deletes the original temp file after successful write.
 *
 * @param {string} inputPath - absolute or relative path to temp uploaded file
 * @param {string} outputDir - directory to save the .webp file
 * @param {string} baseName - filename base (without extension) for the output file
 * @returns {Promise<string>} relative path of saved .webp file (e.g. /uploads/userId-timestamp.webp)
 */
export async function optimizeAvatar(inputPath, outputDir, baseName) {
  const outputFilename = `${baseName}.webp`;
  const outputPath = path.join(outputDir, outputFilename);

  try {
    await sharp(inputPath)
      .resize(400, 400, {
        fit: 'inside',            // preserve aspect ratio
        withoutEnlargement: false, // DO upscale small images
      })
      .webp({ quality: 80 })
      .toFile(outputPath);

    // Delete original temp file
    await fs.unlink(inputPath);

    return `/uploads/${outputFilename}`;
  } catch (err) {
    logger.error('Image optimization failed', { inputPath, error: err.message, stack: err.stack });
    // Attempt to clean up partial output
    try { await fs.unlink(outputPath); } catch {}
    const error = new Error('Image processing failed');
    error.statusCode = 422;
    throw error;
  }
}
