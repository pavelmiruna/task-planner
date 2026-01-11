const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
router.use(authMiddleware);

const Team = require("../models/Team");
const User = require("../models/User");

// include: doar 3 atribute
const membersInclude = [
  {
    model: User,
    as: "members",
    attributes: ["id", "username", "email"],
    through: { attributes: [] },
  },
];

// GET /api/teams
router.get("/", async (req, res, next) => {
  try {
    const where = {};
    if (req.query.projectId) where.projectId = req.query.projectId;

    const teams = await Team.findAll({
      where,
      include: membersInclude,
      order: [["id", "DESC"]],
    });

    res.json({ success: true, data: teams });
  } catch (error) {
    next(error);
  }
});

// ✅ GET /api/teams/:id  (asta îți trebuie ca să nu mai fie 404)
router.get("/:id", async (req, res, next) => {
  try {
    const team = await Team.findByPk(req.params.id, { include: membersInclude });
    if (!team) return res.status(404).json({ error: "Team not found" });

    res.json({ success: true, data: team });
  } catch (error) {
    next(error);
  }
});

// POST /api/teams
router.post("/", async (req, res, next) => {
  try {
    const created = await Team.create({
      name: req.body.name,
      description: req.body.description ?? null,
      projectId: req.body.projectId ?? null,
    });

    const full = await Team.findByPk(created.id, { include: membersInclude });
    res.status(201).json({ success: true, data: full });
  } catch (error) {
    next(error);
  }
});

// PUT /api/teams/:id
router.put("/:id", async (req, res, next) => {
  try {
    const team = await Team.findByPk(req.params.id);
    if (!team) return res.status(404).json({ error: "Team not found" });

    await team.update({
      name: req.body.name ?? team.name,
      description: req.body.description ?? team.description,
      projectId: req.body.projectId ?? team.projectId,
    });

    const full = await Team.findByPk(team.id, { include: membersInclude });
    res.json({ success: true, data: full });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/teams/:id
router.delete("/:id", async (req, res, next) => {
  try {
    const deleted = await Team.destroy({ where: { id: req.params.id } });
    if (!deleted) return res.status(404).json({ error: "Team not found" });

    res.json({ success: true, message: "Team deleted successfully" });
  } catch (error) {
    next(error);
  }
});

// ✅ PUT /api/teams/:id/members
router.put("/:id/members", async (req, res, next) => {
  try {
    const team = await Team.findByPk(req.params.id);
    if (!team) return res.status(404).json({ error: "Team not found" });

    const userIds = Array.isArray(req.body.userIds) ? req.body.userIds : [];
    const users = await User.findAll({ where: { id: userIds } });

    await team.setMembers(users);

    const updated = await Team.findByPk(req.params.id, { include: membersInclude });
    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
});

// POST /api/teams/:id/members/:userId
router.post("/:id/members/:userId", async (req, res, next) => {
  try {
    const team = await Team.findByPk(req.params.id);
    if (!team) return res.status(404).json({ error: "Team not found" });

    const user = await User.findByPk(req.params.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    await team.addMember(user);

    const updated = await Team.findByPk(req.params.id, { include: membersInclude });
    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/teams/:id/members/:userId
router.delete("/:id/members/:userId", async (req, res, next) => {
  try {
    const team = await Team.findByPk(req.params.id);
    if (!team) return res.status(404).json({ error: "Team not found" });

    const user = await User.findByPk(req.params.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    await team.removeMember(user);

    const updated = await Team.findByPk(req.params.id, { include: membersInclude });
    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
