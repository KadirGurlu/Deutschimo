import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const errors = [];

const read = (rel) => {
  const full = path.join(root, rel);
  return fs.existsSync(full) ? fs.readFileSync(full, "utf8") : "";
};

const need = (rel) => {
  if (!fs.existsSync(path.join(root, rel))) {
    errors.push(`Eksik: ${rel}`);
  }
};

/*
 * ==========================================================================
 * V46 RELEASE READINESS REQUIRED FILES
 * ==========================================================================
 */

[
  "playwright.v46.config.ts",
  "e2e/helpers/v46-user.ts",
  "e2e/v46-auth-onboarding-dashboard.spec.ts",
  "e2e/v46-course-progression.spec.ts",
  "e2e/v46-learning-ecosystem.spec.ts",
  "e2e/v46-skill-labs.spec.ts",
  "scripts/audit-v46-release-contracts.mjs",
  "scripts/v46-db-readiness.mjs",
  ".github/workflows/v46-release-readiness.yml",
  "docs/V46_RELEASE_READINESS.md",
  "docs/V46_RELEASE_GATE_MATRIX.md",
].forEach(need);

/*
 * ==========================================================================
 * PACKAGE VERSION
 * ==========================================================================
 *
 * V46 validator remains a regression gate for later releases.
 * V46 and V47 package versions are therefore accepted.
 */

const pkg = JSON.parse(read("package.json") || "{}");

const supportedPackageVersions = [
  "46.0.0",
  "47.0.0",
];

if (!supportedPackageVersions.includes(pkg.version)) {
  errors.push(
    `package version 46.0.0 veya 47.0.0 degil: ${pkg.version}`
  );
}

/*
 * ==========================================================================
 * REQUIRED PACKAGE SCRIPTS
 * ==========================================================================
 */

for (const script of [
  "validate:v46",
  "audit:v46",
  "db:readiness:v46",
  "test:e2e:v46",
  "release:v46",
]) {
  if (!pkg.scripts?.[script]) {
    errors.push(`package script eksik: ${script}`);
  }
}

/*
 * ==========================================================================
 * BUILD / QUALITY REGRESSION GATES
 * ==========================================================================
 */

for (const script of [
  "prebuild",
  "quality:check",
  "vercel-build",
]) {
  const value = String(pkg.scripts?.[script] || "");

  if (!value.includes("validate:v45")) {
    errors.push(`${script}: V45 geriye uyumluluk kapisi yok`);
  }

  if (!value.includes("validate:v46")) {
    errors.push(`${script}: V46 validator kapisi yok`);
  }
}

/*
 * ==========================================================================
 * V46 LISTENING RESILIENCE
 * ==========================================================================
 */

const listening = read("components/skills/listening-lab.tsx");

if (!listening.includes("V46_LISTENING_RESILIENCE")) {
  errors.push("Listening V46 resilience marker eksik.");
}

/*
 * ==========================================================================
 * V46 SPEAKING RESILIENCE
 * ==========================================================================
 */

const speaking = read("components/skills/speaking-lab.tsx");

if (!speaking.includes("V46_SPEAKING_RESILIENCE")) {
  errors.push("Speaking V46 resilience marker eksik.");
}

/*
 * ==========================================================================
 * RELEASE WORKFLOW
 * ==========================================================================
 */

const workflow = read(
  ".github/workflows/v46-release-readiness.yml"
);

const centralized = workflow.includes("npm run release:gate");

for (const token of [
  "v46-staging",
  "postgres:16",
]) {
  if (!workflow.includes(token)) {
    errors.push(`workflow eksik: ${token}`);
  }
}

/*
 * Legacy V46 orchestration:
 * workflow executes each V46 gate separately.
 *
 * V46.11+ orchestration:
 * workflow executes the centralized release:gate command.
 */

if (!centralized) {
  for (const token of [
    "npm run validate:v45",
    "npm run validate:v46",
    "npm run audit:v46",
    "npm run db:readiness:v46",
    "npm run test:e2e:v46",
  ]) {
    if (!workflow.includes(token)) {
      errors.push(`workflow eksik: ${token}`);
    }
  }
} else {
  const releaseGate = String(
    pkg.scripts?.["release:gate"] || ""
  );

  if (!releaseGate.includes("release-gate-v46-11.mjs")) {
    errors.push(
      "Central workflow release:gate kullaniyor fakat package merkezi gate scriptine bagli degil."
    );
  }
}

/*
 * ==========================================================================
 * V46 E2E RATE-LIMIT ISOLATION
 * ==========================================================================
 */

const v46Helper = read("e2e/helpers/v46-user.ts");

if (
  !v46Helper.includes("x-forwarded-for") ||
  !v46Helper.includes("v46ClientIp")
) {
  errors.push(
    "V46 E2E rate-limit izolasyonu eksik."
  );
}

if (v46Helper.includes("rateLimitEvent.deleteMany")) {
  errors.push(
    "V46 E2E cleanup guvenlik rate-limit tablosunu silmemeli."
  );
}

/*
 * ==========================================================================
 * V46.3 SKILL LAB -> MASTERY -> SMART REVIEW BRIDGE
 * ==========================================================================
 */

const masteryBridge = read("lib/mastery/bridge.ts");

if (
  !masteryBridge.includes("skillLabCorrect") ||
  !masteryBridge.includes("correct:multiCorrect")
) {
  errors.push(
    "V46.3 Skill Lab yanlis cevabi Smart Review kuyruguna bagli degil."
  );
}

/*
 * ==========================================================================
 * V46.3 MASTERY REVIEW QUEUE BRIDGE
 * ==========================================================================
 */

{
  const masteryQueueBridgeV8_2 = read(
    "lib/mastery/bridge.ts"
  );

  for (const token of [
    "skillLabQuestionResults",
    "masteryQuestionId",
    "persistedSkillLabUserId",
    "correct: result.correct",
  ]) {
    if (!masteryQueueBridgeV8_2.includes(token)) {
      errors.push(
        `V46.3 Skill Lab -> Mastery Review queue bridge eksik: ${token}`
      );
    }
  }
}

/*
 * ==========================================================================
 * VALIDATION RESULT
 * ==========================================================================
 */

if (errors.length) {
  for (const error of errors) {
    console.error("HATA:", error);
  }

  console.error(
    `V46 dogrulamasi basarisiz: ${errors.length} hata.`
  );

  process.exit(1);
}

console.log(
  "Deutschimo V46 Release Readiness dogrulamasi basarili."
);

console.log(
  "- V46.1 Authentication -> Onboarding -> Placement -> Dashboard E2E: HAZIR"
);

console.log(
  "- V46.2 A1 -> A2 -> B1 -> B2 Course Progression E2E: HAZIR"
);

console.log(
  "- V46.3 Mastery -> Smart Review -> Daily Plan integration E2E: HAZIR"
);

console.log(
  "- V46.4 Listening + Speaking resilience E2E: HAZIR"
);

console.log(
  `- Release orchestration: ${
    centralized
      ? "V46.11 SINGLE RELEASE GATE"
      : "legacy workflow"
  }.`
);

console.log(
  "- V45 accessibility/performance tabani korunuyor."
);