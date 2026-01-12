module.exports = (err, req, res, next) => {
  console.error("Error:", err.message);

  // Sequelize validation errors
  if (err.name === "SequelizeValidationError" || err.name === "SequelizeUniqueConstraintError") {
    return res.status(400).json({
      success: false,
      error: "Validation error",
      details: err.errors.map((e) => e.message),
    });
  }

  // Foreign key errors (PostgreSQL)
  if (err.name === "SequelizeForeignKeyConstraintError") {
    return res.status(409).json({
      success: false,
      error: "Foreign key constraint error",
      details: err.message,
    });
  }

  // Default generic error
  res.status(500).json({
    success: false,
    error: "Internal Server Error",
    message: err.message || "Something went wrong",
  });
};
