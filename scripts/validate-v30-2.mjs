import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];

function read(relativePath) {
  const full = path.join(root, relativePath);
  if (!fs.existsSync(full)) {
    failures.push(`Eksik dosya: ${relativePath}`);
    return "";
  }
  return fs.readFileSync(full, "utf8");
}

function requireText(content, needle, label) {
  if (!content.includes(needle)) failures.push(label);
}

function parseVersion(value) {
  const match = /^(\d+)\.(\d+)\.(\d+)(?:[-+].*)?$/u.exec(String(value ?? ""));
  if (!match) return null;
  return { major: Number(match[1]), minor: Number(match[2]), patch: Number(match[3]) };
}

function atLeast(value, minimum) {
  const version = parseVersion(value);
  if (!version) return false;
  if (version.major !== minimum.major) return version.major > minimum.major;
  if (version.minor !== minimum.minor) return version.minor > minimum.minor;
  return version.patch >= minimum.patch;
}

const packageJson = JSON.parse(read("package.json") || "{}");
const schema = read("prisma/schema.prisma");
const migration = read("prisma/migrations/20260805160000_v30_2_real_germany_learning/migration.sql");
const progressRoute = read("app/api/real-germany/progress/route.ts");
const evaluateRoute = read("app/api/real-germany/evaluate/route.ts");
const component = read("components/real-germany/real-germany-mode.tsx");
const styles = read("components/real-germany/real-germany-mode.module.css");
const types = read("types/real-germany.ts");
const docs = read("docs/V30_2_REAL_GERMANY_LEARNING_SYSTEM.md");

if (!atLeast(packageJson.version, { major: 30, minor: 2, patch: 0 })) failures.push("package.json sürümü 30.2.0 veya daha yeni olmalı.");
for (const script of ["validate:v30.2", "validate:v30.1", "vercel-build", "quality:check"]) {
  if (!packageJson.scripts?.[script]) failures.push(`package.json scripts.${script} eksik.`);
}
const vercelBuild = String(packageJson.scripts?.["vercel-build"] ?? "");
const validationIndex = vercelBuild.indexOf("npm run validate:v30.2");
const migrationIndex = vercelBuild.indexOf("node scripts/db-deploy.mjs");
if (validationIndex < 0 || migrationIndex <= validationIndex) failures.push("V30.2 doğrulaması migration öncesinde çalışmalı.");

for (const token of [
  "REAL_GERMANY",
  "realGermanyProgress",
  "realGermanyAttempts",
  "model RealGermanyScenarioProgress",
  "model RealGermanyScenarioAttempt",
  "draftResponses",
  "latestOverallScore",
  "bestOverallScore",
  "skillScores",
  "smartReviewQueued",
]) requireText(schema, token, `Prisma şeması eksik: ${token}.`);

for (const token of [
  'ALTER TYPE "AssessmentSourceType" ADD VALUE IF NOT EXISTS \'REAL_GERMANY\'',
  'CREATE TABLE "RealGermanyScenarioProgress"',
  'CREATE TABLE "RealGermanyScenarioAttempt"',
  'RealGermanyScenarioProgress_userId_scenarioId_key',
  'RealGermanyScenarioAttempt_progressId_attemptNumber_key',
]) requireText(migration, token, `V30.2 migration eksik: ${token}.`);
if (/DROP TABLE|DROP COLUMN|TRUNCATE|DELETE FROM/iu.test(migration)) failures.push("V30.2 migration yıkıcı SQL içermemeli.");

for (const token of [
  "getApiUser",
  "realGermanyScenarioProgress.findMany",
  "realGermanyScenarioProgress.upsert",
  'action === "RETRY"',
  "draftResponses",
]) requireText(progressRoute, token, `Progress API eksik: ${token}.`);

for (const token of [
  "requestAiEvaluation",
  "heuristicEvaluation",
  "AssessmentSourceType.REAL_GERMANY",
  "learningErrorHistory.upsert",
  "adaptiveReviewAttempt.create",
  "competencyRecord.upsert",
  "assessmentEvidence.create",
  "realGermanyScenarioAttempt.create",
  "REAL_GERMANY_COMPLETED",
  "REAL_GERMANY_RETRIED",
]) requireText(evaluateRoute, token, `Değerlendirme API eksik: ${token}.`);

for (const token of [
  "/api/real-germany/progress",
  "/api/real-germany/evaluate",
  "Bu senaryoyu tekrar çalış",
  "Başlanmadı",
  "Devam ediyor",
  "Tamamlandı",
  "Genel başarı",
  "Akıllı Tekrar",
  "Önceki genel puan",
]) requireText(component, token, `V30.2 arayüz eksik: ${token}.`);

for (const token of [
  ".statusNOT_STARTED",
  ".statusIN_PROGRESS",
  ".statusCOMPLETED",
  ".resultPanel",
  ".scoreGrid",
  ".comparisonStrip",
  ".weakAreaList",
]) requireText(styles, token, `V30.2 stil eksik: ${token}.`);

for (const token of [
  "RealGermanyProgressSummary",
  "RealGermanyEvaluationResult",
  "RealGermanyWeakArea",
  "RealGermanyComparison",
  "RealGermanyStatus",
]) requireText(types, token, `V30.2 tip eksik: ${token}.`);
requireText(docs, "V30.2 — Gerçek Almanya Modu Öğrenme Sistemi", "V30.2 teknik dokümanı eksik.");

if (failures.length) {
  console.error("\nV30.2 doğrulaması başarısız:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("V30.2 doğrulaması başarılı: hesap senkronizasyonu, dört beceri puanı, deneme karşılaştırması ve Akıllı Tekrar köprüsü hazır.");
