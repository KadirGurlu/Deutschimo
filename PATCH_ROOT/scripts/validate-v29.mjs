import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];

function read(relativePath) {
  const fullPath = path.join(root, relativePath);
  if (!fs.existsSync(fullPath)) {
    failures.push(`Eksik dosya: ${relativePath}`);
    return "";
  }
  return fs.readFileSync(fullPath, "utf8");
}

function requireText(content, needle, label) {
  if (!content.includes(needle)) failures.push(label);
}

function forbid(content, pattern, label) {
  if (pattern.test(content)) failures.push(label);
}

const packageJsonText = read("package.json");
const packageJson = packageJsonText ? JSON.parse(packageJsonText) : { scripts: {} };
const sidebar = read("components/layout/app-sidebar.tsx");
const page = read("app/writing-coach/page.tsx");
const component = read("components/writing-coach/writing-coach.tsx");
const styles = read("components/writing-coach/writing-coach.module.css");
const data = read("data/writing-coach.ts");
const types = read("types/writing-coach.ts");
const route = read("app/api/writing-coach/review/route.ts");
const schema = read("prisma/schema.prisma");
const migration = read("prisma/migrations/20260805003000_v29_writing_coach/migration.sql");

const versionMatch = /^(\d+)\.(\d+)\.(\d+)/u.exec(String(packageJson.version ?? ""));
const versionOk = Boolean(versionMatch) && (Number(versionMatch?.[1]) > 29 || (Number(versionMatch?.[1]) === 29 && Number(versionMatch?.[2]) >= 0));
if (!versionOk) failures.push("package.json sürümü 29.0.0 veya daha yeni olmalı.");
for (const script of ["validate:v28.1", "validate:v28.3", "validate:v28.4", "validate:v29", "vercel-build"]) {
  if (!packageJson.scripts?.[script]) failures.push(`package.json scripts.${script} eksik.`);
}
const vercelBuild = String(packageJson.scripts?.["vercel-build"] ?? "");
const validateStep = vercelBuild.indexOf("npm run validate:v29");
const deployStep = vercelBuild.indexOf("node scripts/db-deploy.mjs");
if (validateStep < 0 || deployStep <= validateStep) failures.push("V29 doğrulaması migration öncesinde çalışmalı.");

requireText(sidebar, '[PenLine, "Yazma Koçu", "/writing-coach", "writing-coach"]', "Yazma Koçu ana menü bağlantısı eksik.");
const coursesIndex = sidebar.indexOf('[BookOpenText, "Kurslar"');
const writingIndex = sidebar.indexOf('[PenLine, "Yazma Koçu"');
if (coursesIndex < 0 || writingIndex <= coursesIndex) failures.push("Yazma Koçu, Kurslar bölümünün hemen altında yer almalı.");
requireText(page, '<AppSidebar active="writing-coach"', "Yazma Koçu sayfası doğru menü durumunu kullanmıyor.");
requireText(page, "requireUser", "Yazma Koçu sayfası oturum koruması kullanmalı.");

