const securityService = require("../services/securityService");

/**
 * Authenticated user's own audit trail (not a security-team global view).
 */
async function getMyActivity(req, res, next) {
  try {
    const logs = await securityService.getUserActivity(req.user.id);
    res.status(200).json({ data: logs });
  } catch (error) {
    next(error);
  }
}

module.exports = { getMyActivity };
