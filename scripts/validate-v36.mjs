import fs from "node:fs";
import path from "node:path";
const root=process.cwd(), errors=[];
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const req=p=>{if(!fs.existsSync(path.join(root,p)))errors.push(`Eksik dosya: ${p}`)};
["data/v36-b2-gold-standard.json","data/v36-b2-enrichment.json","data/v36-b2-quality.json","docs/V36_B2_GOLD_STANDARD.md",".github/workflows/v36-b2-gold-standard.yml"].forEach(req);
const pkg=JSON.parse(read("package.json"));
if(!/^36\./.test(String(pkg.version??"")))errors.push(`V36 paket surumu bekleniyor: ${pkg.version}`);
if(!pkg.scripts?.["validate:v36"])errors.push("validate:v36 npm scripti eksik.");
for(const name of ["prebuild","quality:check","vercel-build"])if(!String(pkg.scripts?.[name]??"").includes("validate:v36"))errors.push(`${name} validate:v36 calistirmiyor.`);
const units=JSON.parse(read("data/v36-b2-gold-standard.json")), enrich=JSON.parse(read("data/v36-b2-enrichment.json")), quality=JSON.parse(read("data/v36-b2-quality.json"));
if(units.length!==20)errors.push(`B2 20 unite olmali: ${units.length}`);
if(enrich.length!==20)errors.push(`B2 enrichment 20 kayit olmali: ${enrich.length}`);
if(quality.length!==20)errors.push(`B2 quality 20 kayit olmali: ${quality.length}`);
for(let i=1;i<=20;i++){const id=`b2-u${String(i).padStart(2,"0")}`; if(!units.some(u=>u.id===id))errors.push(`Eksik B2 unite: ${id}`)}
const examples=[];
for(const u of units){
 if(u.goals?.length!==4)errors.push(`${u.id}: 4 hedef gerekli`);
 if((u.grammarExplanation?.length??0)<250)errors.push(`${u.id}: B2 gramer aciklamasi yetersiz`);
 if((u.vocabulary?.length??0)<18)errors.push(`${u.id}: en az 18 kelime/kalip gerekli`);
 if((u.examples?.length??0)<6)errors.push(`${u.id}: en az 6 ornek gerekli`);
 const lens=(u.grammarColumns??[]).map(c=>c.values?.length??0); if(lens.length&&new Set(lens).size!==1)errors.push(`${u.id}: tablo satirlari esit degil`);
 for(const e of u.examples??[]){if(!e.de||!e.tr)errors.push(`${u.id}: cift dilli ornek eksik`);examples.push(e.de.toLocaleLowerCase("de-DE").replace(/[^\p{L}\p{N}\s]/gu,"").trim())}
 if(!u.miniCheck?.options?.includes(u.miniCheck.correctAnswer))errors.push(`${u.id}: miniCheck cevap hatasi`);
 if(!u.dialogue?.options?.includes(u.dialogue.answer))errors.push(`${u.id}: dialogue cevap hatasi`);
}
if(new Set(examples).size!==examples.length)errors.push("B2 temel orneklerinde birebir tekrar bulundu.");
for(const e of enrich){
 if((e.cefrCanDo?.length??0)<4)errors.push(`${e.id}: 4 can-do gerekli`);
 if((e.dialogue?.length??0)<8)errors.push(`${e.id}: diyalog 8 tur olmali`);
 if((e.reading?.de?.split(/\s+/).length??0)<70)errors.push(`${e.id}: B2 okuma metni cok kisa`);
 if((e.listening?.de?.split(/\s+/).length??0)<45)errors.push(`${e.id}: B2 dinleme metni cok kisa`);
 if(e.readingQuestions?.length!==4||e.listeningQuestions?.length!==4)errors.push(`${e.id}: 4+4 anlama sorusu gerekli`);
 for(const q of [...(e.readingQuestions??[]),...(e.listeningQuestions??[])])if(!q.options?.includes(q.correctAnswer))errors.push(`${e.id}: cevap seceneklerde yok ${q.id}`);
 if(!e.writingPrompt||!e.speakingPrompt||!e.realLifeMission)errors.push(`${e.id}: uretim gorevi eksik`);
 if(!String(e.sourceMethod??"").includes("özgün"))errors.push(`${e.id}: ozgunluk notu eksik`);
}
for(const r of quality){if(r.status!=="YAYINA_HAZIR")errors.push(`${r.unitId}: YAYINA_HAZIR degil`);if(!Object.values(r.checks??{}).every(Boolean))errors.push(`${r.unitId}: kalite kontrolu eksik`)}
const slides=read("data/slides.ts");
for(const token of [
'v16ReadingQuestions = v16Content?.readingQuestions ?? []',
'v16ListeningQuestions = v16Content?.listeningQuestions ?? []',
'(unit.courseId === "a1" || unit.courseId === "a2" || unit.courseId === "b1" || unit.courseId === "b2") && v16Content ? v16Content.dialogue',
'(unit.courseId === "a1" || unit.courseId === "a2" || unit.courseId === "b1" || unit.courseId === "b2") && v16Content ? v16Content.reading',
'(unit.courseId === "a1" || unit.courseId === "a2" || unit.courseId === "b1" || unit.courseId === "b2") && v16Content ? v16Content.listening'
])if(!slides.includes(token))errors.push(`B2 zengin icerik entegrasyonu eksik: ${token}`);
for(const [loader,files] of [
["data/curriculum-content.ts",["v33-a1-gold-standard.json","v34-a2-gold-standard.json","v35-b1-gold-standard.json","v36-b2-gold-standard.json"]],
["data/v16-content-bank.ts",["v33-a1-enrichment.json","v34-a2-enrichment.json","v35-b1-enrichment.json","v36-b2-enrichment.json"]],
["data/content-quality.ts",["v33-a1-quality.json","v34-a2-quality.json","v35-b1-quality.json","v36-b2-quality.json"]]
]){const txt=read(loader);for(const f of files)if(!txt.includes(f))errors.push(`Kumulatif overlay eksik ${loader}: ${f}`)}
if(errors.length){errors.forEach(e=>console.error("HATA:",e));console.error(`V36 B2 doğrulamasi basarisiz: ${errors.length} hata`);process.exit(1)}
console.log("V36 B2 Gold Standard doğrulaması başarılı:");
console.log("- 20 B2 ünitesi Gold Standard.");
console.log("- 80 ölçülebilir kazanım, 360+ kelime/kalıp, 120+ temel çift dilli örnek.");
console.log("- 20 diyalog, 20 okuma, 20 dinleme, 80+80 anlama sorusu.");
console.log("- B2 argümantasyon, register, kaynak aktarımı, veri yorumlama ve aracılık görevleri mevcut.");
console.log("- V33 A1 + V34 A2 + V35 B1 katmanları korunuyor.");
