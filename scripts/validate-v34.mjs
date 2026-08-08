import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const errors = [];
const warnings = [];
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");
const req = (p) => { if (!fs.existsSync(path.join(root, p))) errors.push(`Eksik dosya: ${p}`); };

[
  "data/v34-a2-gold-standard.json",
  "data/v34-a2-enrichment.json",
  "data/v34-a2-quality.json",
  "docs/V34_A2_GOLD_STANDARD.md",
  ".github/workflows/v34-a2-gold-standard.yml",
].forEach(req);

const pkg = JSON.parse(read("package.json"));
if (!/^34\./.test(String(pkg.version ?? ""))) errors.push(`V34 paket surumu bekleniyor: ${pkg.version}`);
if (!pkg.scripts?.["validate:v34"]) errors.push("validate:v34 npm scripti eksik.");
for (const name of ["prebuild", "quality:check", "vercel-build"]) {
  if (!String(pkg.scripts?.[name] ?? "").includes("validate:v34")) errors.push(`${name} validate:v34 calistirmiyor.`);
}

const units = JSON.parse(read("data/v34-a2-gold-standard.json"));
const enrich = JSON.parse(read("data/v34-a2-enrichment.json"));
const quality = JSON.parse(read("data/v34-a2-quality.json"));
if (units.length !== 16) errors.push(`A2 Gold Standard 16 unite olmali: ${units.length}`);
if (enrich.length !== 16) errors.push(`A2 enrichment 16 kayit olmali: ${enrich.length}`);
if (quality.length !== 16) errors.push(`A2 quality 16 kayit olmali: ${quality.length}`);

const ids = units.map((u) => u.id);
if (new Set(ids).size !== 16) errors.push("A2 unite kimlikleri benzersiz degil.");
for (let i = 1; i <= 16; i += 1) {
  const id = `a2-u${String(i).padStart(2, "0")}`;
  if (!ids.includes(id)) errors.push(`Eksik A2 unite: ${id}`);
}

const germanExamples = [];
for (const u of units) {
  if (u.goals?.length !== 4) errors.push(`${u.id}: 4 olculebilir hedef gerekli.`);
  if ((u.intro?.length ?? 0) < 90) errors.push(`${u.id}: intro yetersiz.`);
  if ((u.grammarExplanation?.length ?? 0) < 190) errors.push(`${u.id}: gramer aciklamasi yetersiz.`);
  if (!Array.isArray(u.grammarColumns) || u.grammarColumns.length < 2) errors.push(`${u.id}: gramer tablosu eksik.`);
  const lens = (u.grammarColumns ?? []).map((c) => c.values?.length ?? 0);
  if (lens.length && new Set(lens).size !== 1) errors.push(`${u.id}: gramer tablosu satir sayilari esit degil.`);
  if ((u.vocabulary?.length ?? 0) < 16) errors.push(`${u.id}: en az 16 kelime/kalip gerekli.`);
  if ((u.examples?.length ?? 0) < 6) errors.push(`${u.id}: en az 6 cift dilli ornek gerekli.`);
  for (const item of u.vocabulary ?? []) {
    if (!item.includes(" — ")) errors.push(`${u.id}: Turkce anlam ayiraci eksik: ${item}`);
  }
  for (const e of u.examples ?? []) {
    if (!e.de || !e.tr) errors.push(`${u.id}: cift dilli ornek eksik.`);
    germanExamples.push(e.de.toLocaleLowerCase("de-DE").replace(/[^\p{L}\p{N}\s]/gu, "").trim());
  }
  if (!u.miniCheck?.options?.includes(u.miniCheck.correctAnswer)) errors.push(`${u.id}: miniCheck cevap seceneklerde yok.`);
  if (!u.fill?.acceptedAnswers?.includes(u.fill.answer)) errors.push(`${u.id}: fill acceptedAnswers eksik.`);
  if (!u.translation?.acceptedAnswers?.some((a) => a.replace(/[.!?]$/, "") === u.translation.answer.replace(/[.!?]$/, ""))) errors.push(`${u.id}: translation acceptedAnswers eksik.`);
  if (!u.dialogue?.options?.includes(u.dialogue.answer)) errors.push(`${u.id}: dialogue cevap seceneklerde yok.`);
  for (const a of u.multiSelect?.answers ?? []) if (!u.multiSelect.options?.includes(a)) errors.push(`${u.id}: multiSelect cevap seceneklerde yok.`);
}
if (new Set(germanExamples).size !== germanExamples.length) errors.push("A2 temel Almanca orneklerinde birebir tekrar bulundu.");

