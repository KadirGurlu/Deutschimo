import crypto from "node:crypto";

function argValue(name) {
  const prefix = `--${name}=`;
  const item = process.argv.slice(2).find((value) => value.startsWith(prefix));
  return item ? item.slice(prefix.length).trim().toLowerCase() : "";
}

function hasFlag(name) {
  return process.argv.slice(2).includes(`--${name}`);
}

function fail(message) {
  console.error(`V31.1 veritabani ayrimi HATASI: ${message}`);
  process.exit(1);
}

function normalizeEnvironment(value) {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (normalized === "staging") return "preview";
  return normalized;
}

function identityFromUrl(raw) {
  if (!raw) return null;
  let parsed;
  try {
    parsed = new URL(raw);
  } catch {
    fail("DATABASE_URL gecerli bir PostgreSQL URL'si degil.");
  }
  const database = parsed.pathname.replace(/^\//, "") || "postgres";
  const identity = `${parsed.hostname.toLowerCase()}:${parsed.port || "5432"}/${database}:${parsed.username}`;
  const fingerprint = crypto.createHash("sha256").update(identity).digest("hex");
  return {
    host: parsed.hostname,
    database,
    fingerprint,
    shortFingerprint: fingerprint.slice(0, 16),
  };
}

const allowed = new Set(["development", "test", "preview", "production"]);
const expected = normalizeEnvironment(argValue("expect"));
const declared = normalizeEnvironment(process.env.DATABASE_ENVIRONMENT);
const vercel = normalizeEnvironment(process.env.VERCEL_ENV);
const ci = process.env.CI === "true";
const strict = hasFlag("strict-separation");
const current = identityFromUrl(process.env.DATABASE_URL);

if (!process.env.DATABASE_URL) {
  fail("DATABASE_URL tanimli degil.");
}
if (!declared) {
  fail("DATABASE_ENVIRONMENT tanimli degil. preview, production, test veya development kullanin.");
}
if (!allowed.has(declared)) {
  fail(`DATABASE_ENVIRONMENT desteklenmiyor: ${declared}`);
}
if (expected && declared !== expected) {
  fail(`Beklenen ortam '${expected}', tanimlanan ortam '${declared}'.`);
}
if (vercel === "production" && declared !== "production") {
  fail(`VERCEL_ENV=production iken DATABASE_ENVIRONMENT=${declared} olamaz.`);
}
if (vercel === "preview" && declared !== "preview") {
  fail(`VERCEL_ENV=preview iken DATABASE_ENVIRONMENT=${declared} olamaz.`);
}
if (vercel === "development" && !new Set(["development", "test"]).has(declared)) {
  fail(`VERCEL_ENV=development iken DATABASE_ENVIRONMENT=${declared} olamaz.`);
}
if (ci && !vercel && !new Set(["test", "preview"]).has(declared)) {
  fail(`CI calismasinda production veritabani kullanimi engellendi: ${declared}`);
}

const productionFingerprint = String(process.env.PRODUCTION_DATABASE_FINGERPRINT ?? "").trim().toLowerCase();
const previewFingerprint = String(process.env.PREVIEW_DATABASE_FINGERPRINT ?? "").trim().toLowerCase();

if (productionFingerprint && previewFingerprint && productionFingerprint === previewFingerprint) {
  fail("PRODUCTION_DATABASE_FINGERPRINT ve PREVIEW_DATABASE_FINGERPRINT ayni. Veritabanlari ayrilmamis.");
}
if (declared !== "production" && productionFingerprint && current.fingerprint === productionFingerprint) {
  fail("Preview/test ortami Production veritabanina baglaniyor.");
}
if (declared === "production" && previewFingerprint && current.fingerprint === previewFingerprint) {
  fail("Production ortami Preview veritabanina baglaniyor.");
}
if (declared === "production" && productionFingerprint && current.fingerprint !== productionFingerprint) {
  fail("Production DATABASE_URL parmak izi kayitli Production parmak iziyle eslesmiyor.");
}
if (declared === "preview" && previewFingerprint && current.fingerprint !== previewFingerprint) {
  fail("Preview DATABASE_URL parmak izi kayitli Preview parmak iziyle eslesmiyor.");
}

if (strict) {
  if (!productionFingerprint || !previewFingerprint) {
    fail("Strict ayrim kontrolu icin hem PRODUCTION_DATABASE_FINGERPRINT hem PREVIEW_DATABASE_FINGERPRINT tanimlanmali.");
  }
  if (declared === "production" && current.fingerprint !== productionFingerprint) {
    fail("Strict kontrolde Production parmak izi eslesmedi.");
  }
  if (declared === "preview" && current.fingerprint !== previewFingerprint) {
    fail("Strict kontrolde Preview parmak izi eslesmedi.");
  }
}

console.log("V31.1 veritabani ortam kontrolu basarili.");
console.log(`Ortam: ${declared}`);
console.log(`Hedef: ${current.host}/${current.database}`);
console.log(`DATABASE_FINGERPRINT=${current.fingerprint}`);
if (!productionFingerprint || !previewFingerprint) {
  console.warn("Uyari: Tam Preview/Production karsilastirmasi icin iki parmak izini de Vercel ortam degiskenlerine ekleyin.");
}
