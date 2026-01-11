// models/User.js
const { DataTypes } = require("sequelize");
const sequelize = require("../sequelize");

const User = sequelize.define(
  "User",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    username: { type: DataTypes.STRING(100), allowNull: false },
    email: { type: DataTypes.STRING(150), allowNull: false, unique: true },
    role: {
      type: DataTypes.ENUM("admin", "manager", "executor"),
      allowNull: false,
    },
    password: { type: DataTypes.STRING, allowNull: false },
    phone: { type: DataTypes.STRING(20) },
    createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    status: { type: DataTypes.ENUM("active", "inactive"), defaultValue: "active" },
    lastLogin: { type: DataTypes.DATE, allowNull: true },
    profilePicture: { type: DataTypes.STRING, allowNull: true },
    teamId: { type: DataTypes.INTEGER, allowNull: true },

    // rămâne nullable în DB, dar validăm logic mai jos
    managerId: { type: DataTypes.INTEGER, allowNull: true },
  },
  {
    validate: {
      managerRule() {
        const role = String(this.role || "").toLowerCase();

        // executor -> obligatoriu managerId
        if (role === "executor" && !this.managerId) {
          throw new Error("Executor must have managerId.");
        }

        // admin/manager -> NU trebuie să aibă managerId
        if ((role === "admin" || role === "manager") && this.managerId) {
          throw new Error("Admin/Manager must not have managerId.");
        }
      },
    },
  }
);

module.exports = User;
