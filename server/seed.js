require("dotenv").config();

const bcrypt = require("bcryptjs");
const sequelize = require("./sequelize");

// Modele + asocieri 
const { User, Team, Project, Task, TeamMember } = require("./models/associations");

function daysFromNow(n) {
  return new Date(Date.now() + n * 24 * 60 * 60 * 1000);
}

async function run() {
  try {
    console.log(" Connecting DB...");
    await sequelize.authenticate();
    console.log(" DB connected");

    console.log(" Syncing models (force: true)...");
    await sequelize.sync({ force: true });
    console.log(" Sync done");

    console.log(" Seeding...");

    // Guard
    if (!Task || Task.name !== "Task") {
      throw new Error(
        `Task model mismatch. Expected model name "Task", got "${Task?.name}". Check server/models/Task.js export & filename.`
      );
    }

    // 1) Teams
    const team1 = await Team.create({
      name: "Team Alpha",
      description: "Echipa de test Alpha",
    });

    const team2 = await Team.create({
      name: "Team Beta",
      description: "Echipa de test Beta",
    });

    // 2) Users
    const plainPassword = process.env.SEED_PASSWORD || "1234";
    const passwordHash = await bcrypt.hash(plainPassword, 10);

    const adminPayload = {
      username: "andrei",
      email: "andrei@test.com",
      role: "admin",
      password: passwordHash,
      managerId: null,
    };

    const managerPayload = {
      username: "mihai",
      email: "mihai@test.com",
      role: "manager",
      password: passwordHash,
      managerId: null,
    };

    const admin = await User.create(adminPayload);
    const manager = await User.create(managerPayload);

    const executor1 = await User.create({
      username: "ana",
      email: "ana@test.com",
      role: "executor",
      password: passwordHash,
      managerId: manager.id, 
    });

    const executor2 = await User.create({
      username: "ioana",
      email: "ioana@test.com",
      role: "executor",
      password: passwordHash,
      managerId: manager.id,
    });

    // 3) Team members 
    await team1.addMembers([manager, executor1]);
    await team2.addMembers([admin, executor2]);

    // 4) Projects
    const p1 = await Project.create({
      name: "Website UI",
      description: "Refacem UI-ul aplicației",
      status: "OPEN",
      priority: "HIGH",
      progress: 10,
      teamId: team1.id,
      startDate: new Date(),
      endDate: null,
    });

    const p2 = await Project.create({
      name: "API Cleanup",
      description: "Curățare endpoints + validări",
      status: "IN_PROGRESS",
      priority: "MEDIUM",
      progress: 40,
      teamId: team2.id,
      startDate: new Date(),
      endDate: null,
    });

    // 5) Tasks 

    // OPEN 
    const t1 = await Task.create({
      description: "Fă pagina Projects mai completă",
      status: "OPEN",
      priority: "HIGH",
      progress: 0,
      dueDate: daysFromNow(7),
      projectId: p1.id,
      teamId: team1.id,
      userId: null,
      assignedAt: null,
      completedAt: null,
    });

    // PENDING 
    const t2 = await Task.create({
      description: "Adaugă dropdown de teams în Projects modal",
      status: "PENDING",
      priority: "MEDIUM",
      progress: 20,
      dueDate: daysFromNow(10),
      projectId: p1.id,
      teamId: team1.id,
      userId: executor1.id,
      assignedAt: new Date(),
      completedAt: null,
    });

    // COMPLETED 
    const t3 = await Task.create({
      description: "Curăță și testează endpoint-urile de tasks",
      status: "COMPLETED",
      priority: "URGENT",
      progress: 100,
      dueDate: daysFromNow(3),
      projectId: p2.id,
      teamId: team2.id,
      userId: executor2.id,
      assignedAt: daysFromNow(-2),
      completedAt: new Date(),
    });

    // CLOSED 
    const t4 = await Task.create({
      description: "Pregătește demo data pentru prezentare",
      status: "CLOSED",
      priority: "MEDIUM",
      progress: 100,
      dueDate: daysFromNow(1),
      projectId: p2.id,
      teamId: team2.id,
      userId: executor2.id,
      assignedAt: daysFromNow(-4),
      completedAt: daysFromNow(-1),
    });

    // 6) Counts
    const teamCount = await Team.count();
    const userCount = await User.count();
    const projectCount = await Project.count();
    const taskCount = await Task.count();

    console.log(" Seed done!");
    console.log({
      teamCount,
      userCount,
      projectCount,
      taskCount,
      adminEmail: admin.email,
      managerEmail: manager.email,
      executor1Email: executor1.email,
      executor2Email: executor2.email,
      password: plainPassword,
      sampleTasks: [t1.id, t2.id, t3.id, t4.id],
    });
  } catch (e) {
    console.error(" Seed error:", e);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

run();
