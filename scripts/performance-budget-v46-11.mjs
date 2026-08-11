import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const root = process.cwd();
const nextDir = path.join(root, ".next");
const budgetPath = path.join(root, "config", "v46-11-performance-budget.json");

if (!fs.existsSync(nextDir)) {
  console.error("V46.11 performans taraması için .next production build çıktısı bulunamadı.");
  process.exit(1);
}
if (!fs.existsSync(budgetPath)) {
  console.error("V46.11 performans bütçesi bulunamadı.");
  process.exit(1);
}

const budget = JSON.parse(fs.readFileSync(budgetPath, "utf8"));
const maxChunk = Number(budget.bundle.maxSingleChunkGzipBytes);
const maxTotal = Number(budget.bundle.maxTotalGzipBytes);

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

const chunks = walk(path.join(nextDir, "static", "chunks")).filter((file) => file.endsWith(".js"));
if (!chunks.length) {
  console.error("V46.11: Next.js production JS chunk bulunamadı.");
  process.exit(1);
}

const rows = chunks
  .map((file) => {
    const raw = fs.readFileSync(file);
    return {
      file: path.relative(root, file).replaceAll("\\", "/"),
      raw: raw.length,
      gzip: zlib.gzipSync(raw, { level: 9 }).length,
    };
  })
  .sort((a, b) => b.gzip - a.gzip);

const total = rows.reduce((sum, row) => sum + row.gzip, 0);
const oversized = rows.filter((row) => row.gzip > maxChunk);
const kb = (bytes) => `${(bytes / 1024).toFixed(1)} KB`;

console.log("Deutschimo V46.11 Production Bundle Performance Scan");
console.log(`- JS chunk count: ${rows.length}`);
console.log(`- Total gzip JS: ${kb(total)} / budget ${kb(maxTotal)}`);
console.log(`- Single chunk gzip budget: ${kb(maxChunk)}`);
console.log("- Largest 15 chunks:");
for (const row of rows.slice(0, 15)) {
  console.log(`  ${kb(row.gzip).padStart(10)} gzip | ${kb(row.raw).padStart(10)} raw | ${row.file}`);
}

for (const row of oversized) {
  console.error(`HATA: Tek JS chunk bütçeyi aştı: ${row.file} (${kb(row.gzip)})`);
}
if (total > maxTotal) {
  console.error(`HATA: Toplam gzip JS bütçeyi aştı: ${kb(total)}`);
}

const appManifest = path.join(nextDir, "app-build-manifest.json");
if (fs.existsSync(appManifest)) {
  const manifest = JSON.parse(fs.readFileSync(appManifest, "utf8"));
  const pages = Object.entries(manifest.pages || {})
    .map(([route, assets]) => ({
      route,
      jsCount: Array.isArray(assets) ? assets.filter((asset) => String(asset).endsWith(".js")).length : 0,
    }))
    .sort((a, b) => b.jsCount - a.jsCount)
    .slice(0, 15);
  console.log("- App route JS file-count diagnostics:");
  for (const item of pages) console.log(`  ${String(item.jsCount).padStart(2)} JS | ${item.route}`);
}

if (oversized.length || total > maxTotal) process.exit(1);
console.log("✓ V46.11 production bundle budget: PASSED");
