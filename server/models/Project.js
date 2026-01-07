const { DataTypes } = require("sequelize");
const sequelize = require("../sequelize");

const Project = sequelize.define("Project", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(150), allowNull: false },
  description: { type: DataTypes.TEXT },
  startDate: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  endDate: { type: DataTypes.DATE, allowNull: true },
  status: {
    type: DataTypes.ENUM("OPEN", "IN_PROGRESS", "COMPLETED", "CLOSED"),
    defaultValue: "OPEN",
  },
  priority: {
    type: DataTypes.ENUM("LOW", "MEDIUM", "HIGH"),
    defaultValue: "MEDIUM",
  },
  progress: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: { min: 0, max: 100 },
  },
  teamId: { type: DataTypes.INTEGER, allowNull: true },
});

module.exports = Project;
