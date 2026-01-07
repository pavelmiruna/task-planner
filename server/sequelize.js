const { Sequelize } = require("sequelize");
require("dotenv").config();

let sequelize;

// Dacă există o variabilă DATABASE_URL (folosită pe Azure)
if (process.env.DATABASE_URL) {
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: "postgres",
    protocol: "postgres",
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false, // important pentru Azure
      },
    },
    define: {
      timestamps: false,
    },
    logging: false, // opțional: dezactivează logurile SQL
  });
  console.log("✅ Using PostgreSQL database (Azure)");
} else {
  // Altfel, folosește baza locală SQLite
  sequelize = new Sequelize({
    dialect: "sqlite",
    storage: "./database.sqlite",
    define: {
      timestamps: false,
    },
    logging: false,
  });
  console.log("💾 Using local SQLite database");
}

module.exports = sequelize;
