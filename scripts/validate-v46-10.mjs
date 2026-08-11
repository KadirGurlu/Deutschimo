import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const errors = [];

function read(rel) {
  const full = path.join(root, rel);
  if (!fs.existsSync(full)) {
    errors.push(`Eksik dosya: ${rel}`);
    return "";
  }
  return fs.readFileSync(full, "utf8");
}

function requireText(label, source, tokens) {
  for (const token of tokens) {
    if (!source.includes(token)) errors.push(`${label}: eksik -> ${token}`);
  }
}

const layout = read("app/layout.tsx");
const runtime = read("components/accessibility/accessibility-runtime.tsx");
const sidebar = read("components/layout/app-sidebar.tsx");
const mobile = read("components/layout/mobile-nav.tsx");
const header = read("components/layout/site-header.tsx");
const auth = read("app/auth/page.tsx");
const forgot = read("app/forgot-password/page.tsx");
const reset = read("app/reset-password/page.tsx");
const css = read("app/globals.css");
const manual = read("docs/V46_10_MANUAL_WCAG_CHECKLIST.md");
const e2e = read("e2e/v46-10-public-accessibility.spec.ts");
const workflow = read(".github/workflows/v46-10-accessibility.yml");
const pkg = JSON.parse(read("package.json") || "{}");

requireText("Root main semantics", layout, [
  'id="main-content"',
  "tabIndex={-1}",
  '<html lang="tr">',
]);

requireText("Route announcer", runtime, [
  'role="status"',
  'aria-live="polite"',
  'aria-atomic="true"',
  "data-v46-10-route-announcer",
]);

requireText("Sidebar current page", sidebar, ["aria-current={current ? \"page\" : undefined}"]);
requireText("Mobile current page", mobile, ["usePathname", "aria-current={current ? \"page\" : undefined}"]);
requireText("Mobile menu keyboard semantics", header, [
  'aria-controls="mobile-account-menu"',
  'aria-expanded={open}',
  'event.key !== "Escape"',
  'id="mobile-account-menu"',
]);

requireText("Auth form semantics", auth, [
  'role="group"',
  'aria-pressed={mode === "register"}',
  'aria-pressed={mode === "login"}',
  'role="alert"',
  'aria-live="assertive"',
  'role="status"',
  'aria-live="polite"',
  "aria-busy={loading || googleLoading}",
]);

requireText("Forgot password form", forgot, [
  'htmlFor="forgot-email"',
  'autoComplete="email"',
  'role="status"',
  'aria-live="polite"',
]);

requireText("Reset password form", reset, [
  'htmlFor="reset-password"',
  'autoComplete="new-password"',
  'aria-describedby="reset-password-help"',
  'role="alert"',
  'role="status"',
]);

requireText("V46.10 CSS", css, [
  "V46_10_MANUAL_ACCESSIBILITY_PASS",
  "--turquoise-dark: #087B85",
  "input:focus-visible",
  "prefers-reduced-motion: reduce",
  "scroll-padding-block-start",
]);

requireText("Manual WCAG checklist", manual, [
  "Keyboard",
  "Focus",
  "Forms",
  "Screen Reader",
  "Contrast",
  "Semantic HTML",
  "Motion",
  "MANUAL PASS REQUIRED",
]);

requireText("Public accessibility E2E", e2e, [
  "keyboard",
  "accessible name",
  "reduced motion",
]);

requireText("V46.10 CI", workflow, [
  "validate:v46.10",
  "a11y:v46.10",
  "test:e2e:v46.10",
  "actions/checkout@v6",
  "actions/setup-node@v7",
]);

const scripts = pkg.scripts || {};
for (const key of [
  "validate:v46.10",
  "a11y:v46.10",
  "test:e2e:v46.10",
  "test:e2e:v46.10:headed",
  "release:v46.10",
]) {
  if (!scripts[key]) errors.push(`package.json script eksik: ${key}`);
}

if (!String(scripts.prebuild || "").includes("validate:v46.10")) {
  errors.push("prebuild V46.10 validator kapisini icermiyor.");
}
if (!String(scripts["vercel-build"] || "").includes("validate:v46.10")) {
  errors.push("vercel-build V46.10 validator kapisini icermiyor.");
}

if (errors.length) {
  console.error("V46.10 WCAG manual accessibility pass doğrulaması başarısız:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("V46.10 WCAG Manual Accessibility Pass yapısal doğrulaması başarılı.");
console.log("- Keyboard/focus tabanı ve mobil menü Escape davranışı hazır.");
console.log("- Form label/description ve live-region semantiği güçlendirildi.");
console.log("- Aktif navigasyon aria-current ile işaretleniyor.");
console.log("- Kontrast tokenı AA metin tabanı için koyulaştırıldı.");
console.log("- Reduced-motion ve semantic HTML denetimleri release kapısında.");
console.log("- Not: WCAG uygunluk beyanı için MANUEL PASS halen zorunludur.");
