const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const requireRole = require("../middleware/requireRole");

router.use(authMiddleware);

const ALLOWED_ROLES = ["admin", "manager", "executor"];

function normRole(r) {
  const v = String(r || "").toLowerCase();
  return ALLOWED_ROLES.includes(v) ? v : "";
}

async function ensureManagerExists(managerId) {
  if (!managerId) return null;

  const manager = await User.findByPk(Number(managerId));
  if (!manager) return null;

  if (normRole(manager.role) !== "manager") return null;
  return manager;
}

/**
 * GET /api/users
 * ✅ Doar admin (mai safe)
 * (Dacă vrei și pentru manager, schimbă requireRole("admin") în requireRole("admin","manager"))
 */
router.get("/", requireRole("admin"), async (req, res, next) => {
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

/**
 * GET /api/users/executors
 * ✅ util pentru manager/admin ca să poată aloca task-uri
 */
router.get("/executors", requireRole("admin", "manager"), async (req, res, next) => {
  try {
    const users = await User.findAll({
      where: { role: "executor" },
      attributes: { exclude: ["password"] },
      order: [["id", "ASC"]],
    });

    res.json({ success: true, data: users });
  } catch (error) {
    console.error("Error fetching executors:", error);
    next(error);
  }
});

/**
 * POST /api/users
 * ✅ DOAR ADMIN
 * Cerință: executor trebuie să aibă managerId valid (un user cu rol 'manager')
 */
router.post("/", requireRole("admin"), async (req, res, next) => {
  try {
    const payload = { ...req.body };

    // role default
    if (!payload.role) payload.role = "executor";
    payload.role = normRole(payload.role);

    if (!payload.role) {
      return res.status(400).json({
        success: false,
        error: `Invalid role. Allowed: ${ALLOWED_ROLES.join(", ")}`,
      });
    }

    // executor -> managerId obligatoriu și valid
    if (payload.role === "executor") {
      const manager = await ensureManagerExists(payload.managerId);
      if (!manager) {
        return res.status(400).json({
          success: false,
          error: "Executantul trebuie să aibă managerId valid (un user cu rol 'manager').",
        });
      }
    } else {
      // dacă nu e executor, managerId nu are sens (opțional)
      payload.managerId = null;
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

/**
 * PUT /api/users/:id
 * ✅ DOAR ADMIN
 * Cerință: dacă rolul final e executor => managerId valid
 */
router.put("/:id", requireRole("admin"), async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ success: false, error: "User not found" });

    const updates = { ...req.body };
    delete updates.id;

    // dacă se trimite role, validează
    if (updates.role !== undefined) {
      updates.role = normRole(updates.role);
      if (!updates.role) {
        return res.status(400).json({
          success: false,
          error: `Invalid role. Allowed: ${ALLOWED_ROLES.join(", ")}`,
        });
      }
    }

    // dacă se schimbă parola -> hash
    if (updates.password && typeof updates.password === "string") {
      updates.password = await bcrypt.hash(updates.password, 10);
    }

    // rol final după update
    const finalRole = updates.role ?? user.role;
    const finalRoleNorm = normRole(finalRole);

    // managerId final după update
    const finalManagerId =
      updates.managerId !== undefined ? updates.managerId : user.managerId;

    if (finalRoleNorm === "executor") {
      const manager = await ensureManagerExists(finalManagerId);
      if (!manager) {
        return res.status(400).json({
          success: false,
          error: "Executantul trebuie să aibă managerId valid (un user cu rol 'manager').",
        });
      }
      // păstrează managerId (validat)
      updates.managerId = Number(finalManagerId);
    } else {
      // nu e executor => managerId null (opțional)
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

/**
 * DELETE /api/users/:id
 * ✅ DOAR ADMIN
 * Protecție: nu șterge manager dacă are executori alocați
 */
router.delete("/:id", requireRole("admin"), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ success: false, error: "User not found" });

    if (normRole(user.role) === "manager") {
      const count = await User.count({ where: { managerId: id } });
      if (count > 0) {
        return res.status(400).json({
          success: false,
          error: "Nu poți șterge un manager care are executori alocați. Reasignează-i întâi.",
        });
      }
    }

    await User.destroy({ where: { id } });
    res.json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    next(error);
  }
});

module.exports = router;
