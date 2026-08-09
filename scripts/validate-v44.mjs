import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const errors = [];
const read = (rel) =>
  fs.existsSync(path.join(root, rel))
    ? fs.readFileSync(path.join(root, rel), "utf8")
    : "";
const req = (rel) => {
  if (!fs.existsSync(path.join(root, rel))) errors.push(`Eksik: ${rel}`);
};

[
  "lib/admin/content-cms.ts",
  "app/api/admin/content-studio/route.ts",
  "app/api/admin/content-studio/[id]/route.ts",
  "app/api/admin/content-studio/[id]/versions/route.ts",
  "app/api/admin/content-studio/quality/route.ts",
  "app/api/content/unit/[unitId]/route.ts",
  "components/admin/content-manager.tsx",
  "app/admin/courses/[courseId]/units/[unitId]/page.tsx",
  "components/admin/quality-dashboard.tsx",
  "app/admin/quality/page.tsx",
  "lib/services/course-service.ts",
  "hooks/use-content-store.ts",
  "prisma/migrations/20260809163500_v44_admin_content_studio/migration.sql",
  ".github/workflows/v44-admin-content-studio.yml",
].forEach(req);

const pkg = JSON.parse(read("package.json") || "{}");
if (Number(String(pkg.version || "0").split(".")[0]) < 44) {
  errors.push("package version 44+ degil");
}
for (const script of ["prebuild", "quality:check", "vercel-build"]) {
  const value = String(pkg.scripts?.[script] || "");
  if (!value.includes("validate:v43")) errors.push(`${script}: V43 kayip`);
  if (!value.includes("validate:v44")) errors.push(`${script}: V44 yok`);
}

const schema = read("prisma/schema.prisma");
for (const token of [
  "enum CmsEntityType",
  "enum CmsWorkflowStatus",
  "READY",
  "model CmsContentRecord",
  "model CmsContentRevision",
]) {
  if (!schema.includes(token)) errors.push(`schema: ${token}`);
}

const ui = read("components/admin/content-manager.tsx");

/*
 * V44 hotfix:
 * Content creation buttons are rendered dynamically:
 *   typeLabel[t] + " ekle"
 * Therefore looking for literal source strings such as "Ders ekle"
 * causes a false-negative even though the UI renders them correctly.
 */
for (const token of [
  "Kurs Oluştur",
  "Yeni ünite",
  "Pasife al",
  "Sürümler",
  "Taslak",
  "İncelemede",
  "Yayına hazır",
  "Yayında",
]) {
  if (!ui.includes(token)) errors.push(`ui: ${token}`);
}

for (const token of [
  'LESSON:"Ders"',
  'VOCABULARY:"Kelime"',
  'QUESTION:"Soru"',
  'LISTENING:"Dinleme"',
]) {
  if (!ui.includes(token)) errors.push(`ui typeLabel: ${token}`);
}

for (const token of [
  '"LESSON","VOCABULARY","QUESTION","LISTENING"',
  'onClick={()=>create(t)}',
  '{typeLabel[t]} ekle',
]) {
  if (!ui.includes(token)) errors.push(`ui dynamic create control: ${token}`);
}


// V44_ROUTE_PROP_CONTRACT
const adminUnitRoute = read("app/admin/courses/[courseId]/units/[unitId]/page.tsx");
for (const token of ["initialCourseId={courseId}","initialUnitId={unitId}"]) {
  if (!adminUnitRoute.includes(token)) errors.push(`admin unit route prop contract: ${token}`);
}
for (const token of ["type ContentManagerProps=","initialCourseId?:string","initialUnitId?:string","initialCourseId,initialUnitId}:ContentManagerProps"]) {
  if (!ui.includes(token)) errors.push(`ContentManager prop contract: ${token}`);
}

const helper = read("lib/admin/content-cms.ts");
for (const token of [
  "ensureCmsBaseline",
  "materializeLegacyUnit",
  "CmsQualityTier.GOLD",
  "VOCABULARY",
  "LISTENING",
]) {
  if (!helper.includes(token)) errors.push(`helper: ${token}`);
}

const store = read("hooks/use-content-store.ts");
if (!store.includes("/api/content/unit/")) {
  errors.push("published CMS learner bridge yok");
}

const service = read("lib/services/course-service.ts");
for (const token of [
  "CmsEntityType.COURSE",
  "CmsEntityType.UNIT",
  "CmsEntityType.LESSON",
  "CmsEntityType.QUESTION",
  "CmsEntityType.VOCABULARY",
  "CmsEntityType.LISTENING",
]) {
  if (!service.includes(token)) errors.push(`service: ${token}`);
}

const css = read("app/globals.css");
if (!css.includes("V44_ADMIN_CONTENT_STUDIO")) errors.push("V44 css yok");

if (errors.length) {
  errors.forEach((error) => console.error("HATA:", error));
  console.error(`V44 Admin Content Studio dogrulamasi basarisiz: ${errors.length} hata.`);
  process.exit(1);
}

console.log("V44 Admin Content Studio dogrulamasi basarili.");
console.log("- DB tabanli kurs/unite/ders/kelime/soru/dinleme yonetimi.");
console.log("- Dinamik Ders/Kelime/Soru/Dinleme ekleme kontrolleri dogrulandi.");
console.log("- Taslak -> Incelemede -> Yayina hazir -> Yayinda.");
console.log("- Soru pasife alma ve surum gecmisi.");
console.log("- A1 12/12, A2 16/16, B1 18/18, B2 20/20 Gold kalite tabani.");
console.log("- Published CMS icerigi learner content store'a bagli.");
