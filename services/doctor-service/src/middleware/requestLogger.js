export function requestLogger(req, _res, next) {
  // lightweight logger (you already also have morgan in dev)
  console.log(`[doctor-service] ${req.method} ${req.originalUrl}`);
  next();
}