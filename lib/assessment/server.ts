import { Prisma } from "@prisma/client";
import { getLearningObjective } from "@/data/learning-objectives";
import { prisma } from "@/lib/db";
import type { AssessmentEvidenceInput } from "@/types/assessment";

function clamp(value: number, minimum: number, maximum: number) {
  return Math.max(minimum, Math.min(maximum, value));
}

function jsonValue(value: unknown): Prisma.InputJsonValue | typeof Prisma.JsonNull {
  if (value === undefined || value === null) return Prisma.JsonNull;
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

const cognitiveBonus = {
  REMEMBER: 0,
  UNDERSTAND: 3,
  APPLY: 6,
  ANALYZE: 8,
  CREATE: 10,
} as const;

function nextReviewDate(mastery: number, correct: boolean) {
  const days = !correct ? 1 : mastery < 55 ? 1 : mastery < 75 ? 3 : mastery < 90 ? 7 : 14;
  return new Date(Date.now() + days * 86_400_000);
}

export async function recordAssessmentEvidence(userId: string, input: AssessmentEvidenceInput) {
  const difficulty = clamp(Math.round(input.difficulty || 1), 1, 5);
  const responseMs = input.responseMs ? clamp(Math.round(input.responseMs), 0, 3_600_000) : null;
  const objectiveCodes = Array.from(new Set(input.objectiveCodes.filter(Boolean))).slice(0, 8);
  const topicTags = Array.from(new Set(input.topicTags.filter(Boolean))).slice(0, 12);
  const pointsPossible = clamp(Math.round(input.pointsPossible ?? 10), 1, 100);
  const pointsEarned = input.correct ? clamp(Math.round(input.pointsEarned ?? pointsPossible), 0, pointsPossible) : 0;

  return prisma.$transaction(async (tx) => {
    const evidence = await tx.assessmentEvidence.create({
      data: {
        userId,
        sourceType: input.sourceType,
        sourceId: input.sourceId.slice(0, 240),
        courseId: input.courseId.slice(0, 80),
        unitId: input.unitId?.slice(0, 80) || null,
        level: input.level,
        skill: input.skill,
        difficulty,
        cognitiveLevel: input.cognitiveLevel,
        objectiveCodes: objectiveCodes as Prisma.InputJsonValue,
        topicTags: topicTags as Prisma.InputJsonValue,
        correct: input.correct,
        answer: jsonValue(input.answer),
        correctAnswer: jsonValue(input.correctAnswer),
        explanation: input.explanation?.slice(0, 8000) || null,
        relatedSlideId: input.relatedSlideId?.slice(0, 160) || null,
        responseMs,
        attemptNumber: clamp(Math.round(input.attemptNumber ?? 1), 1, 20),
        pointsPossible,
        pointsEarned,
      },
    });

    for (const objectiveCode of objectiveCodes) {
      const definition = getLearningObjective(objectiveCode);
      const existing = await tx.competencyRecord.findUnique({ where: { userId_objectiveCode: { userId, objectiveCode } } });
      const evidenceCount = (existing?.evidenceCount ?? 0) + 1;
      const currentMastery = existing?.mastery ?? 0;
      const target = input.correct
        ? clamp(56 + difficulty * 7 + cognitiveBonus[input.cognitiveLevel], 0, 100)
        : clamp(30 - difficulty * 4, 0, 100);
      const learningRate = clamp(0.18 + difficulty * 0.03 + (input.correct ? 0.02 : 0.06), 0.2, 0.42);
      const mastery = existing
        ? Math.round(currentMastery * (1 - learningRate) + target * learningRate)
        : Math.round(target * 0.72);
      const confidence = clamp(Math.round((1 - Math.exp(-evidenceCount / 5)) * 100), 0, 100);
      const pointsDelta = input.correct ? 5 + difficulty * 2 : -(2 + difficulty);
      const points = Math.max(0, (existing?.points ?? 0) + pointsDelta);
      const averageResponseMs = responseMs == null
        ? existing?.averageResponseMs ?? null
        : existing?.averageResponseMs == null
          ? responseMs
          : Math.round((existing.averageResponseMs * (evidenceCount - 1) + responseMs) / evidenceCount);

      await tx.competencyRecord.upsert({
        where: { userId_objectiveCode: { userId, objectiveCode } },
        create: {
          userId,
          objectiveCode,
          unitId: input.unitId || definition?.unitId || null,
          level: input.level,
          skill: input.skill,
          topic: definition?.topic ?? topicTags[0] ?? input.skill,
          mastery,
          confidence,
          points,
          evidenceCount: 1,
          correctCount: input.correct ? 1 : 0,
          incorrectCount: input.correct ? 0 : 1,
          averageResponseMs,
          lastEvidenceAt: new Date(),
          nextReviewAt: nextReviewDate(mastery, input.correct),
        },
        update: {
          unitId: input.unitId || definition?.unitId || existing?.unitId || null,
          level: input.level,
          skill: input.skill,
          topic: definition?.topic ?? existing?.topic ?? topicTags[0] ?? input.skill,
          mastery,
          confidence,
          points,
          evidenceCount: { increment: 1 },
          correctCount: input.correct ? { increment: 1 } : undefined,
          incorrectCount: input.correct ? undefined : { increment: 1 },
          averageResponseMs,
          lastEvidenceAt: new Date(),
          nextReviewAt: nextReviewDate(mastery, input.correct),
        },
      });

      if (!input.correct) {
        await tx.learningErrorHistory.upsert({
          where: {
            userId_sourceType_sourceId_objectiveCode: {
              userId,
              sourceType: input.sourceType,
              sourceId: input.sourceId.slice(0, 240),
              objectiveCode,
            },
          },
          create: {
            userId,
            sourceType: input.sourceType,
            sourceId: input.sourceId.slice(0, 240),
            courseId: input.courseId.slice(0, 80),
            unitId: input.unitId?.slice(0, 80) || null,
            level: input.level,
            skill: input.skill,
            objectiveCode,
            topic: definition?.topic ?? topicTags[0] ?? input.skill,
            userAnswer: jsonValue(input.answer),
            correctAnswer: jsonValue(input.correctAnswer),
            explanation: input.explanation?.slice(0, 8000) || null,
            relatedSlideId: input.relatedSlideId?.slice(0, 160) || null,
            metadata: { difficulty, cognitiveLevel: input.cognitiveLevel } as Prisma.InputJsonValue,
          },
          update: {
            userAnswer: jsonValue(input.answer),
            correctAnswer: jsonValue(input.correctAnswer),
            explanation: input.explanation?.slice(0, 8000) || null,
            relatedSlideId: input.relatedSlideId?.slice(0, 160) || null,
            occurrenceCount: { increment: 1 },
            lastOccurredAt: new Date(),
            resolvedAt: null,
            metadata: { difficulty, cognitiveLevel: input.cognitiveLevel } as Prisma.InputJsonValue,
          },
        });
      } else {
        await tx.learningErrorHistory.updateMany({
          where: { userId, sourceType: input.sourceType, sourceId: input.sourceId, objectiveCode, resolvedAt: null },
          data: { resolvedAt: new Date() },
        });
      }
    }

    return evidence;
  });
}
