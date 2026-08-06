import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { createDecipheriv, createHash } from "node:crypto";
import { pipeline } from "node:stream/promises";

const arg = (name) => process.argv.find((value) => value.startsWith(`--${name}=`))?.split("=").slice(1).join("=");
const file = arg("file");
if (!file || !fs.existsSync(file)) throw new Error("--file=<backup.dump.enc> zorunlu.");

const targetUrl = process.env.RESTORE_DATABASE_URL;
if (!targetUrl) throw new Error("RESTORE_DATABASE_URL zorunludur.");
const environment = String(process.env.RESTORE_DATABASE_ENVIRONMENT || "test").toLowerCase();
if (environment === "production") throw new Error("Bu arac Production'a restore yapmaz.");
if (process.env.RESTORE_CONFIRM !== "RESTORE_NON_PRODUCTION") throw new Error("RESTORE_CONFIRM=RESTORE_NON_PRODUCTION zorunludur.");

const keyHex = process.env.BACKUP_ENCRYPTION_KEY || "";
if (!/^[a-f0-9]{64}$/i.test(keyHex)) throw new Error("BACKUP_ENCRYPTION_KEY gecersiz.");
const manifestPath = `${file}.manifest.json`;
if (!fs.existsSync(manifestPath)) throw new Error(`Manifest bulunamadi: ${manifestPath}`);
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
if (manifest.version !== 2 || manifest.algorithm !== "aes-256-gcm") throw new Error("Desteklenmeyen backup manifest surumu veya algoritmasi.");
if (!manifest.iv || !manifest.authTag || !manifest.checksum) throw new Error("Backup manifesti eksik.");

async function sha256File(filePath) {
  const hash = createHash("sha256");
  await pipeline(fs.createReadStream(filePath), hash);
  return hash.digest("hex");
}

const checksum = await sha256File(file);
if (checksum !== manifest.checksum) throw new Error("Backup checksum uyusmuyor.");

const temp = path.resolve(`.backups/restore-${Date.now()}.dump`);
fs.mkdirSync(path.dirname(temp), { recursive: true });
const decipher = createDecipheriv("aes-256-gcm", Buffer.from(keyHex, "hex"), Buffer.from(manifest.iv, "base64"));
decipher.setAuthTag(Buffer.from(manifest.authTag, "base64"));
try {
  await pipeline(
    fs.createReadStream(file),
    decipher,
    fs.createWriteStream(temp, { mode: 0o600 }),
  );
  const result = spawnSync(
    "pg_restore",
    ["--clean", "--if-exists", "--no-owner", "--no-privileges", "--dbname", targetUrl, temp],
    { stdio: "inherit" },
  );
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`pg_restore cikis kodu ${result.status}`);

  const check = spawnSync(
    "psql",
    [targetUrl, "-v", "ON_ERROR_STOP=1", "-tAc", 'SELECT COUNT(*) FROM "Course";'],
    { encoding: "utf8" },
  );
  if (check.status !== 0) throw new Error("Restore sonrasi Course tablosu dogrulanamadi.");
  console.log(`Restore tatbikati basarili. Course satiri: ${check.stdout.trim()}`);
} finally {
  fs.rmSync(temp, { force: true });
}
