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

function atLeast(value, minimum) {
  const version = parseVersion(value);
  if (!version) return false;
  if (version.major !== minimum.major) return version.major > minimum.major;
  if (version.minor !== minimum.minor) return version.minor > minimum.minor;
  return version.patch >= minimum.patch;
}

const packageJson = JSON.parse(read("package.json") || "{}");
const schema = read("prisma/schema.prisma");
const migration = read("prisma/migrations/20260805150000_v31_platform_core/migration.sql");
const middleware = read("middleware.ts");
const nextConfig = read("next.config.ts");
const contracts = read("lib/platform/contracts.ts");
const response = read("lib/platform/response.ts");
const idempotency = read("lib/platform/idempotency.ts");
const device = read("lib/platform/device.ts");
const platformAuth = read("lib/platform/auth.ts");
const rateLimit = read("lib/platform/rate-limit.ts");
const apiMonitor = read("lib/security/api-monitor.ts");
const maintenance = read("lib/platform/maintenance.ts");
const health = read("app/api/v1/health/route.ts");
const bootstrap = read("app/api/v1/bootstrap/route.ts");
const devices = read("app/api/v1/devices/route.ts");
const cron = read("app/api/cron/daily-maintenance/route.ts");
const cleanupScript = read("scripts/maintenance-cleanup.mjs");
const writingRoute = read("app/api/writing-coach/review/route.ts");
const germanyEvaluate = read("app/api/real-germany/evaluate/route.ts");
const germanyProgress = read("app/api/real-germany/progress/route.ts");
const docs = read("docs/V31_PLATFORM_CORE.md");

if (!atLeast(packageJson.version, { major: 31, minor: 0, patch: 0 })) {
  failures.push("package.json sürümü 31.0.0 veya daha yeni olmalı.");
}
for (const script of ["validate:v31", "maintenance:cleanup", "vercel-build", "quality:check"]) {
  if (!packageJson.scripts?.[script]) failures.push(`package.json scripts.${script} eksik.`);
}
const vercelBuild = String(packageJson.scripts?.["vercel-build"] ?? "");
const validationIndex = vercelBuild.indexOf("npm run validate:v31");
const deployIndex = vercelBuild.indexOf("node scripts/db-deploy.mjs");
if (validationIndex < 0 || deployIndex <= validationIndex) failures.push("V31 doğrulaması migration öncesinde çalışmalı.");

for (const needle of [
  "enum ClientPlatform",
  "model ClientDevice",
  "model ApiIdempotencyRecord",
  "deviceIdHash",
  "@@unique([userId, deviceIdHash])",
  "@@unique([userId, route, keyHash])",
]) requireText(schema, needle, `Prisma V31 yapısı eksik: ${needle}.`);
if (/\bdeviceId\s+String/u.test(schema)) failures.push("Ham deviceId veritabanında saklanmamalı; yalnızca deviceIdHash kullanılmalı.");

for (const needle of [
  'CREATE TYPE "ClientPlatform"',
  'CREATE TABLE "ClientDevice"',
  'CREATE TABLE "ApiIdempotencyRecord"',
  'ON DELETE CASCADE',
]) requireText(migration, needle, `V31 migration öğesi eksik: ${needle}.`);
if (/DROP TABLE|DROP COLUMN|TRUNCATE|DELETE FROM/iu.test(migration)) failures.push("V31 migration veri silen komut içermemeli.");

for (const needle of [
  'DEUTSCHIMO_API_VERSION = "v1"',
  'DEUTSCHIMO_PLATFORM_VERSION = "31.0.0"',
  "ApiSuccess",
  "ApiFailure",
]) requireText(contracts, needle, `API sözleşmesi eksik: ${needle}.`);
for (const needle of ["x-deutschimo-api-version", "x-request-id", "Cache-Control"]) {
  requireText(response, needle, `Standart API yanıt başlığı eksik: ${needle}.`);
}

