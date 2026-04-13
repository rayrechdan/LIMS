import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  console.log("🧹 Disabling non-essential demo accounts…");

  const emailsToDisable = [
    "pathologist@lab.com",
    "tech@lab.com",
    "reception@lab.com",
    "doctor@lab.com",
  ];

  const result = await db.user.updateMany({
    where: { email: { in: emailsToDisable } },
    data: { isActive: false },
  });

  console.log(`✅ Disabled ${result.count} user accounts`);
  console.log("Active demo accounts:");
  console.log("  admin@lab.com   / admin123");
  console.log("  patient@lab.com / patient123");
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
