/**
 * asyncHandler
 * Wraps async Express handlers so errors go to the error middleware.
 */
export default function asyncHandler(fn) {
  return function asyncWrapped(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}