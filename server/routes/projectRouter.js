const express = require("express");
const Project = require("../models/Project");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
router.use(authMiddleware);

// GET - proiecte (cu filtrare)
router.get("/", async (req, res,next) => {
  try {
    const where = {};
    if (req.query.status) where.status = req.query.status;
    if (req.query.teamId) where.teamId = req.query.teamId;
    const projects = await Project.findAll({ where });
    res.json({ success: true, data: projects });
  } catch (error) {
   next(error);
  }
});

// POST - creare proiect
router.post("/", async (req, res,next) => {
  try {
    const project = await Project.create(req.body);
    res.status(201).json({ success: true, data: project });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT - actualizare proiect
router.put("/:id", async (req, res,next) => {
  try {
    const project = await Project.findByPk(req.params.id);
    if (!project) return res.status(404).json({ error: "Project not found" });
    await project.update(req.body);
    res.json({ success: true, data: project });
  } catch (error) {
   next(error);
  }
});

// DELETE - ștergere proiect
router.delete("/:id", async (req, res,next) => {
  try {
    const deleted = await Project.destroy({ where: { id: req.params.id } });
    if (!deleted) return res.status(404).json({ error: "Project not found" });
    res.json({ success: true, message: "Project deleted successfully" });
  } catch (error) {
   next(error);
  }
});

module.exports = router;
