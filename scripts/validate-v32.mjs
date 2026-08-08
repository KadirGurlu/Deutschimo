import fs from "node:fs";
import path from "node:path";
const root=process.cwd(); const errors=[];
const read=(p)=>fs.existsSync(path.join(root,p))?fs.readFileSync(path.join(root,p),"utf8"):"";
const req=(p)=>{if(!fs.existsSync(path.join(root,p)))errors.push(`Eksik dosya: ${p}`)};
const pkg=JSON.parse(read("package.json")||"{}");
const [pkgMajor]=String(pkg.version??"").split(".").map(Number); if(!Number.isFinite(pkgMajor)||pkgMajor<32) errors.push(`Surum en az 32.x olmali: ${pkg.version}`);
for(const name of ["validate:v32","test:e2e:v32","release:v32"]) if(!pkg.scripts?.[name]) errors.push(`Eksik npm scripti: ${name}`);
for(const name of ["prebuild","quality:check","vercel-build"]) if(!String(pkg.scripts?.[name]??"").includes("validate:v32")) errors.push(`${name} V32 kontrolunu calistirmiyor.`);
[
  "app/onboarding/page.tsx","app/api/onboarding/route.ts","components/onboarding/onboarding-wizard.tsx","components/onboarding/onboarding-wizard.module.css","lib/onboarding/plan.ts","types/onboarding.ts","components/dashboard/dashboard-page-client.tsx","prisma/migrations/20260807160500_v32_smart_onboarding/migration.sql","playwright.v32.config.ts","e2e/v32-onboarding.spec.ts",".github/workflows/v32-onboarding.yml","docs/V32_0_SMART_ONBOARDING.md"
].forEach(req);
const schema=read("prisma/schema.prisma"); for(const n of ["model LearnerOnboardingProfile","onboardingProfile","planSummary","estimatedCompletionWeeks"]) if(!schema.includes(n)) errors.push(`Prisma onboarding modeli eksik: ${n}`);
const authz=read("lib/auth/authorization.ts"); if(!authz.includes("requireOnboardedUser")) errors.push("Dashboard onboarding yetki kapisi eksik.");
const dashboard=read("app/dashboard/page.tsx"); if(!dashboard.includes("requireOnboardedUser")) errors.push("Dashboard onboarding tamamlanma kontrolu kullanmiyor.");
const placement=read("app/api/intelligence/placement/route.ts"); if(/currentLevel:\s*result\.recommendedLevel,\s*onboardingCompleted:\s*true/.test(placement)) errors.push("Seviye testi onboarding'i erken tamamliyor.");
const authPage=read("app/auth/page.tsx"); if(authPage.includes('Field label="Mevcut seviye"')) errors.push("Kayit ekraninda eski seviye secimi hala gorunuyor.");
if(errors.length){errors.forEach(e=>console.error(`HATA: ${e}`));console.error(`V32 dogrulamasi basarisiz: ${errors.length} hata.`);process.exit(1)}
console.log("V32 dogrulamasi basarili: onboarding wizard, seviye testi koprusu, kalici profil, kisisel plan, dashboard kapisi ve E2E akisi hazir.");
