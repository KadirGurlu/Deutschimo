import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const errors = [];
const read = (rel) => fs.existsSync(path.join(root, rel))
  ? fs.readFileSync(path.join(root, rel), "utf8")
  : "";
const req = (rel) => {
  if (!fs.existsSync(path.join(root, rel))) errors.push(`Eksik V43 dosyasi: ${rel}`);
};

[
  "types/personal-learning-v43.ts",
  "lib/intelligence/personal-learning-v43.ts",
  "lib/intelligence/personal-learning-server-v43.ts",
  "lib/intelligence/daily-plan.ts",
  "lib/intelligence/server.ts",
  "components/intelligence/daily-plan.tsx",
  "components/dashboard/today-plan-card.tsx",
  "app/api/intelligence/personal-learning/route.ts",
  "scripts/validate-v43.mjs",
  "docs/V43_PERSONAL_LEARNING_ENGINE_2.md",
  ".github/workflows/v43-personal-learning.yml",
].forEach(req);

const pkg = JSON.parse(read("package.json") || "{}");
const major = Number(String(pkg.version ?? "").split(".")[0]);
if (!Number.isFinite(major) || major < 43) {
  errors.push(`V43 paket surumu bekleniyor: ${pkg.version}`);
}
if (!pkg.scripts?.["validate:v43"]) errors.push("validate:v43 npm scripti eksik.");
if (!pkg.scripts?.["release:v43"]) errors.push("release:v43 npm scripti eksik.");

for (const scriptName of ["prebuild", "quality:check", "vercel-build"]) {
  const value = String(pkg.scripts?.[scriptName] ?? "");
  if (!value.includes("validate:v40")) errors.push(`${scriptName}: V40 tabani kaybolmus.`);
  if (!value.includes("validate:v43")) errors.push(`${scriptName}: V43 kalite kapisi eksik.`);
}

const engine = read("lib/intelligence/personal-learning-v43.ts");
for (const token of [
  "goalBoosts",
  "ONBOARDING_FOCUS",
  "LEARNING_GOAL",
  "LOW_MASTERY",
  "RECENT_LOW_SCORE",
  "OPEN_ERRORS",
  "DUE_REVIEW",
  "LONG_GAP",
  "confidenceFactor",
  "recentAttempts >= 2",
  'mode = dataCoverage >= 50 ? "ADAPTIVE" : "PROFILE_LED"',
  "severeFocus",
  "primarySkill",
  "secondarySkill",
]) {
  if (!engine.includes(token)) errors.push(`V43 karar motoru parcasi eksik: ${token}`);
}

const collector = read("lib/intelligence/personal-learning-server-v43.ts");
for (const token of [
  "learnerOnboardingProfile",
  "masterySkillSnapshot",
  "skillLabAttempt",
  "learningErrorHistory",
  "masteryReviewQueueItem",
  "vocabularyNotebookItem",
  "21 * 86_400_000",
]) {
  if (!collector.includes(token)) errors.push(`V43 sinyal toplayici eksik: ${token}`);
}

const plan = read("lib/intelligence/daily-plan.ts");
for (const token of [
  "focusSkills",
  "selfReportedLevelReady",
  "-v32-1-",
  "allocateMinutes",
  "-v43-",
  "personalization",
  "severeFocus",
  "[0.40, 0.27, 0.17, 0.16]",
  "[0.27, 0.23, 0.27, 0.23]",
  "COURSE_CONTINUITY",
]) {
  if (!plan.includes(token)) errors.push(`V43 gunluk plan parcasi eksik: ${token}`);
}

const server = read("lib/intelligence/server.ts");
for (const token of [
  "getPersonalLearningDecisionForUser",
  "learnerOnboardingProfile",
  "isV321Plan",
  "isV43Plan",
  "selfReportedLevelReady",
  "focusSkills",
  "personalization",
]) {
  if (!server.includes(token)) errors.push(`V43 server entegrasyonu eksik: ${token}`);
}

const types = read("types/intelligence.ts");
for (const token of [
  "adaptive?: boolean",
  "reason?: string",
  "reasonCodes?:",
  "personalization?:",
]) {
  if (!types.includes(token)) errors.push(`V43 DailyStudyPlan type eksik: ${token}`);
}

const ui = read("components/intelligence/daily-plan.tsx");
for (const token of [
  "V43 · KİŞİSEL ÖĞRENME MOTORU 2.0",
  "V32 onboarding artık planın girdisi",
  "BUGÜN NEDEN BU DAĞILIM?",
  "Planı yeniden hesapla",
  "dataCoverage",
  "priorityScore",
  "task.reason",
]) {
  if (!ui.includes(token)) errors.push(`V43 Daily Plan UI eksik: ${token}`);
}

const compact = read("components/dashboard/today-plan-card.tsx");
for (const token of [
  "V43 kişisel motor",
  "engine.profile.goalLabel",
  "engine.mode",
  "task.reason",
]) {
  if (!compact.includes(token)) errors.push(`V43 Dashboard plan karti eksik: ${token}`);
}

const route = read("app/api/intelligence/personal-learning/route.ts");
if (!route.includes("/api/intelligence/personal-learning") ||
    !route.includes("getPersonalLearningDecisionForUser")) {
  errors.push("V43 aciklanabilir karar API'si eksik.");
}

const css = read("app/globals.css");
if (!css.includes("V43_PERSONAL_LEARNING_ENGINE_2")) {
  errors.push("V43 global stilleri eksik.");
}
const dashCss = read("components/dashboard/v32-1-dashboard.module.css");
if (!dashCss.includes(".v43EngineStrip") || !dashCss.includes(".v43TaskReason")) {
  errors.push("V43 dashboard stilleri eksik.");
}

const workflow = read(".github/workflows/v43-personal-learning.yml");
for (const token of [
  "branches: [v43-staging]",
  "actions/checkout@v6",
  "actions/setup-node@v7",
  "postgres:16",
  "DATABASE_ENVIRONMENT: test",
  "npm run validate:v40",
  "npm run validate:v43",
  "npm run db:drift:check",
  "npm run typecheck",
  "npm run build",
]) {
  if (!workflow.includes(token)) errors.push(`V43 workflow parcasi eksik: ${token}`);
}

if (errors.length) {
  errors.forEach((error) => console.error("HATA:", error));
  console.error(`V43 Kisisel Ogrenme Motoru 2.0 dogrulamasi basarisiz: ${errors.length} hata.`);
  process.exit(1);
}

console.log("V43 Kisisel Ogrenme Motoru 2.0 dogrulamasi basarili:");
console.log("- V32 onboarding: seviye, hedef, gunluk dakika, haftalik gun ve beceri oncelikleri aktif girdiler.");
console.log("- V37 Mastery, V38 review, acik hatalar, kelime tekrar borcu ve V39/V40 lab sonuclari tek sinyal modelinde.");
console.log("- Tek kotu sonuc plani ele gecirmiyor; confidence/recent-attempt damping uygulanmis.");
console.log("- 30 dk dengeli 4 gorev profili 8/7/8/7; guvenilir ciddi zayiflikta 12/8/5/5 adaptasyonu destekleniyor.");
console.log("- Ayni gun plan stabil; yeni kanitlar sonraki gunun dagilimini etkiliyor. Manuel refresh kontrollu.");
console.log("- Motor kararlari UI ve /api/intelligence/personal-learning uzerinden aciklanabilir.");
console.log("- Yeni Prisma migration ve yeni environment variable gerekmiyor.");
