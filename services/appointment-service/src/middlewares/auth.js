import jwt from "jsonwebtoken";

export function auth(req, res, next) {
  const mode = (process.env.AUTH_MODE || "dev").toLowerCase();

  // DEV MODE
  if (mode === "dev") {
    const userId = req.header("x-user-id");
    const role = req.header("x-role");
    const verificationStatus = req.header("x-verification-status") || "VERIFIED";

    if (!userId || !role) {
      return res.status(401).json({ message: "Missing dev auth headers" });
    }

    req.user = { userId, role, verificationStatus };
    return next();
  }

  // JWT MODE
  if (mode === "jwt") {
    const authHeader = req.header("authorization") || "";
    const [scheme, token] = authHeader.split(" ");

    if (scheme !== "Bearer" || !token) {
      return res.status(401).json({
        message: "Missing or invalid Authorization header (Bearer token required)",
      });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({ message: "JWT_SECRET is not configured" });
    }

    try {
      const decoded = jwt.verify(token, secret);

      if (!decoded?.userId || !decoded?.role) {
        return res.status(401).json({ message: "Token payload is invalid" });
      }

      req.user = {
        userId: decoded.userId,
        role: decoded.role,
        verificationStatus: decoded.verificationStatus || "PENDING",
      };

      return next();
    } catch {
      return res.status(401).json({ message: "Invalid or expired token" });
    }
  }

  return res
    .status(500)
    .json({ message: `Unsupported AUTH_MODE: ${process.env.AUTH_MODE}` });
}