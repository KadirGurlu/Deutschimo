import { getDatabaseContext, printDatabaseContext } from "./db-safety.mjs";

const context = getDatabaseContext();
printDatabaseContext(context);
console.log(`PRODUCTION_DATABASE_FINGERPRINT=${context.identity.fingerprint}`);
