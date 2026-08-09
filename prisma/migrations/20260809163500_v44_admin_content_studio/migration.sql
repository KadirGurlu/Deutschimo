CREATE TYPE "CmsEntityType" AS ENUM ('COURSE','UNIT','LESSON','VOCABULARY','QUESTION','LISTENING');
CREATE TYPE "CmsWorkflowStatus" AS ENUM ('DRAFT','REVIEW','READY','PUBLISHED','ARCHIVED');
CREATE TYPE "CmsQualityTier" AS ENUM ('GOLD','STANDARD','REVIEW_REQUIRED');

CREATE TABLE "CmsContentRecord" (
  "id" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "entityType" "CmsEntityType" NOT NULL,
  "parentKey" TEXT,
  "courseKey" TEXT,
  "unitKey" TEXT,
  "level" "Level",
  "title" TEXT NOT NULL,
  "status" "CmsWorkflowStatus" NOT NULL DEFAULT 'DRAFT',
  "active" BOOLEAN NOT NULL DEFAULT true,
  "qualityTier" "CmsQualityTier" NOT NULL DEFAULT 'STANDARD',
  "version" INTEGER NOT NULL DEFAULT 1,
  "payload" JSONB NOT NULL,
  "createdById" TEXT,
  "updatedById" TEXT,
  "publishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CmsContentRecord_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CmsContentRevision" (
  "id" TEXT NOT NULL,
  "contentId" TEXT NOT NULL,
  "version" INTEGER NOT NULL,
  "status" "CmsWorkflowStatus" NOT NULL,
  "snapshot" JSONB NOT NULL,
  "actorUserId" TEXT,
  "changeNote" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CmsContentRevision_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CmsContentRecord_key_key" ON "CmsContentRecord"("key");
CREATE INDEX "CmsContentRecord_entityType_status_idx" ON "CmsContentRecord"("entityType","status");
CREATE INDEX "CmsContentRecord_courseKey_unitKey_idx" ON "CmsContentRecord"("courseKey","unitKey");
CREATE INDEX "CmsContentRecord_unitKey_entityType_idx" ON "CmsContentRecord"("unitKey","entityType");
CREATE INDEX "CmsContentRecord_level_qualityTier_idx" ON "CmsContentRecord"("level","qualityTier");
CREATE UNIQUE INDEX "CmsContentRevision_contentId_version_key" ON "CmsContentRevision"("contentId","version");
CREATE INDEX "CmsContentRevision_contentId_createdAt_idx" ON "CmsContentRevision"("contentId","createdAt");

ALTER TABLE "CmsContentRevision"
ADD CONSTRAINT "CmsContentRevision_contentId_fkey"
FOREIGN KEY ("contentId") REFERENCES "CmsContentRecord"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
