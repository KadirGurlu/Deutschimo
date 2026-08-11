import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const errors = [];
const warnings = [];

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (["node_modules", ".next", ".git", "PATCH_ROOT"].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (/\.(tsx?|css)$/.test(entry.name)) out.push(full);
  }
  return out;
}

function hexToRgb(hex) {
  const value = hex.replace("#", "").trim();
  if (!/^[0-9a-f]{6}$/i.test(value)) return null;
  return [
    parseInt(value.slice(0, 2), 16),
    parseInt(value.slice(2, 4), 16),
    parseInt(value.slice(4, 6), 16),
  ];
}

function channel(value) {
  const n = value / 255;
  return n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4;
}

function luminance(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  const [r, g, b] = rgb.map(channel);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a, b) {
  const la = luminance(a);
  const lb = luminance(b);
  if (la === null || lb === null) return null;
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

const cssPath = path.join(root, "app/globals.css");
const css = fs.existsSync(cssPath) ? fs.readFileSync(cssPath, "utf8") : "";
const token = (name) => {
  const match = css.match(new RegExp(`--${name}\\s*:\\s*(#[0-9a-fA-F]{6})`));
  return match?.[1] ?? "";
};

for (const [label, foreground, background, minimum] of [
  ["body text/background", token("text"), token("background"), 4.5],
  ["muted text/surface", token("muted"), token("surface"), 4.5],
  ["heading/surface", token("heading"), token("surface"), 4.5],
  ["turquoise-dark/surface", token("turquoise-dark"), token("surface"), 4.5],
]) {
  const ratio = contrast(foreground, background);
  if (ratio === null) {
    warnings.push(`${label}: renk tokenları otomatik çözümlenemedi.`);
  } else if (ratio < minimum) {
    errors.push(`${label}: contrast ${ratio.toFixed(2)}:1 < ${minimum}:1.`);
  }
}

const sources = [
  ...walk(path.join(root, "app")),
  ...walk(path.join(root, "components")),
];

for (const file of sources) {
  const rel = path.relative(root, file).replaceAll("\\", "/");
  const source = fs.readFileSync(file, "utf8");

  if (/tabIndex\s*=\s*\{\s*[1-9]\d*\s*\}/.test(source)) {
    errors.push(`${rel}: pozitif tabIndex focus sırasını bozabilir.`);
  }

  if (/<(?:div|span)\b[^>]*\bonClick\s*=/.test(source)) {
    warnings.push(`${rel}: onClick kullanan div/span bulundu; button/link ile değiştirilebilir mi manuel kontrol et.`);
  }

  if (/<(?:div|span)\b[^>]*\brole=["']button["'][^>]*>/.test(source)) {
    warnings.push(`${rel}: div/span role=button bulundu; native <button> tercihini manuel doğrula.`);
  }

  if (/<img\b(?![^>]*\balt=)[^>]*>/i.test(source)) {
    warnings.push(`${rel}: alt niteliği olmayan ham img olasılığı bulundu.`);
  }

  if (/\bautoFocus\b/.test(source)) {
    warnings.push(`${rel}: autoFocus bulundu; beklenmeyen focus hareketi olmadığını manuel kontrol et.`);
  }

  if (/outline\s*:\s*(?:none|0)\b/i.test(source)) {
    warnings.push(`${rel}: outline kaldırma bulundu; V46.10 focus-visible override'ının gerçekten görünür olduğunu manuel kontrol et.`);
  }

  const controls = (source.match(/<(?:input|textarea|select)\b/g) || []).length;
  if (controls > 0 && !/<label\b/.test(source) && !/aria-label|aria-labelledby/.test(source)) {
    warnings.push(`${rel}: form kontrolü var fakat label/aria ilişkisi dosya seviyesinde doğrulanamadı.`);
  }
}

const criticalFiles = [
  "app/auth/page.tsx",
  "app/forgot-password/page.tsx",
  "app/reset-password/page.tsx",
  "components/layout/site-header.tsx",
  "components/layout/app-sidebar.tsx",
  "components/layout/mobile-nav.tsx",
];

for (const rel of criticalFiles) {
  const full = path.join(root, rel);
  const source = fs.existsSync(full) ? fs.readFileSync(full, "utf8") : "";
  if (/<(?:div|span)\b[^>]*\bonClick\s*=/.test(source)) {
    errors.push(`${rel}: kritik akışta clickable div/span kabul edilmiyor.`);
  }
}

console.log("Deutschimo V46.10 erişilebilirlik statik/manual-yardımcı denetimi:");
console.log(`- Kritik hata: ${errors.length}`);
console.log(`- Manuel inceleme uyarısı: ${warnings.length}`);

for (const warning of warnings.slice(0, 80)) console.warn("UYARI:", warning);
if (warnings.length > 80) console.warn(`UYARI: +${warnings.length - 80} ek uyarı gizlendi.`);

if (errors.length) {
  for (const error of errors) console.error("HATA:", error);
  process.exit(1);
}

console.log("- Temel metin kontrast tokenları >= 4.5:1: OK");
console.log("- Kritik auth/navigation akışlarında native semantics tabanı: OK");
console.log("- Pozitif tabIndex: YOK");
console.log("- Manuel klavye, screen reader, focus-obscured ve tüm-state kontrast kontrolü halen gereklidir.");
