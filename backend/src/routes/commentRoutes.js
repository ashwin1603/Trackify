const express = require("express");
const commentController = require("../controllers/commentController");
const validate = require("../middleware/validate");
const { authenticate } = require("../middleware/authMiddleware");
const { requirePermissions } = require("../middleware/permissionMiddleware");
const { addCommentSchema } = require("../validators/commentValidators");
const { PERMISSIONS } = require("../utils/constants");

const router = express.Router();

router.use(authenticate);

router.post(
  "/",
  requirePermissions([PERMISSIONS.ADD_COMMENT]),
  validate(addCommentSchema),
  commentController.addComment
);

module.exports = router;
