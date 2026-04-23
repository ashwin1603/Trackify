const bcrypt = require("bcrypt");
const prisma = require("../config/prisma");
const AppError = require("../utils/appError");
const { signAccessToken } = require("../utils/token");
const { createAuditLog } = require("./auditService");

async function signup({ name, email, password, roleName, dob }, context) {
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new AppError("Email already in use", 409);
  }

  const role = await prisma.role.findUnique({ where: { name: roleName } });
  if (!role) {
    throw new AppError("Invalid role selected", 400);
  }

  // Service-level guard: DOB is required for DEVELOPER role
  if (roleName === "DEVELOPER" && !dob) {
    throw new AppError("Date of birth is required for developer accounts", 400);
  }

  // Generate devCode from birth year + lowercased name (no spaces)
  let devCode = null;
  if (roleName === "DEVELOPER" && dob && name) {
    const year = new Date(dob).getFullYear();
    const cleanName = name.replace(/\s+/g, "").toLowerCase();
    devCode = `${year}${cleanName}`;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { name, email, passwordHash, roleId: role.id, dob, devCode },
    include: { role: true },
  });

  await createAuditLog({
    actorId: user.id,
    action: "USER_SIGNUP",
    entityType: "User",
    entityId: user.id,
    metadata: { email: user.email, role: user.role.name, devCode: user.devCode },
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  });

  const token = signAccessToken({ sub: user.id, role: user.role.name, devCode: user.devCode });

  return {
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role.name, devCode: user.devCode },
  };
}

async function login({ email, password }, context) {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { role: true },
  });

  if (!user) {
    throw new AppError("Invalid credentials", 401);
  }

  // --- Lockout Check ---
  if (user.failedLoginAttempts >= 5 && user.lastFailedLoginAt) {
    const timeSinceLastFail = Date.now() - user.lastFailedLoginAt.getTime();
    if (timeSinceLastFail < 30_000) {
      throw new AppError("Too many failed attempts. Please wait 30 seconds.", 429);
    }
  }

  const validPassword = await bcrypt.compare(password, user.passwordHash);
  if (!validPassword) {
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: { increment: 1 },
        lastFailedLoginAt: new Date(),
      },
    });

    await createAuditLog({
      actorId: user.id,
      action: "LOGIN_FAILED",
      entityType: "User",
      entityId: user.id,
      metadata: { email },
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    // --- Generate Security Alert for Brute Force ---
    if (updatedUser.failedLoginAttempts === 5 || (updatedUser.failedLoginAttempts > 5 && updatedUser.failedLoginAttempts % 5 === 0)) {
      const SecurityAnalyzer = require("../utils/securityAnalyzer");
      const alert = await prisma.securityAlert.create({
        data: {
          type: "A07_AUTHENTICATION_FAILURES",
          severity: "HIGH",
          message: `Brute force attack detected on ${user.role.name} account (${user.email})`,
          status: "OPEN",
          endpoint: "POST /api/auth/login",
          ipAddress: context.ipAddress || "unknown",
          userId: user.id,
          metadata: {
            category: "BRUTE_FORCE",
            attemptCount: updatedUser.failedLoginAttempts,
            role: user.role.name,
            timestamp: new Date().toISOString(),
          }
        }
      });
      // Attach AI analysis natively
      await prisma.securityAlert.update({
        where: { id: alert.id },
        data: { aiAnalysis: SecurityAnalyzer.analyzeSecurityAlert(alert) }
      });
    }

    throw new AppError("Invalid credentials", 401);
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      failedLoginAttempts: 0,
      lastSuccessfulLoginAt: new Date(),
    },
  });

  await createAuditLog({
    actorId: user.id,
    action: "LOGIN_SUCCESS",
    entityType: "User",
    entityId: user.id,
    metadata: { email },
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  });

  const token = signAccessToken({ sub: user.id, role: user.role.name, devCode: user.devCode });

  return {
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role.name, devCode: user.devCode },
  };
}

module.exports = { signup, login };
