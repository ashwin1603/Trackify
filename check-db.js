const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function checkAlerts() {
  console.log("Checking database for security alerts...\n");

  const alerts = await prisma.securityAlert.findMany({
    include: {
      user: true,
    },
  });

  console.log(`Total alerts found: ${alerts.length}`);

  if (alerts.length > 0) {
    alerts.forEach((alert, i) => {
      console.log(`\n${i + 1}. ${alert.type}`);
      console.log(`   Severity: ${alert.severity}`);
      console.log(`   Status: ${alert.status}`);
      console.log(`   Endpoint: ${alert.endpoint}`);
      console.log(`   IP: ${alert.ipAddress}`);
      console.log(`   Created: ${alert.createdAt}`);
    });
  } else {
    console.log("No alerts found in database");
  }

  // Also check API keys
  console.log("\n\nChecking API Keys...");
  const keys = await prisma.apiKey.findMany();
  console.log(`Total API keys: ${keys.length}`);
  keys.forEach((key) => {
    console.log(
      `  - ${key.name}: ${key.key.substring(0, 10)}... (Active: ${key.isActive})`,
    );
  });

  // Check users
  console.log("\n\nChecking Users...");
  const users = await prisma.user.findMany({
    include: {
      role: true,
    },
  });
  console.log(`Total users: ${users.length}`);
  users.forEach((user) => {
    console.log(`  - ${user.email}: ${user.role.name}`);
  });

  await prisma.$disconnect();
}

checkAlerts().catch(console.error);
