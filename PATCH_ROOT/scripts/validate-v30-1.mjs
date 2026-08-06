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

function parseVersion(value) {
  const match = /^(\d+)\.(\d+)\.(\d+)(?:[-+].*)?$/u.exec(String(value ?? ""));
  if (!match) return null;
  return { major: Number(match[1]), minor: Number(match[2]), patch: Number(match[3]) };
}

function isAtLeastVersion(version, minimum) {
  if (!version) return false;
  if (version.major !== minimum.major) return version.major > minimum.major;
  if (version.minor !== minimum.minor) return version.minor > minimum.minor;
  return version.patch >= minimum.patch;
}

const packageJsonText = read("package.json");
const packageJson = packageJsonText ? JSON.parse(packageJsonText) : { scripts: {} };
const sidebar = read("components/layout/app-sidebar.tsx");
const page = read("app/real-germany/page.tsx");
const component = read("components/real-germany/real-germany-mode.tsx");
const styles = read("components/real-germany/real-germany-mode.module.css");
const data = read("data/real-germany.ts");
const types = read("types/real-germany.ts");
const docs = read("docs/V30_1_REAL_GERMANY_MODE.md");

const version = parseVersion(packageJson.version);
if (!isAtLeastVersion(version, { major: 30, minor: 1, patch: 0 })) failures.push("package.json sürümü 30.1.0 veya daha yeni olmalı.");
for (const script of ["validate:v30.1", "validate:v29.2", "vercel-build", "quality:check"]) {
  if (!packageJson.scripts?.[script]) failures.push(`package.json scripts.${script} eksik.`);
}
const vercelBuild = String(packageJson.scripts?.["vercel-build"] ?? "");
const v301Step = vercelBuild.indexOf("npm run validate:v30.1");
const deployStep = vercelBuild.indexOf("node scripts/db-deploy.mjs");
if (v301Step < 0 || deployStep <= v301Step) failures.push("V30.1 doğrulaması migration öncesinde çalışmalı.");

requireText(sidebar, '[MapPinned, "Gerçek Almanya Modu", "/real-germany", "real-germany"]', "Sidebar bağlantısı eksik.");
const germanyIndex = sidebar.indexOf('[MapPinned, "Gerçek Almanya Modu"');
const profileIndex = sidebar.indexOf('[UserRound, "Profil"');
if (germanyIndex < 0 || profileIndex <= germanyIndex) failures.push("Gerçek Almanya Modu, Profilin üstünde yer almalı.");

requireText(page, '<AppSidebar active="real-germany"', "Real Germany sayfası doğru menü durumunu kullanmıyor.");
requireText(page, "requireUser", "Real Germany sayfası oturum koruması kullanmalı.");
requireText(page, "RealGermanyMode", "Sayfa bileşeni eksik.");

for (const typeName of ["RealGermanyLevel", "RealGermanyStepKind", "RealGermanyScenario"]) {
  requireText(types, typeName, `Tip eksik: ${typeName}.`);
}
for (const text of [
  "Gerçek Almanya Modu",
  "Okuma",
  "Dinleme",
  "Form",
  "Yazma",
  "Görevi değerlendir",
]) {
  if (!component.toLocaleLowerCase("tr-TR").includes(text.toLocaleLowerCase("tr-TR"))) failures.push(`Arayüz metni eksik: ${text}.`);
}
for (const cssNeedle of [
  ".scenarioGrid",
  ".tagCloud",
  ".stepCard",
  ".progressTrack",
  ".actionRow",
]) {
  requireText(styles, cssNeedle, `V30.1 stili eksik: ${cssNeedle}.`);
}

const scenarioCount = (data.match(/id: "rgm-/g) || []).length;
if (scenarioCount < 32) failures.push(`En az 32 senaryo olmalı; bulunan: ${scenarioCount}.`);
for (const level of ["a1", "a2", "b1", "b2"]) {
  const count = (data.match(new RegExp(`id: "rgm-${level}-`, "g")) || []).length;
  if (count < 8) failures.push(`${level.toUpperCase()} seviyesinde en az 8 senaryo olmalı; bulunan: ${count}.`);
}
for (const category of [
  "Almanya'ya ilk geliş",
  "Anmeldung",
  "Sağlık sigortası",
  "Banka hesabı",
  "Ev arama",
  "Doktor ve eczane",
  "Üniversite işlemleri",
  "İş başvurusu",
  "İş görüşmesi",
  "İş yerindeki iletişim",
  "Toplu taşıma",
  "Vergi ve resmî yazışmalar",
  "Komşuluk ve günlük hayat",
]) {
  requireText(data, category, `Kategori eksik: ${category}.`);
}
requireText(docs, "V30.1 — Gerçek Almanya Modu", "V30.1 dokümanı eksik veya başlığı hatalı.");

if (failures.length) {
  console.error("\nV30.1 doğrulaması başarısız:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("V30.1 doğrulaması başarılı: yeni sidebar bağlantısı, A1–B2 gerçek görev akışları ve genişletilmiş senaryo kütüphanesi hazır.");
