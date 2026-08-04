import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";

export const BASELINE_MIGRATION = "20260803143000_v28_1_baseline";
export const PRODUCTION_BASELINE_CONFIRMATION = "DEUTSCHIMO_V28_1";
export const DATABASE_ENVIRONMENTS = new Set(["production", "preview", "development", "test"]);

function value(name) {
  return String(process.env[name] ?? "").trim();
}

export function truthy(name, fallback = false) {
  const current = value(name).toLowerCase();
  if (!current) return fallback;
  return ["1", "true", "yes", "on"].includes(current);
}

export function resolveDatabaseEnvironment() {
  const explicit = value("DATABASE_ENVIRONMENT").toLowerCase();
  const vercel = value("VERCEL_ENV").toLowerCase();
  const inferred = vercel || (value("NODE_ENV") === "test" || value("CI") === "true" ? "test" : "development");
  const environment = explicit || inferred;

  if (!DATABASE_ENVIRONMENTS.has(environment)) {
    throw new Error(`DATABASE_ENVIRONMENT production, preview, development veya test olmalıdır. Mevcut: ${environment || "boş"}`);
  }
  if (explicit && vercel && explicit !== vercel) {
    throw new Error(`DATABASE_ENVIRONMENT=${explicit}, VERCEL_ENV=${vercel} ile uyuşmuyor.`);
  }
  return environment;
}

function parsePostgresUrl(name, raw) {
  if (!raw) throw new Error(`${name} tanımlı değil.`);
  let parsed;
  try {
    parsed = new URL(raw);
  } catch {
    throw new Error(`${name} geçerli bir bağlantı adresi değil.`);
  }
  if (!["postgres:", "postgresql:"].includes(parsed.protocol)) {
    throw new Error(`${name} PostgreSQL bağlantı adresi olmalıdır.`);
  }
  return parsed;
}

function normalizedHost(hostname) {
  return hostname.toLowerCase().replace(/-pooler(?=\.|$)/g, "");
}

export function databaseIdentity(rawUrl) {
  const parsed = parsePostgresUrl("veritabanı URL'si", rawUrl);
  const host = normalizedHost(parsed.hostname);
  const port = parsed.port || "5432";
  const database = decodeURIComponent(parsed.pathname.replace(/^\//, "")) || "postgres";
  const canonical = `${host}:${port}/${database}`;
  return {
    host,
    port,
    database,
    canonical,
    fingerprint: createHash("sha256").update(canonical).digest("hex"),
  };
}

export function getDatabaseContext() {
  const environment = resolveDatabaseEnvironment();
  const databaseUrl = value("DATABASE_URL");
  const postgresUrl = value("DATABASE_POSTGRES_URL");
  if (!databaseUrl) throw new Error("DATABASE_URL tanımlı değil.");
  const direct = databaseIdentity(postgresUrl);

  const productionFingerprint = value("PRODUCTION_DATABASE_FINGERPRINT").toLowerCase();
  if (environment !== "production" && productionFingerprint && direct.fingerprint === productionFingerprint) {
    throw new Error(`${environment} ortamı production veritabanı parmak iziyle eşleşiyor. İşlem durduruldu.`);
  }

  return {
    environment,
    databaseUrl,
    postgresUrl,
    directUrl: postgresUrl,
    identity: direct,
    productionFingerprint,
  };
}

export function assertNonProduction(action = "Bu işlem") {
  const context = getDatabaseContext();
  if (context.environment === "production") {
    throw new Error(`${action} production veritabanında çalıştırılamaz.`);
  }
  return context;
}

export function printDatabaseContext(context, prefix = "Veritabanı") {
  console.log(`${prefix}: ortam=${context.environment}, hedef=${context.identity.canonical}, parmak izi=${context.identity.fingerprint}`);
}

export function runCommand(command, args, options = {}) {
  const result = spawnSync(command, args, {
    stdio: options.stdio ?? "inherit",
    env: { ...process.env, ...(options.env ?? {}) },
    shell: process.platform === "win32",
    encoding: options.encoding ?? "utf8",
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} komutu ${result.status} koduyla başarısız oldu.`);
  }
  return result;
}

export function runPrisma(args, options = {}) {
  return runCommand("npm", ["exec", "--", "prisma", ...args], options);
}
