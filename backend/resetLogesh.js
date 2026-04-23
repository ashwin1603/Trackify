const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('Security@123', 10);
  await prisma.user.update({
    where: { email: 'logeshbalaji@gmail.com' },
    data: { passwordHash: hash }
  });
  console.log('Password reset successfully');
}
main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
