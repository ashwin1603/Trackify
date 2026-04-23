const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('Password123!', 10);
  const emails = [
    'vinayn@gmail.com',         // Admin
    'utkarsh@gmail.com',        // Developer
    'abhiram@gmail.com',        // Tester
    'ashwinampily@gmail.com'    // Security
  ];
  
  for (const email of emails) {
    await prisma.user.updateMany({
      where: { email },
      data: { passwordHash: hash }
    });
    console.log(`Reset ${email}`);
  }
}
main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
