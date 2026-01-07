const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config(); // pentru variabile .env
const sequelize = require("./sequelize");

// Import routers
const userRouter = require("./routes/userRouter");
const taskRouter = require("./routes/taskRouter");
const projectRouter = require("./routes/projectRouter");
const commentRouter = require("./routes/commentRouter");
const notificationRouter = require("./routes/notificationRouter");
const teamRouter = require("./routes/teamRouter");
const uploadRouter = require("./routes/uploadRouter");
// Asociațiile între modele
require("./models/associations");

// Middleware global de erori
const errorHandler = require("./middleware/errorHandler");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: "*" })); // Azure rulează frontendul de pe alt domeniu
app.use(express.json());

// Servim fișiere statice (ex: poze uploadate local, dacă există)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Health check endpoint (Azure folosește asta pentru monitorizare)
app.get("/", (req, res) => {
  res.status(200).send("Task Planner backend is running ✅");
});

// API routes
app.use("/api/users", userRouter);
app.use("/api/tasks", taskRouter);
app.use("/api/projects", projectRouter);
app.use("/api/comments", commentRouter);
app.use("/api/notifications", notificationRouter);
app.use("/api/teams", teamRouter);

// Middleware de erori (trebuie pus DUPĂ rute!)
app.use(errorHandler);

//Cloudinary

app.use("/api/upload", uploadRouter);


// Start server
app.listen(PORT, async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connected successfully");

    // Sincronizare modele doar în dezvoltare
    if (process.env.NODE_ENV !== "production") {
      await sequelize.sync({ alter: true });
      console.log("🛠️ Models synchronized (development mode)");
    }else {
      console.log("🏢 Production mode - no schema sync");
    }

    console.log(`🚀 Server running on http://localhost:${PORT}`);
  } catch (error) {
    console.error("❌ Database connection error:", error);
  }
});
