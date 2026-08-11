import { spawnSync } from "node:child_process";

const steps = [
  ["Production Safety", "npm run release:safety:v46.11"],
  ["Toolchain / Lockfile", "npm run verify:toolchain && npm run verify:lockfile"],
  ["V45 Regression Baseline", "npm run validate:v44 && npm run validate:v45 && npm run a11y:v45 && npm run regression:v46.11"],
  ["V46 Validation", "npm run validate:v46 && npm run audit:v46 && npm run validate:v46.5 && npm run validate:v46.7 && npm run validate:v46.10 && npm run validate:v46.11"],
  ["Security/Auth Checks", "npm run security:release && npm run db:data-boundaries"],
  ["Migration Validation", "npm run db:migration:safety:v46.7 && npm run test:migration:v46.7"],
  ["Database Setup", "npm run db:baseline:init && npm run db:deploy && npm run db:deploy && npm run db:migrate:status && npm run db:drift:check"],
  ["Database Validation", "npm run db:integrity:assert && npm run db:readiness:v46"],
  ["Lint", "npm run lint"],
  ["TypeScript", "npm run typecheck"],
  ["Unit Tests", "npm run test:unit:v46.11"],
  ["Integration Tests", "npm run test:integration:v46.11"],
  ["Production Build", "npm run build"],
  ["Performance / Core Web Vitals", "npm run perf:v45 && npm run perf:v46.11"],
  ["Accessibility Checks", "npm run a11y:v46.10 && npm run test:e2e:v46.10"],
  ["Critical E2E Tests", "npm run test:e2e:v46 && npm run test:e2e:v46.11"],
  ["Test Data Cleanup", "npm run cleanup:test:v46.11"],
  ["Final Database Validation", "npm run db:integrity:assert && npm run db:readiness:v46"],
  ["Observability", "npm run observability:v46.11"],
];

const passed = [];
let failed = null;

console.log("============================================================");
console.log(" Deutschimo V46.11 — SINGLE RELEASE GATE");
console.log(" stability → correctness → accessibility → performance");
console.log("============================================================");

for (const [name, command] of steps) {
  console.log(`\n[RUN] ${name}`);
  const result = spawnSync(command, {
    shell: true,
    stdio: "inherit",
    env: process.env,
  });

  if (result.status !== 0) {
    failed = name;
    console.error(`✗ ${name}`);
    break;
  }

  passed.push(name);
  console.log(`✓ ${name}`);
}

console.log("\n============================================================");
console.log(" RELEASE GATE SUMMARY");
console.log("============================================================");
for (const name of passed) console.log(`✓ ${name}`);
if (failed) console.log(`✗ ${failed}`);

if (failed) {
  console.error("\nV46 RELEASE GATE: FAILED");
  console.error(`Failed control: ${failed}`);
  process.exit(1);
}

console.log("\nCritical scenario coverage:");
console.log("✓ Auth E2E — Register → Login → Onboarding → Level Test → Dashboard");
console.log("✓ Course Progression — Course → Unit → Lesson/Exercise → Progress");
console.log("✓ Mastery Engine — Wrong Answer → Mastery → Smart Review → Daily Plan");
console.log("✓ Content Publishing — Admin create/publish → Student content visibility");
console.log("✓ Authorization — Student /admin + direct admin API denied");
console.log("✓ Persistence — completion survives logout/login/second device");
console.log("✓ Failure Recovery — API failure → friendly feedback → successful retry");
console.log("✓ Database Integrity");
console.log("✓ Accessibility");
console.log("✓ Production Build");
console.log("✓ Performance / Core Web Vitals lab guard");
console.log("\nV46 RELEASE GATE: PASSED");
