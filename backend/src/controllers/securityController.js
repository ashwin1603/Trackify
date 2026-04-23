const securityService = require("../services/securityService");
const AppError = require("../utils/appError");
const logger = require("../utils/logger");

async function getSecurityDashboard(req, res, next) {
  try {
    const dashboard = await securityService.getSecurityDashboard();
    res.status(200).json({ data: dashboard });
  } catch (error) {
    next(error);
  }
}

async function getAuditLogs(req, res, next) {
  try {
    const logs = await securityService.getAuditLogs();
    res.status(200).json({ data: logs });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/security/alerts
 * Get all security alerts (ADMIN only)
 */
async function getAllSecurityAlerts(req, res, next) {
  try {
    const { severity, status, type, limit, offset } = req.query;
    const filters = {
      severity,
      status,
      type,
      limit: Math.min(parseInt(limit) || 50, 200),
      offset: parseInt(offset) || 0,
    };

    const result = await securityService.getAllSecurityAlerts(filters);
    res.status(200).json({
      data: result.alerts,
      pagination: {
        total: result.total,
        offset: result.offset,
        limit: result.limit,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/security/alerts/:alertId
 * Get single alert details
 */
async function getAlertById(req, res, next) {
  try {
    const { alertId } = req.params;

    const alert = await securityService.getAlertById(alertId);
    if (!alert) {
      throw new AppError("Alert not found", 404);
    }

    res.status(200).json({ data: alert });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/security/assign-alert
 * Assign alert to security team member (ADMIN only)
 */
async function assignAlert(req, res, next) {
  try {
    const { alertId, securityUserId } = req.body;

    if (!alertId || !securityUserId) {
      throw new AppError("alertId and securityUserId are required", 400);
    }

    const alert = await securityService.assignAlert(
      alertId,
      securityUserId,
      req.user.id,
    );

    logger.info("Alert assigned successfully", {
      alertId,
      securityUserId,
      by: req.user.email,
    });

    res
      .status(200)
      .json({ data: alert, message: "Alert assigned successfully" });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/security/my-alerts
 * Get alerts assigned to current security team member
 */
async function getMyAlerts(req, res, next) {
  try {
    const { status, limit, offset } = req.query;
    const filters = {
      status: status || "ASSIGNED",
      limit: Math.min(parseInt(limit) || 50, 200),
      offset: parseInt(offset) || 0,
    };

    const result = await securityService.getAssignedAlerts(
      req.user.id,
      filters,
    );

    res.status(200).json({
      data: result.alerts,
      pagination: {
        total: result.total,
        offset: result.offset,
        limit: result.limit,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/security/resolve-alert
 * Resolve alert with notes (SECURITY_TEAM)
 */
async function resolveAlert(req, res, next) {
  try {
    const { alertId, resolutionNotes } = req.body;

    if (!alertId) {
      throw new AppError("alertId is required", 400);
    }

    const alert = await securityService.resolveAlert(
      alertId,
      resolutionNotes || "",
      req.user.id,
    );

    logger.info("Alert resolved successfully", {
      alertId,
      by: req.user.email,
    });

    res
      .status(200)
      .json({ data: alert, message: "Alert resolved successfully" });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/security/stats
 * Get alert statistics (ADMIN/SECURITY_TEAM)
 */
async function getAlertStats(req, res, next) {
  try {
    const stats = await securityService.getAlertStats();
    res.status(200).json({ data: stats });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/security/ml-analytics
 * Get ML analytics data (ADMIN/SECURITY_TEAM)
 */
async function getMlAnalytics(req, res, next) {
  try {
    const analytics = await securityService.getMlAnalytics();
    res.status(200).json({ data: analytics });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/security/api-keys
 * Create new API key (ADMIN only)
 */
async function createApiKey(req, res, next) {
  try {
    const { name } = req.body;

    if (!name) {
      throw new AppError("API key name is required", 400);
    }

    const apiKey = await securityService.createApiKey(name);

    logger.info("API key created", {
      keyId: apiKey.id,
      name,
      by: req.user.email,
    });

    res.status(201).json({
      data: apiKey,
      message:
        "API key created successfully. Store it securely - it won't be shown again.",
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/security/api-keys
 * List all API keys (ADMIN only)
 */
async function listApiKeys(req, res, next) {
  try {
    const keys = await securityService.listApiKeys();
    res.status(200).json({ data: keys });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/security/api-keys/:keyId
 * Deactivate API key (ADMIN only)
 */
async function deactivateApiKey(req, res, next) {
  try {
    const { keyId } = req.params;

    const apiKey = await securityService.deactivateApiKey(keyId);

    logger.info("API key deactivated", {
      keyId,
      by: req.user.email,
    });

    res
      .status(200)
      .json({ data: apiKey, message: "API key deactivated successfully" });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getSecurityDashboard,
  getAuditLogs,
  getAllSecurityAlerts,
  getAlertById,
  assignAlert,
  getMyAlerts,
  resolveAlert,
  getAlertStats,
  getMlAnalytics,
  createApiKey,
  listApiKeys,
  deactivateApiKey,
};
