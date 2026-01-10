const { DataTypes } = require("sequelize");
const sequelize = require("../sequelize");

const TeamMember = sequelize.define(
  "TeamMember",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    teamId: { type: DataTypes.INTEGER, allowNull: false },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    role: { type: DataTypes.STRING(50), allowNull: true }, // opțional
  },
  {
    indexes: [{ unique: true, fields: ["teamId", "userId"] }],
  }
);

module.exports = TeamMember;
