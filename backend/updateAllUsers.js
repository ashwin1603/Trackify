const bcrypt = require("bcrypt");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash("Password@123", 10);
  const result = await prisma.user.updateMany({
    data: { passwordHash: hash }
  });
  console.log(`Updated ${result.count} users to Password@123`);
}
main().catch(console.error).finally(() => prisma.$disconnect());
