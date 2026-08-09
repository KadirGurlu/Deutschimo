-- Deutschimo V37 — Mastery updatedAt schema-drift hotfix
--
-- The original V37 migration created database-level CURRENT_TIMESTAMP
-- defaults for two @updatedAt fields. The Prisma datamodel intentionally
-- has no database default for these fields, so Prisma migrate diff reports:
--   default changed from Some(Now) to None
--
-- This migration does not delete rows, columns, tables, indexes or constraints.
-- It only removes the two database defaults so the live schema matches
-- prisma/schema.prisma exactly.

ALTER TABLE "MasterySkillSnapshot"
  ALTER COLUMN "updatedAt" DROP DEFAULT;

ALTER TABLE "MasteryTopicSnapshot"
  ALTER COLUMN "updatedAt" DROP DEFAULT;
