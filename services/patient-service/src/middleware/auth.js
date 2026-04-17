export function auth(req, res, next) {
    const mode = (process.env.AUTH_MODE || "dev").toLowerCase();

    if (mode === "dev") {
        const userId = req.header("x-user-id");
        const role = req.header("x-role");
        const verificationStatus = req.header("x-verification-status") || "VERIFIED";

        if (!userId || !role) {
            return res.status(401).json({
                message: "Missing dev auth headers: x-user-id and x-role are required",
            });
        }

        // Health endpoint for Kubernetes readiness/liveness checks
        req.user = { userId, role, verificationStatus };
        return next();
    }
    // Later: implement JWT verification using Authorization: Bearer <token>
    return res.status(501).json({
        message: "JWT auth not implemented yet. Use AUTH_MODE=dev for now.",
    });
}