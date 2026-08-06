import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
const errors = [], warnings = [];
const root = process.cwd();
const pkg = JSON.parse(fs.readFileSync("package.json","utf8"));
const vercel = String(pkg.scripts?.["vercel-build"] ?? "");
if (vercel.includes("prisma db push")) errors.push("vercel-build icinde prisma db push yasaktir.");
const forbiddenNames = [/\.pem$/i,/\.key$/i,/id_rsa/i,/service-account/i];
const isSensitiveEnv = (name) => /^\.env(?:\..+)?$/i.test(name) && !/^\.env\.(example|sample|template)$/i.test(name);
let tracked = [];
try { tracked = execFileSync("git", ["ls-files"], { encoding:"utf8" }).split(/\r?\n/).filter(Boolean); }
catch { warnings.push("git ls-files calistirilamadi; secret dosya taramasi sinirli."); }
for (const file of tracked) { const base=path.basename(file); if (isSensitiveEnv(base) || forbiddenNames.some((re)=>re.test(base))) errors.push(`Hassas dosya Git tarafindan izleniyor: ${file}`); }
for (const file of [".github/workflows/v31-2-production-release.yml",".github/workflows/v31-2-database-backup.yml"]) {
  if (!fs.existsSync(file)) continue;
  const text = fs.readFileSync(file,"utf8");
  if (/postgres(?:ql)?:\/\/[^\s]+:[^\s]+@(?:[^\s]*neon|[^\s]*supabase|[^\s]*amazonaws)/i.test(text)) errors.push(`Workflow icinde gercek veritabani URL'si olabilir: ${file}`);
}
const required = ["middleware.ts","lib/security/api-monitor.ts","lib/security/logging.ts","app/api/monitoring/errors/route.ts"];
required.forEach((file)=>{ if(!fs.existsSync(file)) errors.push(`Guvenlik dosyasi eksik: ${file}`); });
warnings.forEach((x)=>console.warn(`UYARI: ${x}`));
if (errors.length) { errors.forEach((x)=>console.error(`HATA: ${x}`)); process.exit(1); }
console.log("Release guvenlik kontrolu basarili: gizli dosya, production db push ve monitoring katmanlari kontrol edildi.");
