export function auth(req, res, next) {
  const mode = (process.env.AUTH_MODE || "dev").toLowerCase();

  if (mode === "dev") {
    const userId = req.header("x-user-id");
    const role = req.header("x-role");
    const verificationStatus =
      req.header("x-verification-status") || "VERIFIED";

    if (!userId || !role) {
      return res.status(401).json({ message: "Missing dev auth headers" });
    }
    req.user = { userId, role, verificationStatus };
    return next();
  }

  return res.status(501).json({ message: "JWT auth not implemented" });
}
