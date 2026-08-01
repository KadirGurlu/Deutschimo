import { withApiMonitoring } from "@/lib/security/api-monitor";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { placementQuestions } from "@/data/placement-test";
import { getApiUser } from "@/lib/auth/authorization";
import { prisma } from "@/lib/db";
import { evaluatePlacement } from "@/lib/intelligence/placement";
import { latestPlacement } from "@/lib/intelligence/server";

async function GETHandler() {
  const user = await getApiUser();
  if (!user) return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });
  return NextResponse.json({ questions: placementQuestions.map(({ correctAnswer: _correct, explanation: _explanation, ...question }) => question), latest: await latestPlacement(user.id) });
}

async function POSTHandler(request: Request) {
  const user = await getApiUser();
  if (!user) return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });
  const body = await request.json() as { answers?: Record<string, string> };
  if (!body.answers || typeof body.answers !== "object") return NextResponse.json({ error: "Sınav cevapları bulunamadı." }, { status: 400 });
  const missing = placementQuestions.filter((question) => typeof body.answers?.[question.id] !== "string");
  if (missing.length) return NextResponse.json({ error: `${missing.length} soru cevaplanmamış.` }, { status: 400 });

  const result = evaluatePlacement(body.answers);
  const saved = await prisma.$transaction(async (tx) => {
    const assessment = await tx.placementAssessment.create({
      data: {
        userId: user.id,
        answers: body.answers as Prisma.InputJsonValue,
        levelScores: result.levelScores as unknown as Prisma.InputJsonValue,
        strengths: result.strengths as unknown as Prisma.InputJsonValue,
        weakTopics: result.weakTopics as unknown as Prisma.InputJsonValue,
        recommendedLevel: result.recommendedLevel,
        totalScore: result.totalScore,
        correctCount: result.correctCount,
        questionCount: result.questionCount,
      },
    });
    await tx.user.update({ where: { id: user.id }, data: { currentLevel: result.recommendedLevel, onboardingCompleted: true } });
    await tx.dailyStudyPlan.deleteMany({ where: { userId: user.id } });
    return assessment;
  });

  return NextResponse.json({ result: { ...result, id: saved.id, completedAt: saved.completedAt.toISOString() } });
}

export const GET = withApiMonitoring("/api/intelligence/placement", GETHandler);
export const POST = withApiMonitoring("/api/intelligence/placement", POSTHandler);
