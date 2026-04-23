const prisma = require("../config/prisma");
const SecurityAnalyzer = require("../utils/securityAnalyzer");
const logger = require("../utils/logger");
const { getMlStats } = require("../middleware/mlDetectionMiddleware");

async function getSecurityDashboard() {
  const failedLoginsLast24h = await prisma.auditLog.count({
    where: {
      action: "LOGIN_FAILED",
      createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    },
  });

  const topFailedUsers = await prisma.user.findMany({
    where: { failedLoginAttempts: { gt: 0 } },
    select: {
      id: true,
      email: true,
      failedLoginAttempts: true,
      lastFailedLoginAt: true,
    },
    orderBy: { failedLoginAttempts: "desc" },
    take: 10,
  });

  const recentAuditLogs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
    include: { actor: { select: { id: true, email: true, name: true } } },
  });

  return { failedLoginsLast24h, topFailedUsers, recentAuditLogs };
}

async function getUserActivity(userId) {
  return prisma.auditLog.findMany({
    where: { actorId: userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

async function getAuditLogs() {
  return prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { actor: { select: { id: true, name: true, email: true } } },
  });
}

/**
 * Get all security alerts (ADMIN only)
 */
async function getAllSecurityAlerts(filters = {}) {
  const { severity, status, type, limit = 50, offset = 0 } = filters;
  const where = {};

  if (severity) where.severity = severity;
  if (status) where.status = status;
  if (type) where.type = type;

  const [alerts, total] = await Promise.all([
    prisma.securityAlert.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: offset,
      take: limit,
      include: {
        user: { select: { id: true, email: true, name: true } },
        assignedTo: { select: { id: true, email: true, name: true } },
      },
    }),
    prisma.securityAlert.count({ where }),
  ]);

  return { alerts, total, offset, limit };
}

/**
 * Get alerts assigned to a security team member
 */
async function getAssignedAlerts(userId, filters = {}) {
  const { status = "ASSIGNED", limit = 50, offset = 0 } = filters;

  const [alerts, total] = await Promise.all([
    prisma.securityAlert.findMany({
      where: {
        assignedToId: userId,
        status,
      },
      orderBy: { createdAt: "desc" },
      skip: offset,
      take: limit,
      include: {
        user: { select: { id: true, email: true, name: true } },
        assignedTo: { select: { id: true, email: true, name: true } },
      },
    }),
    prisma.securityAlert.count({
      where: {
        assignedToId: userId,
        status,
      },
    }),
  ]);

  return { alerts, total, offset, limit };
}

/**
 * Get single alert by ID
 */
async function getAlertById(alertId) {
  return prisma.securityAlert.findUnique({
    where: { id: alertId },
    include: {
      user: { select: { id: true, email: true, name: true } },
      assignedTo: { select: { id: true, email: true, name: true } },
    },
  });
}

/**
 * Assign alert to security team member (ADMIN)
 */
async function assignAlert(alertId, securityUserId, adminId) {
  try {
    // Verify security user exists and has SECURITY_TEAM role
    const securityUser = await prisma.user.findUnique({
      where: { id: securityUserId },
      include: { role: true },
    });

    if (!securityUser) {
      throw new Error("Security team member not found");
    }

    if (securityUser.role.name !== "SECURITY_TEAM") {
      throw new Error("User does not have SECURITY_TEAM role");
    }

    const alert = await prisma.securityAlert.update({
      where: { id: alertId },
      data: {
        status: "ASSIGNED",
        assignedToId: securityUserId,
      },
      include: {
        user: { select: { id: true, email: true, name: true } },
        assignedTo: { select: { id: true, email: true, name: true } },
      },
    });

    // Log assignment
    await prisma.auditLog.create({
      data: {
        actorId: adminId,
        action: "ALERT_ASSIGNED",
        entityType: "SecurityAlert",
        entityId: alertId,
        metadata: {
          assignedTo: securityUserId,
          alertType: alert.type,
          severity: alert.severity,
        },
      },
    });

    logger.info("Alert assigned", {
      alertId,
      assignedTo: securityUserId,
      by: adminId,
    });

    return alert;
  } catch (error) {
    logger.error("Failed to assign alert", { alertId, error: error.message });
    throw error;
  }
}

/**
 * Resolve alert with notes (SECURITY_TEAM)
 */
async function resolveAlert(alertId, resolutionNotes, userId) {
  try {
    const alert = await prisma.securityAlert.update({
      where: { id: alertId },
      data: {
        status: "RESOLVED",
        resolutionNotes,
      },
      include: {
        user: { select: { id: true, email: true, name: true } },
        assignedTo: { select: { id: true, email: true, name: true } },
      },
    });

    // Log resolution
    await prisma.auditLog.create({
      data: {
        actorId: userId,
        action: "ALERT_RESOLVED",
        entityType: "SecurityAlert",
        entityId: alertId,
        metadata: {
          alertType: alert.type,
          severity: alert.severity,
          resolutionNotes,
        },
      },
    });

    logger.info("Alert resolved", { alertId, by: userId });

    return alert;
  } catch (error) {
    logger.error("Failed to resolve alert", { alertId, error: error.message });
    throw error;
  }
}

/**
 * Get alert statistics for dashboard
 */
