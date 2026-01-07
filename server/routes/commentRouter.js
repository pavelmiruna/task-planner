const express = require("express");
const Comment = require("../models/Comment");
const router = express.Router();

// GET - comentarii (cu filtrare opțională)
router.get("/", async (req, res) => {
  try {
    const where = {};
    if (req.query.taskId) where.taskId = req.query.taskId;
    if (req.query.userId) where.userId = req.query.userId;
    const comments = await Comment.findAll({ where });
    res.json({ success: true, data: comments });
  } catch (error) {
   next(error);
  }
});

// POST - creare comentariu
router.post("/", async (req, res) => {
  try {
    const comment = await Comment.create(req.body);
    res.status(201).json({ success: true, data: comment });
  } catch (error) {
   next(error);
  }
});

//PUT - actualizare comentariu
router.put("/:id", async (req, res, next) => {
  try {
    const comment = await Comment.findByPk(req.params.id);
    if (!comment) {
      return res.status(404).json({ success: false, error: "Comment not found" });
    }
    await comment.update(req.body);
    res.json({
      success: true,
      message: "Comment updated successfully",
      data: comment,
    });
  } catch (error) {
    next(error);
  }
});

// DELETE - ștergere comentariu
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Comment.destroy({ where: { id: req.params.id } });
    if (!deleted) return res.status(404).json({ error: "Comment not found" });
    res.json({ success: true, message: "Comment deleted successfully" });
  } catch (error) {
   next(error);
  }
});

module.exports = router;
