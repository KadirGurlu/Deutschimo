import fs from "node:fs";
import path from "node:path";
const root=process.cwd(); const errors=[];
const read=(p)=>fs.existsSync(path.join(root,p))?fs.readFileSync(path.join(root,p),"utf8"):"";
const req=(p)=>{if(!fs.existsSync(path.join(root,p))) errors.push(`Eksik dosya: ${p}`)};
const pkg=JSON.parse(read("package.json")||"{}");
if(pkg.version!=="32.1.0") errors.push(`Surum 32.1.0 olmali: ${pkg.version}`);
for(const name of ["validate:v32.1","test:e2e:v32.1","release:v32.1"]) if(!pkg.scripts?.[name]) errors.push(`Eksik npm scripti: ${name}`);
for(const name of ["prebuild","quality:check","vercel-build"]) if(!String(pkg.scripts?.[name]??"").includes("validate:v32.1")) errors.push(`${name} V32.1 kontrolunu calistirmiyor.`);
[
  "components/dashboard/today-plan-card.tsx",
  "components/dashboard/today-continue-card.tsx",
  "components/dashboard/v32-1-dashboard.module.css",
  "components/dashboard/dashboard-page-client.tsx",
  "lib/intelligence/daily-plan.ts",
  "lib/intelligence/server.ts",
  "playwright.v32-1.config.ts",
  "e2e/v32-1-dashboard.spec.ts",
  ".github/workflows/v32-1-daily-dashboard.yml",
  "docs/V32_1_DAILY_DASHBOARD.md",
].forEach(req);
const dashboard=read("components/dashboard/dashboard-page-client.tsx");
for(const token of ["Guten Tag","Bugünkü hedefin","TodayPlanCard","TodayContinueCard","Bu haftaki ritmin"]) if(!dashboard.includes(token)) errors.push(`Dashboard V32.1 parcasi eksik: ${token}`);
if(dashboard.includes("Çalışma serisi") || dashboard.includes("calculateStudyStreak")) errors.push("V32.1 dashboard streak sistemini ana motivasyon olarak kullanmamali.");
const plan=read("lib/intelligence/daily-plan.ts");
for(const token of ["selfReportedLevelReady","focusSkills","-v32-1-","allocateMinutes"]) if(!plan.includes(token)) errors.push(`V32.1 gunluk plan davranisi eksik: ${token}`);
const server=read("lib/intelligence/server.ts");
for(const token of ["learnerOnboardingProfile","isV321Plan","selfReportedLevelReady","focusSkills"]) if(!server.includes(token)) errors.push(`V32.1 server entegrasyonu eksik: ${token}`);
const v32Validator=read("scripts/validate-v32.mjs"); if(v32Validator.includes('pkg.version!=="32.0.0"')) errors.push("Eski V32 validator 32.0.0 surumune kilitli kalmis.");
if(errors.length){errors.forEach(e=>console.error(`HATA: ${e}`));console.error(`V32.1 dogrulamasi basarisiz: ${errors.length} hata.`);process.exit(1)}
console.log("V32.1 dogrulamasi basarili: gun odakli dashboard, kalici gunluk plan, onboarding oncelikleri, devam karti ve haftalik ritim hazir.");
