import jwt from "jsonwebtoken";

/**
 * Auth middleware:
 * - AUTH_MODE=dev => x-user-id, x-role
 * - AUTH_MODE=jwt => Authorization: Bearer <token>
 */
export default function requireAuth(req, res, next) {
  const mode = (process.env.AUTH_MODE || "dev").toLowerCase();

  if (mode === "dev") {
    const userId = req.header("x-user-id");
    const role = req.header("x-role");

    if (!userId || !role) {
      return res.status(401).json({
        success: false,
        message: "Missing auth headers (x-user-id, x-role)",
      });
    }

    req.user = { id: userId, role };
    return next();
  }

  if (mode === "jwt") {
    const authHeader = req.header("authorization") || "";
    const [scheme, token] = authHeader.split(" ");

    if (scheme !== "Bearer" || !token) {
      return res.status(401).json({
        success: false,
        message: "Missing or invalid Authorization header",
      });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        success: false,
        message: "JWT_SECRET is not configured",
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (!decoded?.userId || !decoded?.role) {
        return res.status(401).json({
          success: false,
          message: "Token payload is invalid",
        });
      }

      req.user = { id: decoded.userId, role: decoded.role };
      return next();
    } catch {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token",
      });
    }
  }

  return res.status(500).json({
    success: false,
    message: `Unsupported AUTH_MODE: ${process.env.AUTH_MODE}`,
  });
}