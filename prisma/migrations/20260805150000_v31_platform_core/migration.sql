-- V31 platform core: mobile-ready device registry and idempotent mutation storage.
CREATE TYPE "ClientPlatform" AS ENUM ('WEB', 'IOS', 'ANDROID');

CREATE TABLE "ClientDevice" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "deviceIdHash" TEXT NOT NULL,
    "platform" "ClientPlatform" NOT NULL,
    "appVersion" TEXT NOT NULL,
    "deviceName" TEXT,
    "locale" TEXT,
    "timezone" TEXT,
    "metadata" JSONB,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientDevice_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ApiIdempotencyRecord" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "route" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "requestHash" TEXT NOT NULL,
    "statusCode" INTEGER NOT NULL,
    "response" JSONB NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApiIdempotencyRecord_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ClientDevice_userId_deviceIdHash_key" ON "ClientDevice"("userId", "deviceIdHash");
CREATE INDEX "ClientDevice_userId_revokedAt_lastSeenAt_idx" ON "ClientDevice"("userId", "revokedAt", "lastSeenAt");
CREATE INDEX "ClientDevice_platform_appVersion_idx" ON "ClientDevice"("platform", "appVersion");

CREATE UNIQUE INDEX "ApiIdempotencyRecord_userId_route_keyHash_key" ON "ApiIdempotencyRecord"("userId", "route", "keyHash");
CREATE INDEX "ApiIdempotencyRecord_expiresAt_idx" ON "ApiIdempotencyRecord"("expiresAt");
CREATE INDEX "ApiIdempotencyRecord_userId_createdAt_idx" ON "ApiIdempotencyRecord"("userId", "createdAt");

ALTER TABLE "ClientDevice"
ADD CONSTRAINT "ClientDevice_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ApiIdempotencyRecord"
ADD CONSTRAINT "ApiIdempotencyRecord_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
