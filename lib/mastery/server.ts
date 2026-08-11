import { createHash, randomUUID } from "node:crypto";
import { MasterySkillArea, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { evolveSnapshot, normalizeEvidence } from "@/lib/mastery/score";
import { inferMasterySkill, inferMasteryTags } from "@/lib/mastery/skill-tags";
import { MASTERY_SKILLS, type MasteryEvidenceInput, type MasterySkill, type MasterySkillSummary, type MasteryOverviewResponse } from "@/types/mastery";
import { enqueueMasteryEvidenceForReview } from "@/lib/review/mastery-review-3";

const scopeKey = (courseId: string, unitId?: string | null) => unitId ? `unit:${courseId}:${unitId}` : `course:${courseId}`;
const eventKey = (userId: string, input: MasteryEvidenceInput) => input.externalId
  ? createHash("sha256").update(`${userId}|${input.source}|${input.externalId}`).digest("hex")
  : randomUUID();

async function resolveMasteryCourseId(raw: MasteryEvidenceInput) {
  const requestedCourse = raw.courseId.trim().toLowerCase();
  if (!requestedCourse) return null;
  const course = await prisma.course.findFirst({
    where: { OR: [{ id: requestedCourse }, { slug: requestedCourse }] },
    select: { id: true },
  });
  return course?.id ?? null;
}

async function updateSkill(tx: Prisma.TransactionClient, userId: string, input: MasteryEvidenceInput, skill: MasterySkillArea, unitId: string | null, score: number, weight: number) {
  const key = scopeKey(input.courseId, unitId);
  const where = { userId_scopeKey_skill: { userId, scopeKey: key, skill } };
  const prev = await tx.masterySkillSnapshot.findUnique({ where });
  const next = evolveSnapshot({ previousScore: prev?.score ?? null, evidenceCount: prev?.evidenceCount ?? 0, evidenceScore: score, evidenceWeight: weight, correct: input.correct });
  await tx.masterySkillSnapshot.upsert({
    where,
    create: { userId, scopeKey: key, courseId: input.courseId, unitId, skill, score: next.score, evidenceCount: next.evidenceCount, confidence: next.confidence, lastEvidenceAt: new Date() },
    update: { score: next.score, evidenceCount: next.evidenceCount, confidence: next.confidence, lastEvidenceAt: new Date() },
  });
}

async function updateTopic(tx: Prisma.TransactionClient, userId: string, input: MasteryEvidenceInput, tag: string, unitId: string | null, score: number, weight: number) {
  const key = scopeKey(input.courseId, unitId);
  const where = { userId_scopeKey_tag: { userId, scopeKey: key, tag } };
  const prev = await tx.masteryTopicSnapshot.findUnique({ where });
  const next = evolveSnapshot({ previousScore: prev?.score ?? null, evidenceCount: prev?.evidenceCount ?? 0, evidenceScore: score, evidenceWeight: weight, correct: input.correct });
  await tx.masteryTopicSnapshot.upsert({
    where,
    create: { userId, scopeKey: key, courseId: input.courseId, unitId, tag, score: next.score, evidenceCount: next.evidenceCount, confidence: next.confidence, lastEvidenceAt: new Date() },
    update: { score: next.score, evidenceCount: next.evidenceCount, confidence: next.confidence, lastEvidenceAt: new Date() },
  });
}

export async function recordMasteryEvidence(userId: string, raw: MasteryEvidenceInput): Promise<void> {
  if (!raw.questionId.trim()) return;
  const courseId = await resolveMasteryCourseId(raw);
  if (!courseId) return;

  const skill = inferMasterySkill({ explicit: raw.skill, source: raw.source, prompt: raw.questionId });
  const tags = inferMasteryTags({ skill, courseId, unitId: raw.unitId, existing: raw.tags, prompt: raw.questionId });
  const input: MasteryEvidenceInput = { ...raw, courseId, skill, tags };
  const { evidenceScore, evidenceWeight } = normalizeEvidence(input);
  const key = eventKey(userId, input);

  try {
    await prisma.$transaction(async (tx) => {
      await tx.masteryAttempt.create({
        data: {
          userId,
          courseId: input.courseId,
          unitId: input.unitId ?? null,
          questionId: input.questionId.slice(0, 180),
          source: input.source,
          skill: skill as MasterySkillArea,
          tags,
          score: evidenceScore,
          correct: input.correct ?? null,
          responseMs: input.responseMs ?? null,
          hintUsed: Boolean(input.hintUsed),
          confidenceLabel: input.confidence?.slice(0, 40) ?? null,
          difficulty: input.difficulty ?? null,
          evidenceWeight,
          eventKey: key,
        },
      });
      await updateSkill(tx, userId, input, skill as MasterySkillArea, input.unitId ?? null, evidenceScore, evidenceWeight);
      await updateSkill(tx, userId, input, skill as MasterySkillArea, null, evidenceScore, evidenceWeight);
      for (const tag of tags) {
        await updateTopic(tx, userId, input, tag, input.unitId ?? null, evidenceScore, evidenceWeight);
        await updateTopic(tx, userId, input, tag, null, evidenceScore, evidenceWeight);
      }
      await enqueueMasteryEvidenceForReview(tx, userId, input, evidenceScore);
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return;
    throw error;
  }
}

async function completionByCourse(userId: string) {
  const result = new Map<string, number>();
  try {
    const rows = await prisma.$queryRawUnsafe<Array<{ courseId: string; completion: number | string | null }>>(
      `SELECT LOWER(COALESCE(c."slug", c."level"::text, u."courseId")) AS "courseId", AVG(COALESCE(up."totalProgress",0)) AS "completion" FROM "UnitProgress" up JOIN "Unit" u ON u."id"=up."unitId" LEFT JOIN "Course" c ON c."id"=u."courseId" WHERE up."userId"=$1 GROUP BY LOWER(COALESCE(c."slug", c."level"::text, u."courseId"))`,
      userId,
    );
    for (const row of rows) {
      const n = Number(row.completion);
      if (row.courseId && Number.isFinite(n)) result.set(String(row.courseId).toLowerCase(), n);
    }
  } catch {}
  return result;
}

function summarize(rows: Array<{ skill: MasterySkillArea; score: number; evidenceCount: number; confidence: number }>): MasterySkillSummary[] {
  const map = new Map(rows.map((x) => [x.skill as MasterySkill, x]));
  return MASTERY_SKILLS.map((skill) => {
    const x = map.get(skill);
    return { skill, score: x ? Math.round(x.score) : null, evidenceCount: x?.evidenceCount ?? 0, confidence: x?.confidence ?? 0 };
  });
}

function aggregate(skills: MasterySkillSummary[]) {
  const measured = skills.filter((x) => x.score !== null);
  const coverage = Math.round(measured.length / 6 * 100);
  if (!measured.length) return { mastery: null, coverage, provisional: true, strongestSkill: null, weakestSkill: null };
  const w = measured.reduce((a, x) => {
    const k = Math.max(.25, x.confidence);
    return { sum: a.sum + Number(x.score) * k, weight: a.weight + k };
  }, { sum: 0, weight: 0 });
  const sorted = [...measured].sort((a, b) => Number(a.score) - Number(b.score));
  return { mastery: Math.round(w.sum / w.weight), coverage, provisional: measured.length < 4, strongestSkill: sorted.at(-1) ?? null, weakestSkill: sorted[0] ?? null };
}

export async function getMasteryOverview(userId: string): Promise<MasteryOverviewResponse> {
  const snapshots = await prisma.masterySkillSnapshot.findMany({ where: { userId, unitId: null }, orderBy: [{ courseId: "asc" }, { skill: "asc" }] });
  const topics = await prisma.masteryTopicSnapshot.findMany({ where: { userId, unitId: null, evidenceCount: { gte: 1 } }, orderBy: [{ score: "asc" }, { evidenceCount: "desc" }] });
  const completion = await completionByCourse(userId);
  const ids = new Set([...snapshots.map((x) => x.courseId), ...topics.map((x) => x.courseId), ...completion.keys()]);
  const courses = [...ids].sort().map((courseId) => {
    const skills = summarize(snapshots.filter((x) => x.courseId === courseId));
    const a = aggregate(skills);
    return { courseId, mastery: a.mastery, completion: completion.has(courseId) ? Math.round(completion.get(courseId) ?? 0) : null, coverage: a.coverage, provisional: a.provisional, strongestSkill: a.strongestSkill, weakestSkill: a.weakestSkill, skills, weakTopics: topics.filter((x) => x.courseId === courseId).slice(0, 5).map((x) => ({ tag: x.tag, score: Math.round(x.score), evidenceCount: x.evidenceCount, confidence: x.confidence })) };
  });
  return { courses, generatedAt: new Date().toISOString() };
}

export async function getUnitMastery(userId: string, unitId: string) {
  const skills = await prisma.masterySkillSnapshot.findMany({ where: { userId, unitId }, orderBy: { skill: "asc" } });
  const topics = await prisma.masteryTopicSnapshot.findMany({ where: { userId, unitId }, orderBy: [{ score: "asc" }, { evidenceCount: "desc" }], take: 8 });
  return { skills: summarize(skills), topics: topics.map((x) => ({ tag: x.tag, score: Math.round(x.score), evidenceCount: x.evidenceCount, confidence: x.confidence })) };
}
