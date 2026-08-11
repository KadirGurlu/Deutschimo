import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
let failed = false;
const errors = [];
function read(rel) {
  const p = path.join(root, rel);
  if (!fs.existsSync(p)) { failed = true; errors.push(`Eksik dosya: ${rel}`); return ""; }
  return fs.readFileSync(p, "utf8");
}
function requireText(label, source, tokens) {
  for (const token of tokens) {
    if (!source.includes(token)) { failed = true; errors.push(`${label}: eksik -> ${token}`); }
  }
}

const schema = read("prisma/schema.prisma");
const migration = read("prisma/migrations/20260811123000_v46_7_database_integrity/migration.sql");
const daily = read("app/api/intelligence/daily-plan/route.ts");
const mastery = read("lib/mastery/server.ts");
const progress = read("app/api/progress/route.ts");
const integrity = read("scripts/database-integrity-v46-7.mjs");
const migrationSafety = read("scripts/migration-safety-v46-7.mjs");
const upgrade = read("scripts/test-v46-7-upgrade.mjs");
const workflow = read(".github/workflows/v46-7-database-integrity.yml");
const pkg = JSON.parse(read("package.json") || "{}");

requireText("Prisma UserUnitProgress relations", schema, [
  "course                    Course   @relation(fields: [courseId], references: [id], onDelete: Restrict)",
]);
for (const model of ["MasteryAttempt", "MasterySkillSnapshot", "MasteryTopicSnapshot", "MasteryReviewQueueItem"]) {
  const start = schema.indexOf(`model ${model} {`);
  const end = schema.indexOf("\n}", start);
  const block = start >= 0 && end >= 0 ? schema.slice(start, end) : "";
  requireText(`${model} relations`, block, [
    "@relation(fields: [userId], references: [id], onDelete: Cascade)",
    "@relation(fields: [courseId], references: [id], onDelete: Restrict)",
  ]);
}

requireText("Duplicate guards", schema, [
  "@@unique([userId, unitId])",
  "@@unique([userId, planDate])",
  "eventKey        String           @unique",
  "@@unique([userId, scopeKey, skill])",
  "@@unique([userId, scopeKey, tag])",
  "@@unique([userId, courseId, questionId, skill])",
  "@@unique([progressId, attemptNumber])",
  "@@unique([contentId, version])",
]);

const sqlNoComments = migration.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/--.*$/gm, " ").toUpperCase();
for (const destructive of ["DROP TABLE", "DROP COLUMN", "TRUNCATE", "DELETE FROM"]) {
  if (sqlNoComments.includes(destructive)) { failed = true; errors.push(`Destructive migration bulundu: ${destructive}`); }
}
requireText("Migration FK strategy", sqlNoComments, ["NOT VALID", "VALIDATE CONSTRAINT", "ON DELETE CASCADE", "ON DELETE RESTRICT"]);

requireText("Daily plan transaction", daily, ["prisma.$transaction", "FOR UPDATE", "completedMinutes"]);
requireText("Progress transaction", progress, ["prisma.$transaction"]);
requireText("Mastery transaction/integrity", mastery, ["prisma.$transaction", "resolveMasteryCourseId", "course.findFirst"]);
requireText("Read-only integrity checker", integrity, ["READ-ONLY CHECK", "duplicate daily plan", "duplicate mastery", "orphan/logical reference", "pg_constraint"]);
requireText("Migration safety scanner", migrationSafety, ["Destructive migration: YOK", "migrate reset", "db push"]);
requireText("Upgrade test", upgrade, ["DATABASE_ENVIRONMENT", "preflight", "migrate", "deploy", "fingerprint"]);
requireText("CI fresh/upgrade", workflow, ["fresh-database", "upgrade-from-v45-v46-schema", "npm run db:seed", "npm start", "test:migration:v46.7"]);

const scripts = pkg.scripts || {};
for (const key of ["validate:v46.7", "db:integrity:preflight", "db:integrity:assert", "db:migration:safety:v46.7", "test:migration:v46.7", "release:v46.7"]) {
  if (!scripts[key]) { failed = true; errors.push(`package.json script eksik: ${key}`); }
}
const vercel = String(scripts["vercel-build"] || "");
const preflightPos = vercel.indexOf("db:integrity:preflight");
const deployPos = vercel.indexOf("db-deploy.mjs");
const assertPos = vercel.indexOf("db:integrity:assert");
if (!(preflightPos >= 0 && deployPos > preflightPos && assertPos > deployPos)) {
  failed = true; errors.push("vercel-build sırası preflight -> db-deploy -> assert değil.");
}
if (/migrate reset|db push/i.test(vercel)) { failed = true; errors.push("vercel-build destructive DB komutu içeriyor."); }

if (failed) {
  console.error("V46.7 doğrulaması başarısız:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log("V46.7 Database Integrity & Migration Safety doğrulaması başarılı.");
console.log("- Foreign key / orphan / duplicate / nullable / cascade kuralları tanımlı; legacy unitId referansları raporlanır.");
console.log("- Daily plan eşzamanlı güncellemeleri transaction + row lock ile korunuyor.");
console.log("- Fresh DB ve V45/V46-schema upgrade CI senaryoları hazır.");
console.log("- Destructive migration: YOK. Production otomatik veri silme: YOK.");
