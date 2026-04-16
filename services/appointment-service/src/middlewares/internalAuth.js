export function internalAuth(req, res, next) {
  const secret =
    req.headers["x-internal-secret"] || req.headers["X-Internal-Secret"];
  if (!secret || secret !== process.env.INTERNAL_API_SECRET) {
    console.error(
      `[internalAuth] Forbidden: secret mismatch or missing. Expected: ${process.env.INTERNAL_API_SECRET}, Received: ${secret}`,
    );
    return res.status(403).json({ message: "Forbidden: internal API only" });
  }
  next();
}
