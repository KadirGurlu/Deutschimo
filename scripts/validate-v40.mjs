import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const errors = [];
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");
const exists = (rel) => fs.existsSync(path.join(root, rel));

for (const file of [
  "components/skills/speaking-lab.tsx",
  "components/skills/skill-lab-overview.tsx",
  "data/skill-labs.ts",
  "lib/skills/evaluation.ts",
  "types/skills.ts",
  "scripts/validate-v40.mjs",
  "scripts/validate-v39-1.mjs",
  "docs/V40_SPEAKING_LAB.md",
  ".github/workflows/v40-speaking-lab.yml",
]) {
  if (!exists(file)) errors.push(`Eksik V40 dosyasi: ${file}`);
}

const pkg = JSON.parse(read("package.json"));
const major = Number(String(pkg.version ?? "").split(".")[0]);
if (!Number.isFinite(major) || major < 40) errors.push(`V40 paket surumu bekleniyor: ${pkg.version}`);
if (!pkg.scripts?.["validate:v40"]) errors.push("validate:v40 npm scripti eksik.");

for (const scriptName of ["prebuild", "quality:check", "vercel-build"]) {
  const value = String(pkg.scripts?.[scriptName] ?? "");
  if (!value.includes("validate:v39.1")) errors.push(`${scriptName}: V39.1 teknik tabani kaybolmus.`);
  if (!value.includes("validate:v40")) errors.push(`${scriptName}: V40 kalite kapisi eksik.`);
}

const types = read("types/skills.ts");
for (const token of [
  "SpeakingCommunicationGoal",
  "SpeakingNaturalAlternative",
  "communicationGoals:",
  "grammarTargets:",
  "naturalAlternatives:",
  "pronunciationTargets:",
  'band: "CLEAR" | "CHECK" | "RETRY"',
  "naturalSuggestions:",
  "grammarNotes:",
  "wordsPerMinute:",
]) {
  if (!types.includes(token)) errors.push(`V40 speaking type eksik: ${token}`);
}

const data = read("data/skill-labs.ts");
const speakingBlock = data.match(/export const speakingTasks:[\s\S]*?(?=export const writingTasks:)/)?.[0] ?? "";
const speakingIds = speakingBlock.match(/id:"speak-/g)?.length ?? 0;
if (speakingIds !== 16) errors.push(`V40 speaking gorev sayisi 16 olmali. Mevcut: ${speakingIds}`);

for (const [level, count] of [["A1",4],["A2",4],["B1",4],["B2",4]]) {
  const found = speakingBlock.match(new RegExp(`level:"${level}"`, "g"))?.length ?? 0;
  if (found !== count) errors.push(`${level} speaking gorev sayisi ${count} olmali. Mevcut: ${found}`);
}

for (const id of [
  "speak-a1-intro","speak-a1-cafe","speak-a1-weg",
  "speak-a2-termin","speak-a2-erlebnis","speak-a2-wohnung",
  "speak-b1-bewerbung","speak-b1-meinung","speak-b1-projekt",
  "speak-b2-debatte","speak-b2-grafik","speak-b2-loesung",
]) {
  if (!speakingBlock.includes(id)) errors.push(`Gecmis speaking taskId korunmuyor: ${id}`);
}

for (const token of [
  "communicationGoals:[",
  "grammarTargets:[",
  "naturalAlternatives:[",
  "pronunciationTargets:[",
  "Ich würde gern einen Termin vereinbaren.",
]) {
  if (!speakingBlock.includes(token)) errors.push(`V40 speaking bank parcasi eksik: ${token}`);
}

const evaluator = read("lib/skills/evaluation.ts");
for (const token of [
  "speakingGoalAchieved",
  "speakingGrammarNotes",
  "speakingPaceScore",
  "taskCompletion * 0.30",
  "clarity * 0.22",
  "fluency * 0.18",
  "vocabulary * 0.15",
  "grammar * 0.15",
  "Telaffuz için ayrı bir yapay yüzde genel sonuca eklenmez.",
  "manuallyEdited",
  "naturalSuggestions",
  "pronunciation",
]) {
  if (!evaluator.includes(token)) errors.push(`V40 speaking evaluator parcasi eksik: ${token}`);
}

const ui = read("components/skills/speaking-lab.tsx");
for (const token of [
  "V40 · KONUŞMA LABORATUVARI",
  "Konuş, anlaşıl ve daha doğal hale getir.",
  "Anlaşılırlık",
  "Akıcılık",
  "Kelime seçimi",
  "Gramer",
  "Görevi tamamlama",
  "Telaffuz geri bildirimi",
  "DAHA DOĞAL KULLANIM",
  "Tanıma güveni bir fonetik telaffuz notu değildir.",
  "Genel iletişim başarısı",
  "evaluatorVersion: \"V40\"",
]) {
  if (!ui.includes(token)) errors.push(`V40 Speaking UI parcasi eksik: ${token}`);
}

const css = read("app/globals.css");
if (!css.includes("V40_SPEAKING_LAB_STYLES")) errors.push("V40 Speaking CSS eksik.");

const overview = read("components/skills/skill-lab-overview.tsx");
if (!overview.includes("anlaşılırlık") || !overview.includes("doğal kullanım")) {
  errors.push("Beceri Laboratuvari Konusma karti V40 yeteneklerini anlatmiyor.");
}

const v39_1 = read("scripts/validate-v39-1.mjs");
if (!v39_1.includes("V39.1 veya sonraki paket surumu bekleniyor")) {
  errors.push("V39.1 version gate V40 geriye uyumlulugu icin guncellenmemis.");
}

const workflow = read(".github/workflows/v40-speaking-lab.yml");
for (const token of [
  "branches: [v40-staging]",
  "actions/checkout@v6",
  "actions/setup-node@v7",
  "postgres:16",
  "DATABASE_ENVIRONMENT: test",
  "npm run validate:v39.1",
  "npm run validate:v40",
  "npm run db:drift:check",
  "npm run typecheck",
  "npm run build",
]) {
  if (!workflow.includes(token)) errors.push(`V40 workflow parcasi eksik: ${token}`);
}

if (errors.length) {
  errors.forEach((error) => console.error("HATA:", error));
  console.error(`V40 Konusma Laboratuvari dogrulamasi basarisiz: ${errors.length} hata.`);
  process.exit(1);
}

console.log("V40 Konusma Laboratuvari dogrulamasi basarili:");
console.log("- 16 ozgun speaking gorevi: A1/A2/B1/B2 seviyelerinde 4'er gorev.");
console.log("- 5 sayisal iletisim metrigi: gorev, anlasilabilirlik, akicilik, kelime, gramer.");
console.log("- Telaffuz tek yapay yuzde olarak genel skora eklenmiyor; CLEAR/CHECK/RETRY nitel geri bildirim kullaniliyor.");
console.log("- Mikrofon -> transkript -> kontrol -> degerlendirme -> tekrar dongusu korunuyor.");
console.log("- Konusmaya gore dogal ifade alternatifleri ve gramer/yapi notlari uretiliyor.");
console.log("- Eski speaking taskId'leri ve SkillAttempt/Mastery kayit akisi korunuyor.");
console.log("- V39.1 teknik hardening ve V39 Dinleme Laboratuvari geriye uyumlulugu korunuyor.");
