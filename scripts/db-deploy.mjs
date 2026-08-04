import { PrismaClient } from "@prisma/client";
import {
  BASELINE_MIGRATION,
  PRODUCTION_BASELINE_CONFIRMATION,
  getDatabaseContext,
  printDatabaseContext,
  runCommand,
  runPrisma,
  truthy,
} from "./db-safety.mjs";

const NON_PRODUCTION_BASELINE_CONFIRMATION = "DEUTSCHIMO_V28_1_NONPROD";
const REQUIRED_TABLES = [
  "User",
  "Account",
  "Session",
  "VerificationToken",
  "EmailVerificationToken",
  "PasswordResetToken",
  "Course",
  "Unit",
  "Exercise",
  "Enrollment",
  "LearningStateSnapshot",
  "UserUnitProgress",
  "UserActivityEvent",
  "StudySession",
  "PlacementAssessment",
  "LearningInsightSnapshot",
  "DailyStudyPlan",
  "SmartReviewState",
  "AuditLog",
  "SystemErrorLog",
  "ApiFailureLog",
  "LoginAttempt",
  "RateLimitEvent",
  "DatabaseBackup",
  "AccountDeletionLog",
  "SkillLabAttempt",
  "VocabularySet",
  "VocabularyNotebookItem",
  "VocabularyReviewAttempt",
  "AssessmentEvidence",
  "CompetencyRecord",
  "LearningErrorHistory",
];

const context = getDatabaseContext();
printDatabaseContext(context, "Migration hedefi");
const prisma = new PrismaClient();

async function tableExists(tableName) {
  const rows = await prisma.$queryRawUnsafe(
    "SELECT to_regclass($1) IS NOT NULL AS exists",
    `public.\"${tableName}\"`,
  );
  return Boolean(rows?.[0]?.exists);
}

async function migrationsTableExists() {
  const rows = await prisma.$queryRawUnsafe(
    "SELECT to_regclass('public._prisma_migrations') IS NOT NULL AS exists",
  );
  return Boolean(rows?.[0]?.exists);
}

async function baselineApplied() {
  if (!(await migrationsTableExists())) return false;
  const rows = await prisma.$queryRawUnsafe(
    'SELECT COUNT(*)::int AS count FROM "_prisma_migrations" WHERE migration_name = $1 AND finished_at IS NOT NULL AND rolled_back_at IS NULL',
    BASELINE_MIGRATION,
  );
  return Number(rows?.[0]?.count ?? 0) > 0;
}

async function publicApplicationTables() {
  const rows = await prisma.$queryRawUnsafe(
    "SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> '_prisma_migrations' ORDER BY tablename",
  );
  return rows.map((row) => String(row.tablename));
}

async function existingApplicationTables() {
  const existing = [];
  for (const table of REQUIRED_TABLES) {
    if (await tableExists(table)) existing.push(table);
  }
  return existing;
}

function verifySchemaMatchesDatamodel() {
  console.log("Mevcut veritabanı şeması Prisma datamodel ile karşılaştırılıyor.");
  runPrisma(
    [
      "migrate",
      "diff",
      "--from-schema-datasource",
      "prisma/schema.prisma",
      "--to-schema-datamodel",
      "prisma/schema.prisma",
      "--exit-code",
    ],
    { env: { DATABASE_URL: context.directUrl, DATABASE_POSTGRES_URL: context.directUrl } },
  );
}

async function adoptExistingSchema(existing) {
  const missing = REQUIRED_TABLES.filter((table) => !existing.includes(table));
  if (missing.length) {
    throw new Error(`Baseline uygulanamadı. Mevcut şema eksik veya kısmi: ${missing.join(", ")}`);
  }

  if (context.environment === "production") {
    if (process.env.CONFIRM_PRODUCTION_BASELINE !== PRODUCTION_BASELINE_CONFIRMATION) {
      throw new Error(
        `İlk production migration geçişi için CONFIRM_PRODUCTION_BASELINE=${PRODUCTION_BASELINE_CONFIRMATION} değerini bir kez tanımlayın. Production şemasına yazılmadı.`,
      );
    }
  } else if (process.env.CONFIRM_NON_PRODUCTION_BASELINE !== NON_PRODUCTION_BASELINE_CONFIRMATION) {
    throw new Error(
      `Production dışı veritabanı boş değil ve migration geçmişi yok. Kopyalanmış production verisi riskine karşı işlem durduruldu. Bilinçli olarak mevcut şemayı benimsemek için CONFIRM_NON_PRODUCTION_BASELINE=${NON_PRODUCTION_BASELINE_CONFIRMATION} kullanın.`,
    );
  }

  verifySchemaMatchesDatamodel();
  console.log("Mevcut şema değiştirilmeden V28.1 baseline olarak işaretleniyor.");
  runPrisma(["migrate", "resolve", "--applied", BASELINE_MIGRATION]);
}

async function prepareMigrationHistory() {
  if (await baselineApplied()) return;

  const publicTables = await publicApplicationTables();
  const existing = await existingApplicationTables();
  if (publicTables.length) {
    if (!existing.length) {
      throw new Error(`Public şemada Deutschimo dışı veya tanınmayan tablolar var: ${publicTables.join(", ")}`);
    }
    await adoptExistingSchema(existing);
    return;
  }

  const allowedToInitialize = ["preview", "test"].includes(context.environment)
    || truthy("AUTO_INIT_NON_PRODUCTION_DATABASE");
  if (context.environment === "production") {
    throw new Error("Production veritabanı boş görünüyor. Otomatik şema oluşturma güvenlik nedeniyle engellendi.");
  }
  if (!allowedToInitialize) {
    throw new Error(
      "Boş development veritabanını hazırlamak için npm run db:baseline:init çalıştırın veya AUTO_INIT_NON_PRODUCTION_DATABASE=true tanımlayın.",
    );
  }

  console.log("Boş production dışı veritabanına tam V28.1 baseline migration uygulanacak.");
}

try {
  await prepareMigrationHistory();
  runPrisma(["migrate", "deploy"]);
  verifySchemaMatchesDatamodel();

  if (context.environment !== "production") {
    runPrisma(["db", "seed"]);
  }

  if (["preview", "test"].includes(context.environment) && truthy("SEED_PREVIEW_TEST_DATA")) {
    runCommand("node", ["scripts/db-test-data.mjs", "reset"]);
  }
  console.log("Prisma migration deploy tamamlandı.");
} finally {
  await prisma.$disconnect();
}
