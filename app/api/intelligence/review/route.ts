import { AssessmentSkill, Level, Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth/authorization";
import { prisma } from "@/lib/db";
import { answersMatch } from "@/lib/learning/answer-normalizer";
import { getOrRefreshReviewState } from "@/lib/intelligence/server";
import {
  adaptiveDuePriority,
  expectedResponseSeconds,
  intervalLabel,
  scheduleAdaptiveReview,
  type AdaptiveReviewRating,
} from "@/lib/review/adaptive-scheduler";
import { withApiMonitoring } from "@/lib/security/api-monitor";
import type { ReviewConfidence, ReviewPracticeMode } from "@/types/intelligence";
import {
  decorateSmartReviewQueue,
  getStandaloneMasteryReviewItem,
  listStandaloneMasteryReviewItems,
  syncMasteryReviewOutcome,
} from "@/lib/review/mastery-review-3";
import {
  normalizeMasteryReviewPhase,
  type MasteryReviewPhase,
} from "@/types/smart-review-v38";


/* V37_ROUTE_COMPAT_INLINE
 * V28.x-V36 static release validators expect the historical learning logic
 * to remain visible in this route file. V37 therefore keeps the original
 * POST implementation inline and mirrors only successful responses into
 * Mastery Engine. The old business logic runs first and remains authoritative.
 */
import { captureMasteryExchange } from "@/lib/mastery/bridge";

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

function objectiveKey(item: Awaited<ReturnType<typeof getOrRefreshReviewState>>["queue"][number]) {
  return item.objectiveCode ?? `SMART_REVIEW:${item.courseId}:${item.unitId}:${item.sourceId}`;
}

function reviewMode(item: Awaited<ReturnType<typeof getOrRefreshReviewState>>["queue"][number]): ReviewPracticeMode {
  if (item.type === "MULTIPLE_CHOICE") return "MULTIPLE_CHOICE";
  if (item.type === "TRUE_FALSE") return "TRUE_FALSE";
  if (item.type === "FILL_IN_THE_BLANK") return "FILL_BLANK";
  if (item.type === "TRANSLATION") return "TRANSLATION";
  return "NEW_SENTENCE";
}

function difficulty(item: Awaited<ReturnType<typeof getOrRefreshReviewState>>["queue"][number]) {
  const priorityBase = item.priority === "CRITICAL" ? 5 : item.priority === "HIGH" ? 4 : 3;
  return Math.min(5, Math.max(1, priorityBase + ((item.occurrenceCount ?? 0) >= 4 ? 1 : 0)));
}

function skillFor(label: string): AssessmentSkill {
  const normalized = label.toLocaleLowerCase("tr-TR");
  if (normalized.includes("kelime") || normalized.includes("vocabulary")) return AssessmentSkill.VOCABULARY;
  if (normalized.includes("oku")) return AssessmentSkill.READING;
  if (normalized.includes("dinle")) return AssessmentSkill.LISTENING;
  if (normalized.includes("yaz")) return AssessmentSkill.WRITING;
  if (normalized.includes("konuş")) return AssessmentSkill.SPEAKING;
  if (normalized.includes("telaffuz")) return AssessmentSkill.PRONUNCIATION;
  if (normalized.includes("iletişim")) return AssessmentSkill.COMMUNICATION;
  return AssessmentSkill.GRAMMAR;
}

function levelFor(courseId: string): Level {
  const candidate = courseId.toUpperCase();
  return candidate === "A2" ? Level.A2 : candidate === "B1" ? Level.B1 : candidate === "B2" ? Level.B2 : Level.A1;
}

function ratingFromSignals(args: {
  correct: boolean;
  confidence: ReviewConfidence;
  hintUsed: boolean;
  responseMs: number | null;
  expectedSeconds: number;
}): AdaptiveReviewRating {
  if (!args.correct) return "FORGOT";
  const fast = Boolean(args.responseMs && args.responseMs <= args.expectedSeconds * 900);
  if (args.confidence === "SURE" && !args.hintUsed && fast) return "EASY";
  if (args.confidence === "UNSURE" || args.hintUsed) return "HARD";
  return "GOOD";
}

async function GETHandler(request: Request) {
  const user = await getApiUser();
  if (!user) return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });
  const url = new URL(request.url);
  const state = await getOrRefreshReviewState(user.id, url.searchParams.get("refresh") === "1");
  const keys = state.queue.map(objectiveKey);
  const competencies = keys.length
    ? await prisma.competencyRecord.findMany({ where: { userId: user.id, objectiveCode: { in: keys } } })
    : [];
  const competencyByKey = new Map(competencies.map((entry) => [entry.objectiveCode, entry]));
  const now = new Date();

  const dueQueue = state.queue
    .map((item) => {
      const key = objectiveKey(item);
      const competency = competencyByKey.get(key);
      const mode = reviewMode(item);
      const itemDifficulty = competency?.difficulty ?? difficulty(item);
      return {
        item,
        competency,
        key,
        mode,
        itemDifficulty,
        dueAt: competency?.nextReviewAt ?? now,
      };
    })
    .filter((entry) => entry.dueAt.getTime() <= now.getTime())
    .sort((first, second) => {
      const score = (entry: typeof first) => adaptiveDuePriority({
        nextReviewAt: entry.dueAt,
        mastery: entry.competency?.mastery ?? 0,
        difficulty: entry.itemDifficulty,
        sameErrorStreak: entry.competency?.sameErrorStreak ?? Math.max(0, (entry.item.occurrenceCount ?? 1) - 1),
        hintUseCount: entry.competency?.hintUseCount ?? 0,
        averageResponseMs: entry.competency?.averageResponseMs,
        mode: entry.mode,
      }, now);
      return score(second) - score(first);
    })
    .map(({ item, competency, key, mode, itemDifficulty }) => ({
      ...publicItem(item),
      objectiveCode: key,
      reviewMode: mode,
      difficulty: itemDifficulty,
      mastery: competency?.mastery ?? 0,
      sameErrorStreak: competency?.sameErrorStreak ?? Math.max(0, (item.occurrenceCount ?? 1) - 1),
      expectedSeconds: expectedResponseSeconds(mode, itemDifficulty),
      nextReviewAt: competency?.nextReviewAt?.toISOString() ?? null,
      hint: item.reason ?? "İlgili ders notundaki örnek yapıyı hatırla.",
    }));

  const standaloneMasteryItems = await listStandaloneMasteryReviewItems(
    user.id,
    dueQueue.map((item) => item.sourceId),
  );
  const masteryDueQueue = await decorateSmartReviewQueue(
    user.id,
    [...dueQueue, ...standaloneMasteryItems],
  );
  return NextResponse.json({
    items: masteryDueQueue,
    completedIds: [],
    attempts: state.attempts,
    total: masteryDueQueue.length,
    completed: 0,
    personalization: sourceSummary(state.queue),
  });
}

