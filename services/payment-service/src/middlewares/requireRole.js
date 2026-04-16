export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user?.role)
      return res.status(401).json({ message: "Unauthenticated" });

    const userRoleUpper = req.user.role.toUpperCase();
    const allowedUpper = allowedRoles.map((r) => r.toUpperCase());
    if (!allowedUpper.includes(userRoleUpper)) {
      return res
        .status(403)
        .json({ message: `Forbidden (role ${req.user.role})` });
    }
    next();
  };
}
