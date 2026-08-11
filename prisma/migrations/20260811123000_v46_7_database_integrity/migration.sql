-- Deutschimo V46.7 — Database Integrity & Migration Safety
-- ADDITIVE / NON-DESTRUCTIVE MIGRATION.
-- No DROP TABLE, DROP COLUMN, TRUNCATE, DELETE, UPDATE or automatic data repair.
-- Existing orphan/duplicate data must be reported by preflight and fixed manually before deploy.
--
-- IMPORTANT LEGACY BOUNDARY:
-- unitId fields are intentionally NOT converted to physical Unit foreign keys in V46.7.
-- Current V45/V46 deterministic/legacy data can contain logical unit IDs without Unit rows.
-- V46.7 audits and reports those logical orphans but does not delete or rewrite them.

BEGIN;

-- Progress course ownership is safe to enforce: seeded/production courses use stable IDs (a1/a2/b1/b2).
ALTER TABLE "UserUnitProgress"
  ADD CONSTRAINT "UserUnitProgress_courseId_fkey"
  FOREIGN KEY ("courseId") REFERENCES "Course"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;

-- Mastery: user ownership and course ownership become physical foreign keys.
-- User deletion cascades user-owned learning evidence; Course deletion is restricted while evidence exists.
ALTER TABLE "MasteryAttempt"
  ADD CONSTRAINT "MasteryAttempt_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE NOT VALID;
ALTER TABLE "MasteryAttempt"
  ADD CONSTRAINT "MasteryAttempt_courseId_fkey"
  FOREIGN KEY ("courseId") REFERENCES "Course"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;

ALTER TABLE "MasterySkillSnapshot"
  ADD CONSTRAINT "MasterySkillSnapshot_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE NOT VALID;
ALTER TABLE "MasterySkillSnapshot"
  ADD CONSTRAINT "MasterySkillSnapshot_courseId_fkey"
  FOREIGN KEY ("courseId") REFERENCES "Course"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;

ALTER TABLE "MasteryTopicSnapshot"
  ADD CONSTRAINT "MasteryTopicSnapshot_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE NOT VALID;
ALTER TABLE "MasteryTopicSnapshot"
  ADD CONSTRAINT "MasteryTopicSnapshot_courseId_fkey"
  FOREIGN KEY ("courseId") REFERENCES "Course"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;

ALTER TABLE "MasteryReviewQueueItem"
  ADD CONSTRAINT "MasteryReviewQueueItem_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE NOT VALID;
ALTER TABLE "MasteryReviewQueueItem"
  ADD CONSTRAINT "MasteryReviewQueueItem_courseId_fkey"
  FOREIGN KEY ("courseId") REFERENCES "Course"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;

-- Validate after preflight. No automatic cleanup is performed if validation would fail.
ALTER TABLE "UserUnitProgress" VALIDATE CONSTRAINT "UserUnitProgress_courseId_fkey";
ALTER TABLE "MasteryAttempt" VALIDATE CONSTRAINT "MasteryAttempt_userId_fkey";
ALTER TABLE "MasteryAttempt" VALIDATE CONSTRAINT "MasteryAttempt_courseId_fkey";
ALTER TABLE "MasterySkillSnapshot" VALIDATE CONSTRAINT "MasterySkillSnapshot_userId_fkey";
ALTER TABLE "MasterySkillSnapshot" VALIDATE CONSTRAINT "MasterySkillSnapshot_courseId_fkey";
ALTER TABLE "MasteryTopicSnapshot" VALIDATE CONSTRAINT "MasteryTopicSnapshot_userId_fkey";
ALTER TABLE "MasteryTopicSnapshot" VALIDATE CONSTRAINT "MasteryTopicSnapshot_courseId_fkey";
ALTER TABLE "MasteryReviewQueueItem" VALIDATE CONSTRAINT "MasteryReviewQueueItem_userId_fkey";
ALTER TABLE "MasteryReviewQueueItem" VALIDATE CONSTRAINT "MasteryReviewQueueItem_courseId_fkey";

COMMIT;
