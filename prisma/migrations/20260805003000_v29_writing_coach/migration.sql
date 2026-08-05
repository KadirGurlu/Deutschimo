-- Deutschimo V29 — AI Writing Coach, revision history and adaptive error profile.
-- Additive migration: existing users, courses, progress and review data are preserved.

CREATE TABLE IF NOT EXISTS "WritingCoachSession" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "scenarioId" TEXT NOT NULL,
  "level" "Level" NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "latestRevision" INTEGER NOT NULL DEFAULT 0,
  "bestScore" INTEGER NOT NULL DEFAULT 0,
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "WritingCoachSession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "WritingCoachAttempt" (
  "id" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "scenarioId" TEXT NOT NULL,
  "level" "Level" NOT NULL,
  "revisionNumber" INTEGER NOT NULL,
  "studentText" TEXT NOT NULL,
  "wordCount" INTEGER NOT NULL,
  "durationSeconds" INTEGER,
  "overallScore" INTEGER NOT NULL,
  "rubric" JSONB NOT NULL,
  "errors" JSONB NOT NULL,
  "strengths" JSONB NOT NULL,
  "taskCoverage" JSONB NOT NULL,
  "feedback" JSONB NOT NULL,
  "aiModel" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WritingCoachAttempt_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "WritingErrorProfile" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "count" INTEGER NOT NULL DEFAULT 1,
  "lastExcerpt" TEXT,
  "lastScenarioId" TEXT,
  "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "nextReviewAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "WritingErrorProfile_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "WritingCoachSession_userId_updatedAt_idx"
  ON "WritingCoachSession"("userId", "updatedAt");
CREATE INDEX IF NOT EXISTS "WritingCoachSession_userId_scenarioId_status_idx"
  ON "WritingCoachSession"("userId", "scenarioId", "status");
CREATE UNIQUE INDEX IF NOT EXISTS "WritingCoachAttempt_sessionId_revisionNumber_key"
  ON "WritingCoachAttempt"("sessionId", "revisionNumber");
CREATE INDEX IF NOT EXISTS "WritingCoachAttempt_userId_createdAt_idx"
  ON "WritingCoachAttempt"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "WritingCoachAttempt_userId_scenarioId_createdAt_idx"
  ON "WritingCoachAttempt"("userId", "scenarioId", "createdAt");
CREATE UNIQUE INDEX IF NOT EXISTS "WritingErrorProfile_userId_category_key"
  ON "WritingErrorProfile"("userId", "category");
CREATE INDEX IF NOT EXISTS "WritingErrorProfile_userId_count_idx"
  ON "WritingErrorProfile"("userId", "count");
CREATE INDEX IF NOT EXISTS "WritingErrorProfile_userId_nextReviewAt_idx"
  ON "WritingErrorProfile"("userId", "nextReviewAt");

DO $$ BEGIN
  ALTER TABLE "WritingCoachSession"
    ADD CONSTRAINT "WritingCoachSession_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "WritingCoachAttempt"
    ADD CONSTRAINT "WritingCoachAttempt_sessionId_fkey"
    FOREIGN KEY ("sessionId") REFERENCES "WritingCoachSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "WritingCoachAttempt"
    ADD CONSTRAINT "WritingCoachAttempt_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "WritingErrorProfile"
    ADD CONSTRAINT "WritingErrorProfile_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
