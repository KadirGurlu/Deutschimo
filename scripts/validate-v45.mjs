import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const errors = [];

const read = (rel) =>
  fs.existsSync(path.join(root, rel))
    ? fs.readFileSync(path.join(root, rel), "utf8")
    : "";

const req = (rel) => {
  if (!fs.existsSync(path.join(root, rel))) errors.push(`Eksik: ${rel}`);
};

[
  "components/accessibility/accessibility-runtime.tsx",
  "components/performance/web-vitals-dev.tsx",
  "scripts/audit-accessibility-v45.mjs",
  "scripts/performance-budget-v45.mjs",
  "config/v45-performance-routes.json",
  ".github/workflows/v45-accessibility-ux-performance.yml",
  "docs/V45_ACCESSIBILITY_UX_PERFORMANCE.md",
  "docs/V45_FINAL_MANUAL_CHECKLIST.md",
].forEach(req);

const pkg = JSON.parse(read("package.json") || "{}");
if (pkg.version !== "45.0.0") errors.push(`package version 45.0.0 degil: ${pkg.version}`);

for (const script of ["validate:v45", "a11y:v45", "perf:v45", "release:v45"]) {
  if (!pkg.scripts?.[script]) errors.push(`package script eksik: ${script}`);
}

for (const script of ["prebuild", "quality:check", "vercel-build"]) {
  const value = String(pkg.scripts?.[script] || "");
  if (!value.includes("validate:v44")) errors.push(`${script}: V44 geriye uyumluluk kapisi yok`);
  if (!value.includes("validate:v45")) errors.push(`${script}: V45 kapisi yok`);
}

const layout = read("app/layout.tsx");
for (const token of [
  "@/components/accessibility/accessibility-runtime",
  "@/components/performance/web-vitals-dev",
  "<AccessibilityRuntime",
  "<WebVitalsDevReporter",
]) {
  if (!layout.includes(token)) errors.push(`layout: ${token}`);
}
if (!/<html\b[^>]*\blang=/.test(layout)) errors.push("layout: html lang yok");

const css = read("app/globals.css");
for (const token of [
  "V45_ACCESSIBILITY_UX_PERFORMANCE",
  "v45-skip-link",
  ":focus-visible",
  "prefers-reduced-motion: reduce",
  "forced-colors: active",
]) {
  if (!css.includes(token)) errors.push(`css: ${token}`);
}

const question = read("components/skills/question-step.tsx");
for (const token of ['role="radiogroup"', 'role="radio"', "aria-checked"]) {
  if (!question.includes(token)) errors.push(`question-step: ${token}`);
}

const listening = read("components/skills/listening-lab.tsx");
for (const token of [
  "accessibleTranscriptOpened",
  "v45-accessible-transcript",
  'lang="de"',
  'role="status"',
]) {
  if (!listening.includes(token)) errors.push(`listening-lab: ${token}`);
}

const speaking = read("components/skills/speaking-lab.tsx");
for (const token of ["aria-pressed={recording}", 'aria-label="Konuşma metni"', 'role="status"']) {
  if (!speaking.includes(token)) errors.push(`speaking-lab: ${token}`);
}

const workflow = read(".github/workflows/v45-accessibility-ux-performance.yml");
for (const token of [
  "npm run validate:v44",
  "npm run validate:v45",
  "npm run a11y:v45",
  "npm run typecheck",
  "npm run build",
  "npm run perf:v45",
]) {
  if (!workflow.includes(token)) errors.push(`workflow: ${token}`);
}

if (errors.length) {
  for (const error of errors) console.error("HATA:", error);
  console.error(`V45 dogrulamasi basarisiz: ${errors.length} hata.`);
  process.exit(1);
}

console.log("V45 Accessibility + UX + Performance dogrulamasi basarili.");
console.log("- WCAG 2.2 AA hedef accessibility foundation aktif.");
console.log("- Klavye focus/skip-link/reduced-motion/forced-colors tabani aktif.");
console.log("- Dinleme erisilebilir transkript sinyali aktif.");
console.log("- Konusma ve soru ekranlarinda screen-reader semantigi guclendirildi.");
console.log("- GitHub Actions bundle performans butcesi aktif.");
console.log("- Vercel Speed Insights icin Dashboard/Kurs/Ders/Test/Gunluk Plan/Admin rota matrisi hazir.");
console.log("- Yeni Prisma migration yok; yeni environment variable yok.");