for (const needle of [
  "Idempotency-Key",
  "requestHash",
  "securityHash",
  "P2002",
  "expiresAt",
]) requireText(idempotency, needle, `Idempotency güvenliği eksik: ${needle}.`);
for (const needle of ["deviceId", "platform", "appVersion", "12,256"]) {
  requireText(device, needle, `Cihaz giriş doğrulaması eksik: ${needle}.`);
}
requireText(platformAuth, "getPlatformApiUser", "Mobil hazır auth soyutlaması eksik.");
requireText(rateLimit, "consumeRateLimit", "Platform rate limit köprüsü eksik.");
for (const needle of ["monitoredFailure", "route.startsWith(\"/api/v1/\")", "!response.headers.has(\"Cache-Control\")"]) {
  requireText(apiMonitor, needle, `API monitor V31 davranışı eksik: ${needle}.`);
}

for (const [content, routeName] of [[health, "health"], [bootstrap, "bootstrap"], [devices, "devices"]]) {
  requireText(content, "withApiMonitoring", `${routeName} endpoint'i API izleme katmanını kullanmalı.`);
  requireText(content, "apiSuccess", `${routeName} endpoint'i standart API yanıtını kullanmalı.`);
}
for (const needle of ["deep", "HEALTH_CHECK_SECRET", "SELECT 1", "2_500"]) {
  requireText(health, needle, `Health endpoint güvenliği eksik: ${needle}.`);
}
for (const needle of ["clientCompatibility", "capabilities", "offlineSync: false", "mobileAuthentication: false"]) {
  requireText(bootstrap, needle, `Bootstrap sözleşmesi eksik: ${needle}.`);
}
for (const needle of ["runIdempotentMutation", "Idempotency-Replayed", "CLIENT_DEVICE_REGISTERED", "CLIENT_DEVICE_REVOKED"]) {
  requireText(devices, needle, `Cihaz endpoint'i eksik: ${needle}.`);
}

for (const needle of [
  "Content-Security-Policy",
  "Content-Security-Policy-Report-Only",
  "Origin-Agent-Cluster",
  "Cross-Origin-Resource-Policy",
  "X-Robots-Tag",
  "minimumCacheTTL",
]) requireText(nextConfig, needle, `Next.js güvenlik/performans ayarı eksik: ${needle}.`);
for (const needle of ["violatesSameOrigin", "x-request-id", "x-deutschimo-api-version", "csrfExemptPrefixes"]) {
  requireText(middleware, needle, `Middleware güvenlik öğesi eksik: ${needle}.`);
}

for (const needle of [
  "apiIdempotencyRecord.deleteMany",
  'scope: { not: "session-revocation" }',
  'scope: "session-revocation"',
  "clientDevice.deleteMany",
]) requireText(maintenance, needle, `Bakım politikası eksik: ${needle}.`);
requireText(cron, "runPlatformMaintenance", "Günlük bakım V31 temizliğini çağırmalı.");
requireText(cron, "safeSecretEqual", "Günlük bakım sabit zamanlı secret karşılaştırması kullanmalı.");
requireText(cleanupScript, "apiIdempotencyRecord.deleteMany", "Manuel bakım scripti idempotency kayıtlarını temizlemeli.");

for (const [content, label] of [
  [writingRoute, "Yazma Koçu"],
  [germanyEvaluate, "Gerçek Almanya değerlendirme"],
  [germanyProgress, "Gerçek Almanya ilerleme"],
]) {
  requireText(content, "maxBodyBytes", `${label} endpoint'inde istek boyutu sınırı eksik.`);
}
requireText(germanyProgress, "parseSkillScores", "V30.2 JSON okuma hotfix'i V31 paketinde korunmalı.");

for (const needle of [
  "güvenlik",
  "mobil",
  "idempotency",
  "cihaz",
  "bakım",
  "API v1",
]) {
  if (!docs.toLocaleLowerCase("tr-TR").includes(needle.toLocaleLowerCase("tr-TR"))) {
    failures.push(`V31 dokümanında konu eksik: ${needle}.`);
  }
}

if (failures.length) {
  console.error("\nV31 doğrulaması başarısız:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("V31 doğrulaması başarılı: güvenlik başlıkları, API v1 sözleşmesi, cihaz kaydı, idempotency, bakım ve mobil hazırlık katmanları hazır.");
