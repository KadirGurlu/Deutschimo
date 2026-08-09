import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const errors = [];
const notes = [];

const exists = (rel) => fs.existsSync(path.join(root, rel));
const read = (rel) => exists(rel) ? fs.readFileSync(path.join(root, rel), "utf8") : "";

function requireFile(rel) {
  if (!exists(rel)) errors.push(`Eksik V39.1 dosyasi: ${rel}`);
}

for (const rel of [
  ".github/workflows/v39-1-technical-health.yml",
  ".github/dependabot.yml",
  ".gitattributes",
  "scripts/validate-v39-1.mjs",
  "docs/V39_1_TECHNICAL_HARDENING.md",
]) requireFile(rel);

const pkg = JSON.parse(read("package.json") || "{}");
if (pkg.version !== "39.1.0") {
  errors.push(`package.json surumu 39.1.0 olmali. Mevcut: ${pkg.version}`);
}

if (!pkg.scripts?.["validate:v39.1"]) {
  errors.push("validate:v39.1 npm scripti eksik.");
}
if (!pkg.scripts?.["technical:health"]) {
  errors.push("technical:health npm scripti eksik.");
}
if (!pkg.scripts?.["release:v39.1"]) {
  errors.push("release:v39.1 npm scripti eksik.");
}

for (const scriptName of ["prebuild", "quality:check", "vercel-build"]) {
  const value = String(pkg.scripts?.[scriptName] ?? "");
  if (!value.includes("validate:v39")) {
    errors.push(`${scriptName}: V39 kalite kapisi kaybolmus.`);
  }
  if (!value.includes("validate:v39.1")) {
    errors.push(`${scriptName}: V39.1 teknik kalite kapisi eksik.`);
  }
}

if (exists("package-lock.json")) {
  const lock = JSON.parse(read("package-lock.json") || "{}");
  if (lock.version !== "39.1.0") {
    errors.push(`package-lock.json ust surumu 39.1.0 olmali. Mevcut: ${lock.version}`);
  }
  if (lock.packages?.[""]?.version !== "39.1.0") {
    errors.push(`package-lock kok paket surumu 39.1.0 olmali. Mevcut: ${lock.packages?.[""]?.version}`);
  }
} else {
  errors.push("package-lock.json eksik.");
}

const workflowDir = path.join(root, ".github", "workflows");
if (fs.existsSync(workflowDir)) {
  const files = fs.readdirSync(workflowDir).filter((name) => /\.ya?ml$/i.test(name));
  for (const name of files) {
    const body = fs.readFileSync(path.join(workflowDir, name), "utf8");
    if (/actions\/checkout@v[1-5]\b/.test(body)) {
      errors.push(`${name}: eski actions/checkout runtime'i kalmis.`);
    }
    if (/actions\/setup-node@v[1-6]\b/.test(body)) {
      errors.push(`${name}: eski actions/setup-node runtime'i kalmis.`);
    }
  }
  notes.push(`${files.length} workflow dosyasi action runtime acisindan tarandi.`);
}

const health = read(".github/workflows/v39-1-technical-health.yml");
for (const token of [
  "branches: [v39-1-staging]",
  "concurrency:",
  "cancel-in-progress: true",
  "postgres:16",
  "DATABASE_ENVIRONMENT: test",
  "actions/checkout@v6",
  "actions/setup-node@v7",
  "npm ci --no-audit --no-fund",
  "npm run verify:toolchain",
  "npm run verify:lockfile",
  "npm run validate:env",
  "npm run validate:v39",
  "npm run validate:v39.1",
  "npm run db:baseline:init",
  "npm run db:deploy",
  "npm run db:drift:check",
  "npm run security:release",
  "npm run db:data-boundaries",
  "npm run lint",
  "npm run typecheck",
  "npm run build",
]) {
  if (!health.includes(token)) {
    errors.push(`V39.1 technical health workflow eksik: ${token}`);
  }
}

const dependabot = read(".github/dependabot.yml");
for (const token of [
  'package-ecosystem: "npm"',
  'package-ecosystem: "github-actions"',
  'interval: "monthly"',
]) {
  if (!dependabot.includes(token)) errors.push(`Dependabot V39.1 ayari eksik: ${token}`);
}

const attrs = read(".gitattributes");
for (const token of [
  "*.yml text eol=lf",
  "*.yaml text eol=lf",
  "*.mjs text eol=lf",
  "*.ts text eol=lf",
  "*.tsx text eol=lf",
  "*.json text eol=lf",
  "*.prisma text eol=lf",
  "*.sql text eol=lf",
  "*.ps1 text eol=crlf",
  "*.bat text eol=crlf",
]) {
  if (!attrs.includes(token)) errors.push(`.gitattributes eksik: ${token}`);
}

const gitignore = read(".gitignore");
if (!gitignore.includes(".github/workflows/_local-backups/")) {
  errors.push(".gitignore CI hotfix yerel backup klasorunu dislamiyor.");
}

const v39Validator = read("scripts/validate-v39.mjs");
if (!v39Validator.includes("V39 Dinleme Laboratuvari dogrulamasi basarili")) {
  errors.push("V39 Dinleme Laboratuvari validatoru korunmuyor.");
}

const v28Validator = read("scripts/validate-v28.mjs");
if (!v28Validator.includes('productionBuildNeeds.includes("quality")') ||
    !v28Validator.includes('productionBuildNeeds.includes("e2e")')) {
  errors.push("V28 modern CI gate compatibility hotfix korunmuyor.");
}

if (errors.length) {
  for (const error of errors) console.error(`HATA: ${error}`);
  console.error(`V39.1 teknik dogrulama basarisiz: ${errors.length} hata.`);
  process.exit(1);
}

console.log("V39.1 Teknik Saglik dogrulamasi basarili:");
console.log("- package.json ve package-lock.json 39.1.0 ile senkron.");
console.log("- GitHub Actions Node 20 runtime uyarisi uretecek eski checkout/setup-node majorlari temizlendi.");
console.log("- V39.1 staging workflow'u izole PostgreSQL, toolchain, lockfile, migration, security, lint, typecheck ve production build kapilarini calistiriyor.");
console.log("- Dependabot npm + GitHub Actions guncellemelerini aylik takip edecek.");
console.log("- LF/CRLF politikasi .gitattributes ile repository seviyesinde tanimlandi.");
console.log("- V28 modern CI compatibility ve V39 Dinleme Laboratuvari korunuyor.");
for (const note of notes) console.log(`- ${note}`);
