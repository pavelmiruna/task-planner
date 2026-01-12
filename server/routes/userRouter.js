const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Task = require("../models/Task"); 
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
  if (managerId === null || managerId === undefined || managerId === "") return null;

  const id = Number(managerId);
  if (!Number.isFinite(id)) return null;

  const manager = await User.findByPk(id);
  if (!manager) return null;

  if (normRole(manager.role) !== "manager") return null;
  return manager;
}


  //GET /api/users

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


//GET /api/users/executors

router.get("/executors", requireRole("admin", "manager"), async (req, res, next) => {
  try {
    const where = { role: "executor" };

    if (normRole(req.user?.role) === "manager") {
      where.managerId = req.user.id;
    }

    const users = await User.findAll({
      where,
      attributes: { exclude: ["password"] },
      order: [["id", "ASC"]],
    });

    res.json({ success: true, data: users });
  } catch (error) {
    console.error("Error fetching executors:", error);
    next(error);
  }
});


 //GET /api/users/managers
 
router.get("/managers", requireRole("admin"), async (req, res, next) => {
  try {
    const users = await User.findAll({
      where: { role: "manager" },
      attributes: { exclude: ["password"] },
      order: [["id", "ASC"]],
    });

    res.json({ success: true, data: users });
  } catch (error) {
    console.error("Error fetching managers:", error);
    next(error);
  }
});

/**
 * POST /api/users
 * DOAR ADMIN
 */
router.post("/", requireRole("admin"), async (req, res, next) => {
  try {
    const payload = { ...req.body };

    // validari
    if (!payload.username || !String(payload.username).trim()) {
      return res.status(400).json({ success: false, error: "Username este obligatoriu." });
    }
    if (!payload.email || !String(payload.email).trim() || !String(payload.email).includes("@")) {
      return res.status(400).json({ success: false, error: "Email invalid / lipsă." });
    }
    if (!payload.password || String(payload.password).length < 4) {
      return res.status(400).json({ success: false, error: "Parola trebuie să aibă minim 4 caractere." });
    }

    // role default
    if (!payload.role) payload.role = "executor";
    payload.role = normRole(payload.role);

    if (!payload.role) {
      return res.status(400).json({
        success: false,
        error: `Invalid role. Allowed: ${ALLOWED_ROLES.join(", ")}`,
      });
    }

    // executor -> managerId 
    if (payload.role === "executor") {
      const manager = await ensureManagerExists(payload.managerId);
      if (!manager) {
        return res.status(400).json({
          success: false,
          error: "Executantul trebuie să aibă managerId valid (un user cu rol 'manager').",
        });
      }
      payload.managerId = manager.id;
    } else {
      payload.managerId = null;
    }

    // hash password
    payload.password = await bcrypt.hash(String(payload.password), 10);

    const user = await User.create({
      username: String(payload.username).trim(),
      email: String(payload.email).trim(),
      role: payload.role,
      password: payload.password,
      phone: payload.phone ?? null,
      status: payload.status ?? "active",
      teamId: payload.teamId ?? null,
      managerId: payload.managerId,
    });

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
 *DOAR ADMIN
 */
router.put("/:id", requireRole("admin"), async (req, res, next) => {
  try {
    const user = await User.findByPk(Number(req.params.id));
    if (!user) return res.status(404).json({ success: false, error: "User not found" });

    const updates = { ...req.body };
    delete updates.id;

    // role validare
    if (updates.role !== undefined) {
      updates.role = normRole(updates.role);
      if (!updates.role) {
        return res.status(400).json({
          success: false,
          error: `Invalid role. Allowed: ${ALLOWED_ROLES.join(", ")}`,
        });
      }
    }

    // schimbare parola -> hash
    if (updates.password && typeof updates.password === "string") {
      if (String(updates.password).length < 4) {
        return res.status(400).json({ success: false, error: "Parola trebuie să aibă minim 4 caractere." });
      }
      updates.password = await bcrypt.hash(updates.password, 10);
    }

    const finalRole = normRole(updates.role ?? user.role);
    const finalManagerId =
      updates.managerId !== undefined ? updates.managerId : user.managerId;

    if (finalRole === "executor") {
      const manager = await ensureManagerExists(finalManagerId);
      if (!manager) {
        return res.status(400).json({
          success: false,
          error: "Executantul trebuie să aibă managerId valid (un user cu rol 'manager').",
        });
      }
      updates.managerId = manager.id;
    } else {
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


 // DELETE /api/users/:id
 //DOAR ADMIN

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
    //stergere user cu task-uri alocate
    const taskCount = await Task.count({ where: { userId: id } });
    if (taskCount > 0) {
      return res.status(400).json({
        success: false,
        error: "Nu poți șterge un user care are task-uri alocate. Reasignează task-urile întâi.",
      });
    }

    await User.destroy({ where: { id } });
    res.json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    next(error);
  }
});

module.exports = router;
