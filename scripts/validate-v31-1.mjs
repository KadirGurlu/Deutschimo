import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const errors = [];
const warnings = [];
const read = (relative) => {
  const full = path.join(root, relative);
  if (!fs.existsSync(full)) return "";
  return fs.readFileSync(full, "utf8");
};
const requireFile = (relative) => {
  if (!fs.existsSync(path.join(root, relative))) errors.push(`Eksik dosya: ${relative}`);
};

const packagePath = path.join(root, "package.json");
if (!fs.existsSync(packagePath)) {
  console.error("package.json bulunamadi.");
  process.exit(1);
}
const pkg = JSON.parse(fs.readFileSync(packagePath, "utf8"));
const version = String(pkg.version ?? "0.0.0").split(".").map(Number);
if ((version[0] ?? 0) < 31 || ((version[0] ?? 0) === 31 && (version[1] ?? 0) < 1)) {
  errors.push(`package.json surumu 31.1.0 veya ustu olmali. Mevcut: ${pkg.version}`);
}

const requiredScripts = [
  "validate:v31.1",
  "db:environment:verify",
  "db:environment:verify:strict",
  "test:e2e:v31.1",
  "stability:report",
  "release:v31.1",
];
for (const name of requiredScripts) {
  if (!pkg.scripts?.[name]) errors.push(`Eksik npm scripti: ${name}`);
}
for (const name of ["prebuild", "quality:check", "vercel-build"]) {
  if (!String(pkg.scripts?.[name] ?? "").includes("validate:v31.1")) {
    errors.push(`${name} V31.1 dogrulamasini calistirmiyor.`);
  }
}
const vercelBuild = String(pkg.scripts?.["vercel-build"] ?? "");
if (!vercelBuild.includes("db:environment:verify")) errors.push("vercel-build veritabani ortam kontrolunu calistirmiyor.");
if (!vercelBuild.includes("scripts/db-deploy.mjs")) errors.push("vercel-build prisma migrate deploy katmanini calistirmiyor.");
if (vercelBuild.includes("prisma db push")) errors.push("Production build akisi prisma db push kullanamaz.");

const requiredFiles = [
  "app/page.tsx",
  "app/auth/page.tsx",
  "app/dashboard/page.tsx",
  "app/api/auth/[...nextauth]/route.ts",
  "app/layout.tsx",
  "app/providers.tsx",
  "app/globals.css",
  "components/layout/app-sidebar.tsx",
  "components/layout/site-header.tsx",
  "playwright.v31-1.config.ts",
  "e2e/v31-1-critical-flow.spec.ts",
  ".github/workflows/v31-1-stability.yml",
  "scripts/verify-db-environment.mjs",
  "scripts/stability-report.mjs",
  "docs/V31_1_STABILIZATION.md",
  "docs/V31_1_7_DAY_CHECKLIST.md",
  "prisma/schema.prisma",
];
requiredFiles.forEach(requireFile);

const sidebar = read("components/layout/app-sidebar.tsx");
const routes = [...sidebar.matchAll(/"(\/[a-z0-9-]+)"/g)].map((match) => match[1]);
const uniqueRoutes = [...new Set(routes)];
if (uniqueRoutes.length < 10) warnings.push(`Sidebar rota sayisi beklenenden az: ${uniqueRoutes.length}`);
for (const route of uniqueRoutes) {
  const page = path.join("app", route.slice(1), "page.tsx");
  requireFile(page);
}

const header = read("components/layout/site-header.tsx");
if (!/signOut\s*\(/.test(header)) errors.push("Site header icinde NextAuth signOut akisi bulunamadi.");
if (!/Çıkış Yap|Cikis Yap/i.test(header)) errors.push("Site header icinde Çıkış Yap kontrolu bulunamadi.");

const migrationsPath = path.join(root, "prisma", "migrations");
if (!fs.existsSync(migrationsPath)) {
  errors.push("prisma/migrations klasoru bulunamadi; migration gecmisi surum kontrolunde olmali.");
} else {
  const migrations = fs.readdirSync(migrationsPath, { withFileTypes: true }).filter((item) => item.isDirectory());
  if (!migrations.length) errors.push("prisma/migrations icinde migration bulunamadi.");
}

const workflow = read(".github/workflows/v31-1-stability.yml");
for (const required of ["prisma migrate deploy", "test:e2e:v31.1", "npm run build", "db:environment:verify"]) {
  if (!workflow.includes(required)) errors.push(`V31.1 workflow eksik adim: ${required}`);
}

if (warnings.length) {
  for (const warning of warnings) console.warn(`Uyari: ${warning}`);
}
if (errors.length) {
  for (const error of errors) console.error(`HATA: ${error}`);
  console.error(`V31.1 dogrulamasi basarisiz: ${errors.length} hata.`);
  process.exit(1);
}

console.log("V31.1 dogrulamasi basarili:");
console.log("- Ana sayfa, auth, dashboard ve sidebar rota dosyalari mevcut.");
console.log("- Kayit/giris/cikis E2E senaryosu ve Production build kapisi hazir.");
console.log("- Preview/Production veritabani ayrimi kontrolu hazir.");
console.log("- Migration gecmisi ve prisma migrate deploy akisi korunuyor.");
console.log("- 7 gunluk kritik hata stabilite kaydi hazir.");
