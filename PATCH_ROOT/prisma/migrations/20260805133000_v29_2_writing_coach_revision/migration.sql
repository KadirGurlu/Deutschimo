-- Deutschimo V29.2 — Writing Coach 2.0 revision comparison, rubric modes and Smart Review bridge.
-- Additive migration: existing writing sessions, attempts and learner data are preserved.

ALTER TABLE "WritingCoachSession"
  ADD COLUMN IF NOT EXISTS "rubricMode" TEXT NOT NULL DEFAULT 'DEUTSCHIMO',
  ADD COLUMN IF NOT EXISTS "initialScore" INTEGER,
  ADD COLUMN IF NOT EXISTS "latestScore" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "scoreImprovement" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "WritingCoachAttempt"
  ADD COLUMN IF NOT EXISTS "rubricMode" TEXT NOT NULL DEFAULT 'DEUTSCHIMO',
  ADD COLUMN IF NOT EXISTS "previousAttemptId" TEXT,
  ADD COLUMN IF NOT EXISTS "isRevision" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "improvement" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "errorCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "resolvedErrorCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "repeatedErrorCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "newErrorCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "suggestions" JSONB,
  ADD COLUMN IF NOT EXISTS "comparison" JSONB;

CREATE INDEX IF NOT EXISTS "WritingCoachAttempt_sessionId_rubricMode_revisionNumber_idx"
  ON "WritingCoachAttempt"("sessionId", "rubricMode", "revisionNumber");

-- Backfill summary columns for existing V29 sessions without rewriting attempt content.
UPDATE "WritingCoachSession" AS session
SET
  "initialScore" = summary."initialScore",
  "latestScore" = summary."latestScore",
  "scoreImprovement" = summary."latestScore" - summary."initialScore"
FROM (
  SELECT DISTINCT ON (first_attempt."sessionId")
    first_attempt."sessionId",
    first_attempt."overallScore" AS "initialScore",
    last_attempt."overallScore" AS "latestScore"
  FROM "WritingCoachAttempt" AS first_attempt
  JOIN LATERAL (
    SELECT "overallScore"
    FROM "WritingCoachAttempt"
    WHERE "sessionId" = first_attempt."sessionId"
    ORDER BY "revisionNumber" DESC
    LIMIT 1
  ) AS last_attempt ON true
  ORDER BY first_attempt."sessionId", first_attempt."revisionNumber" ASC
) AS summary
WHERE session."id" = summary."sessionId"
  AND session."initialScore" IS NULL;

UPDATE "WritingCoachAttempt"
SET
  "errorCount" = CASE
    WHEN jsonb_typeof("errors") = 'array' THEN jsonb_array_length("errors")
    ELSE 0
  END,
  "isRevision" = "revisionNumber" > 1
WHERE "errorCount" = 0 OR "isRevision" = false;
