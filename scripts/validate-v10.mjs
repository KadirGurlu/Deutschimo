import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const bankPath = path.join(root, "data/v10-example-bank.ts");
const enrichPath = path.join(root, "lib/learning/content-enrichment.ts");
const curriculumPath = path.join(root, "data/curriculum-content.json");
const bank = fs.readFileSync(bankPath, "utf8");
const enrichment = fs.readFileSync(enrichPath, "utf8");
const curriculum = JSON.parse(fs.readFileSync(curriculumPath, "utf8"));
const failures = [];

const ids = [...bank.matchAll(/^\s*"([a-b][12]-u\d{2})": \{/gm)].map((match) => match[1]);
const languageIds = new Set(ids.filter((id, index) => ids.indexOf(id) === index));
for (const item of curriculum) {
  if (!languageIds.has(item.id)) failures.push(`Eksik seviye/ünite örnek bankası: ${item.id}`);
}

const banned = [
  "Der Ausdruck „",
  "Wir verwenden das Verb",
  "ist in diesem Thema wichtig",
  "Ich übe Kennenlernen und Begrüßung",
  "Welche Wendung brauchst du bei",
];
for (const phrase of banned) {
  if (bank.includes(phrase) || enrichment.includes(phrase)) failures.push(`Yasaklı yapay kalıp bulundu: ${phrase}`);
}

const a1Items = curriculum.filter((item) => item.id.startsWith("a1-"));
const overrideBlocks = new Map();
for (const match of bank.matchAll(/^\s*"(a1-u\d{2})": \{([\s\S]*?)^\s*\},$/gm)) {
  if (!overrideBlocks.has(match[1])) overrideBlocks.set(match[1], match[2]);
}
for (const item of a1Items) {
  const termBlock = overrideBlocks.get(item.id) ?? "";
  for (const raw of item.vocabulary) {
    const term = raw.split(" — ")[0];
    if (!termBlock.includes(`"${term}"`)) failures.push(`A1 kelime örneği eksik: ${item.id} / ${term}`);
  }
}

for (const item of curriculum) {
  for (const example of item.examples) {
    if (!example.de?.trim() || !example.tr?.trim()) failures.push(`Çift dilli örnek eksik: ${item.id}`);
    if (/\b(Kadir|Ahmet|Mehmet|Ayşe|Fatma)\b/.test(example.de)) failures.push(`Türkçe kişi adı bulundu: ${item.id} / ${example.de}`);
  }
}

const a1BankSection = bank.slice(bank.indexOf('"a1-u01"'), bank.indexOf('"a2-u01"'));
for (const match of a1BankSection.matchAll(/line\("([^"]+)"/g)) {
  const sentence = match[1];
  const words = sentence.replace(/[!?.,]/g, "").split(/\s+/).filter(Boolean);
  if (words.length > 12) failures.push(`A1 örneği fazla uzun (${words.length}): ${sentence}`);
}

if (failures.length) {
  console.error("V10 doğrulaması başarısız:\n- " + failures.join("\n- "));
  process.exit(1);
}
console.log(`V10 doğrulaması başarılı: ${curriculum.length} ünitenin seviye bankası ve A1 kelime örnekleri kontrol edildi.`);
