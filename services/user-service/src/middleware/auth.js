import { verifyToken } from "../services/authService.js";

export function auth(req, res, next) {
  const header = req.header("authorization") || "";
  const [type, token] = header.split(" ");

  if (type !== "Bearer" || !token) {
    return res.status(401).json({ message: "Missing or invalid Authorization header" });
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded; // { userId, role, verificationStatus, iat, exp }
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}