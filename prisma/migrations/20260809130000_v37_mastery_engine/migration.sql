DO $$ BEGIN
  CREATE TYPE "MasterySkillArea" AS ENUM ('VOCABULARY','GRAMMAR','READING','LISTENING','WRITING','SPEAKING');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "MasteryAttempt" (
  "id" TEXT NOT NULL, "userId" TEXT NOT NULL, "courseId" TEXT NOT NULL, "unitId" TEXT,
  "questionId" TEXT NOT NULL, "source" TEXT NOT NULL, "skill" "MasterySkillArea" NOT NULL,
  "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[], "score" DOUBLE PRECISION NOT NULL,
  "correct" BOOLEAN, "responseMs" INTEGER, "hintUsed" BOOLEAN NOT NULL DEFAULT false,
  "confidenceLabel" TEXT, "difficulty" INTEGER, "evidenceWeight" DOUBLE PRECISION NOT NULL DEFAULT 1,
  "eventKey" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MasteryAttempt_pkey" PRIMARY KEY ("id")
);
CREATE TABLE IF NOT EXISTS "MasterySkillSnapshot" (
  "id" TEXT NOT NULL, "userId" TEXT NOT NULL, "scopeKey" TEXT NOT NULL, "courseId" TEXT NOT NULL,
  "unitId" TEXT, "skill" "MasterySkillArea" NOT NULL, "score" DOUBLE PRECISION NOT NULL,
  "evidenceCount" INTEGER NOT NULL DEFAULT 0, "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "lastEvidenceAt" TIMESTAMP(3), "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MasterySkillSnapshot_pkey" PRIMARY KEY ("id")
);
CREATE TABLE IF NOT EXISTS "MasteryTopicSnapshot" (
  "id" TEXT NOT NULL, "userId" TEXT NOT NULL, "scopeKey" TEXT NOT NULL, "courseId" TEXT NOT NULL,
  "unitId" TEXT, "tag" TEXT NOT NULL, "score" DOUBLE PRECISION NOT NULL,
  "evidenceCount" INTEGER NOT NULL DEFAULT 0, "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "lastEvidenceAt" TIMESTAMP(3), "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MasteryTopicSnapshot_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "MasteryAttempt_eventKey_key" ON "MasteryAttempt"("eventKey");
CREATE INDEX IF NOT EXISTS "MasteryAttempt_userId_courseId_createdAt_idx" ON "MasteryAttempt"("userId","courseId","createdAt");
CREATE INDEX IF NOT EXISTS "MasteryAttempt_userId_courseId_unitId_skill_idx" ON "MasteryAttempt"("userId","courseId","unitId","skill");
CREATE INDEX IF NOT EXISTS "MasteryAttempt_userId_skill_createdAt_idx" ON "MasteryAttempt"("userId","skill","createdAt");
CREATE UNIQUE INDEX IF NOT EXISTS "MasterySkillSnapshot_userId_scopeKey_skill_key" ON "MasterySkillSnapshot"("userId","scopeKey","skill");
CREATE INDEX IF NOT EXISTS "MasterySkillSnapshot_userId_courseId_unitId_idx" ON "MasterySkillSnapshot"("userId","courseId","unitId");
CREATE UNIQUE INDEX IF NOT EXISTS "MasteryTopicSnapshot_userId_scopeKey_tag_key" ON "MasteryTopicSnapshot"("userId","scopeKey","tag");
CREATE INDEX IF NOT EXISTS "MasteryTopicSnapshot_userId_courseId_unitId_idx" ON "MasteryTopicSnapshot"("userId","courseId","unitId");
CREATE INDEX IF NOT EXISTS "MasteryTopicSnapshot_userId_tag_idx" ON "MasteryTopicSnapshot"("userId","tag");
