-- Deutschimo V38 — Smart Review 3.0
-- Mastery-aware review queue.
-- Additive migration only. No existing student/content records are deleted.

CREATE TABLE "MasteryReviewQueueItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "unitId" TEXT,
    "questionId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "skill" "MasterySkillArea" NOT NULL,
    "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "phase" TEXT NOT NULL DEFAULT 'RECALL',
    "dueAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "priorityScore" DOUBLE PRECISION NOT NULL DEFAULT 50,
    "failureCount" INTEGER NOT NULL DEFAULT 1,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "lastCorrectAt" TIMESTAMP(3),
    "lastIncorrectAt" TIMESTAMP(3),
    "lastResponseMs" INTEGER,
    "averageResponseMs" INTEGER,
    "confidenceLabel" TEXT,
    "difficulty" INTEGER NOT NULL DEFAULT 3,
    "masteryScore" DOUBLE PRECISION,
    "similarTopicScore" DOUBLE PRECISION,
    "lastReviewedAt" TIMESTAMP(3),
    "lastMode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MasteryReviewQueueItem_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MasteryReviewQueueItem_userId_courseId_questionId_skill_key"
ON "MasteryReviewQueueItem"("userId", "courseId", "questionId", "skill");

CREATE INDEX "MasteryReviewQueueItem_userId_status_dueAt_idx"
ON "MasteryReviewQueueItem"("userId", "status", "dueAt");

CREATE INDEX "MasteryReviewQueueItem_userId_skill_dueAt_idx"
ON "MasteryReviewQueueItem"("userId", "skill", "dueAt");

CREATE INDEX "MasteryReviewQueueItem_userId_courseId_unitId_idx"
ON "MasteryReviewQueueItem"("userId", "courseId", "unitId");
