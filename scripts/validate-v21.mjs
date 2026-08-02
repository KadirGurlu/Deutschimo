import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const mustExist = [
  "data/v21-vocabulary-sets.json",
  "components/vocabulary/vocabulary-sets-center.tsx",
  "components/vocabulary/vocabulary-set-study.tsx",
  "app/vocabulary/page.tsx",
  "app/vocabulary/review/page.tsx",
  "app/vocabulary/set/[id]/page.tsx",
  "app/api/vocabulary/sets/route.ts",
  "app/api/vocabulary/sets/[id]/route.ts",
];
for (const file of mustExist) {
  if (!fs.existsSync(path.join(root, file))) throw new Error(`Eksik V21 dosyası: ${file}`);
}

const sets = JSON.parse(read("data/v21-vocabulary-sets.json"));
if (sets.length !== 66) throw new Error(`66 hazır set bekleniyordu, ${sets.length} bulundu.`);
const counts = { A1: 0, A2: 0, B1: 0, B2: 0 };
let termCount = 0;
for (const set of sets) {
  counts[set.level] += 1;
  if (set.entries.length < 30 || set.entries.length > 40) throw new Error(`${set.slug}: set 30–40 terim aralığında değil.`);
  const ids = new Set();
  for (const entry of set.entries) {
    termCount += 1;
    if (!entry.id || ids.has(entry.id)) throw new Error(`${set.slug}: terim kimliği eksik veya tekrarlı.`);
    ids.add(entry.id);
    for (const field of ["word", "translation", "example", "exampleTranslation"]) {
      if (!String(entry[field] || "").trim()) throw new Error(`${set.slug}/${entry.id}: ${field} eksik.`);
    }
  }
}
const expected = { A1: 12, A2: 16, B1: 18, B2: 20 };
for (const level of Object.keys(expected)) if (counts[level] !== expected[level]) throw new Error(`${level}: ${expected[level]} set bekleniyordu, ${counts[level]} bulundu.`);

const schema = read("prisma/schema.prisma");
if (!schema.includes("model VocabularySet")) throw new Error("VocabularySet modeli eksik.");
if (!schema.includes("setId                 String?")) throw new Error("VocabularyNotebookItem.setId eksik.");
if (!read("components/layout/app-sidebar.tsx").includes("Kelime Setlerim")) throw new Error("Sidebar etiketi güncellenmedi.");
if (!read("package.json").includes('"version": "21.0.0"')) throw new Error("Paket sürümü 21.0.0 değil.");

console.log(`V21 doğrulaması başarılı: ${sets.length} hazır set, ${termCount} terim; A1 ${counts.A1}, A2 ${counts.A2}, B1 ${counts.B1}, B2 ${counts.B2}.`);