async function getAlertStats() {
  const [byStatus, bySeverity, byType, openCount, criticalCount] =
    await Promise.all([
      prisma.securityAlert.groupBy({
        by: ["status"],
        _count: true,
      }),
      prisma.securityAlert.groupBy({
        by: ["severity"],
        _count: true,
      }),
      prisma.securityAlert.groupBy({
        by: ["type"],
        _count: true,
      }),
      prisma.securityAlert.count({ where: { status: "OPEN" } }),
      prisma.securityAlert.count({ where: { severity: "CRITICAL" } }),
    ]);

  const statusStats = {};
  const severityStats = {};
  const typeStats = {};

  byStatus.forEach(({ status, _count }) => {
    statusStats[status] = _count;
  });

  bySeverity.forEach(({ severity, _count }) => {
    severityStats[severity] = _count;
  });

  byType.forEach(({ type, _count }) => {
    typeStats[type] = _count;
  });

  return {
    statusStats,
    severityStats,
    typeStats,
    openCount,
    criticalCount,
    totalAlerts:
      openCount + (statusStats.RESOLVED || 0) + (statusStats.ASSIGNED || 0),
  };
}

/**
 * Get ML analytics data for dashboard
 */
async function getMlAnalytics() {
  const alerts = await prisma.securityAlert.findMany({
    where: {
      type: {
        in: ["ML_REQUEST_THREAT", "ML_ANOMALY_DETECTED"],
      },
    },
    select: {
      id: true,
      message: true,
      severity: true,
      metadata: true,
      aiAnalysis: true,
      createdAt: true,
      mlRiskScore: true,
      mlAnomalyScore: true,
      type: true,
    },
    orderBy: { createdAt: "desc" }, // change to desc to get recent alerts at top
    take: 100, // Limit to recent 100 alerts for the table
  });

  const { totalRequests } = getMlStats();

  let suspiciousCount = 0;
  let anomalousCount = 0;
  let peakRisk = 0;
  let totalRisk = 0;
  let riskCount = 0;

  const timeline = alerts.map((alert) => {
    // Normalise risk score depending on what is available
    let score = alert.mlRiskScore;
    if (score == null && alert.mlAnomalyScore != null) {
      score = Math.round(Math.abs(alert.mlAnomalyScore) * 100);
    }
    score = score || 0;

    if (alert.type === "ML_REQUEST_THREAT") suspiciousCount++;
    if (alert.type === "ML_ANOMALY_DETECTED") anomalousCount++;

    if (score > peakRisk) peakRisk = score;
    totalRisk += score;
    riskCount++;

    return {
      timestamp: alert.createdAt,
      riskScore: score,
    };
  });

  const parsedAlerts = alerts.map(alert => {
    let score = alert.mlRiskScore;
    if (score == null && alert.mlAnomalyScore != null) {
      score = Math.round(Math.abs(alert.mlAnomalyScore) * 100);
    }
    score = score || 0;

    const reasons = [];
    if (alert.message) reasons.push(alert.message);
    
    // Attempt extracting features to explain "why"
    const features = alert.metadata?.mlFeatures;
    if (features) {
      if (typeof features === "object") {
        if (features.has_sql_keyword) reasons.push("Contains SQL keyword");
        if (features.has_xss_keyword) reasons.push("Contains XSS keyword");
        if (features.entropy > 4.5) reasons.push("High Entropy String Detected (Risk of Obfuscation)");
        if (features.special_chars_ratio > 0.15) reasons.push("High density of special characters");
        if (features.path_traversal_attempts) reasons.push("Path Traversal pattern detected");
      }
    }

    return {
      id: alert.id,
      type: alert.type,
      title: alert.message,
      risk: score,
      level: alert.severity,
      reasons,
      timestamp: alert.createdAt,
    };
  });

  // Since we ordered desc for alerts, we must reverse the timeline back to asc for the chart
  const ascTimeline = timeline.reverse();

  // Calculate true normal traffic
  // Note: if server restarts, totalRequests might be lower than historical DB records.
  // We floor it to 0 just to maintain a logical distribution.
  const knownThreats = suspiciousCount + anomalousCount;
  const normalCount = Math.max(0, totalRequests - knownThreats);

  return {
    timeline: ascTimeline,
    alerts: parsedAlerts,
    distribution: {
      normal: normalCount,
      suspicious: suspiciousCount,
      anomalous: anomalousCount,
    },
    stats: {
      peakRisk: peakRisk,
      avgRisk: riskCount > 0 ? (totalRisk / riskCount).toFixed(2) : 0,
      totalRequests,
    },
  };
}

/**
 * Create API key for global token validation
 */
async function createApiKey(name) {
  try {
    // Generate random 32-character API key
    const key = Buffer.from(Math.random().toString() + Date.now())
      .toString("base64")
      .slice(0, 32);

    const apiKey = await prisma.apiKey.create({
      data: {
        name,
        key,
        active: true,
      },
    });

    return apiKey;
  } catch (error) {
    logger.error("Failed to create API key", { error: error.message });
    throw error;
  }
}

/**
 * List all API keys
 */
async function listApiKeys() {
  return prisma.apiKey.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      key: true,
      active: true,
      createdAt: true,
      lastUsedAt: true,
    },
  });
}

/**
 * Deactivate API key
 */
async function deactivateApiKey(keyId) {
  return prisma.apiKey.update({
    where: { id: keyId },
    data: { active: false },
  });
}

module.exports = {
  getSecurityDashboard,
  getUserActivity,
  getAuditLogs,
  getAllSecurityAlerts,
  getAssignedAlerts,
  getAlertById,
  assignAlert,
  resolveAlert,
  getAlertStats,
  getMlAnalytics,
  createApiKey,
  listApiKeys,
  deactivateApiKey,
};
