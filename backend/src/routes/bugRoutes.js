const express = require("express");
const bugController = require("../controllers/bugController");
const validate = require("../middleware/validate");
const { authenticate } = require("../middleware/authMiddleware");
const {
  requirePermissions,
  enforceAssignPermissionWhenNeeded,
  allowRoles,
} = require("../middleware/permissionMiddleware");
const { PERMISSIONS, ROLES } = require("../utils/constants");
const {
  createBugSchema,
  updateBugSchema,
  bugQuerySchema,
  idParamSchema,
  assignBugSchema,
} = require("../validators/bugValidators");

const router = express.Router();

router.use(authenticate);

router.get(
  "/",
  requirePermissions([PERMISSIONS.VIEW_BUG]),
  validate(bugQuerySchema, "query"),
  bugController.listBugs
);
router.get(
  "/:id",
  requirePermissions([PERMISSIONS.VIEW_BUG]),
  validate(idParamSchema, "params"),
  bugController.getBug
);
router.post(
  "/",
  requirePermissions([PERMISSIONS.CREATE_BUG]),
  validate(createBugSchema),
  bugController.createBug
);
router.patch(
  "/:id",
  requirePermissions([PERMISSIONS.UPDATE_BUG]),
  enforceAssignPermissionWhenNeeded(PERMISSIONS.ASSIGN_BUG),
  validate(idParamSchema, "params"),
  validate(updateBugSchema),
  bugController.updateBug
);
router.post(
  "/:id/assign",
  allowRoles([ROLES.ADMIN]),
  validate(idParamSchema, "params"),
  validate(assignBugSchema),
  bugController.assignBug
);
router.delete(
  "/:id",
  requirePermissions([PERMISSIONS.DELETE_BUG]),
  validate(idParamSchema, "params"),
  bugController.deleteBug
);

module.exports = router;
