const { DataTypes } = require("sequelize");
const sequelize = require("../sequelize");

const Notification = sequelize.define("Notification", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  message: { type: DataTypes.TEXT, allowNull: false },
  type: {
    type: DataTypes.ENUM("TASK", "PROJECT", "COMMENT", "SYSTEM"),
    defaultValue: "SYSTEM",
  },
  isRead: { type: DataTypes.BOOLEAN, defaultValue: false },
  createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
});

module.exports = Notification;
