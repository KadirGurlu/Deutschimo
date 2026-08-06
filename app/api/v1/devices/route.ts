import { ClientPlatform, Prisma } from "@prisma/client";
import { getPlatformApiUser } from "@/lib/platform/auth";
import { prisma } from "@/lib/db";
import { parseDeviceRegistration, parseDeviceRevocation } from "@/lib/platform/device";
import { IdempotencyError, runIdempotentMutation } from "@/lib/platform/idempotency";
import { enforceUserRateLimit } from "@/lib/platform/rate-limit";
import { apiFailure, apiSuccess } from "@/lib/platform/response";
import { securityHash } from "@/lib/security/request";
import { withApiMonitoring } from "@/lib/security/api-monitor";

export const runtime = "nodejs";
const route = "/api/v1/devices";

function publicDevice(device: {
  id: string;
  platform: ClientPlatform;
  appVersion: string;
  deviceName: string | null;
  locale: string | null;
  timezone: string | null;
  firstSeenAt: Date;
  lastSeenAt: Date;
  revokedAt: Date | null;
}) {
  return {
    id: device.id,
    platform: device.platform,
    appVersion: device.appVersion,
    deviceName: device.deviceName,
    locale: device.locale,
    timezone: device.timezone,
    firstSeenAt: device.firstSeenAt.toISOString(),
    lastSeenAt: device.lastSeenAt.toISOString(),
    revokedAt: device.revokedAt?.toISOString() ?? null,
  };
}

async function authenticatedUser(request: Request) {
  const auth = await getPlatformApiUser(request);
  if (!auth) {
    return {
      ok: false as const,
      response: apiFailure(request, 401, "UNAUTHORIZED", "Oturum gerekli."),
    };
  }

  const { user } = auth;
  const limited = await enforceUserRateLimit(request, {
    scope: "v31-devices",
    userId: user.id,
    limit: 30,
    windowSeconds: 3_600,
  });

  if (limited) return { ok: false as const, response: limited };
  return { ok: true as const, user };
}

async function GETHandler(request: Request): Promise<Response> {
  const authResult = await authenticatedUser(request);
  if (!authResult.ok) return authResult.response;

  const devices = await prisma.clientDevice.findMany({
    where: { userId: authResult.user.id },
    orderBy: { lastSeenAt: "desc" },
    take: 20,
  });
  return apiSuccess(request, { devices: devices.map(publicDevice) });
}

async function POSTHandler(request: Request): Promise<Response> {
  const authResult = await authenticatedUser(request);
  if (!authResult.ok) return authResult.response;

  const rawBody = await request.json();
  const input = parseDeviceRegistration(rawBody);
  if (!input) return apiFailure(request, 400, "BAD_REQUEST", "Cihaz bilgileri doğrulanamadı.");

  try {
    const result = await runIdempotentMutation({
      request,
      userId: authResult.user.id,
      route: `${route}:register`,
      payload: input,
      operation: async () => {
        const deviceIdHash = securityHash(`client-device:${input.deviceId}`);
        const device = await prisma.clientDevice.upsert({
          where: { userId_deviceIdHash: { userId: authResult.user.id, deviceIdHash } },
          create: {
            userId: authResult.user.id,
            deviceIdHash,
            platform: input.platform as ClientPlatform,
            appVersion: input.appVersion,
            deviceName: input.deviceName,
            locale: input.locale,
            timezone: input.timezone,
            metadata: { registeredBy: "V31_API" },
          },
          update: {
            platform: input.platform as ClientPlatform,
            appVersion: input.appVersion,
            deviceName: input.deviceName,
            locale: input.locale,
            timezone: input.timezone,
            lastSeenAt: new Date(),
            revokedAt: null,
          },
        });
        await prisma.auditLog.create({
          data: {
            actorUserId: authResult.user.id,
            actorEmail: authResult.user.email,
            action: "CLIENT_DEVICE_REGISTERED",
            entityType: "ClientDevice",
            entityId: device.id,
            summary: `${input.platform} istemci kaydı güncellendi.`,
            metadata: { appVersion: input.appVersion },
          },
        });
        return {
          status: 201,
          body: { device: publicDevice(device) } as unknown as Prisma.InputJsonValue,
        };
      },
    });
    return apiSuccess(request, result.body, {
      status: result.status,
      headers: { "Idempotency-Replayed": result.replayed ? "true" : "false" },
    });
  } catch (error) {
    if (error instanceof IdempotencyError) return apiFailure(request, error.status, error.code, error.message);
    throw error;
  }
}

async function DELETEHandler(request: Request): Promise<Response> {
  const authResult = await authenticatedUser(request);
  if (!authResult.ok) return authResult.response;

  const rawBody = await request.json();
  const input = parseDeviceRevocation(rawBody);
  if (!input) return apiFailure(request, 400, "BAD_REQUEST", "Geçerli bir deviceId gerekli.");

  try {
    const result = await runIdempotentMutation({
      request,
      userId: authResult.user.id,
      route: `${route}:revoke`,
      payload: input,
      operation: async () => {
        const deviceIdHash = securityHash(`client-device:${input.deviceId}`);
        const device = await prisma.clientDevice.findUnique({
          where: { userId_deviceIdHash: { userId: authResult.user.id, deviceIdHash } },
        });
        if (!device) {
          return { status: 200, body: { revoked: true, deviceFound: false } as Prisma.InputJsonValue };
        }
        const revoked = await prisma.clientDevice.update({
          where: { id: device.id },
          data: { revokedAt: new Date() },
        });
        await prisma.auditLog.create({
          data: {
            actorUserId: authResult.user.id,
            actorEmail: authResult.user.email,
            action: "CLIENT_DEVICE_REVOKED",
            entityType: "ClientDevice",
            entityId: revoked.id,
            summary: "İstemci cihazı iptal edildi.",
          },
        });
        return { status: 200, body: { revoked: true, deviceFound: true } as Prisma.InputJsonValue };
      },
    });
    return apiSuccess(request, result.body, {
      status: result.status,
      headers: { "Idempotency-Replayed": result.replayed ? "true" : "false" },
    });
  } catch (error) {
    if (error instanceof IdempotencyError) return apiFailure(request, error.status, error.code, error.message);
    throw error;
  }
}

export const GET = withApiMonitoring(route, GETHandler);
export const POST = withApiMonitoring(route, POSTHandler, { maxBodyBytes: 16 * 1024 });
export const DELETE = withApiMonitoring(route, DELETEHandler, { maxBodyBytes: 8 * 1024 });
