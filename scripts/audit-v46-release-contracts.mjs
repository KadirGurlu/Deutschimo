import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const errors = [];
const warnings = [];

const read = (rel) => {
  const full = path.join(root, rel);
  return fs.existsSync(full) ? fs.readFileSync(full, "utf8") : "";
};
const requireFile = (rel) => {
  if (!fs.existsSync(path.join(root, rel))) errors.push(`Eksik V46 contract dosyasi: ${rel}`);
};

[
  "app/dashboard/page.tsx",
  "app/onboarding/page.tsx",
  "app/placement-test/page.tsx",
  "app/api/onboarding/route.ts",
  "app/api/progress/route.ts",
  "app/api/skills/attempts/route.ts",
  "app/api/intelligence/personal-learning/route.ts",
  "lib/mastery/server.ts",
  "lib/review/mastery-review-3.ts",
  "lib/intelligence/personal-learning-server-v43.ts",
  "lib/intelligence/daily-plan.ts",
  "lib/services/course-service.ts",
  "components/skills/listening-lab.tsx",
  "components/skills/speaking-lab.tsx",
].forEach(requireFile);

const authE2E = read("e2e/v46-auth-onboarding-dashboard.spec.ts");
function hasDirectGuard(source) {
  return /(requireUser|auth\(|redirect\(\s*["'`]\/auth)/i.test(source);
}
function hasE2ERouteGuard(route) {
  const hasGoto =
    authE2E.includes(`page.goto("/${route}")`) ||
    authE2E.includes(`page.goto('/${route}')`) ||
    authE2E.includes("page.goto(`/" + route + "`)");
  if (!hasGoto) return false;
  return /toHaveURL\([^;\n]{0,220}auth/i.test(authE2E);
}

for (const [label, route, pageSource] of [
  ["dashboard", "dashboard", read("app/dashboard/page.tsx")],
  ["onboarding", "onboarding", read("app/onboarding/page.tsx")],
  ["placement", "placement-test", read("app/placement-test/page.tsx")],
]) {
  if (!hasDirectGuard(pageSource) && !hasE2ERouteGuard(route)) {
    errors.push(`${label}: authenticated route guard contract kaniti bulunamadi.`);
  }
}

const onboarding = read("app/api/onboarding/route.ts");
for (const token of ["learnerOnboardingProfile", "onboardingCompleted", "PLACEMENT_REQUIRED", "dailyStudyPlan.deleteMany"]) {
  if (!onboarding.includes(token)) errors.push(`onboarding contract eksik: ${token}`);
}

const progress = read("app/api/progress/route.ts");
if (!/export\s+(?:async\s+)?function\s+GET|export\s+const\s+GET/.test(progress)) errors.push("progress route GET handler eksik.");
if (!/export\s+(?:async\s+)?function\s+(PUT|POST)|export\s+const\s+(PUT|POST)/.test(progress)) errors.push("progress route yazma handler'i eksik.");
if (progress.includes("captureMasteryExchange")) errors.push("V37 ilkesi ihlal edildi: completion/progress Mastery evidence sayilmamali.");

const courseService = read("lib/services/course-service.ts");
for (const token of ["CmsWorkflowStatus.PUBLISHED", 'status==="PUBLISHED"', "active"]) {
  if (!courseService.includes(token)) errors.push(`published content filter izi eksik: ${token}`);
}

const mastery = read("lib/mastery/server.ts");
for (const token of ["masterySkillSnapshot", "masteryTopicSnapshot", "enqueueMasteryEvidenceForReview"]) {
  if (!mastery.includes(token)) errors.push(`Mastery -> Review bridge eksik: ${token}`);
}
const review = read("lib/review/mastery-review-3.ts");
for (const token of ["masteryReviewQueueItem", 'status: "ACTIVE"', "priorityScore"]) {
  if (!review.includes(token)) errors.push(`Smart Review queue contract eksik: ${token}`);
}
const personal = read("lib/intelligence/personal-learning-server-v43.ts");
for (const token of ["masterySkillSnapshot", "skillLabAttempt", "masteryReviewQueueItem", "vocabularyNotebookItem"]) {
  if (!personal.includes(token)) errors.push(`Personal Learning signal eksik: ${token}`);
}
const daily = read("lib/intelligence/daily-plan.ts");
for (const token of ["personalization", "COURSE_CONTINUITY"]) {
  if (!daily.includes(token)) errors.push(`Daily Plan V43 adaptasyon izi eksik: ${token}`);
}

const listening = read("components/skills/listening-lab.tsx");
for (const token of ["V46_LISTENING_RESILIENCE", "speechSynthesis", "utterance.onerror", "accessibleTranscriptOpened"]) {
  if (!listening.includes(token)) errors.push(`Listening resilience eksik: ${token}`);
}
const speaking = read("components/skills/speaking-lab.tsx");
for (const token of ["V46_SPEAKING_RESILIENCE", "not-allowed", "audio-capture", "network", "Konuşma metni"]) {
  if (!speaking.includes(token)) errors.push(`Speaking resilience eksik: ${token}`);
}

const workflow = read(".github/workflows/v46-release-readiness.yml");
const centralized = workflow.includes("npm run release:gate");
for (const token of ["DATABASE_ENVIRONMENT: test", "postgres:16"]) {
  if (!workflow.includes(token)) errors.push(`V46 CI release gate eksik: ${token}`);
}
if (!centralized) {
  for (const token of [
    "npm run validate:v45",
    "npm run validate:v46",
    "npm run audit:v46",
    "npm run typecheck",
    "npm run build",
    "npm run perf:v45",
    "npm run test:e2e:v46",
  ]) {
    if (!workflow.includes(token)) errors.push(`V46 CI release gate eksik: ${token}`);
  }
}
if (/DATABASE_URL:\s*\$\{\{\s*secrets\./.test(workflow)) {
  errors.push("V46 E2E workflow production/preview secret database kullanmamali; gecici PostgreSQL kullanilmali.");
}

for (const rel of [
  "e2e/v46-auth-onboarding-dashboard.spec.ts",
  "e2e/v46-course-progression.spec.ts",
  "e2e/v46-learning-ecosystem.spec.ts",
  "e2e/v46-skill-labs.spec.ts",
]) requireFile(rel);

console.log("Deutschimo V46 Release Contract Audit");
console.log(`- Kritik hata: ${errors.length}`);
console.log(`- Uyari: ${warnings.length}`);
for (const warning of warnings) console.warn("UYARI:", warning);
if (errors.length) {
  for (const error of errors) console.error("HATA:", error);
  process.exit(1);
}
console.log("- V46.1 Auth/Onboarding/Placement/Dashboard contract: OK");
console.log("- V46.2 A1-A2-B1-B2 progression/published-content contract: OK");
console.log("- V46.3 Mastery -> Review -> Personal Learning -> Daily Plan contract: OK");
console.log("- V46.4 Listening/Speaking resilience contract: OK");
console.log(`- CI orchestration: ${centralized ? "V46.11 single release gate" : "legacy release workflow"}.`);
console.log("- CI gecici PostgreSQL izolasyonu: OK");
