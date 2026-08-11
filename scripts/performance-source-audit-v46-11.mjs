import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const warnings = [];
const errors = [];

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (["node_modules", ".next", ".git", "PATCH_ROOT"].includes(entry.name)) return [];
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

const sourceFiles = [
  ...walk(path.join(root, "app")),
  ...walk(path.join(root, "components")),
  ...walk(path.join(root, "lib")),
].filter((file) => /\.(ts|tsx|js|jsx)$/.test(file));

let clientComponents = 0;
let rawImages = 0;
let dynamicImports = 0;
let fetchCalls = 0;
let prismaCalls = 0;
let hydrationSuppressions = 0;
const heavyImports = new Map();

for (const file of sourceFiles) {
  const rel = path.relative(root, file).replaceAll("\\", "/");
  const source = fs.readFileSync(file, "utf8");

  if (/^\s*["']use client["'];?/m.test(source)) clientComponents += 1;
  rawImages += (source.match(/<img\b/gi) || []).length;
  dynamicImports += (source.match(/\bimport\s*\(/g) || []).length;
  fetchCalls += (source.match(/\bfetch\s*\(/g) || []).length;
  prismaCalls += (source.match(/\bprisma\.[A-Za-z0-9_]+\.(?:find|count|aggregate|groupBy|create|update|delete|upsert)/g) || []).length;
  hydrationSuppressions += (source.match(/\bsuppressHydrationWarning\b/g) || []).length;

  for (const dep of ["recharts", "react-transition-group", "lucide-react", "@vercel/blob"]) {
    if (source.includes(`from "${dep}"`) || source.includes(`from '${dep}'`)) {
      heavyImports.set(dep, (heavyImports.get(dep) || 0) + 1);
    }
  }

  const sequentialPrisma = [...source.matchAll(/await\s+prisma\.[\s\S]{0,220}?\n[\s\S]{0,80}?await\s+prisma\./g)];
  if (sequentialPrisma.length) {
    warnings.push(`${rel}: ardışık Prisma çağrısı bulundu; N+1/parallelization ihtiyacını manuel kontrol et.`);
  }

  const repeatedFetch = (source.match(/\bfetch\s*\(/g) || []).length;
  if (repeatedFetch >= 4) {
    warnings.push(`${rel}: ${repeatedFetch} fetch çağrısı var; duplicate API request ihtimalini manuel kontrol et.`);
  }
}

const publicDir = path.join(root, "public");
const largeAssetLimit = 1572864;
const largeAssets = walk(publicDir)
  .filter((file) => fs.statSync(file).size > largeAssetLimit)
  .map((file) => ({
    rel: path.relative(root, file).replaceAll("\\", "/"),
    bytes: fs.statSync(file).size,
  }));

for (const item of largeAssets) {
  warnings.push(`${item.rel}: ${(item.bytes / 1024 / 1024).toFixed(2)} MB; görsel/asset optimizasyonunu kontrol et.`);
}

const nextConfig = fs.readFileSync(path.join(root, "next.config.ts"), "utf8");
for (const packageName of ["lucide-react", "recharts"]) {
  if (!nextConfig.includes(packageName)) {
    errors.push(`next.config.ts optimizePackageImports içinde ${packageName} korunmuyor.`);
  }
}

const vitals = fs.readFileSync(path.join(root, "components/performance/web-vitals-dev.tsx"), "utf8");
for (const token of ["useReportWebVitals", "LCP", "INP", "CLS", "TTFB", "/api/monitoring/web-vitals"]) {
  if (!vitals.includes(token)) errors.push(`Web Vitals reporter eksik: ${token}`);
}

console.log("Deutschimo V46.11 Performance Source Audit");
console.log(`- Client component count: ${clientComponents}`);
console.log(`- Raw <img> occurrences: ${rawImages}`);
console.log(`- dynamic import() occurrences: ${dynamicImports}`);
console.log(`- fetch() occurrences: ${fetchCalls}`);
console.log(`- Prisma query/write call occurrences: ${prismaCalls}`);
console.log(`- suppressHydrationWarning occurrences: ${hydrationSuppressions}`);
console.log("- Large dependency import footprint:");
for (const [dep, count] of [...heavyImports.entries()].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${dep}: ${count} source file`);
}

if (warnings.length) {
  console.log(`- Manual performance review warnings: ${warnings.length}`);
  for (const warning of warnings.slice(0, 60)) console.warn(`UYARI: ${warning}`);
  if (warnings.length > 60) console.warn(`UYARI: +${warnings.length - 60} ek uyarı gizlendi.`);
}

if (errors.length) {
  for (const error of errors) console.error(`HATA: ${error}`);
  process.exit(1);
}

console.log("✓ Stability-first source performance audit: PASSED");
console.log("Not: Uyarılar otomatik yeniden yazma yapmaz; stability → correctness → accessibility → performance önceliği korunur.");
