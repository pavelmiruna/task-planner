const { DataTypes } = require("sequelize");
const sequelize = require("../sequelize");

const Task = sequelize.define("Task", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  description: { type: DataTypes.STRING(255), allowNull: false },
  status: {
    type: DataTypes.ENUM("OPEN", "PENDING", "COMPLETED", "CLOSED"),
    defaultValue: "OPEN",
  },
  priority: {
    type: DataTypes.ENUM("LOW", "MEDIUM", "HIGH", "URGENT"),
    defaultValue: "MEDIUM",
  },
  progress: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: { min: 0, max: 100 },
  },
  dueDate: { type: DataTypes.DATE, allowNull: true },
  assignedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  completedAt: { type: DataTypes.DATE, allowNull: true },
});

module.exports = Task;
