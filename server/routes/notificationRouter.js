const express = require("express");
const Notification = require("../models/Notification");
const router = express.Router();

// GET - notificări (cu filtrare după userId / unread)
router.get("/", async (req, res, next) => {
  try {
    const where = {};
    if (req.query.userId) where.userId = req.query.userId;
    if (req.query.unread === "true") where.isRead = false;

    const notifications = await Notification.findAll({
      where,
      order: [["createdAt", "DESC"]],
    });

    res.json({ success: true, data: notifications });
  } catch (error) {
    next(error);
  }
});

// GET - count notificări necitite
router.get("/count", async (req, res, next) => {
  try {
    const where = { isRead: false };
    if (req.query.userId) where.userId = req.query.userId;

    const unread = await Notification.count({ where });
    res.json({ success: true, data: { unread } });
  } catch (error) {
    next(error);
  }
});

// POST - creare notificare
router.post("/", async (req, res, next) => {
  try {
    const notification = await Notification.create(req.body);
    res.status(201).json({ success: true, data: notification });
  } catch (error) {
    next(error);
  }
});

// PUT - actualizare notificare (ex: isRead true/false)
router.put("/:id", async (req, res, next) => {
  try {
    const notification = await Notification.findByPk(req.params.id);
    if (!notification) return res.status(404).json({ error: "Notification not found" });

    await notification.update(req.body);
    res.json({ success: true, data: notification });
  } catch (error) {
    next(error);
  }
});

// PUT - marchează ca citită (shortcut)
router.put("/:id/read", async (req, res, next) => {
  try {
    const notification = await Notification.findByPk(req.params.id);
    if (!notification) return res.status(404).json({ error: "Notification not found" });

    await notification.update({ isRead: true });
    res.json({ success: true, data: notification });
  } catch (error) {
    next(error);
  }
});

// PUT - marchează toate ca citite
router.put("/read-all", async (req, res, next) => {
  try {
    const where = { isRead: false };
    if (req.query.userId) where.userId = req.query.userId;

    await Notification.update({ isRead: true }, { where });
    res.json({ success: true, message: "All notifications marked as read" });
  } catch (error) {
    next(error);
  }
});

// DELETE - ștergere notificare
router.delete("/:id", async (req, res, next) => {
  try {
    const deleted = await Notification.destroy({ where: { id: req.params.id } });
    if (!deleted) return res.status(404).json({ error: "Notification not found" });

    res.json({ success: true, message: "Notification deleted successfully" });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