for (const level of ["A1", "A2", "B1", "B2"]) {
  requireText(data, `level: "${level}"`, `${level} yazma senaryoları eksik.`);
}
const scenarioCount = (data.match(/id: "wc-/g) || []).length;
if (scenarioCount !== 24) failures.push(`Toplam 24 yazma senaryosu olmalı; bulunan: ${scenarioCount}.`);
for (const level of ["a1", "a2", "b1", "b2"]) {
  const count = (data.match(new RegExp(`id: "wc-${level}-`, "g")) || []).length;
  if (count !== 6) failures.push(`${level.toUpperCase()} seviyesinde 6 senaryo olmalı; bulunan: ${count}.`);
}

for (const text of ["hata yerlerini gör", "Hata türünü anla", "Şimdi metnini kendin yeniden yaz"]) {
  if (!component.toLocaleLowerCase("tr-TR").includes(text.toLocaleLowerCase("tr-TR"))) failures.push(`Üç aşamalı geri bildirimde “${text}” eksik.`);
}
for (const rubric of ["Görevi yerine getirme", "Gramer doğruluğu", "Kelime çeşitliliği", "Cümle bağlantıları", "Yazım ve noktalama", "Seviyeye uygunluk"]) {
  requireText(component, rubric, `Rubrik boyutu eksik: ${rubric}.`);
}
requireText(component, "highlightedText", "Hata yerlerini metin içinde işaretleyen arayüz eksik.");
if (!component.includes("Yeniden kontrol et") && !component.includes("Revizyonu değerlendir")) failures.push("Revizyon döngüsü eksik.");
requireText(component, "Hata geçmişin", "Öğrenci hata geçmişi paneli eksik.");
requireText(styles, ".errorMark", "Hata işaretleme stili eksik.");
requireText(styles, ".stageCard", "Üç aşamalı koçluk tasarımı eksik.");

for (const key of ["taskFulfillment", "grammarAccuracy", "vocabularyRange", "sentenceConnections", "spellingPunctuation", "levelAppropriateness"]) {
  requireText(types + route, key, `Yazma rubriğinde ${key} eksik.`);
}
for (const category of ["ARTICLE", "DATIVE", "VERB_POSITION", "VOCABULARY", "SPELLING", "PUNCTUATION", "REGISTER", "COHERENCE"]) {
  requireText(types + route, category, `Hata kategorisi eksik: ${category}.`);
}

requireText(route, "https://api.openai.com/v1/responses", "OpenAI Responses API entegrasyonu eksik.");
requireText(route, 'type: "json_schema"', "AI çıktısı strict JSON Schema ile sınırlandırılmalı.");
requireText(route, "Öğrencinin yerine yazma", "AI'nin doğru cevabı doğrudan yazmasını engelleyen talimat eksik.");
requireText(route, "studentText.includes(excerpt)", "AI hata alıntıları öğrenci metnine karşı doğrulanmalı.");
requireText(route, "directAnswerPattern", "AI çıktısında doğrudan doğru cevap sızıntısını engelleyen ikinci kontrol eksik.");
requireText(route, "writingErrorProfile.upsert", "Yazma hata geçmişi güncellenmiyor.");
requireText(route, "learningErrorHistory.upsert", "Yazma hataları ortak öğrenme hata geçmişine eklenmiyor.");
requireText(route, "dailyStudyPlan.deleteMany", "Yeni hata geçmişi sonrası günlük plan yenilenmiyor.");
requireText(route, "writingCoachAttempt.create", "Yazma revizyonları kaydedilmiyor.");
requireText(route, "writingCoachSession", "Yazma oturumu ve revizyon döngüsü eksik.");
requireText(route, "OPENAI_API_KEY", "Sunucu tarafı OpenAI anahtar desteği eksik.");
forbid(route, /NEXT_PUBLIC_OPENAI/i, "OpenAI anahtarı istemciye açık olamaz.");
forbid(route, /correctedText|modelAnswer|replacementText/i, "AI sözleşmesi düzeltilmiş metin veya model cevap alanı içeremez.");

for (const model of ["WritingCoachSession", "WritingCoachAttempt", "WritingErrorProfile"]) {
  requireText(schema, `model ${model}`, `Prisma şemasında ${model} modeli eksik.`);
  requireText(migration, `CREATE TABLE IF NOT EXISTS "${model}"`, `Migration içinde ${model} tablosu eksik.`);
}
for (const relation of ["writingCoachSessions", "writingCoachAttempts", "writingErrorProfiles"]) {
  requireText(schema, relation, `User ilişkisi eksik: ${relation}.`);
}
requireText(schema, "@@unique([userId, category])", "Kullanıcı ve hata kategorisi için tekil profil eksik.");
requireText(migration, "WritingCoachAttempt_sessionId_revisionNumber_key", "Revizyon numarası tekillik indeksi eksik.");
forbid(migration, /\b(DROP\s+TABLE|TRUNCATE|DELETE\s+FROM|DROP\s+COLUMN)\b/i, "V29 migration'ı yıkıcı SQL içeremez.");

if (failures.length) {
  console.error("\nV29 doğrulaması başarısız:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("V29 doğrulaması başarılı: A1-B2 senaryoları, üç aşamalı AI koçluğu, altı boyutlu rubrik, revizyon ve hata geçmişi hazır.");
