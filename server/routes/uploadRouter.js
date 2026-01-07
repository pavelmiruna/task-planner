const express = require("express");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const { v2: cloudinary } = require("cloudinary");
const User = require("../models/User");
require("dotenv").config();

const router = express.Router();

// Configurare Cloudinary
 cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});


// Configurare storage pentru Multer
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "profile_pictures",
    allowed_formats: ["jpg", "jpeg", "png"],
    transformation: [{ width: 300, height: 300, crop: "limit" }],
  },
});

const upload = multer({ storage });

// Upload imagine utilizator
router.post("/:userId", upload.single("image"), async (req, res, next) => {
  try {
    const { userId } = req.params;

    if (!req.file || !req.file.path) {
      return res.status(400).json({ error: "No image file uploaded" });
    }

    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    user.profilePicture = req.file.path;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Profile picture uploaded successfully",
      imageUrl: req.file.path,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
