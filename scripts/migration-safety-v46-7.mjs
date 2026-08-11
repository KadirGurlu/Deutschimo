import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const migration = path.join(root, "prisma", "migrations", "20260811123000_v46_7_database_integrity", "migration.sql");
const packagePath = path.join(root, "package.json");
let failed = false;

function fail(message) { failed = true; console.error(`✗ ${message}`); }
function ok(message) { console.log(`✓ ${message}`); }

if (!fs.existsSync(migration)) fail("V46.7 migration.sql bulunamadı.");
else {
  const raw = fs.readFileSync(migration, "utf8");
  const sql = raw.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/--.*$/gm, " ").toUpperCase();
  const destructive = [
    /\bDROP\s+TABLE\b/,
    /\bDROP\s+COLUMN\b/,
    /\bTRUNCATE\b/,
    /\bDELETE\s+FROM\b/,
    /\bUPDATE\s+[^\s]+\s+SET\b/,
    /\bALTER\s+TABLE[\s\S]*?DROP\s+CONSTRAINT\b/,
  ];
  const hits = destructive.filter((pattern) => pattern.test(sql));
  if (hits.length) fail(`Destructive SQL tespit edildi (${hits.length} kural).`);
  else ok("Destructive migration: YOK (DROP/TRUNCATE/DELETE/UPDATE yok).");

  const required = ["FOREIGN KEY", "NOT VALID", "VALIDATE CONSTRAINT", "ON DELETE CASCADE", "ON DELETE RESTRICT"];
  for (const token of required) {
    if (!sql.includes(token)) fail(`Migration güvenlik işareti eksik: ${token}`);
  }
}

if (fs.existsSync(packagePath)) {
  const pkg = JSON.parse(fs.readFileSync(packagePath, "utf8"));
  const vercel = String(pkg.scripts?.["vercel-build"] || "").toLowerCase();
  if (vercel.includes("migrate reset") || vercel.includes("db push")) fail("vercel-build içinde destructive/reset/db push komutu bulundu.");
  else ok("Production build zincirinde migrate reset / db push yok.");
}

if (failed) process.exit(1);
console.log("V46.7 MIGRATION SAFETY PASSED.");
