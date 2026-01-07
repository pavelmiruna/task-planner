const express = require("express");
const Team = require("../models/Team");
const router = express.Router();

// GET - toate echipele (cu filtrare opțională)
router.get("/", async (req, res) => {
  try {
    const where = {};
    if (req.query.projectId) where.projectId = req.query.projectId;
    const teams = await Team.findAll({ where });
    res.json({ success: true, data: teams });
  } catch (error) {
   next(error);
  }
});

// POST - creare echipă
router.post("/", async (req, res) => {
  try {
    const team = await Team.create(req.body);
    res.status(201).json({ success: true, data: team });
  } catch (error) {
   next(error);
  }
});

// PUT - actualizare echipă
router.put("/:id", async (req, res) => {
  try {
    const team = await Team.findByPk(req.params.id);
    if (!team) return res.status(404).json({ error: "Team not found" });
    await team.update(req.body);
    res.json({ success: true, data: team });
  } catch (error) {
   next(error);
  }
});

// DELETE - ștergere echipă
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Team.destroy({ where: { id: req.params.id } });
    if (!deleted) return res.status(404).json({ error: "Team not found" });
    res.json({ success: true, message: "Team deleted successfully" });
  } catch (error) {
   next(error);
  }
});

module.exports = router;
