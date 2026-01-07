const express = require("express");
const Notification = require("../models/Notification");
const router = express.Router();

// GET - notificări (cu filtrare după userId)
router.get("/", async (req, res) => {
  try {
    const where = {};
    if (req.query.userId) where.userId = req.query.userId;
    const notifications = await Notification.findAll({ where });
    res.json({ success: true, data: notifications });
  } catch (error) {
   next(error);
  }
});

// POST - creare notificare
router.post("/", async (req, res) => {
  try {
    const notification = await Notification.create(req.body);
    res.status(201).json({ success: true, data: notification });
  } catch (error) {
   next(error);
  }
});

// PUT - actualizare (citit/necitit)
router.put("/:id", async (req, res) => {
  try {
    const notification = await Notification.findByPk(req.params.id);
    if (!notification) return res.status(404).json({ error: "Notification not found" });
    await notification.update(req.body);
    res.json({ success: true, data: notification });
  } catch (error) {
   next(error);
  }
});

// DELETE - ștergere notificare
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Notification.destroy({ where: { id: req.params.id } });
    if (!deleted) return res.status(404).json({ error: "Notification not found" });
    res.json({ success: true, message: "Notification deleted successfully" });
  } catch (error) {
   next(error);
  }
});

module.exports = router;
