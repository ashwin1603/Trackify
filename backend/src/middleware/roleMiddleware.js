const AppError = require("../utils/appError");

/**
 * Restrict route to users whose role name matches one of the allowed roles.
 * Must be used AFTER the authenticate middleware.
 * @param {...string} allowedRoleNames - one or more role name strings
 */
function allowRoles(...allowedRoleNames) {
  const allowed = allowedRoleNames.flat().map((r) => r.trim());
  return (req, _res, next) => {
    const roleName = req.user?.role?.name;
    if (!roleName || !allowed.includes(roleName)) {
      return next(
        new AppError(
          `Forbidden: this resource requires one of [${allowed.join(", ")}]`,
          403
        )
      );
    }
    return next();
  };
}

module.exports = { allowRoles };
