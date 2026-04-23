/**
 * One-time backfill script: generates devCode for any existing DEVELOPER
 * users that were created before the DOB field was introduced.
 *
 * Run once from the backend folder:
 *   node prisma/backfillDevCodes.js
 */

require("dotenv").config();
const prisma = require("../src/config/prisma");

async function backfillDevCodes() {
  // Find all users whose role is DEVELOPER and who have no devCode yet
  const devRole = await prisma.role.findUnique({ where: { name: "DEVELOPER" } });
  if (!devRole) {
    console.log("No DEVELOPER role found — nothing to do.");
    return;
  }

  const devs = await prisma.user.findMany({
    where: {
      roleId: devRole.id,
      devCode: null,
    },
  });

  if (devs.length === 0) {
    console.log("✓ All developers already have a devCode — nothing to backfill.");
    return;
  }

  console.log(`Found ${devs.length} developer(s) without a devCode. Patching…\n`);

  let patched = 0;
  let skipped = 0;

  for (const dev of devs) {
    const cleanName = dev.name.replace(/\s+/g, "").toLowerCase();

    let devCode;
    if (dev.dob) {
      // Preferred: use the stored DOB
      const year = new Date(dev.dob).getFullYear();
      devCode = `${year}${cleanName}`;
    } else {
      // Fallback: use "0000" as the year placeholder so the code is still unique-ish
      devCode = `0000${cleanName}`;
      console.log(
        `  ⚠  ${dev.email} has no DOB — assigning fallback devCode: ${devCode}`
      );
    }

    try {
      await prisma.user.update({
        where: { id: dev.id },
        data: { devCode },
      });
      console.log(`  ✓  ${dev.email} → devCode: ${devCode}`);
      patched++;
    } catch (err) {
      // devCode unique constraint may fire if two devs share the same name/year
      console.error(`  ✗  ${dev.email} — failed: ${err.message}`);
      skipped++;
    }
  }

  console.log(`\nDone. ${patched} patched, ${skipped} skipped.`);
}

backfillDevCodes()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
