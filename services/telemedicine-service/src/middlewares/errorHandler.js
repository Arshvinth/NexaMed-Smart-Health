/**
 * errorHandler
 * Centralized JSON error response format.
 */
export default function errorHandler(err, req, res, next) {
  const status = err.statusCode || err.status || 500;

  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.error(err);
  }

  res.status(status).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
}