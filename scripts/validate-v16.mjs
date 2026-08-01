import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const curriculumPath = path.join(root, "data", "curriculum-content.json");
const bankPath = path.join(root, "data", "v16-content-bank.json");
const curriculum = JSON.parse(fs.readFileSync(curriculumPath, "utf8"));
const bank = JSON.parse(fs.readFileSync(bankPath, "utf8"));

const errors = [];
const assert = (condition, message) => { if (!condition) errors.push(message); };
const expectedCounts = { a1: 12, a2: 16, b1: 18, b2: 20 };

assert(curriculum.length === 66, `Müfredat 66 ünite olmalı; bulunan: ${curriculum.length}`);
assert(bank.length === 66, `V16 içerik bankası 66 ünite olmalı; bulunan: ${bank.length}`);

const ids = curriculum.map((item) => item.id);
assert(new Set(ids).size === ids.length, "Müfredatta yinelenen ünite kimliği var.");
assert(new Set(bank.map((item) => item.id)).size === bank.length, "V16 bankasında yinelenen ünite kimliği var.");

for (const [level, expected] of Object.entries(expectedCounts)) {
  const count = ids.filter((id) => id.startsWith(`${level}-`)).length;
  assert(count === expected, `${level.toUpperCase()} için ${expected} ünite bekleniyor; bulunan: ${count}`);
}

const questionIds = [];
const readingTexts = [];
const listeningTexts = [];
const dialogueTexts = [];

for (const unit of curriculum) {
  assert(unit.vocabulary?.length >= 10, `${unit.id}: en az 10 kelime bulunmalı.`);
  assert(unit.examples?.length >= 6, `${unit.id}: en az 6 özgün örnek bulunmalı.`);
  assert(unit.goals?.length >= 4, `${unit.id}: en az 4 öğrenme hedefi bulunmalı.`);
  assert(typeof unit.grammarExplanation === "string" && unit.grammarExplanation.length >= 220, `${unit.id}: dil bilgisi açıklaması yetersiz.`);
}

for (const entry of bank) {
  assert(ids.includes(entry.id), `${entry.id}: müfredatta karşılığı yok.`);
  assert(entry.cefrCanDo?.length >= 4, `${entry.id}: can-do hedefleri eksik.`);
  assert(entry.cultureNote?.text?.length >= 40, `${entry.id}: kültür/günlük yaşam notu kısa.`);
  assert(entry.dialogue?.length >= 5, `${entry.id}: diyalog en az 5 konuşma sırası içermeli.`);
  assert(entry.reading?.de?.length >= 180, `${entry.id}: Almanca okuma metni kısa.`);
  assert(entry.reading?.tr?.length >= 150, `${entry.id}: Türkçe okuma karşılığı kısa.`);
  assert(entry.listening?.de?.length >= 150, `${entry.id}: Almanca dinleme metni kısa.`);
  assert(entry.listening?.tr?.length >= 130, `${entry.id}: Türkçe dinleme karşılığı kısa.`);
  assert(entry.readingQuestions?.length === 3, `${entry.id}: 3 okuma sorusu bulunmalı.`);
  assert(entry.listeningQuestions?.length === 3, `${entry.id}: 3 dinleme sorusu bulunmalı.`);
  assert(entry.writingPrompt?.length >= 100, `${entry.id}: yazma görevi kısa.`);
  assert(entry.speakingPrompt?.length >= 100, `${entry.id}: konuşma görevi kısa.`);
  assert(entry.realLifeMission?.length >= 100, `${entry.id}: gerçek yaşam görevi kısa.`);

  readingTexts.push(entry.reading.de.trim());
  listeningTexts.push(entry.listening.de.trim());
  dialogueTexts.push(entry.dialogue.map((turn) => turn.de).join(" ").trim());

  for (const question of [...entry.readingQuestions, ...entry.listeningQuestions]) {
    questionIds.push(question.id);
    assert(question.type === "MULTIPLE_CHOICE", `${question.id}: V16 soruları tek-soru akışına uygun MULTIPLE_CHOICE olmalı.`);
    assert(Array.isArray(question.options) && question.options.length >= 2, `${question.id}: seçenekler eksik.`);
    assert(question.options?.includes(question.correctAnswer), `${question.id}: doğru cevap seçeneklerde yok.`);
    assert(question.explanation?.length >= 30, `${question.id}: açıklama yetersiz.`);
  }

  const visibleText = JSON.stringify({
    dialogue: entry.dialogue,
    reading: entry.reading,
    listening: entry.listening,
    questions: [...entry.readingQuestions, ...entry.listeningQuestions],
  });
  for (const forbidden of ["Netzwerk neu", "Menschen A1", "Klett Sprachen", "Hueber"]) {
    assert(!visibleText.includes(forbidden), `${entry.id}: öğrenci içeriğinde kaynak eser adı görünmemeli (${forbidden}).`);
  }
}

assert(new Set(questionIds).size === questionIds.length, "V16 soru kimlikleri benzersiz değil.");
assert(new Set(readingTexts).size === readingTexts.length, "Okuma metinlerinden bazıları birebir aynı.");
assert(new Set(listeningTexts).size === listeningTexts.length, "Dinleme metinlerinden bazıları birebir aynı.");
assert(new Set(dialogueTexts).size === dialogueTexts.length, "Diyaloglardan bazıları birebir aynı.");

const exercisesSource = fs.readFileSync(path.join(root, "data", "exercises.ts"), "utf8");
const slidesSource = fs.readFileSync(path.join(root, "data", "slides.ts"), "utf8");
assert(exercisesSource.includes("createV16Exercises"), "V16 alıştırma üreticisi data/exercises.ts içinde bulunamadı.");
assert(exercisesSource.includes("createV16QuizQuestions"), "V16 quiz genişletmesi bulunamadı.");
assert(exercisesSource.includes("exercisesPerUnit = 14"), "Ünite başına 14 alıştırma ayarı bulunamadı.");
assert(slidesSource.includes("reading-v16-questions"), "Okuma soruları ders slaytlarına bağlanmamış.");
assert(slidesSource.includes("listening-v16-questions"), "Dinleme soruları ders slaytlarına bağlanmamış.");
assert(slidesSource.includes("culture-note"), "Kültür notu ders slaytlarına bağlanmamış.");

if (errors.length) {
  console.error("\nV16 doğrulaması başarısız:\n");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("V16 içerik doğrulaması başarılı.");
console.log(`- Ünite: ${curriculum.length}`);
console.log(`- V16 özgün içerik paketi: ${bank.length}`);
console.log(`- Yeni okuma/dinleme sorusu: ${questionIds.length}`);
console.log("- Ünite başına kelime: en az 10");
console.log("- Ünite başına ana alıştırma: 14");
console.log("- Ünite sonu soru sayısı: 10");
