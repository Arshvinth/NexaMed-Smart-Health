/**
 * requestLogger
 * Basic request logger for easier debugging (especially when using Docker).
 */
export default function requestLogger(req, res, next) {
  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.log(`[telemedicine-service] ${req.method} ${req.originalUrl}`);
  }
  next();
}