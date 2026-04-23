const AppError = require("../utils/appError");

function requirePermissions(requiredPermissions = []) {
  return (req, _res, next) => {
    const permissions =
      req.user?.role?.rolePermissions?.map((entry) => entry.permission.code) || [];

    const hasAllPermissions = requiredPermissions.every((permission) =>
      permissions.includes(permission)
    );

    if (!hasAllPermissions) {
      return next(new AppError("Insufficient permissions", 403));
    }

    return next();
  };
}

function enforceAssignPermissionWhenNeeded(assignPermissionCode) {
  return (req, _res, next) => {
    const isAssignmentMutation = Object.prototype.hasOwnProperty.call(req.body || {}, "assigneeId");
    if (!isAssignmentMutation) return next();

    const permissions =
      req.user?.role?.rolePermissions?.map((entry) => entry.permission.code) || [];
    if (!permissions.includes(assignPermissionCode)) {
      return next(new AppError("Assign bug permission required", 403));
    }

    return next();
  };
}

const { allowRoles } = require("./roleMiddleware");

module.exports = {
  requirePermissions,
  enforceAssignPermissionWhenNeeded,
  allowRoles,
};
