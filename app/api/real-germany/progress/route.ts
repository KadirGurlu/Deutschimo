import { NextResponse } from "next/server";
import { Prisma, Level as PrismaLevel } from "@prisma/client";
import { getRealGermanyScenario } from "@/data/real-germany";
import { getApiUser } from "@/lib/auth/authorization";
import { prisma } from "@/lib/db";
import { withApiMonitoring } from "@/lib/security/api-monitor";
import type {
  RealGermanyEvaluationResult,
  RealGermanyLevel,
  RealGermanyProgressSummary,
  RealGermanySaveDraftRequest,
  RealGermanyStatus,
} from "@/types/real-germany";

export const runtime = "nodejs";

const levels = new Set<RealGermanyLevel>(["A1", "A2", "B1", "B2"]);

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function stringRecord(value: unknown) {
  const source = asRecord(value);
  return Object.fromEntries(
    Object.entries(source)
      .filter(([, item]) => typeof item === "string")
      .map(([key, item]) => [key, String(item).slice(0, 4_000)]),
  );
}

function sanitizeResponses(scenarioId: string, value: unknown) {
  const scenario = getRealGermanyScenario(scenarioId);
  if (!scenario) return null;
  const source = stringRecord(value);
  return Object.fromEntries(
    scenario.steps.map((step) => [step.id, String(source[step.id] ?? "").trim().slice(0, 4_000)]),
  );
}

function clampStep(value: unknown, max: number) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, Math.min(max, Math.round(number))) : 0;
}

function latestResult(attempt: {
  id: string;
  attemptNumber: number;
  scenarioId: string;
  overallScore: number;
  readingScore: number;
  listeningScore: number;
  formScore: number;
  writingScore: number;
  skillScores: Prisma.JsonValue;
  comparison: Prisma.JsonValue | null;
  weakAreas: Prisma.JsonValue;
  feedback: Prisma.JsonValue;
  smartReviewQueued: number;
  evaluationMode: string;
  aiModel: string | null;
  createdAt: Date;
} | undefined): RealGermanyEvaluationResult | null {
  if (!attempt) return null;
  const feedback = asRecord(attempt.feedback);
  return {
    attemptId: attempt.id,
    attemptNumber: attempt.attemptNumber,
    scenarioId: attempt.scenarioId,
    overallScore: attempt.overallScore,
    readingScore: attempt.readingScore,
    listeningScore: attempt.listeningScore,
    formScore: attempt.formScore,
    writingScore: attempt.writingScore,
    skillScores: Array.isArray(attempt.skillScores) ? attempt.skillScores as RealGermanyEvaluationResult["skillScores"] : [],
    strengths: Array.isArray(feedback.strengths) ? feedback.strengths.filter((item): item is string => typeof item === "string") : [],
    weakAreas: Array.isArray(attempt.weakAreas) ? attempt.weakAreas as RealGermanyEvaluationResult["weakAreas"] : [],
    nextStep: typeof feedback.nextStep === "string" ? feedback.nextStep : "Zayıf alanlarını Akıllı Tekrar üzerinden pekiştir.",
    comparison: asRecord(attempt.comparison) as unknown as RealGermanyEvaluationResult["comparison"],
    smartReviewQueued: attempt.smartReviewQueued,
    evaluationMode: attempt.evaluationMode === "AI" ? "AI" : "HEURISTIC_FALLBACK",
    aiModel: attempt.aiModel,
    createdAt: attempt.createdAt.toISOString(),
  };
}

async function GETHandler() {
  const user = await getApiUser();
  if (!user) return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });

  const records = await prisma.realGermanyScenarioProgress.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    include: {
      attempts: {
        orderBy: { attemptNumber: "desc" },
        take: 1,
      },
    },
  });

  const progress: RealGermanyProgressSummary[] = records.map((record) => ({
    scenarioId: record.scenarioId,
    level: record.level as RealGermanyLevel,
    status: ["IN_PROGRESS", "COMPLETED"].includes(record.status) ? record.status as RealGermanyStatus : "NOT_STARTED",
    currentStep: record.currentStep,
    draftResponses: stringRecord(record.draftResponses),
    latestAttemptNumber: record.latestAttemptNumber,
    latestOverallScore: record.latestOverallScore,
    bestOverallScore: record.bestOverallScore,
    completedCount: record.completedCount,
    startedAt: record.startedAt?.toISOString() ?? null,
    lastAttemptAt: record.lastAttemptAt?.toISOString() ?? null,
    completedAt: record.completedAt?.toISOString() ?? null,
    updatedAt: record.updatedAt.toISOString(),
    latestResult: latestResult(record.attempts[0]),
  }));

  return NextResponse.json({ progress });
}

async function PATCHHandler(request: Request) {
  const user = await getApiUser();
  if (!user) return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });

  let body: RealGermanySaveDraftRequest;
  try {
    body = await request.json() as RealGermanySaveDraftRequest;
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  if (!levels.has(body.level)) return NextResponse.json({ error: "Geçersiz seviye." }, { status: 400 });
  const scenario = getRealGermanyScenario(body.scenarioId);
  if (!scenario || scenario.level !== body.level) return NextResponse.json({ error: "Senaryo bulunamadı." }, { status: 404 });

  const now = new Date();
  const retry = body.action === "RETRY";
  const responses = retry ? Object.fromEntries(scenario.steps.map((step) => [step.id, ""])) : sanitizeResponses(scenario.id, body.responses);
  if (!responses) return NextResponse.json({ error: "Yanıtlar doğrulanamadı." }, { status: 400 });
  const currentStep = retry ? 0 : clampStep(body.currentStep, Math.max(0, scenario.steps.length - 1));

  const progress = await prisma.realGermanyScenarioProgress.upsert({
    where: { userId_scenarioId: { userId: user.id, scenarioId: scenario.id } },
    create: {
      userId: user.id,
      scenarioId: scenario.id,
      level: body.level as PrismaLevel,
      status: "IN_PROGRESS",
      currentStep,
      draftResponses: responses as unknown as Prisma.InputJsonValue,
      startedAt: now,
    },
    update: {
      level: body.level as PrismaLevel,
      status: "IN_PROGRESS",
      currentStep,
      draftResponses: responses as unknown as Prisma.InputJsonValue,
      startedAt: retry ? now : undefined,
      completedAt: retry ? null : undefined,
    },
  });

  return NextResponse.json({
    ok: true,
    progress: {
      scenarioId: progress.scenarioId,
      status: progress.status,
      currentStep: progress.currentStep,
      draftResponses: stringRecord(progress.draftResponses),
      updatedAt: progress.updatedAt.toISOString(),
    },
  });
}

export const GET = withApiMonitoring("/api/real-germany/progress", GETHandler);
export const PATCH = withApiMonitoring("/api/real-germany/progress", PATCHHandler);
