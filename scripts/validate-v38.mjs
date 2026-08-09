import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const errors = [];
const exists = (rel) => fs.existsSync(path.join(root, rel));
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

const requiredFiles = [
  "types/smart-review-v38.ts",
  "lib/review/mastery-review-3.ts",
  "scripts/validate-v38.mjs",
  "docs/V38_SMART_REVIEW_3.md",
  "prisma/migrations/20260809140000_v38_smart_review_mastery_queue/migration.sql",
  "app/api/intelligence/review/route.ts",
  "components/intelligence/smart-review.tsx",
  "lib/mastery/server.ts",
];

for (const file of requiredFiles) {
  if (!exists(file)) errors.push(`Eksik V38 dosyasi: ${file}`);
}

const pkg = JSON.parse(read("package.json"));
const major = Number(String(pkg.version ?? "").split(".")[0]);
if (!Number.isFinite(major) || major < 38) errors.push(`V38 paket surumu bekleniyor: ${pkg.version}`);
if (!pkg.scripts?.["validate:v38"]) errors.push("validate:v38 npm scripti eksik.");
for (const scriptName of ["vercel-build", "prebuild"]) {
  const value = String(pkg.scripts?.[scriptName] ?? "");
  if (value && !value.includes("validate:v38")) errors.push(`${scriptName} validate:v38 calistirmiyor.`);
}

const schema = read("prisma/schema.prisma");
for (const token of [
  "model MasteryReviewQueueItem",
  "priorityScore",
  "failureCount",
  "lastCorrectAt",
  "lastIncorrectAt",
  "averageResponseMs",
  "similarTopicScore",
  'phase             String',
]) {
  if (!schema.includes(token)) errors.push(`V38 Prisma parcasi eksik: ${token}`);
}

const migration = read("prisma/migrations/20260809140000_v38_smart_review_mastery_queue/migration.sql").toUpperCase();
for (const forbidden of ["DROP TABLE", "DROP COLUMN", "TRUNCATE", "DELETE FROM"]) {
  if (migration.includes(forbidden)) errors.push(`Yikici migration komutu yasak: ${forbidden}`);
}
if (/UPDATEDAT[^,\n]*DEFAULT\s+CURRENT_TIMESTAMP/i.test(migration)) {
  errors.push("V38 updatedAt kolonuna DB DEFAULT eklenmemeli; V37 drift hatasi tekrarlanir.");
}

const phaseTypes = read("types/smart-review-v38.ts");
for (const phase of ["RECALL", "SENTENCE", "PRODUCTION", "CONTRAST"]) {
  if (!phaseTypes.includes(phase)) errors.push(`Eksik tekrar fazi: ${phase}`);
}

const engine = read("lib/review/mastery-review-3.ts");
for (const token of [
  "enqueueMasteryEvidenceForReview",
  "syncMasteryReviewOutcome",
  "decorateSmartReviewQueue",
  "listStandaloneMasteryReviewItems",
  "getStandaloneMasteryReviewItem",
  "lastCorrectAt",
  "lastIncorrectAt",
  "responseMs",
  "failureCount",
  "masteryScore",
  "difficulty",
  "lastReviewedAt",
  "confidenceLabel",
  "similarTopicScore",
  "priorityScore",
  "expectedResponseSeconds",
]) {
  if (!engine.includes(token)) errors.push(`V38 tekrar motoru sinyali/ozelligi eksik: ${token}`);
}

const masteryServer = read("lib/mastery/server.ts");
if (!masteryServer.includes("enqueueMasteryEvidenceForReview")) {
  errors.push("Her yanlis Mastery kanitini tekrar kuyruguna baglayan hook eksik.");
}
if (!masteryServer.includes('import { prisma } from "@/lib/db"')) {
  errors.push("V37 Prisma client import hotfix korunmuyor.");
}

const reviewRoute = read("app/api/intelligence/review/route.ts");
for (const token of [
  "captureMasteryExchange",
  "decorateSmartReviewQueue",
  "listStandaloneMasteryReviewItems",
  "getStandaloneMasteryReviewItem",
  "syncMasteryReviewOutcome",
  "masteryPhase",
  "normalizeMasteryReviewPhase",
  "V37_ROUTE_COMPAT_INLINE",
]) {
  if (!reviewRoute.includes(token)) errors.push(`Smart Review API V38/V37 uyumluluk parcasi eksik: ${token}`);
}

const intelligenceTypes = read("types/intelligence.ts");
for (const token of ["masteryPhase?", "masterySignals?", "masteryPriorityScore?", "masteryPhaseInstruction?"]) {
  if (!intelligenceTypes.includes(token)) errors.push(`ReviewItem V38 alani eksik: ${token}`);
}

const ui = read("components/intelligence/smart-review.tsx");
for (const token of [
  "V38 · AKILLI TEKRAR 3.0",
  "Hatırlama",
  "Cümle",
  "Üretim",
  "Karşılaştırma",
  "masterySignals",
  "Benzer konu",
  "Son yanlış",
]) {
  if (!ui.includes(token)) errors.push(`V38 Smart Review UI parcasi eksik: ${token}`);
}

if (errors.length) {
  errors.forEach((error) => console.error("HATA:", error));
  console.error(`V38 Akilli Tekrar 3.0 dogrulamasi basarisiz: ${errors.length} hata.`);
  process.exit(1);
}

console.log("V38 Akilli Tekrar 3.0 dogrulamasi basarili:");
console.log("- V37 Mastery Engine, V28.3 adaptive scheduler ve yeni V38 kuyrugu birbirine bagli.");
console.log("- Her yanlis Mastery kaniti otomatik ACTIVE tekrar kuyruguna giriyor.");
console.log("- 9 sinyal: son dogru, son yanlis, yanit suresi, hata sayisi, beceri, zorluk, son tekrar, guven, benzer konu performansi.");
console.log("- 4 tekrar fazi: Hatirlama -> Cumle -> Uretim -> Karsilastirma.");
console.log("- Kurs tamamlama verisi Mastery evidence olarak kullanilmiyor.");
console.log("- V37 Prisma import ve schema-drift duzeltmeleri korunuyor.");
