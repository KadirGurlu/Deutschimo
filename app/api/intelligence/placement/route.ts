import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

import { questionsForPlacementMode } from "@/data/placement-test";
import { getApiUser } from "@/lib/auth/authorization";
import { prisma } from "@/lib/db";
import { evaluatePlacement, requiredPlacementQuestionIds } from "@/lib/intelligence/placement";
import { withApiMonitoring } from "@/lib/security/api-monitor";
import type { PlacementResult, PlacementTestMode } from "@/types/intelligence";

function isPlacementMode(value: unknown): value is PlacementTestMode {
  return value === "QUICK" || value === "DETAILED";
}

function asJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function serializeAssessment(result: {
  id: string;
  mode: string;
  recommendedLevel: "A1" | "A2" | "B1" | "B2";
  overallBand: string | null;
  totalScore: number;
  correctCount: number;
  questionCount: number;
  levelScores: Prisma.JsonValue;
  skillScores: Prisma.JsonValue | null;
  skillLevels: Prisma.JsonValue | null;
  strengths: Prisma.JsonValue;
  weakTopics: Prisma.JsonValue;
  studyPlan: Prisma.JsonValue | null;
  confidenceScore: number;
  durationSeconds: number | null;
  completedAt: Date;
}): PlacementResult {
  return {
    id: result.id,
    mode: isPlacementMode(result.mode) ? result.mode : "QUICK",
    recommendedLevel: result.recommendedLevel,
    overallBand: (result.overallBand ?? undefined) as PlacementResult["overallBand"],
    totalScore: result.totalScore,
    correctCount: result.correctCount,
    questionCount: result.questionCount,
    levelScores: result.levelScores as unknown as PlacementResult["levelScores"],
    skillScores: (result.skillScores ?? undefined) as unknown as PlacementResult["skillScores"],
    skillLevels: (result.skillLevels ?? undefined) as unknown as PlacementResult["skillLevels"],
    strengths: result.strengths as unknown as string[],
    weakTopics: result.weakTopics as unknown as string[],
    studyPlan: (result.studyPlan ?? undefined) as unknown as PlacementResult["studyPlan"],
    confidenceScore: result.confidenceScore,
    durationSeconds: result.durationSeconds ?? undefined,
    completedAt: result.completedAt.toISOString(),
  };
}

async function GETHandler(request: Request) {
  const user = await getApiUser();
  if (!user) return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });

  const requestedMode = new URL(request.url).searchParams.get("mode");
  const mode: PlacementTestMode = isPlacementMode(requestedMode) ? requestedMode : "QUICK";
  const questions = questionsForPlacementMode(mode).map(({
    correctAnswer: _correct,
    explanation: _explanation,
    keywords: _keywords,
    ...question
  }) => question);
  const latestRecord = await prisma.placementAssessment.findFirst({
    where: { userId: user.id },
    orderBy: { completedAt: "desc" },
  });

  return NextResponse.json({
    mode,
    questions,
    latest: latestRecord ? serializeAssessment(latestRecord) : null,
  });
}

async function POSTHandler(request: Request) {
  const user = await getApiUser();
  if (!user) return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });

  const body = await request.json() as {
    mode?: PlacementTestMode;
    answers?: Record<string, string>;
    durationSeconds?: number;
  };
  if (!isPlacementMode(body.mode)) {
    return NextResponse.json({ error: "Geçerli bir test türü seçilmedi." }, { status: 400 });
  }
  if (!body.answers || typeof body.answers !== "object") {
    return NextResponse.json({ error: "Sınav cevapları bulunamadı." }, { status: 400 });
  }

  const requiredIds = requiredPlacementQuestionIds(body.mode);
  const normalizedAnswers = Object.fromEntries(requiredIds.map((id) => {
    const raw = typeof body.answers?.[id] === "string" ? body.answers[id] : "";
    return [id, raw.trim().slice(0, 5_000)];
  }));
  const missing = requiredIds.filter((id) => !normalizedAnswers[id]);
  if (missing.length) {
    return NextResponse.json({ error: `${missing.length} görev henüz tamamlanmamış.` }, { status: 400 });
  }

  const durationSeconds = Number.isFinite(body.durationSeconds)
    ? Math.min(14_400, Math.max(1, Math.round(Number(body.durationSeconds))))
    : undefined;
  const result = evaluatePlacement({
    mode: body.mode,
    answers: normalizedAnswers,
    durationSeconds,
  });
  const questions = questionsForPlacementMode(body.mode);
  const writtenSamples = Object.fromEntries(
    questions.filter((question) => question.skill === "WRITING").map((question) => [question.id, normalizedAnswers[question.id] ?? ""]),
  );
  const speakingSamples = Object.fromEntries(
    questions.filter((question) => question.skill === "SPEAKING").map((question) => [question.id, normalizedAnswers[question.id] ?? ""]),
  );

  const saved = await prisma.$transaction(async (tx) => {
    const assessment = await tx.placementAssessment.create({
      data: {
        userId: user.id,
        mode: body.mode,
        answers: asJson(normalizedAnswers),
        levelScores: asJson(result.levelScores),
        skillScores: asJson(result.skillScores ?? {}),
        skillLevels: asJson(result.skillLevels ?? {}),
        strengths: asJson(result.strengths),
        weakTopics: asJson(result.weakTopics),
        studyPlan: asJson(result.studyPlan ?? []),
        writtenSamples: asJson(writtenSamples),
        speakingSamples: asJson(speakingSamples),
        overallBand: result.overallBand ?? null,
        recommendedLevel: result.recommendedLevel,
        totalScore: result.totalScore,
        correctCount: result.correctCount,
        questionCount: result.questionCount,
        confidenceScore: result.confidenceScore ?? 0,
        durationSeconds: result.durationSeconds ?? null,
      },
    });

    await tx.user.update({
      where: { id: user.id },
      data: { currentLevel: result.recommendedLevel },
    });
    await tx.dailyStudyPlan.deleteMany({ where: { userId: user.id } });
    return assessment;
  });

  return NextResponse.json({
    result: {
      ...result,
      id: saved.id,
      completedAt: saved.completedAt.toISOString(),
    },
  });
}

export const GET = withApiMonitoring("/api/intelligence/placement", GETHandler);
export const POST = withApiMonitoring("/api/intelligence/placement", POSTHandler);
