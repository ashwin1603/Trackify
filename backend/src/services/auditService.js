const prisma = require("../config/prisma");

async function createAuditLog({
  actorId = null,
  action,
  entityType,
  entityId = null,
  metadata = null,
  ipAddress = null,
  userAgent = null,
}) {
  await prisma.auditLog.create({
    data: {
      actorId,
      action,
      entityType,
      entityId,
      metadata,
      ipAddress,
      userAgent,
    },
  });
}

module.exports = { createAuditLog };
