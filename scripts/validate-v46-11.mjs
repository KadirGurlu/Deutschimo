import fs from "node:fs";

const errors = [];
const need = (file) => {
  if (!fs.existsSync(file)) errors.push(`Eksik V46.11 dosyası: ${file}`);
};
const read = (file) => (fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "");

[
  "config/v46-11-performance-budget.json",
  "scripts/performance-budget-v46-11.mjs",
  "scripts/performance-source-audit-v46-11.mjs",
  "scripts/release-gate-v46-11.mjs",
  "scripts/release-gate-safety-v46-11.mjs",
  "scripts/observability-audit-v46-11.mjs",
  "scripts/regression-contracts-v46-11.mjs",
  "scripts/integration-v46-11.mjs",
  "scripts/cleanup-test-data-v46-11.mjs",
  "tests/v46-11/release-gate-utils.test.mjs",
  "playwright.v46-11.config.ts",
  "e2e/v46-11-critical-release.spec.ts",
  "e2e/v46-11-performance.spec.ts",
  "app/api/monitoring/web-vitals/route.ts",
  ".github/workflows/v46-release-readiness.yml",
  "docs/V46_11_RELEASE_GATE.md",
].forEach(need);

const pkg = JSON.parse(read("package.json") || "{}");
for (const script of [
  "validate:v46.11",
  "perf:v46.11",
  "test:unit:v46.11",
  "test:integration:v46.11",
  "cleanup:test:v46.11",
  "test:e2e:v46.11",
  "observability:v46.11",
  "regression:v46.11",
  "release:safety:v46.11",
  "release:gate",
  "release:v46.11",
  "validate:v46.5",
]) {
  if (!pkg.scripts?.[script]) errors.push(`package.json script eksik: ${script}`);
}

const prebuild = String(pkg.scripts?.prebuild || "");
if (!prebuild.includes("validate:v46.11")) errors.push("prebuild V46.11 validator kapısını içermiyor.");

const vercel = String(pkg.scripts?.["vercel-build"] || "");
for (const token of ["validate:v46.11", "perf:v46.11"]) {
  if (!vercel.includes(token)) errors.push(`vercel-build performans/release kapısı eksik: ${token}`);
}

const gate = read("scripts/release-gate-v46-11.mjs");
if (!gate.includes("test:migration:v46.7")) errors.push("Central release gate V45/V46 -> V46.7 migration data-preservation testini çalıştırmıyor.");
for (const token of [
  "V46 RELEASE GATE: PASSED",
  "V46 RELEASE GATE: FAILED",
  "TypeScript",
  "Lint",
  "Production Build",
  "Unit Tests",
  "Integration Tests",
  "Database Validation",
  "Migration Validation",
  "Test Data Cleanup",
  "Final Database Validation",
  "Security/Auth Checks",
  "Accessibility Checks",
  "Critical E2E Tests",
  "Performance / Core Web Vitals",
]) {
  if (!gate.includes(token)) errors.push(`Central release gate çıktı/safha sözleşmesi eksik: ${token}`);
}

const workflow = read(".github/workflows/v46-release-readiness.yml");
for (const token of [
  "postgres:16",
  "DATABASE_ENVIRONMENT: test",
  "RELEASE_GATE_ALLOW_ISOLATED_DB",
  "npm run release:gate",
  "actions/checkout@v6",
  "actions/setup-node@v7",
]) {
  if (!workflow.includes(token)) errors.push(`Central workflow eksik: ${token}`);
}
if (/DATABASE_URL:\s*\$\{\{\s*secrets\./.test(workflow)) {
  errors.push("Central release gate production/preview secret DB kullanmamalı.");
}

const vitals = read("components/performance/web-vitals-dev.tsx");
for (const metric of ["LCP", "INP", "CLS", "TTFB"]) {
  if (!vitals.includes(metric)) errors.push(`Production Web Vitals reporter eksik: ${metric}`);
}

const budget = JSON.parse(read("config/v46-11-performance-budget.json") || "{}");
const vitalsBudget = budget.coreWebVitals || {};
const expected = {
  LCP: [2500, 4000],
  INP: [200, 500],
  CLS: [0.1, 0.25],
  TTFB: [800, 1800],
};
for (const [name, [good, poor]] of Object.entries(expected)) {
  if (vitalsBudget?.[name]?.good !== good || vitalsBudget?.[name]?.poor !== poor) {
    errors.push(`${name} performance threshold beklenen V46.11 değeriyle eşleşmiyor.`);
  }
}

if (errors.length) {
  for (const error of errors) console.error(`HATA: ${error}`);
  console.error(`V46.11 validation FAILED: ${errors.length} error.`);
  process.exit(1);
}

console.log("Deutschimo V46.11 Performance / Core Web Vitals / Single Release Gate validation PASSED.");
console.log("✓ LCP / INP / CLS / TTFB thresholds configured.");
console.log("✓ Stability-first bundle/source audit configured.");
console.log("✓ Single npm run release:gate command configured.");
console.log("✓ Isolated test DB safety guard configured.");
console.log("✓ 7 critical scenario coverage maps to V46 + V46.11 Playwright suites.");
console.log("✓ Observability redaction contract configured.");
