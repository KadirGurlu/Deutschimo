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
const types = read("types/intelligence.ts");
const data = read("data/placement-test.ts");
const evaluator = read("lib/intelligence/placement.ts");
const route = read("app/api/intelligence/placement/route.ts");
const component = read("components/intelligence/placement-test.tsx");
const styles = read("components/intelligence/placement-test-v28-4.module.css");
const schema = read("prisma/schema.prisma");
const migration = read("prisma/migrations/20260804180000_v28_4_real_placement/migration.sql");

const versionMatch = /^(\d+)\.(\d+)\.(\d+)/.exec(String(packageJson.version ?? ""));
const versionIsCompatible = Boolean(versionMatch) && (
  Number(versionMatch?.[1]) > 28
  || (Number(versionMatch?.[1]) === 28 && Number(versionMatch?.[2]) >= 4)
);
if (!versionIsCompatible) failures.push("package.json sürümü 28.4.0 veya daha yeni olmalı.");
for (const script of ["validate:v28.1", "validate:v28.3", "validate:v28.4", "vercel-build"]) {
  if (!packageJson.scripts?.[script]) failures.push(`package.json scripts.${script} eksik.`);
}
const vercelBuild = String(packageJson.scripts?.["vercel-build"] ?? "");
const v284Step = vercelBuild.indexOf("npm run validate:v28.4");
const deployStep = vercelBuild.indexOf("node scripts/db-deploy.mjs");
if (v284Step < 0 || deployStep <= v284Step) failures.push("V28.4 doğrulaması migration öncesinde çalışmalı.");

for (const mode of ["QUICK", "DETAILED"]) requireText(types + component + route, mode, `${mode} test modu eksik.`);
for (const skill of ["GRAMMAR", "VOCABULARY", "READING", "LISTENING", "WRITING", "SPEAKING"]) {
  requireText(types, `\"${skill}\"`, `PlacementSkill içinde ${skill} eksik.`);
  requireText(data, `skill: \"${skill}\"`, `Soru bankasında ${skill} görevi eksik.`);
  requireText(component, skill, `Sonuç arayüzünde ${skill} eksik.`);
}

requireText(data, "quickPlacementQuestions", "Hızlı test soru seçimi eksik.");
requireText(data, "detailedPlacementQuestions", "Ayrıntılı test soru bankası eksik.");
requireText(data, "v284-l-b2-02", "B2 dinleme görevi eksik.");
requireText(data, "v284-w-b1-01", "Yazma görevi eksik.");
requireText(data, "v284-s-b1-01", "Konuşma görevi eksik.");
requireText(component, "10–15 dakikada", "Hızlı test süre açıklaması eksik.");
requireText(component, "Altı becerinin", "Ayrıntılı test altı beceri açıklaması eksik.");
requireText(component, "35–50 dakika", "Ayrıntılı test süre açıklaması eksik.");
requireText(component, "SpeechSynthesisUtterance", "Dinleme oynatma desteği eksik.");
requireText(component, "webkitSpeechRecognition", "Konuşma transkript desteği eksik.");
requireText(component, "Eksik tamamlama planın", "Eksik tamamlama planı arayüzü eksik.");
requireText(component, 'result.mode === "QUICK"', "Hızlı test sonrası ayrıntılı test yönlendirmesi eksik.");
requireText(component, "otomatik bir ön değerlendirmedir", "Yazma/konuşma değerlendirme sınırı açıklanmıyor.");
requireText(styles, ".modeGrid", "V28.4 test modu tasarımı eksik.");
requireText(styles, ".skillResultGrid", "Beceri sonuç grid'i eksik.");

requireText(evaluator, "scoreConstructedResponse", "Yazma/konuşma ön değerlendirme algoritması eksik.");
requireText(evaluator, "weakestSkillScore", "Genel seviyede zayıf beceri dengelemesi eksik.");
requireText(evaluator, "buildGapPlan", "Otomatik eksik tamamlama planı üretimi eksik.");
requireText(evaluator, "toOverallBand", "A1.1–B2.2 bant hesabı eksik.");
requireText(route, "writtenSamples", "Yazma örnekleri kaydedilmiyor.");
requireText(route, "keywords: _keywords", "Yazma/konuşma puanlama anahtarları istemciye kapatılmalı.");
requireText(route, "slice(0, 5_000)", "Yerleştirme cevapları güvenli uzunlukla sınırlandırılmalı.");
requireText(route, "speakingSamples", "Konuşma transkriptleri kaydedilmiyor.");
requireText(route, "skillScores", "Beceri puanları kaydedilmiyor.");
requireText(route, "dailyStudyPlan.deleteMany", "Yeni sonuç sonrası günlük plan yenileme tetiklenmiyor.");

for (const field of [
  "mode", "skillScores", "skillLevels", "studyPlan", "writtenSamples", "speakingSamples",
  "overallBand", "confidenceScore", "durationSeconds",
]) requireText(schema, field, `PlacementAssessment.${field} alanı eksik.`);
requireText(migration, 'ALTER TABLE "PlacementAssessment"', "V28.4 PlacementAssessment migration'ı eksik.");
requireText(migration, 'PlacementAssessment_userId_mode_completedAt_idx', "Mod bazlı sonuç indeksi eksik.");
forbid(migration, /\b(DROP\s+TABLE|TRUNCATE|DELETE\s+FROM|DROP\s+COLUMN)\b/i, "V28.4 migration'ı yıkıcı SQL içeremez.");

const quickBlock = data.match(/const quickIds = new Set\(\[([\s\S]*?)\]\);/)?.[1] ?? "";
const quickIdCount = (quickBlock.match(/"v284-/g) || []).length;
const detailedQuestionCount = (data.match(/id: "v284-/g) || []).length;
if (quickIdCount !== 16) failures.push(`Hızlı test 16 seçici soru içermeli; bulunan: ${quickIdCount}.`);
if (detailedQuestionCount !== 36) failures.push(`Ayrıntılı test 36 görev içermeli; bulunan: ${detailedQuestionCount}.`);
requireText(evaluator, "buildGapPlan(skillScores, measuredSkills)", "Eksik tamamlama planı yalnızca ölçülen becerilerden üretilmeli.");

if (failures.length) {
  console.error("\nV28.4 doğrulaması başarısız:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("V28.4 doğrulaması başarılı: iki aşamalı seviye testi, altı beceri profili, A1.1–B2.2 sonuç bantları ve otomatik eksik tamamlama planı hazır.");
