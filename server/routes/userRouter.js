const express = require("express");
const User = require("../models/User");
const router = express.Router();

// GET - toți utilizatorii
router.get("/", async (req, res) => {
  try {
    const users = await User.findAll();
    res.json({ success: true, data: users });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST - adăugare utilizator
router.post("/", async (req, res) => {
  try {
    const user = await User.create(req.body);
    res.status(201).json({ success: true, data: user });
  } catch (error) {
    console.error("Error creating user:", error);
   next(error);
  }
});

// PUT - actualizare utilizator
router.put("/:id", async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    await user.update(req.body);
    res.json({ success: true, data: user });
  } catch (error) {
   next(error);
  }
});

// DELETE - ștergere utilizator
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await User.destroy({ where: { id: req.params.id } });
    if (!deleted) return res.status(404).json({ error: "User not found" });
    res.json({ success: true, message: "User deleted successfully" });
  } catch (error) {
   next(error);
  }
});

module.exports = router;
