export function requestLogger(req, _res, next) {
  console.log(`[appointment-service] ${req.method} ${req.originalUrl}`);
  next();
}
