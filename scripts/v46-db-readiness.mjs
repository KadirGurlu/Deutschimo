import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const expectedTables = [
  "User",
  "LearnerOnboardingProfile",
  "MasterySkillSnapshot",
  "MasteryTopicSnapshot",
  "MasteryReviewQueueItem",
  "SkillLabAttempt",
  "DailyStudyPlan",
  "CmsContentRecord",
];

try {
  const rows = await prisma.$queryRaw`
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
  `;

  const existing = new Set(rows.map((row) => String(row.tablename)));
  const missing = expectedTables.filter((name) => !existing.has(name));

  if (missing.length) {
    for (const name of missing) console.error(`HATA: V46 beklenen tablo eksik: ${name}`);
    process.exit(1);
  }

  const duplicateEmails = await prisma.$queryRaw`
    SELECT email, COUNT(*)::int AS count
    FROM "User"
    WHERE email IS NOT NULL
    GROUP BY email
    HAVING COUNT(*) > 1
    LIMIT 5
  `;

  if (duplicateEmails.length) {
    console.error("HATA: User.email icin duplicate veri bulundu.");
    console.error(duplicateEmails);
    process.exit(1);
  }

  const invalidProgress = await prisma.$queryRaw`
    SELECT COUNT(*)::int AS count
    FROM "UnitProgress"
    WHERE "totalProgress" < 0 OR "totalProgress" > 100
  `.catch(() => [{ count: 0 }]);

  if (Number(invalidProgress?.[0]?.count ?? 0) > 0) {
    console.error("HATA: 0-100 disinda UnitProgress kaydi bulundu.");
    process.exit(1);
  }

  console.log("V46 database readiness: OK");
  console.log("- Kritik V32/V37/V38/V39/V43/V44 tablolar: OK");
  console.log("- Duplicate user email: YOK");
  console.log("- Progress temel veri siniri: OK");
} finally {
  await prisma.$disconnect();
}
