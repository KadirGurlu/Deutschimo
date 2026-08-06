ALTER TYPE "AssessmentSourceType" ADD VALUE IF NOT EXISTS 'REAL_GERMANY';

CREATE TABLE "RealGermanyScenarioProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "scenarioId" TEXT NOT NULL,
    "level" "Level" NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NOT_STARTED',
    "currentStep" INTEGER NOT NULL DEFAULT 0,
    "draftResponses" JSONB,
    "latestAttemptNumber" INTEGER NOT NULL DEFAULT 0,
    "latestOverallScore" INTEGER,
    "bestOverallScore" INTEGER NOT NULL DEFAULT 0,
    "completedCount" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3),
    "lastAttemptAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RealGermanyScenarioProgress_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RealGermanyScenarioAttempt" (
    "id" TEXT NOT NULL,
    "progressId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "scenarioId" TEXT NOT NULL,
    "level" "Level" NOT NULL,
    "attemptNumber" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "responses" JSONB NOT NULL,
    "skillScores" JSONB NOT NULL,
    "overallScore" INTEGER NOT NULL,
    "readingScore" INTEGER NOT NULL,
    "listeningScore" INTEGER NOT NULL,
    "formScore" INTEGER NOT NULL,
    "writingScore" INTEGER NOT NULL,
    "comparison" JSONB,
    "weakAreas" JSONB NOT NULL,
    "feedback" JSONB NOT NULL,
    "smartReviewQueued" INTEGER NOT NULL DEFAULT 0,
    "evaluationMode" TEXT NOT NULL DEFAULT 'AI',
    "aiModel" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RealGermanyScenarioAttempt_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RealGermanyScenarioProgress_userId_scenarioId_key" ON "RealGermanyScenarioProgress"("userId", "scenarioId");
CREATE INDEX "RealGermanyScenarioProgress_userId_status_updatedAt_idx" ON "RealGermanyScenarioProgress"("userId", "status", "updatedAt");
CREATE INDEX "RealGermanyScenarioProgress_userId_level_updatedAt_idx" ON "RealGermanyScenarioProgress"("userId", "level", "updatedAt");

CREATE UNIQUE INDEX "RealGermanyScenarioAttempt_progressId_attemptNumber_key" ON "RealGermanyScenarioAttempt"("progressId", "attemptNumber");
CREATE INDEX "RealGermanyScenarioAttempt_userId_createdAt_idx" ON "RealGermanyScenarioAttempt"("userId", "createdAt");
CREATE INDEX "RealGermanyScenarioAttempt_userId_scenarioId_createdAt_idx" ON "RealGermanyScenarioAttempt"("userId", "scenarioId", "createdAt");
CREATE INDEX "RealGermanyScenarioAttempt_scenarioId_overallScore_idx" ON "RealGermanyScenarioAttempt"("scenarioId", "overallScore");

ALTER TABLE "RealGermanyScenarioProgress" ADD CONSTRAINT "RealGermanyScenarioProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RealGermanyScenarioAttempt" ADD CONSTRAINT "RealGermanyScenarioAttempt_progressId_fkey" FOREIGN KEY ("progressId") REFERENCES "RealGermanyScenarioProgress"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RealGermanyScenarioAttempt" ADD CONSTRAINT "RealGermanyScenarioAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
