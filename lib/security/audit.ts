import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

type AuditInput = {
  actorUserId?: string | null; actorEmail?: string | null; action: string; entityType: string;
  entityId?: string | null; summary: string; before?: unknown; after?: unknown; metadata?: unknown; ipHash?: string | null;
};

function json(value: unknown): Prisma.InputJsonValue | undefined {
  return value === undefined ? undefined : value as Prisma.InputJsonValue;
}

export async function writeAuditLog(input: AuditInput) {
  try {
    await prisma.auditLog.create({ data: {
      actorUserId: input.actorUserId ?? null, actorEmail: input.actorEmail ?? null, action: input.action,
      entityType: input.entityType, entityId: input.entityId ?? null, summary: input.summary,
      before: json(input.before), after: json(input.after), metadata: json(input.metadata), ipHash: input.ipHash ?? null,
    }});
  } catch (error) {
    console.error("audit_log_failed", error);
  }
}
