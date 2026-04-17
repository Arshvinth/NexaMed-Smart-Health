export function errorHandler(err, _req, res, _next) {
  console.error("[doctor-service] error:", err);

  const status = err.statusCode || 500;
  res.status(status).json({
    message: err.message || "Internal server error",
  });
}