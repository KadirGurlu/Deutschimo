import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const curriculum = JSON.parse(read("data/curriculum-content.json"));
const renderer = read("components/learning/lesson-slide-renderer.tsx");
const enrichment = read("lib/learning/content-enrichment.ts");
const topicContent = read("lib/learning/topic-content.ts");
const slides = read("data/slides.ts");
const types = read("types/learning.ts");

const errors = [];
if (curriculum.length !== 66) errors.push(`Beklenen 66 ünite, bulunan ${curriculum.length}`);
if (renderer.includes("practiceQuestions?.map")) errors.push("Konu sonu soruları hâlâ toplu şekilde render ediliyor.");
if (!renderer.includes("Soru {activeIndex + 1} / {safeQuestions.length}")) errors.push("Tek-soru ilerleme göstergesi bulunamadı.");
if (!renderer.includes("Sonraki Soru")) errors.push("Sonraki Soru butonu bulunamadı.");
if (!renderer.includes("BilingualPassage")) errors.push("Bütünlüklü iki dilli metin bileşeni bulunamadı.");
if (!types.includes("passage?: BilingualText")) errors.push("Okuma/dinleme metin veri tipi bulunamadı.");
if (!slides.includes("passage: readingPassage") || !slides.includes("passage: listeningPassage")) errors.push("Okuma/dinleme metinleri passage yapısına geçirilmemiş.");
for (const phrase of ["Achten Sie besonders", "Willkommen zur Hörübung", "In dieser Lektion geht es um das Thema", "Guten Tag! Ich habe eine Frage zum Thema"]) {
  if (enrichment.includes(phrase) || topicContent.includes(phrase)) errors.push(`Tekrarlanan yapay kalıp kaldı: ${phrase}`);
}
const serialized = JSON.stringify(curriculum);
if (serialized.includes("Kadir") || serialized.includes("Frau Kaya")) errors.push("Ders örneklerinde Türkçe kişi adı kaldı.");
if (!topicContent.includes('"a1-u01"') || !topicContent.includes("Schön, dich kennenzulernen")) errors.push("A1 tanışma diyaloğu bulunamadı.");
if (!topicContent.includes("Am Montag beginnt ein neuer Deutschkurs")) errors.push("A1 bütünlüklü okuma metni bulunamadı.");

if (errors.length) {
  console.error("V9 doğrulaması başarısız:");
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}
console.log("V9 doğrulandı: 66 ünite korundu; konu sonu soruları tek tek gösteriliyor; okuma ve dinleme içerikleri bütünlüklü iki dilli metinler; A1 günlük diyalogları ve Alman isimleri mevcut.");
