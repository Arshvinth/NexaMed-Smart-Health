//Later, verification should be derived from the real user-service/admin.
export function requireVerifiedDoctor(req, res, next) {
  if (req.user?.verificationStatus !== "VERIFIED") {
    return res.status(403).json({ message: "Doctor is not verified yet." });
  }
  next();
}