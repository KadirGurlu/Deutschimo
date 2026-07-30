import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");
const errors = [];
const curriculum = JSON.parse(await read("data/curriculum-content.json"));
const header = await read("components/layout/site-header.tsx");
const home = await read("app/page.tsx");
const slides = await read("data/slides.ts");
const renderer = await read("components/learning/lesson-slide-renderer.tsx");
const storage = await read("lib/storage/learning-storage.ts");
const exercises = await read("data/exercises.ts");
const types = await read("types/learning.ts");

const expected = { a1: 12, a2: 16, b1: 18, b2: 20 };
if (curriculum.length !== 66) errors.push(`Ünite sayısı ${curriculum.length}/66`);
for (const [level, count] of Object.entries(expected)) {
  const actual = curriculum.filter((unit) => unit.id.startsWith(`${level}-`)).length;
  if (actual !== count) errors.push(`${level.toUpperCase()} ünite sayısı ${actual}/${count}`);
}

const ids = new Set();
for (const unit of curriculum) {
  if (ids.has(unit.id)) errors.push(`${unit.id}: yinelenen kimlik`);
  ids.add(unit.id);
  if (!unit.intro?.trim() || !unit.grammarExplanation?.trim()) errors.push(`${unit.id}: eksik konu anlatımı`);
  if (!Array.isArray(unit.vocabulary) || unit.vocabulary.length < 8) errors.push(`${unit.id}: en az 8 kelime gerekli`);
  if (!Array.isArray(unit.examples) || unit.examples.length < 4) errors.push(`${unit.id}: en az 4 temel örnek gerekli`);
  for (const [index, example] of (unit.examples ?? []).entries()) {
    if (!example.de?.trim() || !example.tr?.trim()) errors.push(`${unit.id}: ${index + 1}. örnekte Almanca/Türkçe eşleşmesi eksik`);
  }
}

if (header.includes("header-search") || header.includes("placeholder=\"Kurs")) errors.push("Ana header içinde arama kutusu kaldı");
if (!header.includes(">Kayıt Ol<") || !home.includes("Kayıt Ol")) errors.push("Kayıt Ol CTA eksik");
if (/Ücretsiz Başla|Ücretsiz Öğrenmeye Başla/.test(`${header}\n${home}`)) errors.push("Eski CTA metni kaldı");
if (!slides.includes("export const slidesPerUnit = 15")) errors.push("Ünite başına 15 slayt ayarı eksik");
for (const block of ["bilingual_examples", "dialogue", "reading_text", "listening_text", "task_card", "mistake_list", "practice_set"]) {
  if (!types.includes(`\"${block}\"`) || !slides.includes(`\"${block}\"`)) errors.push(`${block}: tip veya slayt kullanımı eksik`);
}
if (!renderer.includes("vocabulary-row-rich") || !renderer.includes("exampleTr")) errors.push("Zengin kelime/çeviri renderer'ı eksik");
if (/vocabulary-kind-badge|>V<|>İ<|>•</.test(renderer)) errors.push("Anlamsız kelime rozetleri renderer içinde kaldı");
if (!storage.includes("deutschimo-learning-v8") || !storage.includes("deutschimo-content-v8")) errors.push("V8 storage anahtarları eksik");
if (exercises.includes("-v7-") || !exercises.includes("-v8-")) errors.push("Alıştırma kimlikleri V8 değil");

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log("V8 doğrulandı: 66 ünite, 15 slaytlı yapı, görünür Türkçe çeviriler, sade header ve V8 soru/storage sistemi mevcut.");
