require("dotenv").config();

const sequelize = require("./sequelize");

// Modele
const Team = require("./models/Team");
const User = require("./models/User");
const Project = require("./models/Project");
const Task = require("./models/Task");
const TeamMember = require("./models/TeamMember");
const Notification = require("./models/Notification"); // ✅ ADĂUGAT

// Asocieri (IMPORTANT)
require("./models/associations");

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function run() {
  try {
    console.log("🔌 Connecting DB...");
    await sequelize.authenticate();
    console.log("✅ DB connected");

    console.log("🛠️ Syncing models...");
    await sequelize.sync({ force: true });
    console.log("✅ Sync done");

    console.log("🌱 Seeding...");

    // 1) Teams
    const team1 = await Team.create({ name: "Team Alpha", description: "Echipa de test Alpha" });
    const team2 = await Team.create({ name: "Team Beta", description: "Echipa de test Beta" });

    // 2) Users
    const users = await User.bulkCreate(
      [
        { username: "ana", email: "ana@test.com", role: "executor", password: "1234" },
        { username: "mihai", email: "mihai@test.com", role: "manager", password: "1234" },
        { username: "ioana", email: "ioana@test.com", role: "executor", password: "1234" },
        { username: "andrei", email: "andrei@test.com", role: "admin", password: "1234" },
      ],
      { returning: true }
    );

    // 3) Add members (many-to-many)
    await team1.addMembers([users[0], users[1]]);
    await team2.addMembers([users[2], users[3]]);

    // 4) Projects
    const p1 = await Project.create({
      name: "Website UI",
      description: "Refacem UI-ul aplicației",
      status: "OPEN",
      priority: "HIGH",
      progress: 10,
      teamId: team1.id,
      startDate: new Date(),
    });

    const p2 = await Project.create({
      name: "API Cleanup",
      description: "Curățare endpoints + validări",
      status: "IN_PROGRESS",
      priority: "MEDIUM",
      progress: 40,
      teamId: team2.id,
      startDate: new Date(),
    });

    // 5) Tasks
    const taskStatus = ["OPEN", "PENDING", "COMPLETED", "CLOSED"];
    const taskPrio = ["LOW", "MEDIUM", "HIGH", "URGENT"];

    await Task.bulkCreate([
      {
        description: "Fă pagina Projects mai completă",
        status: "OPEN",
        priority: "HIGH",
        progress: 0,
        dueDate: new Date(Date.now() + 7 * 24 * 3600 * 1000),
        projectId: p1.id,
        teamId: team1.id,
      },
      {
        description: "Adaugă dropdown de teams în Projects modal",
        status: "PENDING",
        priority: "MEDIUM",
        progress: 20,
        dueDate: new Date(Date.now() + 10 * 24 * 3600 * 1000),
        projectId: p1.id,
        teamId: team1.id,
      },
      {
        description: "Fix notificări endpoints",
        status: "COMPLETED",
        priority: "URGENT",
        progress: 100,
        completedAt: new Date(),
        projectId: p2.id,
        teamId: team2.id,
      },
      {
        description: "Seed demo data pentru prezentare",
        status: pick(taskStatus),
        priority: pick(taskPrio),
        progress: 50,
        dueDate: new Date(Date.now() + 3 * 24 * 3600 * 1000),
        projectId: p2.id,
        teamId: team2.id,
      },
    ]);

    // ✅ Luăm task-urile ca să avem ID-uri sigur
    const allTasks = await Task.findAll({ order: [["id", "ASC"]] });

    // 6) ✅ Notificări (2 bucăți pentru tab-ul Notifications)
    // Dacă în model câmpul se numește altfel decât message/type/isRead, schimbă aici.
    await Notification.bulkCreate([
      {
        userId: users[0].id,        // destinatar: ana
        fromUserId: users[1].id,    // sender: mihai
        taskId: allTasks[0]?.id || null,
        projectId: p1.id,
        type: "TASK_ASSIGNED",
        message: `Ai primit un task nou în proiectul "${p1.name}".`,
        isRead: false,
      },
      {
        userId: users[2].id,        // destinatar: ioana
        fromUserId: users[3].id,    // sender: andrei
        taskId: allTasks[2]?.id || null,
        projectId: p2.id,
        type: "PROJECT_UPDATE",
        message: `Proiectul "${p2.name}" a fost actualizat. Verifică statusul.`,
        isRead: false,
      },
    ]);

    // 7) Counts
    const teamCount = await Team.count();
    const userCount = await User.count();
    const projectCount = await Project.count();
    const taskCount = await Task.count();
    const notificationCount = await Notification.count();

    console.log("✅ Seed done!");
    console.log({ teamCount, userCount, projectCount, taskCount, notificationCount });

    process.exit(0);
  } catch (e) {
    console.error("❌ Seed error:", e);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

run();
