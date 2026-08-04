import { createHash } from "node:crypto";

const strict = process.env.VERCEL === "1" || process.env.CI === "true";
const errors = [];
const warnings = [];

function value(name) {
  return String(process.env[name] ?? "").trim();
}

function placeholder(input) {
  return /replace-with|change-this|example\.com|USER:PASSWORD|PRISMA_DATABASE_URL|POSTGRES_HOST|development-only/i.test(input);
}

function requireValue(name, minLength = 1) {
  const current = value(name);
  if (!current) errors.push(`${name} tanımlı değil.`);
  else if (current.length < minLength) errors.push(`${name} en az ${minLength} karakter olmalı.`);
  else if (placeholder(current)) errors.push(`${name} örnek/placeholder değer içeriyor.`);
  return current;
}

function parseApplicationUrl(name, raw) {
  if (!raw) return null;
  try {
    const parsed = new URL(raw);
    const accepted = new Set(["postgres:", "postgresql:", "prisma:", "prisma+postgres:"]);
    if (!accepted.has(parsed.protocol)) {
      errors.push(`${name} Prisma/PostgreSQL bağlantı adresi olmalı.`);
      return null;
    }
    return parsed;
  } catch {
    errors.push(`${name} geçerli bir bağlantı adresi değil.`);
    return null;
  }
}

function parsePostgresUrl(name, raw) {
  if (!raw) return null;
  let parsed;
  try {
    parsed = new URL(raw);
  } catch {
    errors.push(`${name} geçerli bir bağlantı adresi değil.`);
    return null;
  }
  if (!["postgres:", "postgresql:"].includes(parsed.protocol)) {
    errors.push(`${name} doğrudan PostgreSQL bağlantı adresi olmalı.`);
    return null;
  }
  const host = parsed.hostname.toLowerCase().replace(/-pooler(?=\.|$)/g, "");
  const port = parsed.port || "5432";
  const database = decodeURIComponent(parsed.pathname.replace(/^\//, "")) || "postgres";
  const canonical = `${host}:${port}/${database}`;
  return { canonical, fingerprint: createHash("sha256").update(canonical).digest("hex") };
}

const databaseUrl = requireValue("DATABASE_URL", 20);
const postgresUrl = requireValue("DATABASE_POSTGRES_URL", 20);
const authSecret = requireValue("AUTH_SECRET", 32);
const securityHashKey = requireValue("SECURITY_HASH_KEY", 32);
const cronSecret = requireValue("CRON_SECRET", 32);
const databaseEnvironment = requireValue("DATABASE_ENVIRONMENT").toLowerCase();

if (databaseEnvironment && !["production", "preview", "development", "test"].includes(databaseEnvironment)) {
  errors.push("DATABASE_ENVIRONMENT production, preview, development veya test olmalı.");
}
const vercelEnvironment = value("VERCEL_ENV").toLowerCase();
if (vercelEnvironment && databaseEnvironment && vercelEnvironment !== databaseEnvironment) {
  errors.push(`DATABASE_ENVIRONMENT=${databaseEnvironment}, VERCEL_ENV=${vercelEnvironment} ile uyuşmuyor.`);
}

parseApplicationUrl("DATABASE_URL", databaseUrl);
const direct = parsePostgresUrl("DATABASE_POSTGRES_URL", postgresUrl);

const productionFingerprint = value("PRODUCTION_DATABASE_FINGERPRINT").toLowerCase();
if (databaseEnvironment && databaseEnvironment !== "production" && productionFingerprint && direct?.fingerprint === productionFingerprint) {
  errors.push(`${databaseEnvironment} ortamı production veritabanı parmak iziyle eşleşiyor.`);
}

const seedPreviewData = value("SEED_PREVIEW_TEST_DATA").toLowerCase() === "true";
const testUserPassword = value("TEST_USER_PASSWORD");
if (seedPreviewData && databaseEnvironment === "production") {
  errors.push("SEED_PREVIEW_TEST_DATA production ortamında true olamaz.");
}
if (seedPreviewData && strict && testUserPassword.length < 12) {
  errors.push("Preview test verisi açıkken TEST_USER_PASSWORD en az 12 karakter olmalıdır.");
}

if (authSecret && securityHashKey && authSecret === securityHashKey) {
  errors.push("AUTH_SECRET ve SECURITY_HASH_KEY farklı değerler olmalı.");
}
if (authSecret && cronSecret && authSecret === cronSecret) {
  errors.push("AUTH_SECRET ve CRON_SECRET farklı değerler olmalı.");
}

const googleEnabled = value("NEXT_PUBLIC_GOOGLE_AUTH_ENABLED").toLowerCase() === "true";
const googleId = value("AUTH_GOOGLE_ID");
const googleSecret = value("AUTH_GOOGLE_SECRET");
if (googleEnabled && (!googleId || !googleSecret)) {
  errors.push("Google girişi açıkken AUTH_GOOGLE_ID ve AUTH_GOOGLE_SECRET zorunludur.");
}
if (Boolean(googleId) !== Boolean(googleSecret)) {
  errors.push("AUTH_GOOGLE_ID ve AUTH_GOOGLE_SECRET birlikte tanımlanmalıdır.");
}

const backupKey = value("BACKUP_ENCRYPTION_KEY");
const blobConfigured = Boolean(value("BLOB_STORE_ID") || value("BLOB_READ_WRITE_TOKEN"));
if (blobConfigured && !backupKey) {
  errors.push("Blob yedekleme yapılandırılmışken BACKUP_ENCRYPTION_KEY zorunludur.");
}
if (backupKey) {
  try {
    const decoded = Buffer.from(backupKey, "base64");
    if (decoded.length !== 32 || decoded.toString("base64").replace(/=+$/, "") !== backupKey.replace(/=+$/, "")) {
      errors.push("BACKUP_ENCRYPTION_KEY tam olarak 32 rastgele baytın Base64 karşılığı olmalıdır.");
    }
  } catch {
    errors.push("BACKUP_ENCRYPTION_KEY geçerli Base64 değildir.");
  }
}

if (value("REQUIRE_EMAIL_VERIFICATION").toLowerCase() === "true") {
  if (!value("RESEND_API_KEY") || !value("EMAIL_FROM")) {
    errors.push("E-posta doğrulaması açıkken RESEND_API_KEY ve EMAIL_FROM zorunludur.");
  }
}

if (!strict && errors.length) warnings.push(...errors.splice(0));
for (const warning of warnings) console.warn(`[env warning] ${warning}`);
if (errors.length) {
  console.error("\nV28.1 ortam değişkeni kontrolü başarısız:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log(`V28.1 ortam değişkeni kontrolü başarılı${strict ? " (strict)" : " (development)"}.`);
