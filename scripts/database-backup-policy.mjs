import { PrismaClient } from "@prisma/client";
const environment = String(process.env.DATABASE_ENVIRONMENT || process.env.VERCEL_ENV || "development").toLowerCase();
if (environment !== "production") { console.log(`Backup policy: ${environment} ortaminda Production backup zorunlulugu atlandi.`); process.exit(0); }
if (process.env.SKIP_BACKUP_POLICY === "true") { console.log("Backup policy acikca SKIP_BACKUP_POLICY=true ile atlandi."); process.exit(0); }
const prisma = new PrismaClient();
try {
  const latest = await prisma.databaseBackup.findFirst({where:{status:{startsWith:"COMPLETED_"}},orderBy:{completedAt:"desc"}});
  if (!latest?.completedAt) throw new Error("Tamamlanmis Production backup kaydi bulunamadi.");
  const ageHours = (Date.now()-latest.completedAt.getTime())/3_600_000;
  if (ageHours>30) throw new Error(`Son backup ${ageHours.toFixed(1)} saat once; en fazla 30 saat olabilir.`);
  if (process.env.REQUIRE_PRE_MIGRATION_BACKUP === "true") {
    const pre = await prisma.databaseBackup.findFirst({where:{status:"COMPLETED_PRE_MIGRATION"},orderBy:{completedAt:"desc"}});
    if(!pre?.completedAt || Date.now()-pre.completedAt.getTime()>24*3_600_000) throw new Error("Son 24 saatte pre-migration backup bulunamadi.");
  }
  console.log(`Backup policy basarili: ${latest.status}, ${ageHours.toFixed(1)} saat once.`);
} finally { await prisma.$disconnect(); }
