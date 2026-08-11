import fs from "node:fs";
import path from "node:path";

const roots = ["app", "lib"];
const warnings = [];

function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p);
    else if (/\.(ts|tsx|js|mjs)$/.test(entry.name)) inspect(p);
  }
}

function inspect(file) {
  const text = fs.readFileSync(file, "utf8");
  const prismaCalls = [...text.matchAll(/\bprisma\.[A-Za-z0-9_]+\.(findMany|findFirst|findUnique|count|aggregate|groupBy)\b/g)];
  if (prismaCalls.length >= 4 && !/Promise\.all|\$transaction/.test(text)) {
    warnings.push(`${file}: ${prismaCalls.length} Prisma reads; review N+1/parallelization manually.`);
  }
  if (/findMany\s*\(\s*\{\s*\}\s*\)/s.test(text)) {
    warnings.push(`${file}: unbounded findMany({}) candidate.`);
  }
}

for (const root of roots) walk(root);
for (const warning of warnings.slice(0, 80)) console.warn(`! ${warning}`);
console.log(`V47 database performance audit: ${warnings.length} manual-review warning(s).`);
console.log("No automatic query rewrite was performed; stability-first policy preserved.");
