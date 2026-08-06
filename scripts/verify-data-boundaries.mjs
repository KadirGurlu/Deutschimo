import { createHash } from "node:crypto";
import { PrismaClient } from "@prisma/client";
const strict = process.argv.includes("--strict") || process.env.CI === "true" || process.env.STRICT_DATA_BOUNDARIES === "true";
const environment = String(process.env.DATABASE_ENVIRONMENT || process.env.VERCEL_ENV || "development").toLowerCase();
const classification = String(process.env.DATA_CLASSIFICATION || "").toLowerCase();
const databaseUrl = process.env.DATABASE_POSTGRES_URL || process.env.DATABASE_URL || "";
const errors = [], warnings = [];
if (!["development","test","preview","staging","production"].includes(environment)) errors.push(`Gecersiz DATABASE_ENVIRONMENT: ${environment}`);
if (environment === "production" && classification !== "production") errors.push("Production ortaminda DATA_CLASSIFICATION=production zorunludur.");
if (["test","preview","staging"].includes(environment) && classification === "production") errors.push(`${environment} ortami Production verisi kullanamaz.`);
if (strict && !databaseUrl) errors.push("Strict veri siniri kontrolunde DATABASE_URL/DATABASE_POSTGRES_URL zorunludur.");
if (databaseUrl) {
  let parsed;
  try { parsed = new URL(databaseUrl); } catch { errors.push("Veritabani URL'si gecersiz."); }
  if (parsed) {
    const fingerprint = createHash("sha256").update(`${parsed.hostname}:${parsed.port || "5432"}/${parsed.pathname}`).digest("hex").slice(0,16);
    console.log(`Veri siniri: ortam=${environment}, sinif=${classification || "tanimlanmadi"}, db-parmak-izi=${fingerprint}`);
    if (environment === "production") {
      const prisma = new PrismaClient();
      try {
        const testUsers = await prisma.user.count({ where: { isTestUser: true } });
        if (testUsers > 0) errors.push(`Production veritabaninda ${testUsers} test kullanicisi bulundu.`);
      } catch (error) { (strict ? errors : warnings).push(`Production test-verisi sorgusu yapilamadi: ${error instanceof Error ? error.message : error}`); }
      finally { await prisma.$disconnect(); }
    }
  }
}
warnings.forEach((x)=>console.warn(`UYARI: ${x}`));
if (errors.length) { errors.forEach((x)=>console.error(`HATA: ${x}`)); process.exit(1); }
console.log("Preview/Test/Production veri siniri kontrolu basarili.");
