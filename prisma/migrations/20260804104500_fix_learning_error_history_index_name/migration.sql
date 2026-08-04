-- V28.1 hotfix: PostgreSQL identifiers are limited to 63 bytes.
-- The baseline requested a 65-character unique-index name, which PostgreSQL
-- truncated to ...objectiveCode_k. Prisma's datamodel expects its own
-- 63-character generated name: ...objectiveCo_key.
--
-- This migration is intentionally idempotent:
-- - Fresh Preview/Test databases: rename the PostgreSQL-truncated index.
-- - Existing Production schema with Prisma's expected name: do nothing.
-- - Repeated deployments: do nothing.
DO $$
BEGIN
  IF to_regclass('public."LearningErrorHistory_userId_sourceType_sourceId_objectiveCode_k"') IS NOT NULL
     AND to_regclass('public."LearningErrorHistory_userId_sourceType_sourceId_objectiveCo_key"') IS NULL
  THEN
    ALTER INDEX public."LearningErrorHistory_userId_sourceType_sourceId_objectiveCode_k"
      RENAME TO "LearningErrorHistory_userId_sourceType_sourceId_objectiveCo_key";
  END IF;
END $$;
