import fs from "node:fs";
import path from "node:path";
const root = process.cwd();
const errors = [];
const requireFile = (p) => { if (!fs.existsSync(path.join(root, p))) errors.push(`Eksik dosya: ${p}`); };
const read = (p) => fs.existsSync(path.join(root,p)) ? fs.readFileSync(path.join(root,p),"utf8") : "";
const pkg = JSON.parse(read("package.json") || "{}");
if (pkg.version !== "31.2.0") errors.push(`Surum 31.2.0 olmali: ${pkg.version}`);
if (pkg.engines?.node !== "22.x") errors.push("Node engine 22.x degil.");
if (pkg.packageManager !== "npm@10.9.2") errors.push("npm@10.9.2 sabitlenmemis.");
const scripts = ["verify:toolchain","verify:lockfile","validate:v31.2","security:release","db:data-boundaries","db:backup","db:restore","db:backup:policy","release:snapshot","release:rollback","test:e2e:v31.2","release:readiness:static","release:v31.2"];
scripts.forEach((name) => { if (!pkg.scripts?.[name]) errors.push(`Eksik npm scripti: ${name}`); });
["prebuild","quality:check","vercel-build"].forEach((name) => { if (!String(pkg.scripts?.[name] ?? "").includes("validate:v31.2")) errors.push(`${name} V31.2 kontrolunu calistirmiyor.`); });
const vercel = String(pkg.scripts?.["vercel-build"] ?? "");
for (const gate of ["verify:toolchain","verify:lockfile","security:release","db:data-boundaries","db:backup:policy","scripts/db-deploy.mjs"]) if (!vercel.includes(gate)) errors.push(`vercel-build eksik kapi: ${gate}`);
if (vercel.includes("prisma db push")) errors.push("Production akisi prisma db push kullanamaz.");
const files = [
  ".nvmrc",".node-version",".npmrc","package-lock.json","playwright.v31-2.config.ts","e2e/v31-2-release-readiness.spec.ts",
  "scripts/verify-toolchain.mjs","scripts/verify-lockfile.mjs","scripts/security-release-check.mjs","scripts/verify-data-boundaries.mjs",
  "scripts/database-backup.mjs","scripts/database-restore.mjs","scripts/database-backup-policy.mjs","scripts/release-snapshot.mjs","scripts/rollback-release.mjs",
  "lib/monitoring/error-code.ts","lib/monitoring/client-reporter.ts","components/monitoring/error-boundary.tsx","app/api/monitoring/errors/route.ts",
  "app/admin/errors/page.tsx","components/layout/admin-sidebar.tsx","app/error.tsx","app/global-error.tsx","app/providers.tsx",
  ".github/workflows/v31-2-release-readiness.yml",".github/workflows/v31-2-database-backup.yml",".github/workflows/v31-2-backup-restore-drill.yml",
  ".github/workflows/v31-2-production-release.yml",".github/workflows/v31-2-rollback.yml",
  "docs/V31_2_RELEASE_READINESS.md","docs/V31_2_ENVIRONMENT_CHECKLIST.md","docs/V31_2_BACKUP_RESTORE.md","docs/V31_2_ROLLBACK_RUNBOOK.md","docs/V31_2_BRANCH_PROTECTION.md"
];
files.forEach(requireFile);
const auth = read("app/auth/page.tsx");
for (const needle of ["AUTH-LOGIN-0042","Hata kodu:","reportClientError"]) if (!auth.includes(needle)) errors.push(`Auth hata merkezi entegrasyonu eksik: ${needle}`);
const schema = read("prisma/schema.prisma");
for (const model of ["model SystemErrorLog","model ApiFailureLog","model DatabaseBackup","isTestUser"]) if (!schema.includes(model)) errors.push(`Prisma guvenlik modeli eksik: ${model}`);
const workflow = read(".github/workflows/v31-2-release-readiness.yml");
for (const step of ["npm ci","prisma migrate deploy","npm run typecheck","npm run build","test:e2e:v31.2","security:release","db:data-boundaries"]) if (!workflow.includes(step)) errors.push(`CI eksik adim: ${step}`);
if (errors.length) { errors.forEach((x)=>console.error(`HATA: ${x}`)); console.error(`V31.2 dogrulamasi basarisiz: ${errors.length} hata.`); process.exit(1); }
console.log("V31.2 dogrulamasi basarili: toolchain, kilit dosyasi, CI, E2E, hata merkezi, rollback ve veritabani guvenligi dosyalari hazir.");
