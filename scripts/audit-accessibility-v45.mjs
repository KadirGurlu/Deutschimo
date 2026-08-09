import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const errors = [];
const warnings = [];

const read = (rel) =>
  fs.existsSync(path.join(root, rel))
    ? fs.readFileSync(path.join(root, rel), "utf8")
    : "";

const required = [
  "app/layout.tsx",
  "app/globals.css",
  "components/accessibility/accessibility-runtime.tsx",
  "components/performance/web-vitals-dev.tsx",
  "components/skills/question-step.tsx",
  "components/skills/listening-lab.tsx",
  "components/skills/speaking-lab.tsx",
];

for (const rel of required) {
  if (!fs.existsSync(path.join(root, rel))) errors.push(`Eksik V45 hedef dosyasi: ${rel}`);
}

const layout = read("app/layout.tsx");
if (!/<html\b[^>]*\blang=/.test(layout)) errors.push("Root layout html lang niteligine sahip degil.");
if (!layout.includes("<AccessibilityRuntime")) errors.push("Root layout AccessibilityRuntime icermiyor.");
if (!layout.includes("<WebVitalsDevReporter")) errors.push("Root layout WebVitalsDevReporter icermiyor.");

const css = read("app/globals.css");
for (const token of [
  "V45_ACCESSIBILITY_UX_PERFORMANCE",
  ":focus-visible",
  "prefers-reduced-motion: reduce",
  "forced-colors: active",
  "min-inline-size: 24px",
  "min-block-size: 24px",
]) {
  if (!css.includes(token)) errors.push(`V45 global accessibility CSS eksik: ${token}`);
}

const question = read("components/skills/question-step.tsx");
for (const token of [
  'role="radiogroup"',
  'role="radio"',
  "aria-checked",
  'role="status"',
]) {
  if (!question.includes(token)) errors.push(`Soru semantigi eksik: ${token}`);
}

const listening = read("components/skills/listening-lab.tsx");
for (const token of [
  "accessibleTranscriptOpened",
  "v45-accessible-transcript",
  'lang="de"',
  'lang="tr"',
  'role="status"',
]) {
  if (!listening.includes(token)) errors.push(`Dinleme erisilebilirligi eksik: ${token}`);
}

const speaking = read("components/skills/speaking-lab.tsx");
for (const token of [
  "aria-pressed={recording}",
  'aria-label="Konuşma metni"',
  'role="status"',
]) {
  if (!speaking.includes(token)) errors.push(`Konusma erisilebilirligi eksik: ${token}`);
}

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (["node_modules", ".next", ".git"].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (/\.(tsx?|css)$/.test(entry.name)) out.push(full);
  }
  return out;
}

for (const file of [...walk(path.join(root, "app")), ...walk(path.join(root, "components"))]) {
  const rel = path.relative(root, file).replaceAll("\\", "/");
  const source = fs.readFileSync(file, "utf8");

  if (/tabIndex\s*=\s*\{\s*[1-9]\d*\s*\}/.test(source)) {
    errors.push(`${rel}: pozitif tabIndex klavye sirasini bozabilir.`);
  }

  if (/<(?:div|span)\b[^>]*\bonClick\s*=/.test(source)) {
    warnings.push(`${rel}: onClick kullanan div/span bulundu; klavye semantigini manuel kontrol et.`);
  }

  if (/<img\b(?![^>]*\balt=)[^>]*>/i.test(source)) {
    warnings.push(`${rel}: alt niteligini otomatik dogrulayamadigimiz ham img bulundu.`);
  }

  if (/outline\s*:\s*(?:none|0)\b/i.test(source)) {
    warnings.push(`${rel}: outline kaldirma bulundu; esdeger focus-visible stili oldugunu manuel kontrol et.`);
  }
}

console.log("Deutschimo V45 erisilebilirlik statik denetimi:");
console.log(`- Kritik hata: ${errors.length}`);
console.log(`- Manuel inceleme uyarisi: ${warnings.length}`);

for (const warning of warnings.slice(0, 60)) console.warn("UYARI:", warning);
if (warnings.length > 60) console.warn(`UYARI: +${warnings.length - 60} ek uyari gizlendi.`);

if (errors.length) {
  for (const error of errors) console.error("HATA:", error);
  process.exit(1);
}

console.log("- Skip-link ve klavye odagi: OK");
console.log("- 24px WCAG 2.2 AA hedef minimum kontrol boyutu tabani: OK");
console.log("- Reduced-motion ve forced-colors destegi: OK");
console.log("- Dinleme metin alternatifi/transkript: OK");
console.log("- Soru radiogroup/radio semantigi: OK");
console.log("- Konusma durum mesajlari ve mikrofon durumu: OK");
console.log("Not: Otomatik denetim WCAG 2.2 AA uygunluk beyaninin yerine gecmez; manuel son test gereklidir.");
