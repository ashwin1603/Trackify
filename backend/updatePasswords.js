const bcrypt = require("bcrypt");
const prisma = require("./src/config/prisma");

const users = [
  "vinayn@gmail.com",
  "ashwinampily@gmail.com",
  "logeshbalaji@gmail.com",
];

async function main() {
  const newPasswordHash = await bcrypt.hash("password@123", 12);

  for (const email of users) {
    const updated = await prisma.user.update({
      where: { email },
      data: { passwordHash: newPasswordHash },
    });
    console.log(`✓ Password updated for: ${updated.email} (${updated.name})`);
  }

  console.log("\n✅ All passwords updated to: password@123");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error("❌ Error:", error.message);
    await prisma.$disconnect();
    process.exit(1);
  });
