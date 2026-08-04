import { PrismaClient } from "@prisma/client";
import { BASELINE_MIGRATION, assertNonProduction, printDatabaseContext, runPrisma } from "./db-safety.mjs";

const ADOPT_CONFIRMATION = "DEUTSCHIMO_V28_1_NONPROD";
const context = assertNonProduction("Baseline hazırlığı");
printDatabaseContext(context, "Baseline hedefi");
const prisma = new PrismaClient();

async function publicApplicationTables() {
  const rows = await prisma.$queryRawUnsafe(
    "SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> '_prisma_migrations' ORDER BY tablename",
  );
  return rows.map((row) => String(row.tablename));
}

async function baselineApplied() {
  const migrationTable = await prisma.$queryRawUnsafe("SELECT to_regclass('public._prisma_migrations') IS NOT NULL AS exists");
  if (!migrationTable?.[0]?.exists) return false;
  const rows = await prisma.$queryRawUnsafe(
    'SELECT COUNT(*)::int AS count FROM "_prisma_migrations" WHERE migration_name = $1 AND finished_at IS NOT NULL AND rolled_back_at IS NULL',
    BASELINE_MIGRATION,
  );
  return Number(rows?.[0]?.count ?? 0) > 0;
}

try {
  if (!(await baselineApplied())) {
    const existingTables = await publicApplicationTables();
    if (existingTables.length) {
      if (process.env.CONFIRM_NON_PRODUCTION_BASELINE !== ADOPT_CONFIRMATION) {
        throw new Error(`Veritabanı boş değil. Mevcut development/preview şemasını benimsemek için CONFIRM_NON_PRODUCTION_BASELINE=${ADOPT_CONFIRMATION} kullanın. Tablolar: ${existingTables.join(", ")}`);
      }
      runPrisma(
        ["migrate", "diff", "--from-schema-datasource", "prisma/schema.prisma", "--to-schema-datamodel", "prisma/schema.prisma", "--exit-code"],
        { env: { DATABASE_URL: context.directUrl, DATABASE_POSTGRES_URL: context.directUrl } },
      );
      runPrisma(["migrate", "resolve", "--applied", BASELINE_MIGRATION]);
    }
  }

  runPrisma(["migrate", "deploy"]);
  runPrisma(
    ["migrate", "diff", "--from-schema-datasource", "prisma/schema.prisma", "--to-schema-datamodel", "prisma/schema.prisma", "--exit-code"],
    { env: { DATABASE_URL: context.directUrl, DATABASE_POSTGRES_URL: context.directUrl } },
  );
  runPrisma(["db", "seed"]);
  console.log("Production dışı veritabanı tam migration düzenine geçirildi.");
} finally {
  await prisma.$disconnect();
}
