const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const requireRole = require("../middleware/requireRole");

router.use(authMiddleware);

const ALLOWED_ROLES = ["admin", "manager", "executor"];

async function ensureManagerExists(managerId) {
  if (!managerId) return null;
  const manager = await User.findByPk(managerId);
  if (!manager) return null;
  if (manager.role !== "manager") return null;
  return manager;
}

// GET - toți utilizatorii (fără parolă)
// (poți pune requireRole("admin") dacă vrei să fie listă doar pentru admin)
router.get("/", async (req, res, next) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ["password"] },
      order: [["id", "ASC"]],
    });

    res.json({ success: true, data: users });
  } catch (error) {
    console.error("Error fetching users:", error);
    next(error);
  }
});

// POST - adăugare utilizator (DOAR ADMIN)
router.post("/", requireRole("admin"), async (req, res, next) => {
  try {
    const payload = { ...req.body };

    // role valid
    if (payload.role && !ALLOWED_ROLES.includes(payload.role)) {
      return res.status(400).json({
        success: false,
        error: `Invalid role. Allowed: ${ALLOWED_ROLES.join(", ")}`,
      });
    }

    // Cerință: executor trebuie să aibă managerId valid (manager)
    if (payload.role === "executor") {
      const manager = await ensureManagerExists(payload.managerId);
      if (!manager) {
        return res.status(400).json({
          success: false,
          error: "Executantul trebuie să aibă managerId valid (un user cu rol 'manager').",
        });
      }
    }

    // hash password dacă există
    if (payload.password && typeof payload.password === "string") {
      payload.password = await bcrypt.hash(payload.password, 10);
    }

    const user = await User.create(payload);

    const safeUser = user.toJSON();
    delete safeUser.password;

    res.status(201).json({ success: true, data: safeUser });
  } catch (error) {
    console.error("Error creating user:", error);
    next(error);
  }
});

// PUT - actualizare utilizator (DOAR ADMIN)
router.put("/:id", requireRole("admin"), async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user)
      return res.status(404).json({ success: false, error: "User not found" });

    const updates = { ...req.body };
    delete updates.id; // nu permite schimbarea id

    // role valid (dacă se trimite)
    if (updates.role && !ALLOWED_ROLES.includes(updates.role)) {
      return res.status(400).json({
        success: false,
        error: `Invalid role. Allowed: ${ALLOWED_ROLES.join(", ")}`,
      });
    }

    // Dacă se schimbă parola -> hash
    if (updates.password && typeof updates.password === "string") {
      updates.password = await bcrypt.hash(updates.password, 10);
    }

    // Determină "rolul final" după update
    const finalRole = updates.role ?? user.role;
    const finalManagerId =
      updates.managerId !== undefined ? updates.managerId : user.managerId;

    // Cerință: executor trebuie să aibă managerId valid
    if (finalRole === "executor") {
      const manager = await ensureManagerExists(finalManagerId);
      if (!manager) {
        return res.status(400).json({
          success: false,
          error: "Executantul trebuie să aibă managerId valid (un user cu rol 'manager').",
        });
      }
    } else {
      // Dacă nu e executor, poți curăța managerId (opțional)
      // Dacă vrei să păstrezi managerId și la manager, comentează linia următoare
      updates.managerId = null;
    }

    await user.update(updates);

    const safeUser = user.toJSON();
    delete safeUser.password;

    res.json({ success: true, data: safeUser });
  } catch (error) {
    console.error("Error updating user:", error);
    next(error);
  }
});

// DELETE - ștergere utilizator (DOAR ADMIN)
router.delete("/:id", requireRole("admin"), async (req, res, next) => {
  try {
    const deleted = await User.destroy({ where: { id: req.params.id } });
    if (!deleted)
      return res.status(404).json({ success: false, error: "User not found" });

    res.json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    next(error);
  }
});

module.exports = router;
