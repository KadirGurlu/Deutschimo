import { PrismaClient } from "@prisma/client";

if (process.env.DATABASE_ENVIRONMENT !== "test" || process.env.RELEASE_GATE_ALLOW_ISOLATED_DB !== "1") {
  console.error("V46.11 cleanup yalnızca isolated test DB üzerinde çalışabilir.");
  process.exit(1);
}

const prisma = new PrismaClient();

try {
  // Existing V46 E2E helpers clean their own users in finally blocks. This is a final
  // defense-in-depth cleanup for interrupted runs plus the V46.7 migration sentinel.
  await prisma.cmsContentRecord.deleteMany({
    where: {
      OR: [
        { key: { startsWith: "lesson:v46-11-" } },
        { title: { startsWith: "V46.11 Published Lesson " } }
      ],
    },
  });

  await prisma.user.deleteMany({
    where: {
      isTestUser: true,
      OR: [
        { email: { startsWith: "e2e.v46." } },
        { email: { startsWith: "release.gate.integration." } },
        { email: "v467-upgrade@deutschimo.test" }
      ],
    },
  });

  // V46.7 upgrade sentinel course/unit are deliberately isolated and can be removed
  // after the sentinel user cascades its progress/mastery rows.
  await prisma.unit.deleteMany({ where: { id: "v467-unit" } }).catch(() => {});
  await prisma.course.deleteMany({ where: { id: "v467-course" } }).catch(() => {});

  const remainingUsers = await prisma.user.count({
    where: {
      isTestUser: true,
      OR: [
        { email: { startsWith: "e2e.v46." } },
        { email: { startsWith: "release.gate.integration." } },
        { email: "v467-upgrade@deutschimo.test" }
      ],
    },
  });

  const remainingCms = await prisma.cmsContentRecord.count({
    where: {
      OR: [
        { key: { startsWith: "lesson:v46-11-" } },
        { title: { startsWith: "V46.11 Published Lesson " } }
      ],
    },
  });

  if (remainingUsers !== 0 || remainingCms !== 0) {
    throw new Error(
      `Test cleanup incomplete: users=${remainingUsers}, cms=${remainingCms}`,
    );
  }

  console.log("✓ V46.11 isolated test-data cleanup: PASSED");
} finally {
  await prisma.$disconnect();
}
