import { getDatabaseContext, printDatabaseContext, runPrisma } from "./db-safety.mjs";

const context = getDatabaseContext();
printDatabaseContext(context, "Drift kontrol hedefi");
runPrisma(
  [
    "migrate",
    "diff",
    "--from-schema-datasource",
    "prisma/schema.prisma",
    "--to-schema-datamodel",
    "prisma/schema.prisma",
    "--exit-code",
  ],
  { env: { DATABASE_URL: context.directUrl, DATABASE_POSTGRES_URL: context.directUrl } },
);
console.log("Veritabanı şeması Prisma datamodel ile uyumlu.");
