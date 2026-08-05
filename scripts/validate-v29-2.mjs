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

const packageJsonText = read("package.json");
const packageJson = packageJsonText ? JSON.parse(packageJsonText) : { scripts: {} };
const component = read("components/writing-coach/writing-coach.tsx");
const styles = read("components/writing-coach/writing-coach.module.css");
const types = read("types/writing-coach.ts");
const route = read("app/api/writing-coach/review/route.ts");
const schema = read("prisma/schema.prisma");
const migration = read("prisma/migrations/20260805133000_v29_2_writing_coach_revision/migration.sql");

if (packageJson.version !== "29.2.0") failures.push("package.json sürümü 29.2.0 olmalı.");
for (const script of ["validate:v29", "validate:v29.2", "vercel-build"]) {
  if (!packageJson.scripts?.[script]) failures.push(`package.json scripts.${script} eksik.`);
}
const vercelBuild = String(packageJson.scripts?.["vercel-build"] ?? "");
const validateStep = vercelBuild.indexOf("npm run validate:v29.2");
const deployStep = vercelBuild.indexOf("node scripts/db-deploy.mjs");
if (validateStep < 0 || deployStep <= validateStep) failures.push("V29.2 doğrulaması migration öncesinde çalışmalı.");

for (const text of [
  "İlk ve son metin karşılaştırması",
  "Cümle bazında hata yerlerini gör",
  "Bu hatayı metnimde düzelttim",
  "Revizyon geçmişi",
  "Seviyene uygun kelimeler",
  "Bağlaç ve bağlantı önerileri",
  "Goethe benzeri",
  "telc benzeri",
  "Akıllı Tekrar bağlantısı",
]) {
  requireText(component, text, `Yazma Koçu 2.0 arayüzünde “${text}” eksik.`);
}
for (const style of [
  ".toneGrammar",
  ".toneVocabulary",
  ".toneConnection",
  ".toneMechanics",
  ".comparisonSection",
  ".revisionTimeline",
  ".textComparison",
]) {
  requireText(styles, style, `V29.2 arayüz stili eksik: ${style}.`);
}

for (const type of [
  "WritingCoachRubricMode",
  "WritingRevisionComparison",
  "WritingCoachRevisionSummary",
  "WritingLanguageSuggestion",
]) {
  requireText(types, type, `V29.2 tipi eksik: ${type}.`);
}
for (const mode of ["DEUTSCHIMO", "GOETHE", "TELC"]) {
  requireText(types + route, `"${mode}"`, `Değerlendirme modu eksik: ${mode}.`);
}

requireText(route, "looksLikeGhostwritingRequest", "Öğrencinin yerine metin yazdırma taleplerini reddeden kontrol eksik.");
requireText(route, "GHOSTWRITING_REQUEST_REJECTED", "Hazır metin talebi için açık hata kodu eksik.");
requireText(route, "weightedOverall", "Rubrik modlarına göre ağırlıklı puanlama eksik.");
requireText(route, "buildComparison", "İlk-son karşılaştırma hesaplaması eksik.");
requireText(route, "vocabularySuggestions", "Seviyeye uygun kelime önerileri eksik.");
requireText(route, "connectorSuggestions", "Bağlaç önerileri eksik.");
requireText(route, "previousStudentText", "AI revizyon bağlamı eksik.");
requireText(route, "competencyRecord", "Yazma hataları ustalık kaydına aktarılmıyor.");
requireText(route, "adaptiveReviewAttempt.create", "Tekrarlanan hatalar Akıllı Tekrar kuyruğuna gönderilmiyor.");
requireText(route, 'domain: "WRITING_ERROR"', "Akıllı Tekrar yazma hata alanı eksik.");
requireText(route, "resolvedAt: now", "Düzeltilen hata kayıtlarının çözülmesi eksik.");
requireText(route, "studentText.includes(excerpt)", "AI alıntıları öğrenci metnine karşı doğrulanmalı.");
forbid(route, /correctedText|modelAnswer|replacementText|fullCorrectedSentence/iu, "AI sözleşmesi düzeltilmiş metin veya model cevap alanı içeremez.");
forbid(route, /NEXT_PUBLIC_OPENAI/iu, "OpenAI anahtarı istemciye açık olamaz.");

for (const field of [
  "rubricMode",
  "initialScore",
  "latestScore",
  "scoreImprovement",
  "previousAttemptId",
  "isRevision",
  "improvement",
  "resolvedErrorCount",
  "repeatedErrorCount",
  "newErrorCount",
  "suggestions",
  "comparison",
]) {
  requireText(schema, field, `Prisma şemasında V29.2 alanı eksik: ${field}.`);
  requireText(migration, `"${field}"`, `V29.2 migration içinde alan eksik: ${field}.`);
}
requireText(migration, "WritingCoachAttempt_sessionId_rubricMode_revisionNumber_idx", "Revizyon modu indeksi eksik.");
forbid(migration, /\b(DROP\s+TABLE|TRUNCATE|DELETE\s+FROM|DROP\s+COLUMN)\b/iu, "V29.2 migration'ı yıkıcı SQL içeremez.");

if (failures.length) {
  console.error("\nV29.2 doğrulaması başarısız:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("V29.2 doğrulaması başarılı: öz-düzeltme döngüsü, renkli cümle işaretleme, rubrik modları, revizyon karşılaştırması ve Akıllı Tekrar köprüsü hazır.");
