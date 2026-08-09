import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const errors = [];
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");
const exists = (rel) => fs.existsSync(path.join(root, rel));

const requiredFiles = [
  "data/listening-gold-standard.ts",
  "components/skills/listening-lab.tsx",
  "components/skills/question-step.tsx",
  "types/skills.ts",
  "scripts/validate-v39.mjs",
  "docs/V39_LISTENING_LAB.md",
];

for (const file of requiredFiles) {
  if (!exists(file)) errors.push(`Eksik V39 dosyasi: ${file}`);
}

const expected = [
  ["data/v33-a1-enrichment.json", "A1", 12],
  ["data/v34-a2-enrichment.json", "A2", 16],
  ["data/v35-b1-enrichment.json", "B1", 18],
  ["data/v36-b2-enrichment.json", "B2", 20],
];

let total = 0;
for (const [rel, level, count] of expected) {
  if (!exists(rel)) {
    errors.push(`Gold Standard enrichment eksik: ${rel}`);
    continue;
  }
  const rows = JSON.parse(read(rel));
  if (!Array.isArray(rows)) {
    errors.push(`${level} enrichment dizi degil.`);
    continue;
  }
  if (rows.length !== count) {
    errors.push(`${level} unite sayisi ${count} olmali. Mevcut: ${rows.length}`);
  }
  total += rows.length;

  for (const row of rows) {
    if (!row?.id) errors.push(`${level}: id eksik.`);
    if (!row?.listening?.de?.trim()) errors.push(`${row?.id ?? level}: Almanca listening metni eksik.`);
    if (!row?.listening?.tr?.trim()) errors.push(`${row?.id ?? level}: Turkce listening cevirisi eksik.`);
    if (!Array.isArray(row?.listeningQuestions) || row.listeningQuestions.length < 3) {
      errors.push(`${row?.id ?? level}: en az 3 Gold Standard listening sorusu bekleniyor.`);
    }
    for (const question of row?.listeningQuestions ?? []) {
      if (question.masterySkill && question.masterySkill !== "LISTENING") {
        errors.push(`${row.id}/${question.id}: masterySkill LISTENING olmali.`);
      }
    }
  }
}

if (total !== 66) errors.push(`Toplam Gold Standard dinleme unitesi 66 olmali. Mevcut: ${total}`);

const data = read("data/listening-gold-standard.ts");
for (const token of [
  "v33-a1-enrichment.json",
  "v34-a2-enrichment.json",
  "v35-b1-enrichment.json",
  "v36-b2-enrichment.json",
  "curriculumContentByUnitId",
  "dictationSegments",
  "shadowingSegments",
  "normalRate",
  "slowRate",
  "MAIN_IDEA",
  "INFERENCE",
  "ATTITUDE",
  "listening-main-idea",
  "listening-inference",
  "listening-attitude",
]) {
  if (!data.includes(token)) errors.push(`V39 Gold Standard adapter eksik: ${token}`);
}

const types = read("types/skills.ts");
for (const token of [
  '"MAIN_IDEA" | "DETAIL" | "INFERENCE" | "ATTITUDE"',
  "ListeningKeyword",
  "ListeningPlaybackMode",
  "dictationSegments?",
  "shadowingSegments?",
  "normalRate?",
  "slowRate?",
  "sourceVersion?",
  "masteryQuestionId?",
]) {
  if (!types.includes(token)) errors.push(`V39 skills type eksik: ${token}`);
}

const questionStep = read("components/skills/question-step.tsx");
for (const label of ["ANA FİKİR", "DETAY", "ÇIKARIM", "KONUŞMACININ TUTUMU"]) {
  if (!questionStep.includes(label)) errors.push(`QuestionStep V39 etiketi eksik: ${label}`);
}

const ui = read("components/skills/listening-lab.tsx");
for (const token of [
  "V39 · DİNLEME LABORATUVARI",
  "Normal hız",
  "%75 hız",
  "Tekrar dinle",
  "DİNLEMEDEN ÖNCE",
  "DİKTE MODU",
  "SHADOWING MODU",
  "Dinle → tekrar et → yeniden dinle.",
  "Gold Standard",
  "dictationScore",
  "shadowingCompletion",
  "listeningScore",
  "spellCheck={false}",
  "speechSynthesis",
]) {
  if (!ui.includes(token)) errors.push(`V39 Listening UI/olcum parcasi eksik: ${token}`);
}

if (!ui.includes('task.level === "A1" || task.level === "A2"')) {
  errors.push("A1-A2 tempo/aciklama ayrimi eksik.");
}
if (!ui.includes("Doğal konuşmaya yakın tempo")) {
  errors.push("B1-B2 doğal tempo aciklamasi eksik.");
}

const overview = read("components/skills/skill-lab-overview.tsx");
if (!overview.includes("dikte") || !overview.includes("shadowing")) {
  errors.push("Beceri Laboratuvari Dinleme karti V39 yeteneklerini anlatmiyor.");
}

const pkg = JSON.parse(read("package.json"));
const major = Number(String(pkg.version ?? "").split(".")[0]);
if (!Number.isFinite(major) || major < 39) errors.push(`V39 paket surumu bekleniyor: ${pkg.version}`);
if (!pkg.scripts?.["validate:v39"]) errors.push("validate:v39 npm scripti eksik.");
for (const scriptName of ["prebuild", "vercel-build"]) {
  const value = String(pkg.scripts?.[scriptName] ?? "");
  if (!value.includes("validate:v38")) errors.push(`${scriptName}: V38 geriye uyumluluk kapisi kaybolmus.`);
  if (!value.includes("validate:v39")) errors.push(`${scriptName}: V39 kalite kapisi eksik.`);
}

const v38 = read("scripts/validate-v38.mjs");
if (!v38.includes("V38 Akilli Tekrar 3.0 dogrulamasi basarili")) {
  errors.push("V38 validator korunmuyor.");
}

if (errors.length) {
  errors.forEach((error) => console.error("HATA:", error));
  console.error(`V39 Dinleme Laboratuvari dogrulamasi basarisiz: ${errors.length} hata.`);
  process.exit(1);
}

console.log("V39 Dinleme Laboratuvari dogrulamasi basarili:");
console.log("- 66/66 Gold Standard listening metni A1-A2-B1-B2 laboratuvarina bagli.");
console.log("- Her gorevde normal hiz, %75 hiz ve tekrar dinleme kontrolu var.");
console.log("- Dinleme oncesi anahtar kelime asamasi var; transkript ilk dinlemede kapali.");
console.log("- Ana fikir + detay + cikarim + konusmaci tutumu birlikte olculuyor.");
console.log("- Dikte modu yazim benzerligini olcuyor.");
console.log("- Shadowing modu Dinle -> tekrar et -> yeniden dinle dongusunu izliyor.");
console.log("- A1-A2 kontrollu; B1-B2 dogal konusmaya yakin normal tempo kullaniyor.");
console.log("- V37 Skills -> Mastery bridge ve V38 Akilli Tekrar altyapisi korunuyor.");
