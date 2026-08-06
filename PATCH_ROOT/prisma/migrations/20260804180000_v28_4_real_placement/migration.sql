-- Deutschimo V28.4 — two-stage placement test and six-skill result profile.
-- This migration is additive and preserves every existing placement result.

ALTER TABLE "PlacementAssessment"
  ADD COLUMN IF NOT EXISTS "mode" TEXT NOT NULL DEFAULT 'QUICK',
  ADD COLUMN IF NOT EXISTS "skillScores" JSONB,
  ADD COLUMN IF NOT EXISTS "skillLevels" JSONB,
  ADD COLUMN IF NOT EXISTS "studyPlan" JSONB,
  ADD COLUMN IF NOT EXISTS "writtenSamples" JSONB,
  ADD COLUMN IF NOT EXISTS "speakingSamples" JSONB,
  ADD COLUMN IF NOT EXISTS "overallBand" TEXT,
  ADD COLUMN IF NOT EXISTS "confidenceScore" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "durationSeconds" INTEGER;

CREATE INDEX IF NOT EXISTS "PlacementAssessment_userId_mode_completedAt_idx"
  ON "PlacementAssessment"("userId", "mode", "completedAt");
