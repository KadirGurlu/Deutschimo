import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const root = process.cwd();
const nextDir = path.join(root, ".next");
const maxChunkGzip = 400 * 1024;
const maxTotalGzip = 4600 * 1024;

if (!fs.existsSync(nextDir)) {
  console.error("V45 performans butcesi icin .next build ciktilari bulunamadi.");
  process.exit(1);
}

function walk(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

const chunksDir = path.join(nextDir, "static", "chunks");
const chunks = walk(chunksDir).filter((file) => file.endsWith(".js"));
if (!chunks.length) {
  console.error("V45 performans butcesi: Next.js JS chunk bulunamadi.");
  process.exit(1);
}

const measured = chunks.map((file) => {
  const raw = fs.readFileSync(file);
  const gzip = zlib.gzipSync(raw, { level: 9 }).length;
  return {
    file: path.relative(root, file).replaceAll("\\", "/"),
    raw: raw.length,
    gzip,
  };
}).sort((a, b) => b.gzip - a.gzip);

const total = measured.reduce((sum, item) => sum + item.gzip, 0);
const oversized = measured.filter((item) => item.gzip > maxChunkGzip);

const kb = (bytes) => `${(bytes / 1024).toFixed(1)} KB`;

console.log("Deutschimo V45 Next.js JS performans butcesi");
console.log(`- JS chunk sayisi: ${measured.length}`);
console.log(`- Toplam gzip JS: ${kb(total)} / butce ${kb(maxTotalGzip)}`);
console.log(`- Tek chunk gzip butcesi: ${kb(maxChunkGzip)}`);
console.log("- En buyuk 12 chunk:");
for (const item of measured.slice(0, 12)) {
  console.log(`  ${kb(item.gzip).padStart(10)} gzip | ${kb(item.raw).padStart(10)} raw | ${item.file}`);
}

if (oversized.length) {
  for (const item of oversized) {
    console.error(`HATA: Tek JS chunk butceyi asti: ${item.file} (${kb(item.gzip)})`);
  }
}
if (total > maxTotalGzip) {
  console.error(`HATA: Toplam gzip JS butceyi asti: ${kb(total)}`);
}

const routeFile = path.join(root, "config", "v45-performance-routes.json");
if (fs.existsSync(routeFile)) {
  const routes = JSON.parse(fs.readFileSync(routeFile, "utf8"));
  console.log("- Vercel Speed Insights manuel rota matrisi:");
  for (const item of routes) console.log(`  ${item.name}: ${item.routeHint} [${item.priority}]`);
}

if (oversized.length || total > maxTotalGzip) process.exit(1);

console.log("V45 bundle performans butcesi: OK");
console.log("Not: Bundle butcesi Core Web Vitals yerine gecmez; LCP/INP/CLS gercek kullanici verisi Vercel Speed Insights'tan izlenmelidir.");