for (const e of enrich) {
  if ((e.cefrCanDo?.length ?? 0) < 3) errors.push(`${e.id}: CEFR can-do eksik.`);
  if ((e.dialogue?.length ?? 0) < 6) errors.push(`${e.id}: diyalog en az 6 tur olmali.`);
  if ((e.reading?.de?.split(/\s+/).length ?? 0) < 40) errors.push(`${e.id}: okuma A2 icin cok kisa.`);
  if ((e.listening?.de?.split(/\s+/).length ?? 0) < 34) errors.push(`${e.id}: dinleme A2 icin cok kisa.`);
  if ((e.readingQuestions?.length ?? 0) !== 3) errors.push(`${e.id}: tam 3 okuma sorusu gerekli.`);
  if ((e.listeningQuestions?.length ?? 0) !== 3) errors.push(`${e.id}: tam 3 dinleme sorusu gerekli.`);
  for (const q of [...(e.readingQuestions ?? []), ...(e.listeningQuestions ?? [])]) {
    if (!q.options?.includes(q.correctAnswer)) errors.push(`${e.id}: dogru cevap seceneklerde yok: ${q.id}`);
    if ((q.explanation?.length ?? 0) < 18) errors.push(`${e.id}: aciklama yetersiz: ${q.id}`);
  }
  if (!e.writingPrompt || !e.speakingPrompt || !e.realLifeMission) errors.push(`${e.id}: uretim gorevi eksik.`);
  if (!String(e.sourceMethod ?? "").includes("özgün")) errors.push(`${e.id}: ozgunluk metod notu eksik.`);
}

for (const r of quality) {
  if (r.status !== "YAYINA_HAZIR") errors.push(`${r.unitId}: kalite durumu YAYINA_HAZIR degil.`);
  if (!Object.values(r.checks ?? {}).every(Boolean)) errors.push(`${r.unitId}: kalite kontrolu tamamlanmamis.`);
}

const allText = JSON.stringify({ units, enrich });
const banned = [
  "Mein Vater war auch schon Bäcker",
  "Wohin mit der Kommode",
  "Hier finden Sie Ruhe und Erholung",
  "Was darf es sein?",
  "Ganz schön mobil",
  "Und was machst du?",
  "Nach der Schulzeit",
  "Immer online?",
  "Zusammen leben",
];
for (const phrase of banned) if (allText.includes(phrase)) errors.push(`Kaynak eser basligi/kopyasi Gold Standard verisinde bulundu: ${phrase}`);

const slides = read("data/slides.ts");
for (const token of [
  "v16ReadingQuestions = v16Content?.readingQuestions ?? []",
  "v16ListeningQuestions = v16Content?.listeningQuestions ?? []",
  '(unit.courseId === "a1" || unit.courseId === "a2") && v16Content ? v16Content.dialogue',
  '(unit.courseId === "a1" || unit.courseId === "a2") && v16Content ? v16Content.reading',
  '(unit.courseId === "a1" || unit.courseId === "a2") && v16Content ? v16Content.listening',
]) if (!slides.includes(token)) errors.push(`A2 zengin icerik entegrasyonu eksik: ${token}`);

const curriculumLoader = read("data/curriculum-content.ts");
if (!curriculumLoader.includes("v33-a1-gold-standard.json") || !curriculumLoader.includes("v34-a2-gold-standard.json")) errors.push("A1+A2 kumulatif curriculum overlay eksik.");
const enrichmentLoader = read("data/v16-content-bank.ts");
if (!enrichmentLoader.includes("v33-a1-enrichment.json") || !enrichmentLoader.includes("v34-a2-enrichment.json")) errors.push("A1+A2 kumulatif enrichment overlay eksik.");
const qualityLoader = read("data/content-quality.ts");
if (!qualityLoader.includes("v33-a1-quality.json") || !qualityLoader.includes("v34-a2-quality.json")) errors.push("A1+A2 kumulatif kalite overlay eksik.");

if (errors.length) {
  errors.forEach((e) => console.error(`HATA: ${e}`));
  console.error(`V34 A2 Gold Standard dogrulamasi basarisiz: ${errors.length} hata.`);
  process.exit(1);
}
console.log("V34 A2 Gold Standard doğrulaması başarılı:");
console.log("- 16 A2 ünitesi özgün olarak yeniden yazılmış ve kalite kaydına bağlanmış.");
console.log("- 64 ölçülebilir kazanım, 256 kelime/kalıp ve 96 çift dilli temel örnek hazır.");
console.log("- 16 diyalog, 16 okuma, 16 dinleme, 48+48 özgün anlama sorusu hazır.");
console.log("- A1 V33 Gold Standard korunuyor; A2 V34 overlay ile birlikte yükleniyor.");
console.log("- Kaynak eser başlıkları ve belirgin kopya kalıpları Gold Standard verisinde yasaklı.");
if (warnings.length) console.log(`Bilgilendirme: ${warnings.length} dusuk oncelikli uyari.`);
