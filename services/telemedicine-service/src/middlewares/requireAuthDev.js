/**
 * requireAuthDev
 * Dev authentication mode:
 * - Reads identity from request headers
 * - Attaches req.user = { id, role }
 *
 * Headers:
 * - x-user-id
 * - x-role (doctor|patient|admin)
 *
 * NOTE: This is a placeholder until you integrate real JWT auth next sprint.
 */
export default function requireAuthDev(req, res, next) {
  const mode = process.env.AUTH_MODE || "dev";
  if (mode !== "dev") return next();

  const userId = req.header("x-user-id");
  const role = req.header("x-role");

  if (!userId || !role) {
    return res.status(401).json({
      success: false,
      message: "Missing auth headers (x-user-id, x-role)",
    });
  }

  req.user = { id: userId, role };
  next();
}