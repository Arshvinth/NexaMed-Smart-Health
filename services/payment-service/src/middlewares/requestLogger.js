export function requestLogger(req, _res, next) {
  console.log(`[payment-service] ${req.method} ${req.originalUrl}`);
  next();
}
