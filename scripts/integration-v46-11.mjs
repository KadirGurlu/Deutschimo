import { PrismaClient } from "@prisma/client";

if (process.env.DATABASE_ENVIRONMENT !== "test" || process.env.RELEASE_GATE_ALLOW_ISOLATED_DB !== "1") {
  console.error("Integration test yalnızca isolated test DB üzerinde çalışabilir.");
  process.exit(1);
}

const prisma = new PrismaClient();
const email = `release.gate.integration.${Date.now()}@preview.deutschimo.test`;

try {
  const created = await prisma.user.create({
    data: {
      email,
      firstName: "Release",
      lastName: "Gate",
      role: "STUDENT",
      status: "ACTIVE",
      currentLevel: "A1",
      targetLevel: "B2",
      dailyGoalMinutes: 30,
      isTestUser: true,
    },
    select: { id: true, email: true, dailyGoalMinutes: true },
  });

  if (!created.id || created.email !== email) throw new Error("Test user create/read contract failed.");

  const updated = await prisma.$transaction(async (tx) => {
    return tx.user.update({
      where: { id: created.id },
      data: { dailyGoalMinutes: 45 },
      select: { dailyGoalMinutes: true },
    });
  });

  if (updated.dailyGoalMinutes !== 45) throw new Error("Transactional update contract failed.");

  const count = await prisma.user.count({ where: { email, isTestUser: true } });
  if (count !== 1) throw new Error(`Deterministic test record count expected 1, got ${count}.`);

  console.log("✓ Isolated Prisma create/read/transaction integration: PASSED");
} finally {
  await prisma.user.deleteMany({ where: { email, isTestUser: true } }).catch(() => {});
  await prisma.$disconnect();
}
