import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const errors = [];
const warn = [];
const read = (p) => fs.readFileSync(path.join(root,p),"utf8");
const req = (p) => { if (!fs.existsSync(path.join(root,p))) errors.push(`Eksik dosya: ${p}`); };

const required = [
  "data/v33-a1-gold-standard.json",
  "data/v33-a1-enrichment.json",
  "data/v33-a1-quality.json",
  "docs/V33_A1_GOLD_STANDARD.md",
  ".github/workflows/v33-a1-gold-standard.yml",
];
required.forEach(req);

const pkg = JSON.parse(read("package.json"));
const [pkgMajor]=String(pkg.version??"").split(".").map(Number); if(!Number.isFinite(pkgMajor)||pkgMajor<33) errors.push(`Surum en az 33.x olmali: ${pkg.version}`);
if (!pkg.scripts?.["validate:v33"]) errors.push("validate:v33 npm scripti eksik.");
for (const name of ["prebuild","quality:check","vercel-build"]) {
  if (!String(pkg.scripts?.[name] ?? "").includes("validate:v33")) errors.push(`${name} validate:v33 calistirmiyor.`);
}

const units = JSON.parse(read("data/v33-a1-gold-standard.json"));
const enrich = JSON.parse(read("data/v33-a1-enrichment.json"));
const quality = JSON.parse(read("data/v33-a1-quality.json"));

if (units.length !== 12) errors.push(`A1 Gold Standard 12 unite olmali: ${units.length}`);
if (enrich.length !== 12) errors.push(`A1 enrichment 12 unite olmali: ${enrich.length}`);
if (quality.length !== 12) errors.push(`A1 quality 12 kayit olmali: ${quality.length}`);

const ids = units.map(u=>u.id);
if (new Set(ids).size !== 12) errors.push("A1 unite kimlikleri benzersiz degil.");
for (let i=1;i<=12;i++) {
  const expected=`a1-u${String(i).padStart(2,"0")}`;
  if (!ids.includes(expected)) errors.push(`Eksik Gold Standard unite: ${expected}`);
}

const normalizedGerman = [];
const oldTemplate = "Kuralı öğrenirken önce tek bir model cümleyi";
for (const u of units) {
  if (u.goals?.length !== 4) errors.push(`${u.id}: tam 4 olculebilir hedef gerekli.`);
  if (!u.intro || u.intro.length < 80) errors.push(`${u.id}: intro yetersiz.`);
  if (!u.grammarExplanation || u.grammarExplanation.length < 180) errors.push(`${u.id}: gramer aciklamasi yetersiz.`);
  if (u.grammarExplanation?.includes(oldTemplate)) errors.push(`${u.id}: eski tekrar eden gramer sablonu kalmis.`);
  if (!Array.isArray(u.grammarColumns) || u.grammarColumns.length < 2) errors.push(`${u.id}: gramer tablosu eksik.`);
  const lens=(u.grammarColumns ?? []).map(c=>c.values?.length ?? 0);
  if (lens.length && new Set(lens).size !== 1) errors.push(`${u.id}: gramer tablosu satir sayilari esit degil.`);
  if ((u.vocabulary?.length ?? 0) < 16) errors.push(`${u.id}: en az 16 kelime/kalip gerekli.`);
  if ((u.examples?.length ?? 0) < 6) errors.push(`${u.id}: en az 6 ozgun ornek gerekli.`);
  for (const item of u.vocabulary ?? []) {
    if (!item.includes(" — ")) errors.push(`${u.id}: kelime Turkce anlam ayiraci eksik: ${item}`);
    const de=item.split(" — ")[0];
    if (/^[A-ZÄÖÜ][a-zäöüß]/.test(de) && !/^(der|die|das)\s/.test(de)) warn.push(`${u.id}: isim artikel kontrolu onerilir: ${de}`);
  }
  for (const e of u.examples ?? []) {
    if (!e.de || !e.tr) errors.push(`${u.id}: cift dilli ornek eksik.`);
    normalizedGerman.push(e.de.toLocaleLowerCase("de-DE").replace(/[^\p{L}\p{N}\s]/gu,"").trim());
  }
  if (!u.miniCheck?.options?.includes(u.miniCheck.correctAnswer)) errors.push(`${u.id}: miniCheck cevabi seceneklerde yok.`);
  if (!u.fill?.acceptedAnswers?.includes(u.fill.answer)) errors.push(`${u.id}: fill acceptedAnswers cevabi icermiyor.`);
  if (!u.translation?.acceptedAnswers?.some(a=>a.replace(/[.!?]$/,"")===u.translation.answer.replace(/[.!?]$/,""))) errors.push(`${u.id}: translation acceptedAnswers cevabi icermiyor.`);
  if (!u.dialogue?.options?.includes(u.dialogue.answer)) errors.push(`${u.id}: dialogue cevabi seceneklerde yok.`);
  for (const a of u.multiSelect?.answers ?? []) if (!u.multiSelect.options?.includes(a)) errors.push(`${u.id}: multiSelect cevabi seceneklerde yok: ${a}`);
}
if (new Set(normalizedGerman).size !== normalizedGerman.length) errors.push("A1 temel Almanca orneklerinde birebir tekrar bulundu.");