type SmartReviewRequest = {
  itemId?: string;
  answer?: unknown;
  responseMs?: number;
  hintUsed?: boolean;
  confidence?: ReviewConfidence;
  masteryPhase?: MasteryReviewPhase;
};

async function POSTHandler(request: Request) {
  const user = await getApiUser();
  if (!user) return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });
  const body = await request.json() as SmartReviewRequest;
  if (!body.itemId) return NextResponse.json({ error: "Tekrar öğesi bulunamadı." }, { status: 400 });
  if (body.confidence !== "SURE" && body.confidence !== "UNSURE") {
    return NextResponse.json({ error: "Önce ‘Eminim’ veya ‘Emin değilim’ seçimini yap." }, { status: 400 });
  }
  const confidence: ReviewConfidence = body.confidence;
  const masteryPhase = normalizeMasteryReviewPhase(body.masteryPhase);

  const state = await getOrRefreshReviewState(user.id);
  let item = state.queue.find((entry) => entry.id === body.itemId);
  if (!item) {
    const standaloneItem = await getStandaloneMasteryReviewItem(user.id, body.itemId);
    item = standaloneItem
      ? standaloneItem as unknown as typeof state.queue[number]
      : undefined;
  }
  if (!item) return NextResponse.json({ error: "Tekrar öğesi artık mevcut değil." }, { status: 404 });

  const key = objectiveKey(item);
  const mode = reviewMode(item);
  const current = await prisma.competencyRecord.findUnique({
    where: { userId_objectiveCode: { userId: user.id, objectiveCode: key } },
  });
  const itemDifficulty = current?.difficulty ?? difficulty(item);
  const responseMs = Number.isFinite(body.responseMs) ? Math.max(0, Math.round(body.responseMs ?? 0)) : null;
  const conceptAnswer = typeof body.answer === "string" ? body.answer.trim() : "";
  const openMasteryPhase = masteryPhase === "PRODUCTION" ||
    (masteryPhase === "CONTRAST" && item.type !== "MULTIPLE_CHOICE");
  const correct = openMasteryPhase
    ? conceptAnswer.length >= 12
    : item.type === "CONCEPT"
      ? conceptAnswer.length >= 12
      : answersMatch(body.answer, item.correctAnswer, item.acceptedAnswers ?? []);
  const attempts = { ...state.attempts, [item.id]: (state.attempts[item.id] ?? 0) + 1 };
  const expectedSeconds = expectedResponseSeconds(mode, itemDifficulty);
  const rating = ratingFromSignals({
    correct,
    confidence,
    hintUsed: Boolean(body.hintUsed),
    responseMs,
    expectedSeconds,
  });
  const repeatedErrorCount = current?.sameErrorStreak ?? Math.max(0, (item.occurrenceCount ?? 1) - 1);
  const scheduled = scheduleAdaptiveReview({
    mastery: current?.mastery ?? 0,
    easeFactor: current?.easeFactor ?? 2.5,
    intervalDays: current?.intervalDays ?? 0,
    correctStreak: current?.correctStreak ?? 0,
    lapseCount: current?.lapseCount ?? 0,
    reviewCount: current?.reviewCount ?? 0,
    stability: current?.stability ?? 1,
    retrievability: current?.retrievability ?? 1,
    confidenceScore: current?.confidence ?? 50,
    hintUseCount: current?.hintUseCount ?? 0,
    sameErrorStreak: current?.sameErrorStreak ?? 0,
    averageResponseMs: current?.averageResponseMs,
    lastSeenAt: current?.lastReviewedAt,
  }, {
    correct,
    responseMs,
    hintUsed: Boolean(body.hintUsed),
    repeatedErrorCount,
    difficulty: itemDifficulty,
    confidence,
    rating,
    mode,
  });
  const completedIds = correct ? Array.from(new Set([...state.completedIds, item.id])) : state.completedIds;

  await prisma.$transaction(async (tx) => {
    await tx.smartReviewState.update({
      where: { userId: user.id },
      data: {
        completedIds: completedIds as unknown as Prisma.InputJsonValue,
        attempts: attempts as unknown as Prisma.InputJsonValue,
      },
    });

    await tx.competencyRecord.upsert({
      where: { userId_objectiveCode: { userId: user.id, objectiveCode: key } },
      create: {
        userId: user.id,
        objectiveCode: key,
        unitId: item.unitId,
        level: levelFor(item.courseId),
        skill: skillFor(item.skill),
        topic: item.skill,
        mastery: scheduled.mastery,
        confidence: scheduled.confidenceScore,
        points: correct ? 10 : 0,
        evidenceCount: 1,
        correctCount: correct ? 1 : 0,
        incorrectCount: correct ? 0 : 1,
        averageResponseMs: scheduled.averageResponseMs,
        intervalDays: scheduled.intervalDays,
        easeFactor: scheduled.easeFactor,
        correctStreak: scheduled.correctStreak,
        lapseCount: scheduled.lapseCount,
        reviewCount: scheduled.reviewCount,
        lastReviewedAt: scheduled.lastReviewedAt,
        lastRating: scheduled.lastRating,
        hintUseCount: scheduled.hintUseCount,
        sameErrorStreak: scheduled.sameErrorStreak,
        difficulty: itemDifficulty,
        stability: scheduled.stability,
        retrievability: scheduled.retrievability,
        lastResponseMs: scheduled.lastResponseMs,
        lastEvidenceAt: scheduled.lastReviewedAt,
        nextReviewAt: scheduled.nextReviewAt,
      },
      update: {
        mastery: scheduled.mastery,
        confidence: scheduled.confidenceScore,
        points: { increment: correct ? 10 : 0 },
        evidenceCount: { increment: 1 },
        correctCount: { increment: correct ? 1 : 0 },
        incorrectCount: { increment: correct ? 0 : 1 },
        averageResponseMs: scheduled.averageResponseMs,
        intervalDays: scheduled.intervalDays,
        easeFactor: scheduled.easeFactor,
        correctStreak: scheduled.correctStreak,
        lapseCount: scheduled.lapseCount,
        reviewCount: scheduled.reviewCount,
        lastReviewedAt: scheduled.lastReviewedAt,
        lastRating: scheduled.lastRating,
        hintUseCount: scheduled.hintUseCount,
        sameErrorStreak: scheduled.sameErrorStreak,
        difficulty: itemDifficulty,
        stability: scheduled.stability,
        retrievability: scheduled.retrievability,
        lastResponseMs: scheduled.lastResponseMs,
        lastEvidenceAt: scheduled.lastReviewedAt,
        nextReviewAt: scheduled.nextReviewAt,
      },
    });

    await tx.adaptiveReviewAttempt.create({
      data: {
        userId: user.id,
        domain: "SMART_REVIEW",
        targetId: item.id,
        objectiveCode: key,
        sourceType: item.sourceType,
        sourceId: item.sourceId,
        mode,
        rating,
        correct,
        responseMs,
        hintUsed: Boolean(body.hintUsed),
        confidence,
        difficulty: itemDifficulty,
        repeatedErrorCount,
        signalScore: scheduled.signalScore,
        nextReviewAt: scheduled.nextReviewAt,
        metadata: {
          courseId: item.courseId,
          unitId: item.unitId,
          skill: item.skill,
          attemptNumber: attempts[item.id],
          masteryPhase,
        },
      },
    });

    await syncMasteryReviewOutcome(tx, {
      userId: user.id,
      courseId: item.courseId,
      unitId: item.unitId ?? null,
      questionId: item.sourceId,
      source: "SMART_REVIEW",
      skillLabel: item.skill,
      correct,
      responseMs,
      confidence,
      difficulty: itemDifficulty,
      nextReviewAt: scheduled.nextReviewAt,
      mode,
      phase: masteryPhase,
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
      explanation: item.type === "CONCEPT" && !correct
        ? "Kuralı kendi Almanca örneğinle yaz. En az birkaç kelimelik anlamlı bir cümle kur."
        : item.explanation,
      correctAnswer: !openMasteryPhase && !correct && attempts[item.id] >= 2 ? item.correctAnswer : undefined,
      completedCount: completedIds.length,
      totalCount: state.queue.length,
      schedule: {
        nextReviewAt: scheduled.nextReviewAt.toISOString(),
        label: intervalLabel(scheduled.nextReviewAt),
        mastery: scheduled.mastery,
        confidenceScore: scheduled.confidenceScore,
        signalScore: scheduled.signalScore,
        explanations: scheduled.explanations,
      },
    },
  });
}

export const GET = withApiMonitoring("/api/intelligence/review", GETHandler);
const __v37LegacyPost = withApiMonitoring("/api/intelligence/review", POSTHandler);


export async function POST(request: Request): Promise<Response> {
  const requestCopy = request.clone();

  const response = await (
    __v37LegacyPost as unknown as (request: Request) => Promise<Response>
  )(request);

  if (response.ok) {
    try {
      const requestBody = await requestCopy.json().catch(() => null);
      const responseBody = await response.clone().json().catch(() => null);

      await captureMasteryExchange({
        source: "intelligence-review",
        requestBody,
        responseBody,
      });
    } catch (error) {
      console.warn(
        "V37 mastery bridge skipped:",
        error instanceof Error ? error.message : "unknown"
      );
    }
  }

  return response;
}
