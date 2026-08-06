import { assertNonProduction, getDatabaseContext, printDatabaseContext, runPrisma } from "./db-safety.mjs";

const action = process.argv[2] || "status";
const context = action === "status" ? getDatabaseContext() : assertNonProduction("Migration geliştirme");
printDatabaseContext(context, "Migration hedefi");

if (action === "status") {
  runPrisma(["migrate", "status"]);
} else if (action === "create") {
  if (context.environment !== "development") throw new Error("Yeni migration yalnızca development veritabanında oluşturulabilir.");
  const nameIndex = process.argv.indexOf("--name");
  const rawName = nameIndex >= 0 ? process.argv[nameIndex + 1] : process.argv[3];
  if (!rawName || !/^[a-z0-9_]+$/.test(rawName)) {
    throw new Error("Migration adı zorunludur ve yalnızca küçük harf, rakam, alt çizgi içerebilir. Örnek: npm run db:migrate:create -- add_user_preferences");
  }
  runPrisma(["migrate", "dev", "--create-only", "--name", rawName]);
} else if (action === "apply") {
  if (context.environment !== "development") throw new Error("prisma migrate dev yalnızca development ortamında çalıştırılabilir.");
  runPrisma(["migrate", "dev"]);
} else {
  throw new Error(`Bilinmeyen migration işlemi: ${action}`);
}
