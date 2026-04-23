const bcrypt = require("bcrypt");
const prisma = require("../src/config/prisma");
const { PERMISSIONS, ROLES } = require("../src/utils/constants");

const ALL_BUG_PERMISSIONS = [
  PERMISSIONS.CREATE_BUG,
  PERMISSIONS.UPDATE_BUG,
  PERMISSIONS.DELETE_BUG,
  PERMISSIONS.ASSIGN_BUG,
  PERMISSIONS.VIEW_BUG,
  PERMISSIONS.ADD_COMMENT,
];

async function main() {
  const permissionRecords = [];

  for (const code of Object.values(PERMISSIONS)) {
    const permission = await prisma.permission.upsert({
      where: { code },
      update: {},
      create: { code, description: code.replaceAll("_", " ") },
    });
    permissionRecords.push(permission);
  }

  const rolePermissionMap = {
    [ROLES.ADMIN]: ALL_BUG_PERMISSIONS,
    [ROLES.DEVELOPER]: [
      PERMISSIONS.CREATE_BUG,
      PERMISSIONS.UPDATE_BUG,
      PERMISSIONS.VIEW_BUG,
      PERMISSIONS.ADD_COMMENT,
    ],
    [ROLES.TESTER]: [
      PERMISSIONS.CREATE_BUG,
      PERMISSIONS.UPDATE_BUG,
      PERMISSIONS.VIEW_BUG,
      PERMISSIONS.ADD_COMMENT,
    ],
    [ROLES.SECURITY_TEAM]: [
      PERMISSIONS.VIEW_AUDIT_LOGS,
      PERMISSIONS.VIEW_SECURITY_DASHBOARD,
    ],
  };

  for (const roleName of Object.keys(rolePermissionMap)) {
    await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: { name: roleName, description: `${roleName} role` },
    });
  }

  // Replace role-permission links so removed permissions (e.g. audit on ADMIN) are actually revoked
  await prisma.rolePermission.deleteMany({});

  for (const [roleName, permissionCodes] of Object.entries(rolePermissionMap)) {
    const role = await prisma.role.findUniqueOrThrow({
      where: { name: roleName },
    });
    for (const permissionCode of permissionCodes) {
      const permission = permissionRecords.find(
        (p) => p.code === permissionCode,
      );
      await prisma.rolePermission.create({
        data: {
          roleId: role.id,
          permissionId: permission.id,
        },
      });
    }
  }

  // Clear all existing users to ensure clean state
  await prisma.user.deleteMany({});

  const adminRole = await prisma.role.findUniqueOrThrow({
    where: { name: ROLES.ADMIN },
  });
  const developerRole = await prisma.role.findUniqueOrThrow({
    where: { name: ROLES.DEVELOPER },
  });
  const securityRole = await prisma.role.findUniqueOrThrow({
    where: { name: ROLES.SECURITY_TEAM },
  });

  // Create ADMIN user (only one admin allowed)
  const adminPassword = await bcrypt.hash("Admin@123", 12);
  await prisma.user.create({
    data: {
      email: "vinayn@gmail.com",
      name: "Vinay N",
      passwordHash: adminPassword,
      roleId: adminRole.id,
    },
  });

  // Create SECURITY_TEAM users (hidden role)
  const securityPassword1 = await bcrypt.hash("Security@1", 12);
  await prisma.user.create({
    data: {
      email: "ashwinampily@gmail.com",
      name: "Ashwin Ampily",
      passwordHash: securityPassword1,
      roleId: securityRole.id,
    },
  });

  const securityPassword2 = await bcrypt.hash("Security@2", 12);
  await prisma.user.create({
    data: {
      email: "logeshbalaji@gmail.com",
      name: "Logesh Balaji",
      passwordHash: securityPassword2,
      roleId: securityRole.id,
    },
  });

  // Create default API key for development
  const defaultApiKey = "dev-api-key-secure-bug-tracker-2026";
  await prisma.apiKey.upsert({
    where: { key: defaultApiKey },
    update: {},
    create: {
      name: "Development API Key",
      key: defaultApiKey,
      active: true,
    },
  });

  console.log("✓ Roles and permissions configured");
  console.log("✓ Users created (Admin + Security Team)");
  console.log("✓ Default API key created");
  console.log("\nDEFAULT API KEY FOR DEVELOPMENT:");
  console.log(`X-API-Key: ${defaultApiKey}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log("\n✓ Seed completed successfully.");
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
