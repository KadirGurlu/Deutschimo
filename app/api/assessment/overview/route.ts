import { NextResponse } from "next/server";
import { getLearningObjective } from "@/data/learning-objectives";
import { getApiUser } from "@/lib/auth/authorization";
import { prisma } from "@/lib/db";
import { withApiMonitoring } from "@/lib/security/api-monitor";

async function GETHandler() {
  const user = await getApiUser();
  if (!user) return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });

  const [competencies, errors, totalEvidence] = await Promise.all([
    prisma.competencyRecord.findMany({ where: { userId: user.id }, orderBy: [{ mastery: "asc" }, { lastEvidenceAt: "desc" }] }),
    prisma.learningErrorHistory.findMany({ where: { userId: user.id, resolvedAt: null }, orderBy: { lastOccurredAt: "desc" }, take: 40 }),
    prisma.assessmentEvidence.count({ where: { userId: user.id } }),
  ]);

  const skillMap = new Map<string, { masteryTotal: number; evidenceCount: number; correctCount: number; incorrectCount: number; objectives: number }>();
  for (const item of competencies) {
    const current = skillMap.get(item.skill) ?? { masteryTotal: 0, evidenceCount: 0, correctCount: 0, incorrectCount: 0, objectives: 0 };
    current.masteryTotal += item.mastery;
    current.evidenceCount += item.evidenceCount;
    current.correctCount += item.correctCount;
    current.incorrectCount += item.incorrectCount;
    current.objectives += 1;
    skillMap.set(item.skill, current);
  }

  const skillSummaries = Array.from(skillMap.entries()).map(([skill, value]) => ({
    skill,
    mastery: value.objectives ? Math.round(value.masteryTotal / value.objectives) : 0,
    evidenceCount: value.evidenceCount,
    correctRate: value.correctCount + value.incorrectCount ? Math.round((value.correctCount / (value.correctCount + value.incorrectCount)) * 100) : 0,
  })).sort((a, b) => a.mastery - b.mastery);

  const overallMastery = competencies.length ? Math.round(competencies.reduce((sum, item) => sum + item.mastery, 0) / competencies.length) : 0;
  return NextResponse.json({
    overview: {
      totalEvidence,
      unresolvedErrors: errors.length,
      overallMastery,
      skillSummaries,
      competencies: competencies.map((item) => {
        const definition = getLearningObjective(item.objectiveCode);
        return {
          objectiveCode: item.objectiveCode,
          title: definition?.title ?? item.topic,
          topic: item.topic,
          skill: item.skill,
          level: item.level,
          mastery: item.mastery,
          confidence: item.confidence,
          evidenceCount: item.evidenceCount,
          correctCount: item.correctCount,
          incorrectCount: item.incorrectCount,
          points: item.points,
          lastEvidenceAt: item.lastEvidenceAt?.toISOString() ?? null,
        };
      }),
      errors: errors.map((item) => {
        const definition = getLearningObjective(item.objectiveCode);
        return {
          id: item.id,
          sourceType: item.sourceType,
          sourceId: item.sourceId,
          objectiveCode: item.objectiveCode,
          objectiveTitle: definition?.title ?? item.topic,
          topic: item.topic,
          skill: item.skill,
          level: item.level,
          occurrenceCount: item.occurrenceCount,
          explanation: item.explanation,
          relatedSlideId: item.relatedSlideId,
          unitId: item.unitId,
          lastOccurredAt: item.lastOccurredAt.toISOString(),
        };
      }),
    },
  });
}

export const GET = withApiMonitoring("/api/assessment/overview", GETHandler);
