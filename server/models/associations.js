const User = require("./User");
const Team = require("./Team");
const Project = require("./Project");
const Task = require("./Task");
const Comment = require("./Comment");
const Notification = require("./Notification");
const TeamMember = require("./TeamMember");

// User ↔ Manager
User.belongsTo(User, { as: "manager", foreignKey: "managerId" });
User.hasMany(User, { as: "subordinates", foreignKey: "managerId" });

// User ↔ Team (one-to-many pe teamId din User) — ✅ alias schimbat ca să nu se bată cu many-to-many
Team.hasMany(User, { as: "directMembers", foreignKey: "teamId" });
User.belongsTo(Team, { as: "directTeam", foreignKey: "teamId" });

// Team ↔ Project
Team.hasMany(Project, { as: "projects", foreignKey: "teamId" });
Project.belongsTo(Team, { as: "team", foreignKey: "teamId" });

// Project ↔ Task
Project.hasMany(Task, { as: "tasks", foreignKey: "projectId" });
Task.belongsTo(Project, { as: "project", foreignKey: "projectId" });

// User ↔ Task
User.hasMany(Task, { as: "tasks", foreignKey: "userId" });
Task.belongsTo(User, { as: "user", foreignKey: "userId" });

// Team ↔ Task
Team.hasMany(Task, { as: "teamTasks", foreignKey: "teamId" });
Task.belongsTo(Team, { as: "team", foreignKey: "teamId" });

// Task ↔ Comment
Task.hasMany(Comment, { as: "comments", foreignKey: "taskId" });
Comment.belongsTo(Task, { as: "task", foreignKey: "taskId" });

// User ↔ Comment
User.hasMany(Comment, { as: "comments", foreignKey: "userId" });
Comment.belongsTo(User, { as: "user", foreignKey: "userId" });

// User ↔ Notification
User.hasMany(Notification, { as: "notifications", foreignKey: "userId" });
Notification.belongsTo(User, { as: "user", foreignKey: "userId" });

Notification.belongsTo(Task, { as: "task", foreignKey: "taskId" });
Notification.belongsTo(Project, { as: "project", foreignKey: "projectId" });
Notification.belongsTo(User, { as: "sender", foreignKey: "fromUserId" });

// ✅ Team ↔ User (many-to-many) — păstrăm alias "members" aici!
Team.belongsToMany(User, {
  through: TeamMember,
  foreignKey: "teamId",
  otherKey: "userId",
  as: "members",
});

User.belongsToMany(Team, {
  through: TeamMember,
  foreignKey: "userId",
  otherKey: "teamId",
  as: "teams",
});

module.exports = { User, Team, Project, Task, Comment, Notification, TeamMember };
