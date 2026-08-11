-- Deutschimo V47 - Production Operability & Growth Foundation
-- EXPAND-ONLY migration. No DROP/TRUNCATE/DELETE/UPDATE statements.

CREATE TABLE "ProductAnalyticsEvent" (
  "id" TEXT NOT NULL,
  "event" TEXT NOT NULL,
  "userId" TEXT,
  "sessionKey" TEXT,
  "route" TEXT,
  "environment" TEXT NOT NULL,
  "release" TEXT,
  "requestId" TEXT,
  "durationMs" INTEGER,
  "metadata" JSONB,
  "dedupeKey" TEXT,
  "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProductAnalyticsEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UserConsent" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "analyticsEnabled" BOOLEAN NOT NULL DEFAULT false,
  "functionalEnabled" BOOLEAN NOT NULL DEFAULT true,
  "marketingEnabled" BOOLEAN NOT NULL DEFAULT false,
  "policyVersion" TEXT NOT NULL DEFAULT 'LEGAL_REVIEW_REQUIRED',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "UserConsent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UserFeedback" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "category" TEXT NOT NULL,
  "comment" TEXT NOT NULL,
  "route" TEXT,
  "resourceType" TEXT,
  "resourceId" TEXT,
  "appVersion" TEXT,
  "status" TEXT NOT NULL DEFAULT 'OPEN',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "UserFeedback_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "NotificationPreference" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "inAppEnabled" BOOLEAN NOT NULL DEFAULT true,
  "emailEnabled" BOOLEAN NOT NULL DEFAULT false,
  "pushEnabled" BOOLEAN NOT NULL DEFAULT false,
  "dailyPlanReady" BOOLEAN NOT NULL DEFAULT true,
  "reviewDue" BOOLEAN NOT NULL DEFAULT true,
  "milestones" BOOLEAN NOT NULL DEFAULT true,
  "streakWarning" BOOLEAN NOT NULL DEFAULT false,
  "newContent" BOOLEAN NOT NULL DEFAULT false,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "NotificationDelivery" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "event" TEXT NOT NULL,
  "channel" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "providerRef" TEXT,
  "scheduledAt" TIMESTAMP(3),
  "sentAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "NotificationDelivery_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AccountDeletionRequest" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AccountDeletionRequest_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProductAnalyticsEvent_dedupeKey_key" ON "ProductAnalyticsEvent"("dedupeKey");
CREATE INDEX "ProductAnalyticsEvent_event_occurredAt_idx" ON "ProductAnalyticsEvent"("event", "occurredAt");
CREATE INDEX "ProductAnalyticsEvent_userId_occurredAt_idx" ON "ProductAnalyticsEvent"("userId", "occurredAt");
CREATE INDEX "ProductAnalyticsEvent_environment_occurredAt_idx" ON "ProductAnalyticsEvent"("environment", "occurredAt");

CREATE UNIQUE INDEX "UserConsent_userId_key" ON "UserConsent"("userId");

CREATE INDEX "UserFeedback_status_createdAt_idx" ON "UserFeedback"("status", "createdAt");
CREATE INDEX "UserFeedback_category_createdAt_idx" ON "UserFeedback"("category", "createdAt");
CREATE INDEX "UserFeedback_userId_createdAt_idx" ON "UserFeedback"("userId", "createdAt");

CREATE UNIQUE INDEX "NotificationPreference_userId_key" ON "NotificationPreference"("userId");
CREATE INDEX "NotificationDelivery_userId_status_scheduledAt_idx" ON "NotificationDelivery"("userId", "status", "scheduledAt");
CREATE INDEX "NotificationDelivery_event_createdAt_idx" ON "NotificationDelivery"("event", "createdAt");

CREATE UNIQUE INDEX "AccountDeletionRequest_userId_key" ON "AccountDeletionRequest"("userId");
CREATE INDEX "AccountDeletionRequest_status_expiresAt_idx" ON "AccountDeletionRequest"("status", "expiresAt");

ALTER TABLE "ProductAnalyticsEvent"
  ADD CONSTRAINT "ProductAnalyticsEvent_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "UserConsent"
  ADD CONSTRAINT "UserConsent_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserFeedback"
  ADD CONSTRAINT "UserFeedback_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "NotificationPreference"
  ADD CONSTRAINT "NotificationPreference_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "NotificationDelivery"
  ADD CONSTRAINT "NotificationDelivery_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AccountDeletionRequest"
  ADD CONSTRAINT "AccountDeletionRequest_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
