import { readFile } from "node:fs/promises";

const readJson = async (path) => JSON.parse(await readFile(new URL(path, import.meta.url), "utf8"));
const curriculum = await readJson("../data/curriculum-content.json");
const enrichment = await readJson("../data/v16-content-bank.json");
const vocabularySets = await readJson("../data/v21-vocabulary-sets.json");
const quality = await readJson("../data/content-quality.json");
const errors = [];
const warnings = [];

const normalize = (value) => String(value ?? "").toLocaleLowerCase("de-DE").replace(/[\s\p{P}]+/gu, " ").trim();
const levelOf = (unitId) => unitId.split("-")[0].toUpperCase();
const bannedPatterns = [
  /durumunda uygun dilsel tepki vermek/i,
  /^Klar\. Was ist passiert\?$/i,
  /^Ich möchte heute .* (?:nennen|beschreiben|sprechen|fragen|verstehen)\.?$/i,
  /^Wir möchten heute /i,
  /^Hier ist (?:der|die|das) /i,
  /^Die Bewertung ist jedoch schwierig\./i,
  /^Dabei zeigt sich eine Schwierigkeit\./i,
  /^Doch es gibt eine Schwierigkeit\./i,
];

const expected = { A1: 12, A2: 16, B1: 18, B2: 20 };
for (const [level, count] of Object.entries(expected)) {
  const actual = curriculum.filter((unit) => levelOf(unit.id) === level).length;
  if (actual !== count) errors.push(`${level}: beklenen ${count}, bulunan ${actual} ünite`);
}

const unitIds = new Set();
const allTaskPrompts = new Map();
for (const unit of curriculum) {
  if (unitIds.has(unit.id)) errors.push(`${unit.id}: yinelenen ünite kimliği`);
  unitIds.add(unit.id);
  if (unit.goals.length !== 4) errors.push(`${unit.id}: öğrenme hedefi sayısı 4 değil (${unit.goals.length})`);
  if (unit.examples.length !== 4) errors.push(`${unit.id}: özgün örnek sayısı 4 değil (${unit.examples.length})`);
  if (unit.grammarColumns.some((column) => column.values.length !== unit.grammarColumns[0].values.length)) errors.push(`${unit.id}: dil bilgisi tablosunda satır sayıları eşit değil`);
  for (const value of [...unit.goals, ...unit.examples.flatMap((item) => [item.de, item.tr])]) {
    if (bannedPatterns.some((pattern) => pattern.test(value))) errors.push(`${unit.id}: şablon/gereksiz ifade kaldı: ${value}`);
  }
  for (const german of [
    ...unit.examples.map((item) => item.de), unit.ordering.answer, unit.translation.answer, unit.dialogue.answer,
    ...unit.miniCheck.options, ...unit.dialogue.options, ...unit.multiSelect.options,
  ]) {
    if (german.includes("İ")) errors.push(`${unit.id}: Almanca metinde Türkçe büyük İ bulundu: ${german}`);
  }
  if (!unit.miniCheck.options.includes(unit.miniCheck.correctAnswer)) errors.push(`${unit.id}: mini kontrol doğru cevabı seçeneklerde yok`);
  if (!unit.dialogue.options.includes(unit.dialogue.answer)) errors.push(`${unit.id}: diyalog doğru cevabı seçeneklerde yok`);
  if (!unit.multiSelect.answers.every((answer) => unit.multiSelect.options.includes(answer))) errors.push(`${unit.id}: çoklu seçim cevabı seçeneklerde yok`);
  const prompts = [unit.miniCheck.question, unit.fill.prompt, unit.translation.prompt, unit.dialogue.prompt, unit.trueFalse.prompt, unit.multiSelect.prompt];
  if (new Set(prompts.map(normalize)).size !== prompts.length) errors.push(`${unit.id}: aynı ünite içinde tekrarlanan görev metni`);
  for (const prompt of prompts) {
    const key = normalize(prompt);
    if (allTaskPrompts.has(key)) warnings.push(`${unit.id}: başka ünitede benzer temel görev metni (${allTaskPrompts.get(key)})`);
    else allTaskPrompts.set(key, unit.id);
  }
  const level = levelOf(unit.id);
  const limit = level === "A1" ? 13 : level === "A2" ? 18 : level === "B1" ? 26 : 32;
  for (const example of unit.examples) {
    const words = example.de.trim().split(/\s+/).length;
    if (words > limit) errors.push(`${unit.id}: ${level} örneği gereğinden uzun (${words} kelime): ${example.de}`);
  }
}

