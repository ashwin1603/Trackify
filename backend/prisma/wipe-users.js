/**
 * Removes all user accounts and app data that references users.
 * Keeps roles, permissions, and role-permission mappings.
 * Run `npm run prisma:seed` after this to restore default admin/developer accounts.
 */
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const prisma = require("../src/config/prisma");

async function main() {
  await prisma.$transaction([
    prisma.comment.deleteMany(),
    prisma.bug.deleteMany(),
    prisma.auditLog.deleteMany(),
    prisma.user.deleteMany(),
  ]);
  console.log("Wiped: comments, bugs, audit logs, and all users.");
  console.log("Run: npm run prisma:seed");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
