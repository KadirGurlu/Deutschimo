import { createCipheriv, createHash, randomBytes } from "node:crypto";
import { put } from "@vercel/blob";
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
  const plaintext = Buffer.from(JSON.stringify(value));
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  const envelope = Buffer.from(JSON.stringify({ version: 1, algorithm: "AES-256-GCM", iv: iv.toString("base64"), tag: tag.toString("base64"), data: ciphertext.toString("base64") }));
  return { envelope, checksum: createHash("sha256").update(envelope).digest("hex") };
}

export async function createLogicalBackup() {
  const record = await prisma.databaseBackup.create({ data: { status: "RUNNING", storageProvider: "VERCEL_BLOB_PRIVATE" } });
  try {
    if (!process.env.BLOB_STORE_ID && !process.env.BLOB_READ_WRITE_TOKEN) throw new Error("Vercel Blob is not configured. Connect a private Blob store to this project.");
    const [users, accounts, enrollments, snapshots, progress, activities, studySessions, placement, insights, plans, reviews, skillAttempts, vocabularyNotebook, vocabularyReviewAttempts, courses, units, exercises] = await Promise.all([
      prisma.user.findMany(), prisma.account.findMany(), prisma.enrollment.findMany(), prisma.learningStateSnapshot.findMany(),
      prisma.userUnitProgress.findMany(), prisma.userActivityEvent.findMany(), prisma.studySession.findMany(), prisma.placementAssessment.findMany(),
      prisma.learningInsightSnapshot.findMany(), prisma.dailyStudyPlan.findMany(), prisma.smartReviewState.findMany(), prisma.skillLabAttempt.findMany(), prisma.vocabularyNotebookItem.findMany(), prisma.vocabularyReviewAttempt.findMany(), prisma.course.findMany(), prisma.unit.findMany(), prisma.exercise.findMany(),
    ]);
    const payload = { schemaVersion: "14.0", createdAt: new Date().toISOString(), data: { users, accounts, enrollments, snapshots, progress, activities, studySessions, placement, insights, plans, reviews, skillAttempts, vocabularyNotebook, vocabularyReviewAttempts, courses, units, exercises } };
    const tableCounts = Object.fromEntries(Object.entries(payload.data).map(([key, rows]) => [key, rows.length]));
    const { envelope, checksum } = encryptedPayload(payload);
    const pathname = `database-backups/deutschimo-${new Date().toISOString().replace(/[:.]/g, "-")}.json.enc`;
    const blob = await put(pathname, envelope, { access: "private", contentType: "application/octet-stream", addRandomSuffix: false });
    return await prisma.databaseBackup.update({ where: { id: record.id }, data: { status: "COMPLETED", pathname: blob.pathname, downloadUrl: blob.downloadUrl, checksum, byteSize: envelope.byteLength, tableCounts, completedAt: new Date() } });
  } catch (error) {
    return await prisma.databaseBackup.update({ where: { id: record.id }, data: { status: "FAILED", errorMessage: error instanceof Error ? error.message : String(error), completedAt: new Date() } });
  }
}
