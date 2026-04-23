const prisma = require("../config/prisma");
const AppError = require("../utils/appError");
const { calculatePriority } = require("../utils/aiPrioritization");
const { createAuditLog } = require("./auditService");

async function listBugs(filters) {
  const where = {};

  if (filters.status) where.status = filters.status;
  if (filters.assigneeId) where.assigneeId = filters.assigneeId;

  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search, mode: "insensitive" } },
      { description: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  return prisma.bug.findMany({
    where,
    include: {
      creator: { select: { id: true, name: true, email: true } },
      assignee: { select: { id: true, name: true, email: true, devCode: true } },
      comments: { include: { author: { select: { id: true, name: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });
}


async function getBugById(id) {
  const bug = await prisma.bug.findUnique({
    where: { id },
    include: {
      creator: { select: { id: true, name: true, email: true } },
      assignee: { select: { id: true, name: true, email: true } },
      comments: {
        include: { author: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!bug) throw new AppError("Bug not found", 404);
  return bug;
}

async function createBug(data, context) {
  const priority = calculatePriority(data);
  
  const ml = context.mlAnalysis?.requestResult;
  const riskScore = ml ? ml.risk_score : null;
  const securityTag = ml 
    ? (ml.malicious_prob >= 0.70 ? "HIGH RISK" : (ml.malicious_prob >= 0.30 ? "MEDIUM RISK" : "NORMAL")) 
    : null;

  const bug = await prisma.bug.create({
    data: {
      title: data.title,
      description: data.description,
      status: data.status || "OPEN",
      creatorId: context.userId,
      assigneeId: data.assigneeId || null,
      assignedToDevCode: data.assignedToDevCode || null,
      priority,
      riskScore,
      securityTag,
    },
  });

  await createAuditLog({
    actorId: context.userId,
    action: "BUG_CREATED",
    entityType: "Bug",
    entityId: bug.id,
    metadata: { title: bug.title, priority, assignedToDevCode: bug.assignedToDevCode },
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  });

  return getBugById(bug.id);
}

async function updateBug(id, data, context) {
  const existingBug = await prisma.bug.findUnique({ where: { id } });
  if (!existingBug) throw new AppError("Bug not found", 404);

  // Visibility: DEVELOPER can view all, but ONLY the assigned developer can UPDATE it
  if (context.role === "DEVELOPER" && existingBug.assigneeId !== context.userId) {
    throw new AppError("Only the assigned developer can update this bug", 403);
  }

  if (data.assigneeId) {
    const assignee = await prisma.user.findUnique({ where: { id: data.assigneeId } });
    if (!assignee) throw new AppError("Invalid assignee", 400);
  }

  const ml = context.mlAnalysis?.requestResult;
  let updateData = {
      title: data.title ?? existingBug.title,
      description: data.description ?? existingBug.description,
      status: data.status ?? existingBug.status,
      assigneeId: data.assigneeId !== undefined ? data.assigneeId : existingBug.assigneeId,
      assignedToDevCode: data.assignedToDevCode !== undefined ? data.assignedToDevCode : existingBug.assignedToDevCode,
      priority:
        data.title || data.description || data.status
          ? calculatePriority({
              title: data.title ?? existingBug.title,
              description: data.description ?? existingBug.description,
              status: data.status ?? existingBug.status,
            })
          : existingBug.priority,
  };

  if (ml) {
    updateData.riskScore = ml.risk_score;
    updateData.securityTag = ml.malicious_prob >= 0.70 ? "HIGH RISK" : (ml.malicious_prob >= 0.30 ? "MEDIUM RISK" : "NORMAL");
  }

  const updatedBug = await prisma.bug.update({
    where: { id },
    data: updateData,
  });

  await createAuditLog({
    actorId: context.userId,
    action: "BUG_UPDATED",
    entityType: "Bug",
    entityId: updatedBug.id,
    metadata: data,
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  });

  return getBugById(updatedBug.id);
}

async function deleteBug(id, context) {
  const existingBug = await prisma.bug.findUnique({ where: { id } });
  if (!existingBug) throw new AppError("Bug not found", 404);

  await createAuditLog({
    actorId: context.userId,
    action: "BUG_DELETED",
    entityType: "Bug",
    entityId: id,
    metadata: { title: existingBug.title },
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  });
}

async function assignBugByEmail(bugId, email, context) {
  const existingBug = await prisma.bug.findUnique({ where: { id: bugId } });
  if (!existingBug) throw new AppError("Bug not found", 404);

  const assignee = await prisma.user.findUnique({ where: { email } });
  if (!assignee) throw new AppError("Developer not found by email", 404);
  if (!assignee.devCode) throw new AppError("User does not have a developer code", 400);

  const updatedBug = await prisma.bug.update({
    where: { id: bugId },
    data: {
      assigneeId: assignee.id,
      assignedToDevCode: assignee.devCode,
    },
  });

  await createAuditLog({
    actorId: context.userId,
    action: "BUG_ASSIGNED",
    entityType: "Bug",
    entityId: bugId,
    metadata: { assignedToEmail: email, assignedToDevCode: assignee.devCode },
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  });

  return getBugById(bugId);
}

module.exports = { listBugs, getBugById, createBug, updateBug, deleteBug, assignBugByEmail };
