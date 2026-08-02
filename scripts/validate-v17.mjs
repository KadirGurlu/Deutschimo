import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { execSync } from "node:child_process";

const root = process.cwd();
const errors = [];
const required = [
  "types/assessment.ts",
  "data/learning-objectives.ts",
  "lib/assessment/server.ts",
  "lib/assessment/client.ts",
  "app/api/assessment/evidence/route.ts",
  "app/api/assessment/overview/route.ts",
  "components/assessment/competency-overview.tsx",
  "components/assessment/error-history.tsx",
  "components/assessment/competency-dashboard-card.tsx",
  "app/competency/page.tsx",
  "app/mistakes/page.tsx",
  "prisma/schema.prisma",
  "CHANGELOG_V17.md",
  "UPLOAD_INSTRUCTIONS_V17.txt",
];
for (const file of required) if (!fs.existsSync(path.join(root, file))) errors.push(`Eksik dosya: ${file}`);

const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
if (pkg.version !== "17.0.0") errors.push(`package.json sürümü 17.0.0 değil: ${pkg.version}`);
if (!pkg.scripts?.["validate:v17"]) errors.push("validate:v17 komutu eksik");

const schema = fs.readFileSync(path.join(root, "prisma/schema.prisma"), "utf8");
for (const model of ["AssessmentEvidence", "CompetencyRecord", "LearningErrorHistory"]) if (!schema.includes(`model ${model}`)) errors.push(`Eksik Prisma modeli: ${model}`);
for (const enumName of ["AssessmentSourceType", "AssessmentSkill", "CognitiveLevel"]) if (!schema.includes(`enum ${enumName}`)) errors.push(`Eksik Prisma enumu: ${enumName}`);
for (const relation of ["assessmentEvidence", "competencies", "learningErrors"]) if (!schema.includes(relation)) errors.push(`User ilişkisi eksik: ${relation}`);

const objectives = fs.readFileSync(path.join(root, "data/learning-objectives.ts"), "utf8");
for (const skill of ["GRAMMAR", "VOCABULARY", "COMMUNICATION", "READING", "LISTENING", "WRITING", "SPEAKING"]) if (!objectives.includes(`"${skill}"`)) errors.push(`Öğrenme hedefi becerisi eksik: ${skill}`);
if (!objectives.includes("learningObjectives")) errors.push("Öğrenme hedefi kataloğu eksik");
if (!objectives.includes("buildAssessmentMetadata")) errors.push("Soru meta verisi üreticisi eksik");

const exerciseSource = fs.readFileSync(path.join(root, "data/exercises.ts"), "utf8");
if (!exerciseSource.includes("assessment: buildAssessmentMetadata")) errors.push("Alıştırma ve quiz meta verileri bağlanmamış");
const exerciseShell = fs.readFileSync(path.join(root, "components/exercises/exercise-shell.tsx"), "utf8");
const quizShell = fs.readFileSync(path.join(root, "components/exercises/unit-quiz.tsx"), "utf8");
if (!exerciseShell.includes("recordAssessmentEvidence")) errors.push("Alıştırma cevapları ölçme API'sine bağlanmamış");
if (!quizShell.includes("recordAssessmentEvidence")) errors.push("Quiz cevapları ölçme API'sine bağlanmamış");

const curriculum = JSON.parse(fs.readFileSync(path.join(root, "data/curriculum-content.json"), "utf8"));
if (curriculum.length !== 66) errors.push(`66 ünite bekleniyor; bulunan: ${curriculum.length}`);

const require = createRequire(import.meta.url);
let ts;
try { ts = require("typescript"); } catch { ts = require(path.join(execSync("npm root -g").toString().trim(), "typescript")); }
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
  console.error(`V17.0 doğrulaması başarısız (${errors.length} hata):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log(`V17.0 doğrulaması başarılı: ${required.length} kritik dosya ve ${syntaxCount} TypeScript/TSX dosyası kontrol edildi.`);
console.log("- 66 ünite için öğrenme hedefi kataloğu");
console.log("- Alıştırma ve quizlerde konu/zorluk/bilişsel düzey etiketleri");
console.log("- Yetkinlik puanı, ölçme kanıtı ve hata geçmişi tabloları");
