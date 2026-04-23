const commentService = require("../services/commentService");

async function addComment(req, res, next) {
  try {
    const comment = await commentService.addComment(req.body, {
      userId: req.user.id,
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });
    res.status(201).json({ data: comment });
  } catch (error) {
    next(error);
  }
}

module.exports = { addComment };
