const prisma = require("../config/prisma");
const AppError = require("../utils/appError");
const { createAuditLog } = require("./auditService");

async function addComment({ bugId, content }, context) {
  const bug = await prisma.bug.findUnique({ where: { id: bugId } });
  if (!bug) throw new AppError("Bug not found", 404);

  const comment = await prisma.comment.create({
    data: {
      bugId,
      content,
      authorId: context.userId,
    },
    include: { author: { select: { id: true, name: true, email: true } } },
  });

  await createAuditLog({
    actorId: context.userId,
    action: "COMMENT_ADDED",
    entityType: "Comment",
    entityId: comment.id,
    metadata: { bugId },
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  });

  return comment;
}

module.exports = { addComment };
