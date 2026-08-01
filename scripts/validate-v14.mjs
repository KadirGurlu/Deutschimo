import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { execSync } from "node:child_process";
const require = createRequire(import.meta.url);
let ts;
try { ts = require("typescript"); } catch { ts = require(path.join(execSync("npm root -g").toString().trim(), "typescript")); }

const root = process.cwd();
const errors = [];
const required = [
  "app/vocabulary/page.tsx",
  "components/vocabulary/vocabulary-center.tsx",
  "components/vocabulary/vocabulary-dashboard-card.tsx",
  "app/api/skills/vocabulary/route.ts",
  "app/api/vocabulary/review/route.ts",
  "lib/vocabulary/scheduler.ts",
  "types/vocabulary.ts",
  "prisma/schema.prisma",
  "CHANGELOG_V14.md",
  "UPLOAD_INSTRUCTIONS_V14.txt",
];
for (const file of required) if (!fs.existsSync(path.join(root, file))) errors.push(`Eksik dosya: ${file}`);

const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
if (pkg.version !== "14.0.0") errors.push(`package.json sürümü 14.0.0 değil: ${pkg.version}`);
if (!pkg.scripts?.["validate:v14"]) errors.push("validate:v14 komutu eksik");

const schema = fs.readFileSync(path.join(root, "prisma/schema.prisma"), "utf8");
for (const model of ["VocabularyNotebookItem", "VocabularyReviewAttempt"]) if (!schema.includes(`model ${model}`)) errors.push(`Eksik Prisma modeli: ${model}`);
for (const field of ["nextReviewAt", "reviewCount", "correctStreak", "lapseCount", "intervalDays", "easeFactor", "verbConjugation", "perfectForm", "governedPreposition", "sourceUnitTitle"]) if (!schema.includes(field)) errors.push(`Eksik kelime alanı: ${field}`);

const scheduler = fs.readFileSync(path.join(root, "lib/vocabulary/scheduler.ts"), "utf8");
for (const mode of ["DE_TO_TR", "TR_TO_DE", "AUDIO_TO_WORD", "FILL_BLANK", "ARTICLE", "PLURAL", "SENTENCE"]) if (!scheduler.includes(`"${mode}"`)) errors.push(`Eksik tekrar türü: ${mode}`);
for (const rating of ["FORGOT", "HARD", "GOOD", "EASY"]) if (!scheduler.includes(`"${rating}"`)) errors.push(`Eksik değerlendirme: ${rating}`);

const page = fs.readFileSync(path.join(root, "components/vocabulary/vocabulary-center.tsx"), "utf8");
for (const label of ["Unuttum", "Zor", "İyi", "Çok kolay", "Fiil çekimi", "Perfekt", "Kelime defteri", "Akıllı tekrar"]) if (!page.includes(label)) errors.push(`Arayüz metni eksik: ${label}`);

let syntaxCount = 0;
function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (["node_modules", ".next", ".git"].includes(entry.name)) continue;
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(ts|tsx)$/.test(entry.name) && !entry.name.endsWith(".d.ts")) {
      syntaxCount++;
      const source = fs.readFileSync(full, "utf8");
      const result = ts.transpileModule(source, { fileName: full, reportDiagnostics: true, compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.Preserve, isolatedModules: true } });
      for (const diagnostic of result.diagnostics ?? []) errors.push(`${path.relative(root, full)}: ${ts.flattenDiagnosticMessageText(diagnostic.messageText, " ")}`);
    }
  }
}
walk(root);

if (errors.length) {
  console.error(`V14 doğrulaması başarısız (${errors.length} hata):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log(`V14 doğrulaması başarılı: ${required.length} kritik dosya ve ${syntaxCount} TypeScript/TSX dosyası kontrol edildi.`);
