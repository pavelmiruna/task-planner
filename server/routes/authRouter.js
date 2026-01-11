const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

const router = express.Router();

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

    // dacă parolele din DB sunt plain "1234", comentează bcrypt și folosește comparație directă
    const isOk =
      user.password?.startsWith("$2") // hash bcrypt începe cu $2
        ? await bcrypt.compare(password, user.password)
        : String(password) === String(user.password);

    if (!isOk) {
      return res.status(401).json({ message: "Credențiale invalide." });
    }

    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
        username: user.username,
        email: user.email,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

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
