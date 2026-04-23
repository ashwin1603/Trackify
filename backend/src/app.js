const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");
const authRoutes = require("./routes/authRoutes");
const bugRoutes = require("./routes/bugRoutes");
const commentRoutes = require("./routes/commentRoutes");
const securityRoutes = require("./routes/securityRoutes");
const auditRoutes = require("./routes/auditRoutes");
const logsRoutes = require("./routes/logsRoutes");
const userRoutes = require("./routes/userRoutes");
const { errorHandler } = require("./middleware/errorHandler");
const { validateGlobalToken } = require("./middleware/globalTokenMiddleware");
const {
  owaspDetectionMiddleware,
} = require("./middleware/owaspDetectionMiddleware");
const {
  mlDetectionMiddleware,
} = require("./middleware/mlDetectionMiddleware");

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(morgan("combined"));

// Health check endpoint (no auth required)
app.get("/api/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

// Global API token validation middleware (applies to all routes below)
app.use(validateGlobalToken);

// OWASP rule-based threat detection (applies to all routes below)
app.use(owaspDetectionMiddleware);

// ML-based threat detection — RandomForest classifier + IsolationForest anomaly detector
app.use(mlDetectionMiddleware);

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/bugs", bugRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/users", userRoutes);
app.use("/api/security", securityRoutes);
app.use("/api/audit", auditRoutes);
app.use("/api/logs", logsRoutes);

app.use(errorHandler);

module.exports = app;
