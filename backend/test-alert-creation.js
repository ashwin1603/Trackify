const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function test() {
  try {
    console.log("Attempting to create a test alert...");

    const alert = await prisma.securityAlert.create({
      data: {
        type: "A05_INJECTION",
        message: "Test alert from script",
        severity: "CRITICAL",
        status: "OPEN",
        endpoint: "/api/test",
        ipAddress: "127.0.0.1",
        metadata: { test: true },
      },
    });

    console.log("✓ Alert created:", alert.id);
    console.log("  Type:", alert.type);
    console.log("  Severity:", alert.severity);

    // Verify it was saved
    const verify = await prisma.securityAlert.findUnique({
      where: { id: alert.id },
    });

    if (verify) {
      console.log("✓ Alert verified in database");
    } else {
      console.log("✗ Alert not found after creation");
    }
  } catch (error) {
    console.error("✗ Error:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

test();
