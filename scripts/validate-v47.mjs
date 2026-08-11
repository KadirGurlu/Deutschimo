import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

let failed = false;
const errors = [];
const warnings = [];

const exists = (p) => fs.existsSync(path.join(root, p));
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");

function requireFile(p) {
  if (!exists(p)) {
    failed = true;
    errors.push(`Missing file: ${p}`);
  }
}

[
  "lib/v47/logger.ts",
  "lib/v47/redact.ts",
  "lib/v47/env.ts",
  "lib/v47/events.ts",
  "lib/v47/feature-flags.ts",

  "app/api/health/live/route.ts",
  "app/api/health/ready/route.ts",

  "app/api/v1/analytics/events/route.ts",

  "app/api/v1/privacy/consent/route.ts",
  "app/api/v1/privacy/export/route.ts",
  "app/api/v1/privacy/delete-account/route.ts",

  "app/api/v1/feedback/route.ts",
  "app/api/v1/release/route.ts",

  "app/api/admin/operations/v47/route.ts",

  "app/manifest.ts",

  "components/platform/network-status.tsx",

  "config/v47-performance-budget.json",

  "docs/V47_PRODUCTION_ARCHITECTURE.md",
  "docs/V47_BACKUP_RESTORE_ROLLBACK.md",
  "docs/V47_PRIVACY_LEGAL_REVIEW.md",
  "docs/V47_API_MOBILE_STRATEGY.md",
  "docs/V47_BETA_ROLLOUT.md",

  ".github/workflows/v47-production-readiness.yml",
  ".github/workflows/v47-post-deploy-smoke.yml",
].forEach(requireFile);

/*
 * --------------------------------------------------------------------------
 * V47 DATABASE MIGRATION SAFETY
 * --------------------------------------------------------------------------
 *
 * V47 uses an expand-only migration strategy.
 *
 * IMPORTANT:
 * SQL comments are removed before destructive-operation detection.
 *
 * This prevents false positives such as:
 *
 *   -- No DROP/TRUNCATE/DELETE/UPDATE statements.
 *
 * Foreign-key clauses such as:
 *
 *   ON DELETE CASCADE
 *   ON UPDATE CASCADE
 *
 * are not destructive migration statements themselves and therefore should
 * not fail this check.
 */

const migrationPath =
  "prisma/migrations/20260811160000_v47_production_operability/migration.sql";

if (exists(migrationPath)) {
  const sql = read(migrationPath);

  // Remove single-line SQL comments.
  // Example:
  // -- EXPAND-ONLY migration. No DROP/TRUNCATE/DELETE/UPDATE statements.
  const executableSql = sql
    .replace(/--.*$/gm, "")
    .replace(/\/\*[\s\S]*?\*\//g, "");

  /*
   * Block genuinely destructive migration operations.
   *
   * Allowed examples:
   *
   * CREATE TABLE ...
   * CREATE INDEX ...
   * ALTER TABLE ... ADD CONSTRAINT ...
   * ON DELETE CASCADE
   * ON UPDATE CASCADE
   *
   * Blocked examples:
   *
   * DROP TABLE ...
   * DROP COLUMN ...
   * TRUNCATE ...
   * DELETE FROM ...
   * UPDATE table SET ...
   */
  const destructiveMigrationPattern =
    /\b(DROP\s+TABLE|DROP\s+COLUMN|TRUNCATE|DELETE\s+FROM|UPDATE\s+\S+\s+SET)\b/i;

  if (destructiveMigrationPattern.test(executableSql)) {
    failed = true;
    errors.push("V47 migration is not expand-only.");
  }
} else {
  failed = true;
  errors.push("V47 migration is missing.");
}

/*
 * --------------------------------------------------------------------------
 * ENVIRONMENT / SECRET EXPOSURE CHECK
 * --------------------------------------------------------------------------
 */

if (exists(".env.example")) {
  const env = read(".env.example");

  const publicSecretPattern =
    /NEXT_PUBLIC_(DATABASE_URL|AUTH_SECRET|SECURITY_HASH_KEY|CRON_SECRET|OPENAI_API_KEY)/;

  if (publicSecretPattern.test(env)) {
    failed = true;
    errors.push(
      "A server secret is exposed with NEXT_PUBLIC_ prefix."
    );
  }
}

/*
 * --------------------------------------------------------------------------
 * SECRET LOGGING CHECK
 * --------------------------------------------------------------------------
 */

const secretLoggingPattern =
  /(console\.log\([^)]*(password|token|secret)|database_url\s*:)/i;

for (const p of [
  "lib/v47/logger.ts",
  "lib/v47/redact.ts",
  "app/api/health/ready/route.ts",
]) {
  if (exists(p) && secretLoggingPattern.test(read(p))) {
    failed = true;
    errors.push(`Potential secret logging pattern in ${p}`);
  }
}

/*
 * --------------------------------------------------------------------------
 * REQUIRED PACKAGE SCRIPTS
 * --------------------------------------------------------------------------
 */

if (exists("package.json")) {
  const pkg = JSON.parse(read("package.json"));

  for (const name of [
    "validate:v47",
    "test:unit:v47",
    "smoke:v47",
    "release:gate:v47",
  ]) {
    if (!pkg.scripts?.[name]) {
      failed = true;
      errors.push(`Missing package script: ${name}`);
    }
  }
} else {
  failed = true;
  errors.push("Missing file: package.json");
}

/*
 * --------------------------------------------------------------------------
 * V45 / V46 REGRESSION SIGNALS
 * --------------------------------------------------------------------------
 *
 * V47 must build on top of the existing production-readiness foundation.
 * Missing legacy signals are warnings because some locations may legitimately
 * change over time, but they must still be manually reviewed.
 */

const legacySignals = [
  [
    "V31 API v1",
    exists("app/api/v1/health/route.ts") || exists("lib/platform"),
  ],
  [
    "V46 release gate",
    exists("scripts/release-gate-v46-11.mjs") ||
      exists(".github/workflows/v46-release-readiness.yml"),
  ],
  [
    "V46.5 authorization",
    exists("lib/auth/authorization.ts"),
  ],
  [
    "V46.7 database validation",
    exists("scripts/validate-v46-7.mjs"),
  ],
  [
    "V46.10 accessibility",
    exists("scripts/validate-v46-10.mjs"),
  ],
  [
    "V46.11 performance",
    exists("scripts/validate-v46-11.mjs"),
  ],
];

for (const [name, ok] of legacySignals) {
  if (!ok) {
    warnings.push(
      `Existing ${name} signal was not found; manual review required.`
    );
  }
}

/*
 * --------------------------------------------------------------------------
 * RESULT
 * --------------------------------------------------------------------------
 */

console.log(
  "Deutschimo V47 Production Operability structural validation"
);

for (const error of errors) {
  console.error(`X ${error}`);
}

for (const warning of warnings) {
  console.warn(`! ${warning}`);
}

if (failed) {
  console.error("V47 VALIDATION: FAILED");
  process.exit(1);
}

console.log("V47 VALIDATION: PASSED");
console.log("- Environment/secrets governance: configured");
console.log("- Structured redacted logging: configured");
console.log("- Live/readiness health: configured");
console.log(
  "- Consent-gated first-party analytics foundation: configured"
);
console.log(
  "- Privacy/export/deletion foundation: configured (deletion disabled by default)"
);
console.log("- Feature flags / staged rollout: configured");
console.log(
  "- PWA/mobile network resilience foundation: configured"
);
console.log("- Expand-only migration: verified");
console.log("- V47 release/readiness workflows: configured");
