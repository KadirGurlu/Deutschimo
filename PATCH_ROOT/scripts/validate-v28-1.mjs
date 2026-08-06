import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const errors = [];

function read(relativePath) {
  const fullPath = path.join(root, relativePath);
  if (!fs.existsSync(fullPath)) {
    errors.push(`${relativePath} eksik.`);
    return "";
  }
  return fs.readFileSync(fullPath, "utf8");
}

function expect(condition, message) {
  if (!condition) errors.push(message);
}

const packageJsonText = read("package.json");
const packageJson = packageJsonText ? JSON.parse(packageJsonText) : { scripts: {} };
const schema = read("prisma/schema.prisma");
const migration = read("prisma/migrations/20260803143000_v28_1_baseline/migration.sql");
const lock = read("prisma/migrations/migration_lock.toml");
const deploy = read("scripts/db-deploy.mjs");
const pushGuard = read("scripts/db-push-guard.mjs");
const safety = read("scripts/db-safety.mjs");
const testData = read("scripts/db-test-data.mjs");
const envExample = read(".env.example");
const workflow = read(".github/workflows/ci.yml");
const seed = read("prisma/seed.mjs");

function parseVersion(value) {
  const match = /^(\d+)\.(\d+)\.(\d+)(?:[-+].*)?$/.exec(String(value ?? ""));
  if (!match) return null;
  return { major: Number(match[1]), minor: Number(match[2]), patch: Number(match[3]) };
}

function isAtLeastVersion(version, minimum) {
  if (!version) return false;
  if (version.major !== minimum.major) return version.major > minimum.major;
  if (version.minor !== minimum.minor) return version.minor > minimum.minor;
  return version.patch >= minimum.patch;
}

const currentVersion = parseVersion(packageJson.version);
expect(
  isAtLeastVersion(currentVersion, { major: 28, minor: 1, patch: 0 }),
  "package.json sürümü 28.1.0 veya daha yeni olmalı.",
);
for (const script of [
  "vercel-build",
  "db:baseline:init",
  "db:migrate:create",
  "db:drift:check",
  "db:test:seed",
  "db:test:clean",
  "db:test:assert-clean",
  "validate:v28.1",
]) {
  expect(Boolean(packageJson.scripts?.[script]), `package.json scripts.${script} eksik.`);
}
expect(schema.includes('directUrl = env("DATABASE_POSTGRES_URL")'), "Prisma datasource DATABASE_POSTGRES_URL kullanmalı.");
expect(schema.includes("isTestUser"), "User.isTestUser alanı korunmalı.");
expect(!schema.includes("@@unique([userId, courseId])\n  @@unique([userId, courseId])"), "Enrollment yinelenen unique tanımı temizlenmeli.");
expect(migration.length > 20000, "Baseline migration tam şema SQL'ini içermeli.");
expect((migration.match(/CREATE TABLE/g) || []).length === 32, "Baseline migration 32 tablo oluşturmalı.");
expect(migration.includes('CREATE TABLE "User"'), "Baseline User tablosunu içermeli.");
expect(migration.includes('CREATE TYPE "UserRole"'), "Baseline enumları içermeli.");
expect(migration.includes('ALTER TABLE "AssessmentEvidence"'), "Baseline ilişkileri içermeli.");
expect(lock.includes('provider = "postgresql"'), "migration_lock.toml PostgreSQL sağlamalı.");
expect(deploy.includes("CONFIRM_PRODUCTION_BASELINE"), "Production baseline onayı eksik.");
expect(deploy.includes("CONFIRM_NON_PRODUCTION_BASELINE"), "Mevcut non-production şema benimseme koruması eksik.");
expect(deploy.includes("--from-schema-datasource") && deploy.includes("--to-schema-datamodel"), "Baseline öncesi şema farkı kontrolü eksik.");
expect(!deploy.includes('["db", "push"'), "Deployment akışında db push bulunmamalı.");
expect(pushGuard.includes('context.environment !== "development"'), "db push yalnızca development ile sınırlanmalı.");
expect(pushGuard.includes("ALLOW_PRISMA_DB_PUSH"), "db push açık onay istemeli.");
expect(safety.includes("PRODUCTION_DATABASE_FINGERPRINT"), "Production parmak izi koruması eksik.");
expect(testData.includes("assertNonProduction"), "Test verisi production koruması eksik.");
expect(testData.includes("isTestUser: true"), "Test kullanıcıları isTestUser=true olmalı.");
expect(testData.includes('action === "assert-clean"'), "Test verisi temizlik doğrulaması eksik.");
expect(envExample.includes("DATABASE_ENVIRONMENT"), ".env.example DATABASE_ENVIRONMENT içermeli.");
expect(envExample.includes("DATABASE_POSTGRES_URL"), ".env.example DATABASE_POSTGRES_URL içermeli.");
expect(envExample.includes("PRODUCTION_DATABASE_FINGERPRINT"), ".env.example production fingerprint içermeli.");
expect(workflow.includes("image: postgres:16"), "CI PostgreSQL servisi içermeli.");
expect(workflow.includes("db:test:clean"), "CI test verisi temizliği içermeli.");
expect(workflow.includes("db:migrate:status"), "CI migration status kapısı içermeli.");
expect(workflow.includes("db:drift:check"), "CI schema drift kontrolü içermeli.");
const vercelBuildScript = String(packageJson.scripts?.["vercel-build"] ?? "");
const migrationStep = vercelBuildScript.indexOf("node scripts/db-deploy.mjs");
const nextBuildStep = vercelBuildScript.indexOf("next build");
expect(
  migrationStep >= 0 && nextBuildStep > migrationStep,
  "Vercel build komutu migration adımını Next.js build işleminden önce çalıştırmalı.",
);
expect(seed.includes("BOOTSTRAP_ADMIN_ON_BUILD"), "Seed admin bootstrap bayrağına bağlı olmalı.");
expect(seed.includes("ALLOW_PREVIEW_ADMIN_BOOTSTRAP"), "Preview admin bootstrap koruması eksik.");

if (errors.length) {
  console.error("\nV28.1 doğrulaması başarısız:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log("V28.1 doğrulaması başarılı: tam baseline, preview/production ayrımı, test verisi ve CI kapıları hazır.");
