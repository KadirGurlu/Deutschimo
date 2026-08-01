import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth/authorization";
import { prisma } from "@/lib/db";
import { withApiMonitoring } from "@/lib/security/api-monitor";
import type { SkillOverview, SkillType } from "@/types/skills";

const skillList: SkillType[] = ["LISTENING", "SPEAKING", "READING", "WRITING"];

async function GETHandler() {
  const user = await getApiUser();
  if (!user) return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });
  const [attempts, vocabularyCount] = await Promise.all([
    prisma.skillLabAttempt.findMany({ where: { userId: user.id }, orderBy: { completedAt: "desc" }, take: 100 }),
    prisma.vocabularyNotebookItem.count({ where: { userId: user.id } }),
  ]);
  const totals = Object.fromEntries(skillList.map((skill) => [skill, attempts.filter((item) => item.skill === skill).length])) as Record<SkillType, number>;
  const averages = Object.fromEntries(skillList.map((skill) => {
    const scores = attempts.filter((item) => item.skill === skill).map((item) => item.score);
    return [skill, scores.length ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : 0];
  })) as Record<SkillType, number>;
  const overview: SkillOverview = {
    totals,
    averages,
    vocabularyCount,
    recent: attempts.slice(0, 8).map((item) => ({
      id: item.id,
      skill: item.skill as SkillType,
      taskId: item.taskId,
      level: item.level,
      score: item.score,
      durationSeconds: item.durationSeconds ?? undefined,
      answerPayload: item.answerPayload ?? undefined,
      transcript: item.transcript ?? undefined,
      feedback: item.feedback ?? undefined,
      completedAt: item.completedAt.toISOString(),
    })),
  };
  return NextResponse.json({ overview });
}

export const GET = withApiMonitoring("/api/skills/overview", GETHandler);
