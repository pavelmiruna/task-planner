const express = require("express");
const router = express.Router();

const Team = require("../models/Team");
const User = require("../models/User");

// Helpers (ajută să nu repeți include-ul peste tot)
const membersInclude = [
  {
    model: User,
    as: "members",
    // Ajustează "attributes" după ce câmpuri ai în User
    // dacă nu ai "name", schimbă cu "username" / "fullName" etc.
    attributes: ["id", "username", "email"],
    through: { attributes: [] }, // nu trimitem join table fields
  },
];

/**
 * GET /teams
 * Returnează toate echipele + lista de membri
 * Opțional: ?projectId=1
 */
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

/**
 * GET /teams/:id
 * Returnează o echipă + membri
 */
router.get("/:id", async (req, res, next) => {
  try {
    const team = await Team.findByPk(req.params.id, { include: membersInclude });
    if (!team) return res.status(404).json({ error: "Team not found" });

    res.json({ success: true, data: team });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /teams
 * Creează echipă
 * Body: { name, description, projectId? }
 */
router.post("/", async (req, res, next) => {
  try {
    const created = await Team.create({
      name: req.body.name,
      description: req.body.description ?? null,
      projectId: req.body.projectId ?? null,
    });

    // întoarcem echipa creată cu members (va fi listă goală)
    const full = await Team.findByPk(created.id, { include: membersInclude });

    res.status(201).json({ success: true, data: full });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /teams/:id
 * Actualizează echipă
 */
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

/**
 * DELETE /teams/:id
 * Șterge echipă
 */
router.delete("/:id", async (req, res, next) => {
  try {
    const deleted = await Team.destroy({ where: { id: req.params.id } });
    if (!deleted) return res.status(404).json({ error: "Team not found" });

    res.json({ success: true, message: "Team deleted successfully" });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /teams/:id/members
 * Setează complet lista de membri (înlocuiește tot)
 * Body: { userIds: [1,2,3] }
 */
router.put("/:id/members", async (req, res, next) => {
  try {
    const team = await Team.findByPk(req.params.id);
    if (!team) return res.status(404).json({ error: "Team not found" });

    const userIds = Array.isArray(req.body.userIds) ? req.body.userIds : [];

    // ia userii existenți din DB
    const users = await User.findAll({ where: { id: userIds } });

    // Sequelize magic method (as: "members")
    await team.setMembers(users);

    const updated = await Team.findByPk(req.params.id, { include: membersInclude });
    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /teams/:id/members/:userId
 * Adaugă un singur membru
 */
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

/**
 * DELETE /teams/:id/members/:userId
 * Șterge un membru
 */
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
