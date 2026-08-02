import { withApiMonitoring } from "@/lib/security/api-monitor";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getApiUser } from "@/lib/auth/authorization";
import { prisma } from "@/lib/db";
import { answersMatch } from "@/lib/learning/answer-normalizer";
import { getOrRefreshReviewState } from "@/lib/intelligence/server";

function publicItem(item: Awaited<ReturnType<typeof getOrRefreshReviewState>>["queue"][number]) {
  const { correctAnswer: _correct, acceptedAnswers: _accepted, explanation: _explanation, ...safe } = item;
  return safe;
}

function sourceSummary(queue: Awaited<ReturnType<typeof getOrRefreshReviewState>>["queue"]) {
  return {
    errorHistory: queue.filter((item) => item.sourceType === "ERROR_HISTORY").length,
    weakTopics: queue.filter((item) => item.sourceType === "INSIGHT").length,
    recentMistakes: queue.filter((item) => item.sourceType === "EXERCISE" || item.sourceType === "QUIZ").length,
  };
}

async function GETHandler(request: Request) {
  const user = await getApiUser();
  if (!user) return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });
  const url = new URL(request.url);
  const state = await getOrRefreshReviewState(user.id, url.searchParams.get("refresh") === "1");
  return NextResponse.json({
    items: state.queue.map(publicItem),
    completedIds: state.completedIds,
    attempts: state.attempts,
    total: state.queue.length,
    completed: state.completedIds.length,
    personalization: sourceSummary(state.queue),
  });
}

async function POSTHandler(request: Request) {
  const user = await getApiUser();
  if (!user) return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });
  const body = await request.json() as { itemId?: string; answer?: unknown; completeConcept?: boolean };
  if (!body.itemId) return NextResponse.json({ error: "Tekrar öğesi bulunamadı." }, { status: 400 });

  const state = await getOrRefreshReviewState(user.id);
  const item = state.queue.find((entry) => entry.id === body.itemId);
  if (!item) return NextResponse.json({ error: "Tekrar öğesi artık mevcut değil." }, { status: 404 });

  const attempts = { ...state.attempts, [item.id]: (state.attempts[item.id] ?? 0) + 1 };
  const correct = item.type === "CONCEPT"
    ? Boolean(body.completeConcept)
    : answersMatch(body.answer, item.correctAnswer, item.acceptedAnswers ?? []);
  const completedIds = correct ? Array.from(new Set([...state.completedIds, item.id])) : state.completedIds;

  await prisma.$transaction(async (tx) => {
    await tx.smartReviewState.update({
      where: { userId: user.id },
      data: {
        completedIds: completedIds as unknown as Prisma.InputJsonValue,
        attempts: attempts as unknown as Prisma.InputJsonValue,
      },
    });

    if (item.errorHistoryId) {
      if (correct) {
        await tx.learningErrorHistory.updateMany({
          where: { id: item.errorHistoryId, userId: user.id, resolvedAt: null },
          data: { resolvedAt: new Date() },
        });
      } else {
        await tx.learningErrorHistory.updateMany({
          where: { id: item.errorHistoryId, userId: user.id },
          data: { occurrenceCount: { increment: 1 }, lastOccurredAt: new Date(), resolvedAt: null },
        });
      }
    }
  });

  return NextResponse.json({
    result: {
      correct,
      explanation: item.explanation,
      correctAnswer: !correct && attempts[item.id] >= 2 ? item.correctAnswer : undefined,
      completedCount: completedIds.length,
      totalCount: state.queue.length,
    },
  });
}

export const GET = withApiMonitoring("/api/intelligence/review", GETHandler);
export const POST = withApiMonitoring("/api/intelligence/review", POSTHandler);
