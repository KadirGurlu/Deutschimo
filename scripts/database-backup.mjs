import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { createCipheriv, createHash, randomBytes } from "node:crypto";
import { pipeline } from "node:stream/promises";
import { PrismaClient } from "@prisma/client";

const arg = (name, fallback) => process.argv.find((value) => value.startsWith(`--${name}=`))?.split("=").slice(1).join("=") || fallback;
const reason = arg("reason", "manual").toLowerCase();
if (!["daily", "pre-migration", "manual", "drill"].includes(reason)) throw new Error(`Gecersiz backup nedeni: ${reason}`);

const environment = String(process.env.DATABASE_ENVIRONMENT || process.env.VERCEL_ENV || "development").toLowerCase();
const databaseUrl = process.env.DATABASE_POSTGRES_URL || process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_POSTGRES_URL veya DATABASE_URL zorunludur.");
if (environment === "production" && !["daily", "pre-migration", "manual"].includes(reason)) throw new Error("Production backup nedeni acikca belirtilmeli.");

const keyHex = process.env.BACKUP_ENCRYPTION_KEY || "";
if (!/^[a-f0-9]{64}$/i.test(keyHex)) throw new Error("BACKUP_ENCRYPTION_KEY 64 hex karakter (32 byte) olmali.");

const outDir = path.resolve(arg("output", ".backups"));
fs.mkdirSync(outDir, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const base = `deutschimo-${environment}-${reason}-${stamp}`;
const rawPath = path.join(outDir, `${base}.dump`);
const encPath = `${rawPath}.enc`;
const manifestPath = `${encPath}.manifest.json`;
const statusToken = reason.toUpperCase().replaceAll("-", "_");

async function sha256File(filePath) {
  const hash = createHash("sha256");
  await pipeline(fs.createReadStream(filePath), hash);
  return hash.digest("hex");
}

const prisma = new PrismaClient();
let record;
try {
  record = await prisma.databaseBackup.create({
    data: {
      status: `RUNNING_${statusToken}`,
      storageProvider: "GITHUB_ACTIONS_ENCRYPTED_ARTIFACT",
      pathname: path.basename(encPath),
    },
  });
} catch (error) {
  console.warn("Backup kaydi baslatilamadi:", error instanceof Error ? error.message : error);
}

try {
  const dump = spawnSync(
    "pg_dump",
    ["--format=custom", "--no-owner", "--no-privileges", "--file", rawPath, databaseUrl],
    { stdio: "inherit" },
  );
  if (dump.error) throw dump.error;
  if (dump.status !== 0) throw new Error(`pg_dump cikis kodu ${dump.status}`);

  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", Buffer.from(keyHex, "hex"), iv);
  await pipeline(
    fs.createReadStream(rawPath),
    cipher,
    fs.createWriteStream(encPath, { mode: 0o600 }),
  );
  const authTag = cipher.getAuthTag();
  fs.rmSync(rawPath, { force: true });

  const checksum = await sha256File(encPath);
  const encryptedBytes = fs.statSync(encPath).size;
  const manifest = {
    version: 2,
    createdAt: new Date().toISOString(),
    environment,
    reason,
    file: path.basename(encPath),
    checksum,
    encryptedBytes,
    format: "pg_dump-custom+aes-256-gcm-stream",
    algorithm: "aes-256-gcm",
    iv: iv.toString("base64"),
    authTag: authTag.toString("base64"),
  };
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, { mode: 0o600 });

  if (record) {
    await prisma.databaseBackup.update({
      where: { id: record.id },
      data: {
        status: `COMPLETED_${statusToken}`,
        checksum,
        byteSize: Math.min(encryptedBytes, 2_147_483_647),
        completedAt: new Date(),
      },
    });
  }
  console.log(`Sifreli backup hazir: ${encPath}`);
  console.log(`Manifest: ${manifestPath}`);
} catch (error) {
  fs.rmSync(rawPath, { force: true });
  fs.rmSync(encPath, { force: true });
  fs.rmSync(manifestPath, { force: true });
  if (record) {
    await prisma.databaseBackup.update({
      where: { id: record.id },
      data: {
        status: "FAILED",
        errorMessage: String(error instanceof Error ? error.message : error).slice(0, 4000),
        completedAt: new Date(),
      },
    }).catch(() => {});
  }
  throw error;
} finally {
  await prisma.$disconnect();
}
