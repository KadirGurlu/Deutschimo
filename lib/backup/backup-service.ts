import { createCipheriv, createHash, randomBytes } from "node:crypto";
import { gzipSync } from "node:zlib";
import { del, put } from "@vercel/blob";
import { prisma } from "@/lib/db";

function encryptionKey() {
  const raw = process.env.BACKUP_ENCRYPTION_KEY || "";
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) throw new Error("BACKUP_ENCRYPTION_KEY must be 32 random bytes encoded as Base64.");
  return key;
}

function encryptedPayload(value: unknown) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const compressed = gzipSync(Buffer.from(JSON.stringify(value)), { level: 9 });
  const ciphertext = Buffer.concat([cipher.update(compressed), cipher.final()]);
  const tag = cipher.getAuthTag();
  const envelope = Buffer.from(JSON.stringify({
    version: 2,
    compression: "gzip",
    algorithm: "AES-256-GCM",
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
    data: ciphertext.toString("base64"),
  }));
  return { envelope, checksum: createHash("sha256").update(envelope).digest("hex") };
}

function retentionDays() {
  const parsed = Number(process.env.BACKUP_RETENTION_DAYS ?? 14);
  return Number.isFinite(parsed) ? Math.min(365, Math.max(3, Math.round(parsed))) : 14;
}

export async function pruneExpiredBackups() {
  const cutoff = new Date(Date.now() - retentionDays() * 24 * 60 * 60 * 1000);
  const expired = await prisma.databaseBackup.findMany({
    where: { startedAt: { lt: cutoff }, status: "COMPLETED", pathname: { not: null } },
    select: { id: true, pathname: true },
    take: 100,
  });

  const pathnames = expired.flatMap((item) => item.pathname ? [item.pathname] : []);
  if (pathnames.length) await del(pathnames);
  if (expired.length) {
    await prisma.databaseBackup.deleteMany({ where: { id: { in: expired.map((item) => item.id) } } });
  }
  return expired.length;
}

export async function createLogicalBackup() {
  const record = await prisma.databaseBackup.create({
    data: { status: "RUNNING", storageProvider: "VERCEL_BLOB_PRIVATE" },
  });

  try {
    if (!process.env.BLOB_STORE_ID && !process.env.BLOB_READ_WRITE_TOKEN) {
      throw new Error("Vercel Blob is not configured. Connect a private Blob store to this project.");
    }

    const [
      users,
      accounts,
      enrollments,
      snapshots,
      progress,
      activities,
      studySessions,
      placement,
      insights,
      plans,
      reviews,
      skillAttempts,
      vocabularySets,
      vocabularyNotebook,
      vocabularyReviewAttempts,
      assessmentEvidence,
      competencies,
      learningErrors,
      courses,
      units,
      exercises,
    ] = await Promise.all([
      prisma.user.findMany(),
      prisma.account.findMany({
        select: {
          userId: true,
          type: true,
          provider: true,
          providerAccountId: true,
          expires_at: true,
          token_type: true,
          scope: true,
          session_state: true,
        },
      }),
      prisma.enrollment.findMany(),
      prisma.learningStateSnapshot.findMany(),
      prisma.userUnitProgress.findMany(),
      prisma.userActivityEvent.findMany(),
      prisma.studySession.findMany(),
      prisma.placementAssessment.findMany(),
      prisma.learningInsightSnapshot.findMany(),
      prisma.dailyStudyPlan.findMany(),
      prisma.smartReviewState.findMany(),
      prisma.skillLabAttempt.findMany(),
      prisma.vocabularySet.findMany(),
      prisma.vocabularyNotebookItem.findMany(),
      prisma.vocabularyReviewAttempt.findMany(),
      prisma.assessmentEvidence.findMany(),
      prisma.competencyRecord.findMany(),
      prisma.learningErrorHistory.findMany(),
      prisma.course.findMany(),
      prisma.unit.findMany(),
      prisma.exercise.findMany(),
    ]);

    const payload = {
      schemaVersion: "24.0",
      createdAt: new Date().toISOString(),
      data: {
        users,
        accounts,
        enrollments,
        snapshots,
        progress,
        activities,
        studySessions,
        placement,
        insights,
        plans,
        reviews,
        skillAttempts,
        vocabularySets,
        vocabularyNotebook,
        vocabularyReviewAttempts,
        assessmentEvidence,
        competencies,
        learningErrors,
        courses,
        units,
        exercises,
      },
    };
    const tableCounts = Object.fromEntries(Object.entries(payload.data).map(([key, rows]) => [key, rows.length]));
    const { envelope, checksum } = encryptedPayload(payload);
    const pathname = `database-backups/deutschimo-${new Date().toISOString().replace(/[:.]/g, "-")}.json.gz.enc`;
    const blob = await put(pathname, envelope, {
      access: "private",
      contentType: "application/octet-stream",
      addRandomSuffix: false,
    });

    return await prisma.databaseBackup.update({
      where: { id: record.id },
      data: {
        status: "COMPLETED",
        pathname: blob.pathname,
        downloadUrl: blob.downloadUrl,
        checksum,
        byteSize: envelope.byteLength,
        tableCounts,
        completedAt: new Date(),
      },
    });
  } catch (error) {
    return await prisma.databaseBackup.update({
      where: { id: record.id },
      data: {
        status: "FAILED",
        errorMessage: error instanceof Error ? error.message : String(error),
        completedAt: new Date(),
      },
    });
  }
}
