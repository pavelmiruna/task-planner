const User = require("./User");
const Team = require("./Team");
const Project = require("./Project");
const Task = require("./Task");
const TeamMember = require("./TeamMember");

// User <-> Manager
User.belongsTo(User, { as: "manager", foreignKey: "managerId" });
User.hasMany(User, { as: "subordinates", foreignKey: "managerId" });

// User <-> Team 
Team.hasMany(User, { as: "directMembers", foreignKey: "teamId" });
User.belongsTo(Team, { as: "directTeam", foreignKey: "teamId" });

// Team <-> Project
Team.hasMany(Project, { as: "projects", foreignKey: "teamId" });
Project.belongsTo(Team, { as: "team", foreignKey: "teamId" });

// Project <-> Task
Project.hasMany(Task, { as: "tasks", foreignKey: "projectId" });
Task.belongsTo(Project, { as: "project", foreignKey: "projectId" });

// User <-> Task
User.hasMany(Task, { as: "tasks", foreignKey: "userId" });
Task.belongsTo(User, { as: "user", foreignKey: "userId" });

// Team <-> Task
Team.hasMany(Task, { as: "teamTasks", foreignKey: "teamId" });
Task.belongsTo(Team, { as: "team", foreignKey: "teamId" });

// Team <-> User (many-to-many)
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

module.exports = { User, Team, Project, Task, TeamMember };
