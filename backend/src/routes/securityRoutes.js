const express = require("express");
const securityController = require("../controllers/securityController");
const { authenticate } = require("../middleware/authMiddleware");
const { allowRoles } = require("../middleware/roleMiddleware");
const { ROLES } = require("../utils/constants");

const router = express.Router();

// Authentication required for all routes below
router.use(authenticate);

/**
 * ADMIN ENDPOINTS
 */

// GET all security alerts
router.get(
  "/alerts",
  allowRoles(ROLES.ADMIN),
  securityController.getAllSecurityAlerts,
);

// GET single alert by ID
router.get(
  "/alerts/:alertId",
  allowRoles(ROLES.ADMIN),
  securityController.getAlertById,
);

// POST assign alert to security team member
router.post(
  "/assign-alert",
  allowRoles(ROLES.ADMIN),
  securityController.assignAlert,
);

/**
 * SECURITY_TEAM ENDPOINTS
 */

// GET alerts assigned to current user
router.get(
  "/my-alerts",
  allowRoles(ROLES.SECURITY_TEAM),
  securityController.getMyAlerts,
);

// PUT resolve alert with notes
router.put(
  "/resolve-alert",
  allowRoles(ROLES.SECURITY_TEAM),
  securityController.resolveAlert,
);

/**
 * ADMIN + SECURITY_TEAM ENDPOINTS
 */

// GET alert statistics
router.get(
  "/stats",
  allowRoles(ROLES.ADMIN, ROLES.SECURITY_TEAM),
  securityController.getAlertStats,
);

// GET ML analytics
router.get(
  "/ml-analytics",
  allowRoles(ROLES.ADMIN, ROLES.SECURITY_TEAM),
  securityController.getMlAnalytics,
);

// GET security dashboard (legacy)
router.get(
  "/dashboard",
  allowRoles(ROLES.ADMIN, ROLES.SECURITY_TEAM),
  securityController.getSecurityDashboard,
);

// GET audit logs
router.get(
  "/audit-logs",
  allowRoles(ROLES.ADMIN, ROLES.SECURITY_TEAM),
  securityController.getAuditLogs,
);

/**
 * API KEY MANAGEMENT (ADMIN only)
 */

// POST create new API key
router.post(
  "/api-keys",
  allowRoles(ROLES.ADMIN),
  securityController.createApiKey,
);

// GET list all API keys
router.get(
  "/api-keys",
  allowRoles(ROLES.ADMIN),
  securityController.listApiKeys,
);

// DELETE deactivate API key
router.delete(
  "/api-keys/:keyId",
  allowRoles(ROLES.ADMIN),
  securityController.deactivateApiKey,
);

module.exports = router;
