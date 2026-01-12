function requireRole(...allowedRoles) {
  //suport pentru requireRole (admin, manager)
  const roles = Array.isArray(allowedRoles[0]) ? allowedRoles[0] : allowedRoles;

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const role = String(req.user.role || "").toLowerCase();

    const ok = roles.some((r) => String(r || "").toLowerCase() === role);

    if (!ok) {
      return res.status(403).json({
        success: false,
        error: "Forbidden",
        allowedRoles: roles,
        role,
      });
    }

    next();
  };
}

module.exports = requireRole;
