const jwt = require("jsonwebtoken");

function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;

    if (!authHeader || !String(authHeader).startsWith("Bearer ")) {
      return res.status(401).json({ message: "Missing token" });
    }

    const token = String(authHeader).slice(7).trim();
    if (!token) {
      return res.status(401).json({ message: "Missing token" });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: "JWT_SECRET is not set" });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // utilizatorul pe request->folosim în rute
    req.user = payload;

    return next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

module.exports = authMiddleware;
