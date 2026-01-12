const express = require("express");
const { Op } = require("sequelize");
const Task = require("../models/Task");
const User = require("../models/User");

const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const requireRole = require("../middleware/requireRole");

router.use(authMiddleware);

const STATUSES = ["OPEN", "PENDING", "COMPLETED", "CLOSED"];

function normRole(r) {
  const v = String(r || "").toLowerCase();
  return v;
}

function isManagerOrAdmin(req) {
  const r = normRole(req.user?.role);
  return r === "manager" || r === "admin";
}

function isExecutor(req) {
  const r = normRole(req.user?.role);
  return r === "executor";
}

async function getSubordinateIds(managerId) {
  const subs = await User.findAll({
    where: { managerId: Number(managerId) },
    attributes: ["id"],
  });
  return subs.map((u) => u.id);
}

/**
 * GET /api/tasks
 * - executor: vede doar task-urile lui
 * - manager/admin: vede task-urile subordonaților + OPEN nealocate (doar status OPEN)
 */
router.get("/", async (req, res, next) => {
  try {
    const where = {};

    // Filtre opționale
    if (req.query.projectId) where.projectId = Number(req.query.projectId);
    if (req.query.status) {
      const s = String(req.query.status).toUpperCase();
      if (!STATUSES.includes(s)) {
        return res.status(400).json({ success: false, error: "Invalid status filter" });
      }
      where.status = s;
    }

    if (isExecutor(req)) {
      where.userId = req.user.id;
    } else if (isManagerOrAdmin(req)) {
      const subIds = await getSubordinateIds(req.user.id);

      // ✅ OPEN nealocate doar dacă sunt OPEN
      where[Op.or] = [
        { userId: { [Op.in]: subIds } },
        { userId: null, status: "OPEN" },
      ];
    } else {
      return res.status(403).json({ success: false, error: "Forbidden" });
    }

    const tasks = await Task.findAll({
      where,
      order: [["id", "DESC"]],
    });

    res.json({ success: true, data: tasks });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/tasks/my
 * executor: taskurile lui
 */
router.get("/my", requireRole("executor"), async (req, res, next) => {
  try {
    const where = { userId: req.user.id };

    if (req.query.projectId) where.projectId = Number(req.query.projectId);
    if (req.query.status) {
      const s = String(req.query.status).toUpperCase();
      if (!STATUSES.includes(s)) {
        return res.status(400).json({ success: false, error: "Invalid status filter" });
      }
      where.status = s;
    }

    const tasks = await Task.findAll({ where, order: [["id", "DESC"]] });
    res.json({ success: true, data: tasks });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/tasks/my/history
 * executor: istoric (COMPLETED + CLOSED)
 */
router.get("/my/history", requireRole("executor"), async (req, res, next) => {
  try {
    const tasks = await Task.findAll({
      where: {
        userId: req.user.id,
        status: { [Op.in]: ["COMPLETED", "CLOSED"] },
      },
      order: [["completedAt", "DESC"]],
    });
    res.json({ success: true, data: tasks });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/tasks/executor/:userId/history
 * manager/admin: istoric pentru un executant (COMPLETED + CLOSED)
 */
router.get("/executor/:userId/history", async (req, res, next) => {
  try {
    if (!isManagerOrAdmin(req)) {
      return res.status(403).json({ success: false, error: "Forbidden" });
    }

    const executorId = Number(req.params.userId);
    if (!executorId) {
      return res.status(400).json({ success: false, error: "Invalid userId" });
    }

    if (normRole(req.user.role) === "manager") {
      const executor = await User.findByPk(executorId);
      if (!executor || normRole(executor.role) !== "executor") {
        return res.status(404).json({ success: false, error: "Executor not found" });
      }
      if (Number(executor.managerId) !== Number(req.user.id)) {
        return res.status(403).json({ success: false, error: "Not your subordinate" });
      }
    }

    const tasks = await Task.findAll({
      where: {
        userId: executorId,
        status: { [Op.in]: ["COMPLETED", "CLOSED"] },
      },
      order: [["completedAt", "DESC"]],
    });

    res.json({ success: true, data: tasks });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/tasks
 * manager/admin creează task (OPEN)
 */
router.post("/", async (req, res, next) => {
  try {
    if (!isManagerOrAdmin(req)) {
      return res.status(403).json({ success: false, error: "Only manager/admin can create tasks" });
    }

    const payload = { ...req.body };

    if (!payload.description || typeof payload.description !== "string" || !payload.description.trim()) {
      return res.status(400).json({ success: false, error: "description is required" });
    }

    // ✅ impunem OPEN la creare
    const createPayload = {
      description: payload.description.trim(),
      status: "OPEN",
      priority: payload.priority,
      progress: payload.progress ?? 0,
      dueDate: payload.dueDate || null,
      projectId: payload.projectId ? Number(payload.projectId) : null,
      teamId: payload.teamId ? Number(payload.teamId) : null,

      // ✅ flux corect
      userId: null,
      assignedAt: null,
      completedAt: null,
    };

    const task = await Task.create(createPayload);
    res.status(201).json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/tasks/:id/assign
 * manager/admin alocă task unui executant -> PENDING
 * Body: { userId: executorId }
 */
router.put("/:id/assign", async (req, res, next) => {
  try {
    if (!isManagerOrAdmin(req)) {
      return res.status(403).json({ success: false, error: "Only manager/admin can assign tasks" });
    }

    const task = await Task.findByPk(req.params.id);
    if (!task) return res.status(404).json({ success: false, error: "Task not found" });

    if (task.status !== "OPEN") {
      return res.status(400).json({ success: false, error: "Only OPEN tasks can be assigned" });
    }

    const executorId = Number(req.body.userId);
    if (!executorId) {
      return res.status(400).json({ success: false, error: "userId (executorId) is required" });
    }

    const executor = await User.findByPk(executorId);
    if (!executor || normRole(executor.role) !== "executor") {
      return res.status(400).json({ success: false, error: "userId must be an executor" });
    }

    if (normRole(req.user.role) === "manager" && Number(executor.managerId) !== Number(req.user.id)) {
      return res.status(403).json({ success: false, error: "You can assign tasks only to your executors" });
    }

    await task.update({
      userId: executorId,
      status: "PENDING",
      assignedAt: new Date(),
      progress: Math.max(task.progress ?? 0, 0),
    });

    res.json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/tasks/:id/complete
 * executor -> COMPLETED
 */
router.put("/:id/complete", requireRole("executor"), async (req, res, next) => {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) return res.status(404).json({ success: false, error: "Task not found" });

    if (Number(task.userId) !== Number(req.user.id)) {
      return res.status(403).json({ success: false, error: "You can complete only your tasks" });
    }

    if (task.status !== "PENDING") {
      return res.status(400).json({ success: false, error: "Only PENDING tasks can be completed" });
    }

    await task.update({
      status: "COMPLETED",
      completedAt: new Date(),
      progress: 100,
    });

    res.json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/tasks/:id/close
 * manager/admin -> CLOSED
 */
router.put("/:id/close", async (req, res, next) => {
  try {
    if (!isManagerOrAdmin(req)) {
      return res.status(403).json({ success: false, error: "Only manager/admin can close tasks" });
    }

    const task = await Task.findByPk(req.params.id);
    if (!task) return res.status(404).json({ success: false, error: "Task not found" });

    if (task.status !== "COMPLETED") {
      return res.status(400).json({ success: false, error: "Only COMPLETED tasks can be closed" });
    }

    if (normRole(req.user.role) === "manager") {
      if (!task.userId) {
        return res.status(400).json({ success: false, error: "Task has no executor assigned" });
      }
      const executor = await User.findByPk(task.userId);
      if (!executor || Number(executor.managerId) !== Number(req.user.id)) {
        return res.status(403).json({ success: false, error: "Not your subordinate's task" });
      }
    }

    await task.update({ status: "CLOSED" });
    res.json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/tasks/:id
 * doar manager/admin
 */
router.delete("/:id", async (req, res, next) => {
  try {
    if (!isManagerOrAdmin(req)) {
      return res.status(403).json({ success: false, error: "Only manager/admin can delete tasks" });
    }

    const deleted = await Task.destroy({ where: { id: req.params.id } });
    if (!deleted) return res.status(404).json({ success: false, error: "Task not found" });

    res.json({ success: true, message: "Task deleted successfully" });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
