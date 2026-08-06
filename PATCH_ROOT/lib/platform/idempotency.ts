import { createHash } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { securityHash } from "@/lib/security/request";

export class IdempotencyError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: "BAD_REQUEST" | "CONFLICT",
    message: string,
  ) {
    super(message);
  }
}

type StoredOperationResult = {
  status: number;
  body: Prisma.InputJsonValue;
};

type IdempotentMutationInput = {
  request: Request;
  userId: string;
  route: string;
  payload: unknown;
  operation: () => Promise<StoredOperationResult>;
  ttlHours?: number;
};

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${stableJson(record[key])}`).join(",")}}`;
  }
  return JSON.stringify(value) ?? "null";
}

function requestHash(payload: unknown) {
  return createHash("sha256").update(stableJson(payload)).digest("hex");
}

function idempotencyKey(request: Request) {
  const key = request.headers.get("idempotency-key")?.trim() ?? "";
  if (!/^[A-Za-z0-9._:-]{8,128}$/u.test(key)) {
    throw new IdempotencyError(400, "BAD_REQUEST", "Bu işlem için 8–128 karakterlik geçerli bir Idempotency-Key başlığı gerekli.");
  }
  return key;
}

export async function runIdempotentMutation(input: IdempotentMutationInput) {
  const keyHash = securityHash(`idempotency:${input.route}:${idempotencyKey(input.request)}`);
  const payloadHash = requestHash(input.payload);
  const uniqueWhere = { userId_route_keyHash: { userId: input.userId, route: input.route, keyHash } } as const;
  const existing = await prisma.apiIdempotencyRecord.findUnique({ where: uniqueWhere });

  if (existing && existing.expiresAt > new Date()) {
    if (existing.requestHash !== payloadHash) {
      throw new IdempotencyError(409, "CONFLICT", "Aynı Idempotency-Key farklı bir istek gövdesiyle tekrar kullanılamaz.");
    }
    return { status: existing.statusCode, body: existing.response, replayed: true };
  }
  if (existing) await prisma.apiIdempotencyRecord.delete({ where: { id: existing.id } });

  const result = await input.operation();
  const expiresAt = new Date(Date.now() + Math.max(1, input.ttlHours ?? 24) * 3_600_000);

  try {
    await prisma.apiIdempotencyRecord.create({
      data: {
        userId: input.userId,
        route: input.route,
        keyHash,
        requestHash: payloadHash,
        statusCode: result.status,
        response: result.body,
        expiresAt,
      },
    });
  } catch (error) {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") throw error;
    const raced = await prisma.apiIdempotencyRecord.findUnique({ where: uniqueWhere });
    if (!raced || raced.requestHash !== payloadHash) {
      throw new IdempotencyError(409, "CONFLICT", "İşlem anahtarı başka bir istek tarafından kullanıldı.");
    }
    return { status: raced.statusCode, body: raced.response, replayed: true };
  }

  return { ...result, replayed: false };
}
