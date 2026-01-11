const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

const router = express.Router();

/** Helpers */
function signToken(user) {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is missing. Set it in .env / Render env vars.");
  }

  return jwt.sign(
    {
      id: user.id,
      role: user.role,
      username: user.username,
      email: user.email,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

function getBearerToken(req) {
  const header = req.headers.authorization || "";
  return header.startsWith("Bearer ") ? header.slice(7) : null;
}

/**
 * GET /api/auth/me
 * - Returnează user-ul din token (și poate încărca din DB dacă vrei).
 */
router.get("/me", async (req, res) => {
  const token = getBearerToken(req);
  if (!token) return res.status(401).json({ message: "Missing token" });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // (opțional) încărcăm user din DB ca să avem date actuale
    const user = await User.findByPk(payload.id);
    if (!user) return res.status(401).json({ message: "User not found" });

    return res.json({
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        phone: user.phone ?? null,
      },
    });
  } catch (e) {
    return res.status(401).json({ message: "Invalid token" });
  }
});

/**
 * POST /api/auth/register
 * Body: { username, email, password, role? }
 *
 * ⚠️ Atenție: în cerințe, ideal doar admin creează useri.
 * Aici e "public register". Dacă vrei doar admin, îți modific imediat.
 */
router.post("/register", async (req, res, next) => {
  try {
    const { username, email, password, role } = req.body;

    if (!username?.trim()) return res.status(400).json({ message: "Username este obligatoriu." });
    if (!email?.trim()) return res.status(400).json({ message: "Email este obligatoriu." });
    if (!String(email).includes("@")) return res.status(400).json({ message: "Email invalid." });
    if (!password || String(password).length < 4) {
      return res.status(400).json({ message: "Parola trebuie să aibă minim 4 caractere." });
    }

    const existing = await User.findOne({ where: { email: email.trim() } });
    if (existing) return res.status(409).json({ message: "Există deja un user cu acest email." });

    const existingU = await User.findOne({ where: { username: username.trim() } });
    if (existingU) return res.status(409).json({ message: "Există deja un user cu acest username." });

    // hash password
    const hashed = await bcrypt.hash(String(password), 10);

    // role default: executor (conform temei)
    const safeRole = role && ["admin", "manager", "executor"].includes(String(role).toLowerCase())
      ? String(role).toLowerCase()
      : "executor";

    const user = await User.create({
      username: username.trim(),
      email: email.trim(),
      password: hashed,
      role: safeRole,
    });

    const token = signToken(user);

    return res.status(201).json({
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          phone: user.phone ?? null,
        },
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/auth/login
 * Body: { email, password } OR { username, password }
 */
router.post("/login", async (req, res, next) => {
  try {
    const { email, password, username } = req.body;

    if ((!email && !username) || !password) {
      return res.status(400).json({ message: "Trimite email/username și parola." });
    }

    const where = email ? { email } : { username };
    const user = await User.findOne({ where });

    if (!user) {
      return res.status(401).json({ message: "Credențiale invalide." });
    }

    // suport pentru parole plain ("1234") + parole hash (bcrypt)
    const isOk =
      user.password?.startsWith("$2")
        ? await bcrypt.compare(String(password), user.password)
        : String(password) === String(user.password);

    if (!isOk) {
      return res.status(401).json({ message: "Credențiale invalide." });
    }

    const token = signToken(user);

    return res.json({
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          phone: user.phone ?? null,
        },
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
