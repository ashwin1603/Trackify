const AppError = require("../utils/appError");

function errorHandler(err, _req, res, _next) {
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const message = err.message || "Internal server error";

  if (process.env.NODE_ENV !== "production") {
    return res.status(statusCode).json({ message, stack: err.stack });
  }
  return res.status(statusCode).json({ message });
}

module.exports = { errorHandler };
