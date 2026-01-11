function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const role = String(req.user.role || "").toLowerCase();
    const ok = allowedRoles.some(r => String(r).toLowerCase() === role);

    if (!ok) {
      return res.status(403).json({
        success: false,
        error: "Forbidden",
        allowedRoles,
        role,
      });
    }

    next();
  };
}

module.exports = requireRole;
