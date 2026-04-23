const express = require("express");
const securityController = require("../controllers/securityController");
const { authenticate } = require("../middleware/authMiddleware");
const { allowRoles } = require("../middleware/roleMiddleware");
const { ROLES } = require("../utils/constants");

const router = express.Router();

// Authentication required for all routes below
router.use(authenticate);

// SECURITY_TEAM ONLY — all other roles (ADMIN, DEVELOPER, TESTER) get 403
router.use(allowRoles(ROLES.SECURITY_TEAM));

/** Failed-login / suspicious-activity style summary (same payload as security dashboard) */
router.get("/failed-logins", securityController.getSecurityDashboard);

module.exports = router;
