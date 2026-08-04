import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];

function read(relativePath) {
  const fullPath = path.join(root, relativePath);
  if (!fs.existsSync(fullPath)) {
    failures.push(`Eksik dosya: ${relativePath}`);
    return "";
  }
  return fs.readFileSync(fullPath, "utf8");
}

function requireText(content, needle, label) {
  if (!content.includes(needle)) failures.push(label);
}

function forbid(content, pattern, label) {
  if (pattern.test(content)) failures.push(label);
}

const packageJson = read("package.json");
const schema = read("prisma/schema.prisma");
const migration = read("prisma/migrations/20260804143000_v28_3_adaptive_review/migration.sql");
const adaptive = read("lib/review/adaptive-scheduler.ts");
const vocabularyScheduler = read("lib/vocabulary/scheduler.ts");
const vocabularyApi = read("app/api/vocabulary/review/route.ts");
const intelligenceApi = read("app/api/intelligence/review/route.ts");
const vocabularyUi = read("components/vocabulary/vocabulary-center.tsx");
const intelligenceUi = read("components/intelligence/smart-review.tsx");
const controls = read("components/review/adaptive-review-controls.tsx");
const vocabularyTypes = read("types/vocabulary.ts");

const packageData = JSON.parse(packageJson || '{}');
const versionMatch = /^(\d+)\.(\d+)\.(\d+)/.exec(String(packageData.version ?? ''));
const versionIsCompatible = Boolean(versionMatch) && (
  Number(versionMatch?.[1]) > 28
  || (Number(versionMatch?.[1]) === 28 && Number(versionMatch?.[2]) >= 3)
);
if (!versionIsCompatible) failures.push("package.json sürümü 28.3.0 veya daha yeni olmalı.");
requireText(packageJson, '"validate:v28.3"', "validate:v28.3 komutu eksik.");
const vercelBuild = String(packageData.scripts?.["vercel-build"] ?? "");
const v283Step = vercelBuild.indexOf("npm run validate:v28.3");
const deployStep = vercelBuild.indexOf("node scripts/db-deploy.mjs");
if (v283Step < 0 || deployStep <= v283Step) failures.push("Vercel build migration öncesinde V28.3 doğrulaması çalıştırmalı.");

for (const field of [
  "difficulty", "stability", "retrievability", "confidenceScore", "hintUseCount",
  "sameErrorStreak", "averageResponseMs", "lastResponseMs", "lastSeenAt", "lastMode",
]) requireText(schema, field, `Prisma şemasında ${field} alanı eksik.`);
requireText(schema, "model AdaptiveReviewAttempt", "AdaptiveReviewAttempt modeli eksik.");
requireText(schema, "adaptiveReviewAttempts AdaptiveReviewAttempt[]", "User → AdaptiveReviewAttempt ilişkisi eksik.");

for (const signal of [
  "correct", "responseMs", "hintUsed", "repeatedErrorCount", "difficulty", "confidence", "lastSeenAt",
]) requireText(adaptive + vocabularyApi + intelligenceApi, signal, `Algoritmada ${signal} sinyali eksik.`);

for (const mode of [
  "DE_TO_TR", "TR_TO_DE", "LISTEN_WRITE", "FILL_BLANK", "SENTENCE_ORDER", "SPEAK", "NEW_SENTENCE",
]) {
  requireText(vocabularyTypes, mode, `Türlerde ${mode} tekrar biçimi eksik.`);
  requireText(vocabularyScheduler, mode, `Kelime scheduler'ında ${mode} tekrar biçimi eksik.`);
  requireText(vocabularyUi, mode, `Kelime arayüzünde ${mode} tekrar biçimi eksik.`);
}

requireText(adaptive, "scheduleAdaptiveReview", "Uyarlanabilir planlayıcı fonksiyonu eksik.");
requireText(adaptive, "adaptiveDuePriority", "Uyarlanabilir kuyruk önceliği eksik.");
requireText(adaptive, "expectedResponseSeconds", "Mod ve zorluğa göre hedef süre hesabı eksik.");
requireText(vocabularyApi, "adaptiveReviewAttempt.create", "Kelime tekrar sinyalleri ortak deneme tablosuna yazılmıyor.");
requireText(intelligenceApi, "competencyRecord.upsert", "Öğrenme hedefi bazlı CompetencyRecord güncellemesi eksik.");
requireText(intelligenceApi, "adaptiveReviewAttempt.create", "Kişisel tekrar sinyalleri ortak deneme tablosuna yazılmıyor.");
requireText(controls, "Emin değilim", "Emin değilim seçimi arayüzde eksik.");
requireText(controls, "Eminim", "Eminim seçimi arayüzde eksik.");
requireText(controls, "İpucu kullan", "İpucu kullanımı arayüzde eksik.");
requireText(vocabularyUi + intelligenceUi, "Date.now() - startedAt", "Cevap süresi arayüzden API'ye gönderilmiyor.");
requireText(intelligenceUi, "Kendi Almanca örneğin", "Kavram tekrarında yeni cümle üretimi eksik.");

requireText(migration, 'ALTER TABLE "VocabularyNotebookItem"', "Kelime tablosu migration'ı eksik.");
requireText(migration, 'ALTER TABLE "CompetencyRecord"', "Öğrenme hedefi migration'ı eksik.");
requireText(migration, 'CREATE TABLE IF NOT EXISTS "AdaptiveReviewAttempt"', "Ortak tekrar denemesi migration'ı eksik.");
forbid(migration, /\b(DROP\s+TABLE|TRUNCATE|DELETE\s+FROM|DROP\s+COLUMN)\b/i, "V28.3 migration'ı yıkıcı SQL içeremez.");

if (failures.length) {
  console.error("\nV28.3 doğrulaması başarısız:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("V28.3 doğrulaması başarılı: 7 sinyalli uyarlanabilir planlama, 7 tekrar biçimi, öğrenme hedefi takibi, migration ve arayüz kapıları hazır.");
