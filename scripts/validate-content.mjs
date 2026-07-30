import { readFile } from "node:fs/promises";

const file = new URL("../data/curriculum-content.json", import.meta.url);
const units = JSON.parse(await readFile(file, "utf8"));
const errors = [];
const seenIds = new Set();

for (const unit of units) {
  if (seenIds.has(unit.id)) errors.push(`${unit.id}: yinelenen ünite kimliği`);
  seenIds.add(unit.id);
  const requiredStrings = ["intro", "grammarTitle", "grammarExplanation", "warning", "tip"];
  for (const key of requiredStrings) if (!String(unit[key] ?? "").trim()) errors.push(`${unit.id}: ${key} boş`);
  if (!Array.isArray(unit.vocabulary) || unit.vocabulary.length < 6) errors.push(`${unit.id}: kelime listesi yetersiz`);
  if (!Array.isArray(unit.examples) || unit.examples.length < 4) errors.push(`${unit.id}: örnek cümle sayısı yetersiz`);
  const taskPrompts = [unit.miniCheck?.question, unit.fill?.prompt, unit.translation?.prompt, unit.dialogue?.prompt, unit.trueFalse?.prompt, unit.multiSelect?.prompt]
    .map((value) => String(value ?? "").toLocaleLowerCase("tr-TR").replace(/[^a-z0-9çğıöşüäöüß]+/gi, " ").trim());
  if (new Set(taskPrompts).size !== taskPrompts.length) errors.push(`${unit.id}: ünite görevlerinde yinelenen soru metni`);
}

const expected = { a1: 12, a2: 16, b1: 18, b2: 20 };
for (const [level, count] of Object.entries(expected)) {
  const actual = units.filter((unit) => unit.id.startsWith(`${level}-`)).length;
  if (actual !== count) errors.push(`${level.toUpperCase()}: ${actual}/${count} ünite`);
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log(`İçerik doğrulandı: ${units.length} ünite, benzersiz temel görev metinleri ve gerekli alanlar mevcut.`);
