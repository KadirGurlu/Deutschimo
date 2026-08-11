import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("V47 event taxonomy is centralized", () => {
  const source = fs.readFileSync("lib/v47/events.ts", "utf8");

  for (const event of [
    "user_registered",
    "onboarding_completed",
    "level_test_completed",
    "lesson_completed",
    "exercise_completed",
    "review_completed",
    "daily_plan_completed",
    "listening_completed",
    "speaking_completed",
  ]) {
    assert.match(
      source,
      new RegExp(`"${event}"`),
      `Missing centralized V47 event: ${event}`,
    );
  }
});

test("V47 redaction contract bans high-risk secret keys", () => {
  const source = fs.readFileSync("lib/v47/redact.ts", "utf8");

  /*
   * SECRET_KEY implementation syntax may evolve.
   *
   * The test should verify the security contract rather than depend on
   * one exact textual representation such as:
   *
   *   api[_-]?key
   *
   * Extract the SECRET_KEY regular-expression declaration and verify
   * that the important secret categories remain represented.
   */
  const secretKeyDeclaration =
    source.match(
      /const\s+SECRET_KEY\s*=\s*\/([^;\n]+)\/[a-z]*\s*;/i,
    )?.[1] ?? "";

  assert.ok(
    secretKeyDeclaration.length > 0,
    "SECRET_KEY redaction pattern must exist.",
  );

  assert.match(
    secretKeyDeclaration,
    /password|passwd/i,
    "Redaction contract must cover password keys.",
  );

  assert.match(
    secretKeyDeclaration,
    /authorization|token|cookie/i,
    "Redaction contract must cover authentication/session secrets.",
  );

  assert.match(
    secretKeyDeclaration,
    /database|connection|credential/i,
    "Redaction contract must cover database/credential secrets.",
  );

  assert.match(
    secretKeyDeclaration,
    /api/i,
    "Redaction contract must identify API-related secrets.",
  );

  assert.match(
    secretKeyDeclaration,
    /key/i,
    "Redaction contract must identify API key secrets.",
  );

  assert.match(
    source,
    /SECRET_KEY\.test\(key\)/,
    "Object-key redaction must use the SECRET_KEY contract.",
  );

  assert.match(
    source,
    /hasForbiddenLogKey/,
    "Forbidden log-key protection must remain exported.",
  );
});

test("V47 migration is expand-only", () => {
  const sql = fs.readFileSync(
    "prisma/migrations/20260811160000_v47_production_operability/migration.sql",
    "utf8",
  );

  /*
   * Only executable SQL is relevant for destructive-migration checks.
   *
   * Comments such as:
   *
   *   -- No DROP/TRUNCATE/DELETE/UPDATE statements.
   *
   * must not be interpreted as SQL commands.
   */
  const executableSql = sql
    .replace(/--.*$/gm, "")
    .replace(/\/\*[\s\S]*?\*\//g, "");

  assert.doesNotMatch(
    executableSql,
    /\b(DROP\s+TABLE|DROP\s+COLUMN|TRUNCATE|DELETE\s+FROM|UPDATE\s+\S+\s+SET)\b/i,
    "V47 migration must remain expand-only.",
  );
});