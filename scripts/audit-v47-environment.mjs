import fs from "node:fs";

let failed = false;
const forbidden = [
  "NEXT_PUBLIC_DATABASE_URL",
  "NEXT_PUBLIC_AUTH_SECRET",
  "NEXT_PUBLIC_SECURITY_HASH_KEY",
  "NEXT_PUBLIC_CRON_SECRET",
  "NEXT_PUBLIC_OPENAI_API_KEY",
];

const envExample = fs.existsSync(".env.example") ? fs.readFileSync(".env.example", "utf8") : "";
for (const key of forbidden) {
  if (envExample.includes(key)) {
    console.error(`X forbidden public secret: ${key}`);
    failed = true;
  }
}

const gitignore = fs.existsSync(".gitignore") ? fs.readFileSync(".gitignore", "utf8") : "";
if (!/\.env(\.local)?/.test(gitignore)) {
  console.warn("! .gitignore env rule could not be confirmed; inspect manually.");
}

for (const path of [".env", ".env.local", ".env.production", ".env.preview"]) {
  if (fs.existsSync(path)) {
    console.warn(`! Local environment file exists: ${path}. Ensure it is ignored and never committed.`);
  }
}

if (failed) process.exit(1);
console.log("V47 ENVIRONMENT GOVERNANCE AUDIT: PASSED");