const allText = units.map(u=>JSON.stringify(u)).join(" ");
const banned = ["Onkel Harry","Hallo! Ich bin Nicole","Der Tisch ist schön!","Wir suchen das Hotel Maritim"];
for (const token of banned) if (allText.includes(token)) errors.push(`Kaynak eser basligi/cumlesi kopyalanmis gorunuyor: ${token}`);

for (const e of enrich) {
  if ((e.cefrCanDo?.length ?? 0) < 3) errors.push(`${e.id}: CEFR can-do hedefleri eksik.`);
  if ((e.dialogue?.length ?? 0) < 6) errors.push(`${e.id}: diyalog en az 6 tur olmali.`);
  if ((e.reading?.de?.split(/\s+/).length ?? 0) < 35) errors.push(`${e.id}: okuma metni cok kisa.`);
  if ((e.listening?.de?.split(/\s+/).length ?? 0) < 30) errors.push(`${e.id}: dinleme metni cok kisa.`);
  if ((e.readingQuestions?.length ?? 0) < 3) errors.push(`${e.id}: okuma sorulari eksik.`);
  if ((e.listeningQuestions?.length ?? 0) < 3) errors.push(`${e.id}: dinleme sorulari eksik.`);
  for (const question of [...(e.readingQuestions ?? []), ...(e.listeningQuestions ?? [])]) {
    if (question.options && !question.options.includes(question.correctAnswer)) errors.push(`${e.id}: comprehension dogru cevap seceneklerde yok: ${question.id}`);
    if (!question.explanation) errors.push(`${e.id}: soru aciklamasi eksik: ${question.id}`);
  }
  if (!e.writingPrompt || !e.speakingPrompt || !e.realLifeMission) errors.push(`${e.id}: uretim/gercek yasam gorevi eksik.`);
}

for (const r of quality) {
  if (r.status !== "YAYINA_HAZIR") errors.push(`${r.unitId}: kalite durumu YAYINA_HAZIR degil.`);
  if (!Object.values(r.checks ?? {}).every(Boolean)) errors.push(`${r.unitId}: kalite kontrol maddelerinden biri tamamlanmamis.`);
}

const slides=read("data/slides.ts");
for (const token of ["v16ReadingQuestions = v16Content?.readingQuestions ?? []","v16ListeningQuestions = v16Content?.listeningQuestions ?? []","(unit.courseId === \"a1\" || unit.courseId === \"a2\") && v16Content ? v16Content.dialogue","(unit.courseId === \"a1\" || unit.courseId === \"a2\") && v16Content ? v16Content.reading","(unit.courseId === \"a1\" || unit.courseId === \"a2\") && v16Content ? v16Content.listening"]) {
  if (!slides.includes(token)) errors.push(`V33 A1 zengin icerik entegrasyonu eksik: ${token}`);
}

if (errors.length) {
  errors.forEach(e=>console.error(`HATA: ${e}`));
  console.error(`V33 A1 Gold Standard dogrulamasi basarisiz: ${errors.length} hata.`);
  process.exit(1);
}
console.log("V33 A1 Gold Standard doğrulaması başarılı:");
console.log("- 12 A1 ünitesi yeniden yazılmış ve benzersiz.");
console.log("- Her ünitede 4 kazanım, 16+ kelime/kalıp, 6+ çift dilli örnek ve tutarlı görevler var.");
console.log("- 12 özgün diyalog, okuma, dinleme, yazma, konuşma ve gerçek yaşam görevi entegre.");
console.log("- Eski tekrar eden gramer şablonu ve kaynak eser örnekleri Gold Standard katmanında yok.");
console.log("- Kalite kayıtları ve V33 yayın kapısı hazır.");
if (warn.length) console.log(`Bilgilendirme: ${warn.length} düşük öncelikli artikel kontrol uyarısı üretildi.`);
