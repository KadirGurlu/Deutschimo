import { getDatabaseContext, printDatabaseContext, runPrisma } from "./db-safety.mjs";

const context = getDatabaseContext();
if (context.environment !== "development") {
  throw new Error("prisma db push yalnızca development ortamında ve açık onayla çalıştırılabilir.");
}
if (process.env.ALLOW_PRISMA_DB_PUSH !== "DEVELOPMENT_ONLY") {
  throw new Error("Migration düzenini korumak için db push kapalıdır. Geçici prototipleme gerekiyorsa ALLOW_PRISMA_DB_PUSH=DEVELOPMENT_ONLY tanımlayın.");
}
printDatabaseContext(context, "db push hedefi");
runPrisma(["db", "push", ...process.argv.slice(2)]);
