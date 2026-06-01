/**
 * Central error handler.
 * Catches all errors thrown / passed via next(err) in route handlers.
 */
function errorHandler(err, req, res, _next) {
  console.error(`[error] ${req.method} ${req.path} —`, err.message);

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      error: `File too large. Maximum size is ${process.env.MAX_FILE_SIZE_MB || 10} MB.`,
    });
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({ error: 'Unexpected file field in request.' });
  }

  // Known validation errors (thrown with a status property)
  if (err.status) {
    return res.status(err.status).json({ error: err.message });
  }

  // Generic / unexpected
  const status = err.statusCode || 500;
  const msg    = process.env.NODE_ENV === 'production'
    ? 'Internal server error'
    : err.message;

  res.status(status).json({ error: msg });
}

/**
 * Tiny helper to create a shaped error with an HTTP status code.
 */
function createError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

module.exports = { errorHandler, createError };
