//Later, verification should be derived from the real user-service/admin.
export function requireVerifiedPatient(req, res, next) {
    if (req.user?.verificationStatus !== "VERIFIED") {
        return res.status(403).json({ message: "Doctor is not verified yet." });
    }
    next();
}