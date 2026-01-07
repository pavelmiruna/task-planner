const { DataTypes } = require("sequelize");
const sequelize = require("../sequelize");

const Team = sequelize.define("Team", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(100), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  projectId: { type: DataTypes.INTEGER, allowNull: true },
});

module.exports = Team;
