-- Deutschimo V28.3 — Akıllı Tekrar 2.0
-- Additive migration: no existing learning data is removed.

ALTER TABLE "VocabularyNotebookItem"
  ADD COLUMN IF NOT EXISTS "difficulty" INTEGER NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS "stability" DOUBLE PRECISION NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS "retrievability" DOUBLE PRECISION NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS "confidenceScore" INTEGER NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS "hintUseCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "sameErrorStreak" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "averageResponseMs" INTEGER,
  ADD COLUMN IF NOT EXISTS "lastResponseMs" INTEGER,
  ADD COLUMN IF NOT EXISTS "lastSeenAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "lastMode" TEXT;

ALTER TABLE "VocabularyReviewAttempt"
  ADD COLUMN IF NOT EXISTS "hintUsed" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "confidence" TEXT,
  ADD COLUMN IF NOT EXISTS "difficulty" INTEGER NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS "repeatedErrorCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "signalScore" DOUBLE PRECISION;

ALTER TABLE "CompetencyRecord"
  ADD COLUMN IF NOT EXISTS "intervalDays" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "easeFactor" DOUBLE PRECISION NOT NULL DEFAULT 2.5,
  ADD COLUMN IF NOT EXISTS "correctStreak" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "lapseCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "reviewCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "lastReviewedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "lastRating" TEXT,
  ADD COLUMN IF NOT EXISTS "hintUseCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "sameErrorStreak" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "difficulty" INTEGER NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS "stability" DOUBLE PRECISION NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS "retrievability" DOUBLE PRECISION NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS "lastResponseMs" INTEGER;

CREATE TABLE IF NOT EXISTS "AdaptiveReviewAttempt" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "domain" TEXT NOT NULL,
  "targetId" TEXT NOT NULL,
  "objectiveCode" TEXT,
  "sourceType" TEXT,
  "sourceId" TEXT,
  "mode" TEXT NOT NULL,
  "rating" TEXT,
  "correct" BOOLEAN NOT NULL,
  "responseMs" INTEGER,
  "hintUsed" BOOLEAN NOT NULL DEFAULT false,
  "confidence" TEXT NOT NULL,
  "difficulty" INTEGER NOT NULL,
  "repeatedErrorCount" INTEGER NOT NULL DEFAULT 0,
  "signalScore" DOUBLE PRECISION NOT NULL,
  "nextReviewAt" TIMESTAMP(3) NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AdaptiveReviewAttempt_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'AdaptiveReviewAttempt_userId_fkey'
  ) THEN
    ALTER TABLE "AdaptiveReviewAttempt"
      ADD CONSTRAINT "AdaptiveReviewAttempt_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "AdaptiveReviewAttempt_userId_createdAt_idx"
  ON "AdaptiveReviewAttempt"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "AdaptiveReviewAttempt_userId_nextReviewAt_idx"
  ON "AdaptiveReviewAttempt"("userId", "nextReviewAt");
CREATE INDEX IF NOT EXISTS "AdaptiveReviewAttempt_domain_targetId_createdAt_idx"
  ON "AdaptiveReviewAttempt"("domain", "targetId", "createdAt");
CREATE INDEX IF NOT EXISTS "AdaptiveReviewAttempt_objectiveCode_createdAt_idx"
  ON "AdaptiveReviewAttempt"("objectiveCode", "createdAt");

CREATE INDEX IF NOT EXISTS "VocabularyNotebookItem_userId_sameErrorStreak_nextReviewAt_idx"
  ON "VocabularyNotebookItem"("userId", "sameErrorStreak", "nextReviewAt");
CREATE INDEX IF NOT EXISTS "CompetencyRecord_userId_nextReviewAt_idx"
  ON "CompetencyRecord"("userId", "nextReviewAt");
