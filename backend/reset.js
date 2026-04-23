const prisma = require("./src/config/prisma");
const bcrypt = require("bcryptjs");

async function run() {
  const hash = await bcrypt.hash("password123", 10);
  await prisma.user.updateMany({ data: { password: hash }});
  console.log("Passwords reset to password123");
}
run();
