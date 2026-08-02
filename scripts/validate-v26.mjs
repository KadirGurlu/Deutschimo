import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const ts = require("typescript");

const root = process.cwd();
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
const failures = [];
const expect = (condition, message) => { if (!condition) failures.push(message); };

const pkg = JSON.parse(read("package.json"));
expect(pkg.version === "26.0.0", "Paket sürümü 26.0.0 değil.");
expect(pkg.scripts["validate:v26"]?.includes("validate-v26.mjs"), "V26 doğrulama komutu eksik.");

const sidebar = read("components/layout/app-sidebar.tsx");
expect(sidebar.includes('"Kurslar", "/courses", "courses"'), "Öğrenci menüsünde Kurslar bağlantısı eksik.");
expect(sidebar.includes('aria-label="Öğrenci menüsü"'), "Öğrenci menüsü erişilebilirlik etiketi eksik.");


const mobileNav = read("components/layout/mobile-nav.tsx");
expect(mobileNav.includes('href="/courses"'), "Mobil alt menüde Kurslar bağlantısı eksik.");
expect(mobileNav.includes('<span>Kurslar</span>'), "Mobil alt menüde Kurslar etiketi eksik.");

const coursesPage = read("app/courses/page.tsx");
for (const marker of ["requireUser", 'AppSidebar active="courses"', "CourseCard", "ünitelerini, ders içeriğini"]) {
  expect(coursesPage.includes(marker), `Kurs kataloğunda V26 özelliği eksik: ${marker}`);
}

const coursePage = read("app/courses/[slug]/page.tsx");
expect(coursePage.includes("requireUser"), "Kurs ayrıntısı oturum kontrolü yapmıyor.");
expect(coursePage.includes('AppSidebar active="courses"'), "Kurs ayrıntısında öğrenci menüsü eksik.");
expect(coursePage.includes("CourseProgram"), "Kurs ayrıntısında ünite programı gösterilmiyor.");

const program = read("components/course/course-program.tsx");
expect(program.includes("UnitLearningPath"), "Kurs içeriğinde ünite listesi eksik.");
expect(!program.includes("<Footer"), "Kurs ayrıntısında eski genel footer hâlâ gösteriliyor.");

const header = read("components/layout/site-header.tsx");
for (const marker of ["v26-site-header", "Çıkış yapmak istediğinden emin misin?", "v26-logout-button", 'href="/courses"']) {
  expect(header.includes(marker), `Başlıkta V26 özelliği eksik: ${marker}`);
}
expect(!header.includes("SyncStatusIndicator"), "Başlıkta ilerleme kaydedildi göstergesi hâlâ bulunuyor.");

const dashboard = read("app/dashboard/page.tsx");
expect(dashboard.includes('href="/courses"'), "Öğrenci Panelinde Kursları Görüntüle bağlantısı eksik.");

const css = read("app/globals.css");
for (const marker of [".v26-site-header .header-inner", "width:100%", "justify-content:space-between", ".v26-course-grid", ".v26-logout-button"]) {
  expect(css.includes(marker), `V26 stilinde kural eksik: ${marker}`);
}

const sourceFiles = [];
function collect(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (["node_modules", ".next"].includes(entry.name)) continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) collect(absolute);
    else if (/\.(ts|tsx)$/.test(entry.name) && !entry.name.endsWith(".d.ts")) sourceFiles.push(absolute);
  }
}
collect(root);

for (const file of sourceFiles) {
  const code = fs.readFileSync(file, "utf8");
  const output = ts.transpileModule(code, {
    compilerOptions: {
      jsx: ts.JsxEmit.ReactJSX,
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
    },
    fileName: file,
    reportDiagnostics: true,
  });
  for (const diagnostic of output.diagnostics ?? []) {
    if (diagnostic.category !== ts.DiagnosticCategory.Error) continue;
    const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, " ");
    failures.push(`${path.relative(root, file)}: ${message}`);
  }
}

if (failures.length) {
  console.error(`V26 doğrulaması başarısız (${failures.length} sorun):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("V26 doğrulaması başarılı.");
console.log("- Kurslar öğrenci menüsüne ve Öğrenci Paneline eklendi.");
console.log("- Kurs ayrıntıları ünite öğrenme yolunu gösteriyor.");
console.log("- Başlık uçtan uca hizalandı ve kayıt göstergesi kaldırıldı.");
console.log("- Çıkış işlemi kullanıcı onayı gerektiriyor.");
console.log(`- ${sourceFiles.length} TypeScript/TSX dosyası sözdizimi açısından kontrol edildi.`);
