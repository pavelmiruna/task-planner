const express = require("express");
const Task = require("../models/Task");
const router = express.Router();

// GET - toate task-urile (filtrare după projectId, userId)
router.get("/", async (req, res) => {
  try {
    const where = {};
    if (req.query.projectId) where.projectId = req.query.projectId;
    if (req.query.userId) where.userId = req.query.userId;
    const tasks = await Task.findAll({ where });
    res.json({ success: true, data: tasks });
  } catch (error) {
   next(error);
  }
});

// POST - creare task
router.post("/", async (req, res) => {
  try {
    const task = await Task.create(req.body);
    res.status(201).json({ success: true, data: task });
  } catch (error) {
   next(error);
  }
});

// PUT - actualizare task
router.put("/:id", async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) return res.status(404).json({ error: "Task not found" });
    await task.update(req.body);
    res.json({ success: true, data: task });
  } catch (error) {
   next(error);
  }
});

// DELETE - ștergere task
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Task.destroy({ where: { id: req.params.id } });
    if (!deleted) return res.status(404).json({ error: "Task not found" });
    res.json({ success: true, message: "Task deleted successfully" });
  } catch (error) {
   next(error);
  }
});

module.exports = router;
