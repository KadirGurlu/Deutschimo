import { spawnSync } from "node:child_process";
if (process.env.BOOTSTRAP_ADMIN_ON_BUILD !== "true") {
  console.log("Admin seed skipped. Set BOOTSTRAP_ADMIN_ON_BUILD=true only for a new empty database.");
  process.exit(0);
}
const result = spawnSync(process.execPath, ["prisma/seed.mjs"], { stdio: "inherit", env: process.env });
process.exit(result.status ?? 1);