if (enrichment.length !== curriculum.length) errors.push(`Zengin içerik: ${enrichment.length}/${curriculum.length} ünite`);
const dialogueLines = [];
const comprehensionPrompts = [];
for (const unit of enrichment) {
  if (!unitIds.has(unit.id)) errors.push(`${unit.id}: zengin içerik için temel ünite yok`);
  if (unit.cefrCanDo.length !== 4) errors.push(`${unit.id}: CEFR can-do sayısı 4 değil`);
  if (unit.dialogue.length < 4) errors.push(`${unit.id}: diyalog çok kısa`);
  if (unit.reading.de.split(/\s+/).length < 12 || unit.listening.de.split(/\s+/).length < 12) errors.push(`${unit.id}: okuma/dinleme metni yetersiz`);
  for (const line of unit.dialogue) {
    const key = normalize(line.de);
    if (dialogueLines.includes(key)) errors.push(`${unit.id}: başka ünitede aynen tekrar eden diyalog satırı: ${line.de}`);
    dialogueLines.push(key);
  }
  for (const question of [...unit.readingQuestions, ...unit.listeningQuestions]) {
    const key = normalize(question.prompt);
    if (comprehensionPrompts.includes(key)) errors.push(`${unit.id}: tekrarlanan anlama sorusu: ${question.prompt}`);
    comprehensionPrompts.push(key);
    if (!question.options?.includes(question.correctAnswer)) errors.push(`${unit.id}: anlama sorusu doğru cevabı seçeneklerde yok`);
  }
  if (bannedPatterns.some((pattern) => pattern.test(unit.reading.de) || pattern.test(unit.listening.de))) errors.push(`${unit.id}: zengin içerikte eski şablon kaldı`);
}

if (vocabularySets.length !== 66) errors.push(`Hazır kelime seti sayısı 66 değil (${vocabularySets.length})`);
const exampleCounts = new Map();
const sentenceCardCounts = new Map();
let vocabularyCardCount = 0;
for (const set of vocabularySets) {
  if (set.entries.length < 30 || set.entries.length > 40) errors.push(`${set.unitId}: kelime seti 30-40 kart aralığında değil (${set.entries.length})`);
  const entryIds = new Set();
  for (const entry of set.entries) {
    vocabularyCardCount += 1;
    if (entryIds.has(entry.id)) errors.push(`${set.unitId}: yinelenen kart kimliği ${entry.id}`);
    entryIds.add(entry.id);
    if (!entry.word.trim() || !entry.translation.trim() || !entry.example.trim() || !entry.exampleTranslation.trim()) errors.push(`${entry.id}: kart alanı boş`);
    if (entry.example.includes("İ")) errors.push(`${entry.id}: Almanca kart örneğinde Türkçe büyük İ bulundu`);
    if (bannedPatterns.some((pattern) => pattern.test(entry.word) || pattern.test(entry.example))) errors.push(`${entry.id}: eski şablon kartı kaldı`);
    const exampleKey = normalize(entry.example);
    exampleCounts.set(exampleKey, (exampleCounts.get(exampleKey) ?? 0) + 1);
    if (entry.wordType === "Kalıp cümle") {
      const sentenceKey = normalize(entry.word);
      sentenceCardCounts.set(sentenceKey, (sentenceCardCounts.get(sentenceKey) ?? 0) + 1);
    }
  }
}
for (const [example, count] of exampleCounts) if (count > 3) errors.push(`Kelime kartı örneği ${count} kez tekrar ediyor: ${example}`);
for (const [sentence, count] of sentenceCardCounts) if (count > 2) errors.push(`Kalıp cümle ${count} sette tekrar ediyor: ${sentence}`);

if (quality.length !== 66) errors.push(`Kalite kaydı sayısı 66 değil (${quality.length})`);
const qualityIds = new Set();
for (const record of quality) {
  if (qualityIds.has(record.unitId)) errors.push(`${record.unitId}: yinelenen kalite kaydı`);
  qualityIds.add(record.unitId);
  if (!unitIds.has(record.unitId)) errors.push(`${record.unitId}: kalite kaydının ünitesi yok`);
  if (levelOf(record.unitId) === "A1" && record.status !== "YAYINA_HAZIR") errors.push(`${record.unitId}: manuel A1 kontrolü yayına hazır değil`);
  if (!record.checks.duplicateAndTemplateScan || !record.checks.answerConsistency || !record.checks.vocabularyContextScan) errors.push(`${record.unitId}: zorunlu otomatik kalite kontrolü eksik`);
}

if (errors.length) {
  console.error(`V27 içerik kalite kontrolü başarısız (${errors.length} hata):\n- ${errors.join("\n- ")}`);
  process.exit(1);
}
console.log(`V27 içerik kalite kontrolü başarılı: ${curriculum.length} ünite, ${enrichment.length} zengin içerik kaydı, ${vocabularySets.length} kelime seti ve ${vocabularyCardCount} kart doğrulandı.`);
if (warnings.length) console.warn(`${warnings.length} düşük öncelikli benzer görev uyarısı var; yayıma engel değildir.`);
