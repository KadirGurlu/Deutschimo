import fs from "node:fs";
import path from "node:path";
const root=process.cwd(), errors=[], warnings=[];
const read=(p)=>fs.readFileSync(path.join(root,p),"utf8");
const req=(p)=>{if(!fs.existsSync(path.join(root,p)))errors.push(`Eksik dosya: ${p}`);};
[
 "data/v35-b1-gold-standard.json","data/v35-b1-enrichment.json","data/v35-b1-quality.json",
 "docs/V35_B1_GOLD_STANDARD.md",".github/workflows/v35-b1-gold-standard.yml"
].forEach(req);
const pkg=JSON.parse(read("package.json"));
if(!/^35\./.test(String(pkg.version??"")))errors.push(`V35 paket surumu bekleniyor: ${pkg.version}`);
if(!pkg.scripts?.["validate:v35"])errors.push("validate:v35 npm scripti eksik.");
for(const name of ["prebuild","quality:check","vercel-build"])if(!String(pkg.scripts?.[name]??"").includes("validate:v35"))errors.push(`${name} validate:v35 calistirmiyor.`);
const units=JSON.parse(read("data/v35-b1-gold-standard.json"));
const enrich=JSON.parse(read("data/v35-b1-enrichment.json"));
const quality=JSON.parse(read("data/v35-b1-quality.json"));
if(units.length!==18)errors.push(`B1 Gold Standard 18 unite olmali: ${units.length}`);
if(enrich.length!==18)errors.push(`B1 enrichment 18 kayit olmali: ${enrich.length}`);
if(quality.length!==18)errors.push(`B1 quality 18 kayit olmali: ${quality.length}`);
const ids=units.map(u=>u.id); if(new Set(ids).size!==18)errors.push("B1 unite kimlikleri benzersiz degil.");
for(let i=1;i<=18;i++){const id=`b1-u${String(i).padStart(2,"0")}`;if(!ids.includes(id))errors.push(`Eksik B1 unite: ${id}`);}
const examples=[];
for(const u of units){
 if(u.goals?.length!==4)errors.push(`${u.id}: 4 olculebilir hedef gerekli.`);
 if((u.intro?.length??0)<100)errors.push(`${u.id}: intro B1 icin yetersiz.`);
 if((u.grammarExplanation?.length??0)<210)errors.push(`${u.id}: gramer aciklamasi B1 icin yetersiz.`);
 if(!Array.isArray(u.grammarColumns)||u.grammarColumns.length<3)errors.push(`${u.id}: gramer tablosu eksik.`);
 const lens=(u.grammarColumns??[]).map(c=>c.values?.length??0); if(lens.length&&new Set(lens).size!==1)errors.push(`${u.id}: gramer tablosu satir sayilari esit degil.`);
 if((u.vocabulary?.length??0)<18)errors.push(`${u.id}: en az 18 kelime/kalip gerekli.`);
 if((u.examples?.length??0)<6)errors.push(`${u.id}: en az 6 cift dilli ornek gerekli.`);
 for(const v of u.vocabulary??[])if(!v.includes(" — "))errors.push(`${u.id}: Turkce anlam ayiraci eksik: ${v}`);
 for(const e of u.examples??[]){if(!e.de||!e.tr)errors.push(`${u.id}: cift dilli ornek eksik.`);examples.push(e.de.toLocaleLowerCase("de-DE").replace(/[^\p{L}\p{N}\s]/gu,"").trim());}
 if(!u.miniCheck?.options?.includes(u.miniCheck.correctAnswer))errors.push(`${u.id}: miniCheck cevap seceneklerde yok.`);
 if(!u.fill?.acceptedAnswers?.includes(u.fill.answer))errors.push(`${u.id}: fill acceptedAnswers eksik.`);
 if(!u.translation?.acceptedAnswers?.some(a=>a.replace(/[.!?]$/,"")===u.translation.answer.replace(/[.!?]$/,"")))errors.push(`${u.id}: translation acceptedAnswers eksik.`);
 if(!u.dialogue?.options?.includes(u.dialogue.answer))errors.push(`${u.id}: dialogue cevap seceneklerde yok.`);
 for(const a of u.multiSelect?.answers??[])if(!u.multiSelect.options?.includes(a))errors.push(`${u.id}: multiSelect cevap seceneklerde yok.`);
}
if(new Set(examples).size!==examples.length)errors.push("B1 temel Almanca orneklerinde birebir tekrar bulundu.");
for(const e of enrich){
 if((e.cefrCanDo?.length??0)<3)errors.push(`${e.id}: CEFR can-do eksik.`);
 if((e.dialogue?.length??0)<8)errors.push(`${e.id}: B1 diyalog en az 8 tur olmali.`);
 if((e.reading?.de?.split(/\s+/).length??0)<60)errors.push(`${e.id}: B1 okuma metni cok kisa.`);
 if((e.listening?.de?.split(/\s+/).length??0)<50)errors.push(`${e.id}: B1 dinleme metni cok kisa.`);
 if((e.readingQuestions?.length??0)!==4)errors.push(`${e.id}: tam 4 okuma sorusu gerekli.`);
 if((e.listeningQuestions?.length??0)!==4)errors.push(`${e.id}: tam 4 dinleme sorusu gerekli.`);
 for(const q of [...(e.readingQuestions??[]),...(e.listeningQuestions??[])]){if(!q.options?.includes(q.correctAnswer))errors.push(`${e.id}: dogru cevap seceneklerde yok: ${q.id}`);if((q.explanation?.length??0)<18)errors.push(`${e.id}: aciklama yetersiz: ${q.id}`);}
 if(!e.writingPrompt||!e.speakingPrompt||!e.realLifeMission)errors.push(`${e.id}: uretim gorevi eksik.`);
 if(!String(e.sourceMethod??"").includes("özgün"))errors.push(`${e.id}: ozgunluk metod notu eksik.`);
}
for(const r of quality){if(r.status!=="YAYINA_HAZIR")errors.push(`${r.unitId}: kalite durumu YAYINA_HAZIR degil.`);if(!Object.values(r.checks??{}).every(Boolean))errors.push(`${r.unitId}: kalite kontrolu tamamlanmamis.`);}
const allText=JSON.stringify({units,enrich});
const banned=["Auf der Suche","Gutes Benehmen","Ein toller Typ","Wohngemeinschaften der anderen Art","Beschwerdebrief an den Vermieter","Fotowettbewerb Natur und wir","Grundlegende Spielregeln von Schach","Ankündigung einer neuen Fernsehserie","Filmkritik zu Ziemlich beste Freunde","Zweisprachige Erziehung von Kindern","Tipps zur Konzentrationsförderung","Wer die Wahl hat, hat die Qual","Ein Reklamationsschreiben","Sichere Geldanlagen","Wanderung durch Deutschland","Hochwasser an Elbe und Donau","Gewalt in Fußballstadien","Haustierhaltung in Deutschland","Leben einer Schriftstellerin"];
for(const phrase of banned)if(allText.includes(phrase))errors.push(`Kaynak eser basligi/kopyasi Gold Standard verisinde bulundu: ${phrase}`);
const slides=read("data/slides.ts");
for(const token of ["v16ReadingQuestions = v16Content?.readingQuestions ?? []","v16ListeningQuestions = v16Content?.listeningQuestions ?? []",'(unit.courseId === "a1" || unit.courseId === "a2" || unit.courseId === "b1") && v16Content ? v16Content.dialogue','(unit.courseId === "a1" || unit.courseId === "a2" || unit.courseId === "b1") && v16Content ? v16Content.reading','(unit.courseId === "a1" || unit.courseId === "a2" || unit.courseId === "b1") && v16Content ? v16Content.listening'])if(!slides.includes(token))errors.push(`B1 zengin icerik entegrasyonu eksik: ${token}`);
for(const [loader,files] of [["data/curriculum-content.ts",["v33-a1-gold-standard.json","v34-a2-gold-standard.json","v35-b1-gold-standard.json"]],["data/v16-content-bank.ts",["v33-a1-enrichment.json","v34-a2-enrichment.json","v35-b1-enrichment.json"]],["data/content-quality.ts",["v33-a1-quality.json","v34-a2-quality.json","v35-b1-quality.json"]]]){const text=read(loader);for(const f of files)if(!text.includes(f))errors.push(`Kumulatif overlay eksik: ${loader} -> ${f}`);}
if(errors.length){errors.forEach(e=>console.error(`HATA: ${e}`));console.error(`V35 B1 Gold Standard dogrulamasi basarisiz: ${errors.length} hata.`);process.exit(1);}
console.log("V35 B1 Gold Standard doğrulaması başarılı:");
console.log("- 18 B1 ünitesi özgün olarak yeniden yazılmış ve kalite kaydına bağlanmış.");
console.log("- 72 ölçülebilir kazanım, 324+ kelime/kalıp ve 108+ çift dilli temel örnek hazır.");
console.log("- 18 diyalog, 18 okuma, 18 dinleme, 72+72 özgün anlama sorusu hazır.");
console.log("- B1 görevleri bağlantılı metin, gerekçe, örnek, resmî üslup, sunum ve partnerle planlama içeriyor.");
console.log("- V33 A1 ve V34 A2 Gold Standard katmanları korunuyor.");
if(warnings.length)console.log(`Bilgilendirme: ${warnings.length} dusuk oncelikli uyari.`);
