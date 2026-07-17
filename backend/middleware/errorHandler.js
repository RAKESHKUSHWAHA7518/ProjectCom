import logger from '../utils/logger.js';

/**
 * Global Express error handling middleware.
 * Must be registered as the last middleware in server.js.
 *
 * @param {Error} err
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export const globalErrorHandler = (err, req, res, next) => {
  const isProduction = process.env.NODE_ENV === 'production';

  // Log every error at the error level with full context
  logger.error({
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // --- Mongoose ValidationError → 422 with field-level details ---
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return res.status(422).json({ errors });
  }

  // --- MongoDB CastError (invalid ObjectId) ---
  if (err.name === 'CastError') {
    // Auth routes get a generic 401 to avoid leaking existence of resources
    if (req.path.startsWith('/api/auth/')) {
      return res.status(401).json({ error: 'Not authorized' });
    }
    // All other paths (including /api/users/) get 400
    return res.status(400).json({ error: 'Invalid ID format' });
  }

  // --- Multer file-size limit ---
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'File too large. Maximum size is 5 MB' });
  }

  // --- All other errors ---
  // Clamp statusCode to 400–599, default to 500
  const statusCode =
    err.statusCode >= 400 && err.statusCode <= 599 ? err.statusCode : 500;

  const body = {
    error: err.message || 'Internal Server Error',
  };

  if (!isProduction) {
    body.stack = err.stack;
  }

  return res.status(statusCode).json(body);
}
