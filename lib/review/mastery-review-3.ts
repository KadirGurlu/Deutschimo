import { MasterySkillArea, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { expectedResponseSeconds } from "@/lib/review/adaptive-scheduler";
import type { MasteryEvidenceInput } from "@/types/mastery";
import type { ReviewItem, ReviewItemType, ReviewPracticeMode } from "@/types/intelligence";
import {
  MASTERY_REVIEW_PHASE_INSTRUCTIONS,
  MASTERY_REVIEW_PHASE_LABELS,
  nextMasteryReviewPhase,
  normalizeMasteryReviewPhase,
  type MasteryReviewPhase,
  type MasteryReviewSignalSummary,
} from "@/types/smart-review-v38";

const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, value));
const lower = (value: string) => value.trim().toLowerCase();
const scopeKey = (courseId: string) => `course:${lower(courseId)}`;

function toSkill(value: unknown): MasterySkillArea {
  const normalized = String(value ?? "").toLocaleLowerCase("tr-TR");
  if (/vocab|wort|kelime/.test(normalized)) return MasterySkillArea.VOCABULARY;
  if (/read|lesen|oku/.test(normalized)) return MasterySkillArea.READING;
  if (/listen|hör|hoer|dinle/.test(normalized)) return MasterySkillArea.LISTENING;
  if (/writ|schreib|yaz/.test(normalized)) return MasterySkillArea.WRITING;
  if (/speak|sprech|konuş|konus/.test(normalized)) return MasterySkillArea.SPEAKING;
  return MasterySkillArea.GRAMMAR;
}

function expectedMode(skill: MasterySkillArea): ReviewPracticeMode {
  if (skill === MasterySkillArea.VOCABULARY) return "TRANSLATION";
  if (skill === MasterySkillArea.READING || skill === MasterySkillArea.LISTENING) return "MULTIPLE_CHOICE";
  if (skill === MasterySkillArea.WRITING || skill === MasterySkillArea.SPEAKING) return "NEW_SENTENCE";
  return "FILL_BLANK";
}

function iso(value: Date | null | undefined) {
  return value ? value.toISOString() : null;
}

function phaseVariant<T extends ReviewItem>(item: T, phase: MasteryReviewPhase): T {
  if (phase === "SENTENCE") {
    return {
      ...item,
      type: "FILL_IN_THE_BLANK" as ReviewItemType,
      reviewMode: "FILL_BLANK",
      prompt: item.prompt.includes("___")
        ? item.prompt
        : `Cümle içinde doğru biçimi yaz: ${item.prompt}`,
    };
  }

  if (phase === "PRODUCTION") {
    return {
      ...item,
      type: "CONCEPT" as ReviewItemType,
      reviewMode: "NEW_SENTENCE",
      prompt: `Üretim · ${item.skill}: Öğrendiğin yapıyı kullanarak kendi Almanca cümleni yaz.`,
      options: undefined,
    };
  }

  if (phase === "CONTRAST") {
    if (item.options?.length && item.type === "MULTIPLE_CHOICE") {
      return {
        ...item,
        prompt: `Karşılaştırma: Seçenekleri birbirinden ayır ve doğru biçimi seç. ${item.prompt}`,
      };
    }

    return {
      ...item,
      type: "CONCEPT" as ReviewItemType,
      reviewMode: "CONCEPT",
      prompt: `Karşılaştırma · ${item.skill}: Karıştırılabilecek biçimler arasındaki farkı doğru bir Almanca örnekle göster.`,
      options: undefined,
    };
  }

  return item;
}

function queuePriority(args: {
  masteryScore: number | null;
  similarTopicScore: number | null;
  failureCount: number;
  difficulty: number;
  responseMs: number | null;
  expectedSeconds: number;
  confidence: string | null;
  daysSinceReview: number | null;
}) {
  const weakMastery = args.masteryScore === null ? 10 : (100 - args.masteryScore) * 0.22;
  const similarWeakness = args.similarTopicScore === null ? 4 : (100 - args.similarTopicScore) * 0.12;
  const repeatedErrors = Math.min(24, args.failureCount * 5);
  const difficulty = args.difficulty * 3;
  const expectedMs = Math.max(1, args.expectedSeconds * 1000);
  const slowness = args.responseMs ? Math.min(10, Math.max(0, args.responseMs / expectedMs - 1) * 6) : 2;
  const confidentWrong = args.confidence === "SURE" ? 8 : 0;
  const reviewGap = args.daysSinceReview === null ? 4 : Math.min(12, Math.max(0, args.daysSinceReview) * 1.5);
  return Math.round(clamp(20 + weakMastery + similarWeakness + repeatedErrors + difficulty + slowness + confidentWrong + reviewGap) * 10) / 10;
}

export async function enqueueMasteryEvidenceForReview(
  tx: Prisma.TransactionClient,
  userId: string,
  input: MasteryEvidenceInput,
  evidenceScore: number,
): Promise<void> {
  if (input.correct !== false || input.source === "SMART_REVIEW") return;

  const courseId = lower(input.courseId);
  const skill = toSkill(input.skill);
  const questionId = input.questionId.slice(0, 180);
  const tags = Array.isArray(input.tags) ? input.tags.slice(0, 8) : [];
  const now = new Date();

  const [attempts, failureCount, skillSnapshot, topics, existing] = await Promise.all([
    tx.masteryAttempt.findMany({
      where: { userId, courseId, questionId, skill },
      orderBy: { createdAt: "desc" },
      take: 16,
    }),
    tx.masteryAttempt.count({
      where: { userId, courseId, questionId, skill, correct: false },
    }),
    tx.masterySkillSnapshot.findUnique({
      where: { userId_scopeKey_skill: { userId, scopeKey: scopeKey(courseId), skill } },
    }),
    tags.length
      ? tx.masteryTopicSnapshot.findMany({
          where: { userId, courseId, unitId: null, tag: { in: tags } },
        })
      : Promise.resolve([]),
    tx.masteryReviewQueueItem.findUnique({
      where: { userId_courseId_questionId_skill: { userId, courseId, questionId, skill } },
    }),
  ]);

  const correctAttempt = attempts.find((entry) => entry.correct === true);
  const wrongAttempt = attempts.find((entry) => entry.correct === false);
  const responseValues = attempts.map((entry) => entry.responseMs).filter((value): value is number => typeof value === "number");
  const averageResponseMs = responseValues.length
    ? Math.round(responseValues.reduce((sum, value) => sum + value, 0) / responseValues.length)
    : input.responseMs ?? null;
  const similarTopicScore = topics.length
    ? Math.round(topics.reduce((sum, entry) => sum + entry.score, 0) / topics.length)
    : skillSnapshot?.score ?? null;
  const difficulty = Math.max(1, Math.min(5, Number(input.difficulty ?? 3)));
  const expectedSeconds = expectedResponseSeconds(expectedMode(skill), difficulty);
  const daysSinceReview = existing?.lastReviewedAt
    ? Math.max(0, (now.getTime() - existing.lastReviewedAt.getTime()) / 86_400_000)
    : null;

  const priorityScore = queuePriority({
    masteryScore: skillSnapshot?.score ?? evidenceScore,
    similarTopicScore,
    failureCount: Math.max(1, failureCount),
    difficulty,
    responseMs: input.responseMs ?? wrongAttempt?.responseMs ?? null,
    expectedSeconds,
    confidence: input.confidence ?? wrongAttempt?.confidenceLabel ?? null,
    daysSinceReview,
  });

  await tx.masteryReviewQueueItem.upsert({
    where: { userId_courseId_questionId_skill: { userId, courseId, questionId, skill } },
    create: {
      userId,
      courseId,
      unitId: input.unitId ?? null,
      questionId,
      source: input.source,
      skill,
      tags,
      status: "ACTIVE",
      phase: "RECALL",
      dueAt: now,
      priorityScore,
      failureCount: Math.max(1, failureCount),
      successCount: 0,
      lastCorrectAt: correctAttempt?.createdAt ?? null,
      lastIncorrectAt: now,
      lastResponseMs: input.responseMs ?? wrongAttempt?.responseMs ?? null,
      averageResponseMs,
      confidenceLabel: input.confidence ?? null,
      difficulty,
      masteryScore: skillSnapshot?.score ?? evidenceScore,
      similarTopicScore,
      lastReviewedAt: existing?.lastReviewedAt ?? null,
      lastMode: existing?.lastMode ?? null,
    },
    update: {
      unitId: input.unitId ?? existing?.unitId ?? null,
      source: input.source,
      tags,
      status: "ACTIVE",
      phase: "RECALL",
      dueAt: now,
      priorityScore,
      failureCount: { increment: 1 },
      lastCorrectAt: correctAttempt?.createdAt ?? existing?.lastCorrectAt ?? null,
      lastIncorrectAt: now,
      lastResponseMs: input.responseMs ?? wrongAttempt?.responseMs ?? null,
      averageResponseMs,
      confidenceLabel: input.confidence ?? existing?.confidenceLabel ?? null,
      difficulty,
      masteryScore: skillSnapshot?.score ?? evidenceScore,
      similarTopicScore,
    },
  });
}

export async function syncMasteryReviewOutcome(
  tx: Prisma.TransactionClient,
  args: {
    userId: string;
    courseId: string;
    unitId: string | null;
    questionId: string;
    source: string;
    skillLabel: string;
    correct: boolean;
    responseMs: number | null;
    confidence: string;
    difficulty: number;
    nextReviewAt: Date;
    mode: string;
    phase: unknown;
  },
) {
  const courseId = lower(args.courseId);
  const skill = toSkill(args.skillLabel);
  const requestedPhase = normalizeMasteryReviewPhase(args.phase);
  const now = new Date();

  let queue = await tx.masteryReviewQueueItem.findUnique({
    where: {
      userId_courseId_questionId_skill: {
        userId: args.userId,
        courseId,
        questionId: args.questionId.slice(0, 180),
        skill,
      },
    },
  });

  if (!queue && args.unitId) {
    queue = await tx.masteryReviewQueueItem.findFirst({
      where: {
        userId: args.userId,
        courseId,
        unitId: args.unitId,
        skill,
        status: "ACTIVE",
      },
      orderBy: [{ priorityScore: "desc" }, { dueAt: "asc" }],
    });
  }

  if (!queue && !args.correct) {
    return tx.masteryReviewQueueItem.create({
      data: {
        userId: args.userId,
        courseId,
        unitId: args.unitId,
        questionId: args.questionId.slice(0, 180),
        source: args.source,
        skill,
        tags: [],
        status: "ACTIVE",
        phase: "RECALL",
        dueAt: args.nextReviewAt,
        priorityScore: 75,
        failureCount: 1,
        successCount: 0,
        lastIncorrectAt: now,
        lastResponseMs: args.responseMs,
        averageResponseMs: args.responseMs,
        confidenceLabel: args.confidence,
        difficulty: args.difficulty,
        lastReviewedAt: now,
        lastMode: args.mode,
      },
    });
  }

  if (!queue) return null;

  const previousAverage = queue.averageResponseMs;
  const nextAverage = args.responseMs === null
    ? previousAverage
    : previousAverage === null
      ? args.responseMs
      : Math.round((previousAverage * Math.max(1, queue.failureCount + queue.successCount) + args.responseMs) /
          Math.max(2, queue.failureCount + queue.successCount + 1));

  if (!args.correct) {
    return tx.masteryReviewQueueItem.update({
      where: { id: queue.id },
      data: {
        status: "ACTIVE",
        phase: "RECALL",
        dueAt: args.nextReviewAt,
        priorityScore: clamp(queue.priorityScore + 8),
        failureCount: { increment: 1 },
        lastIncorrectAt: now,
        lastResponseMs: args.responseMs,
        averageResponseMs: nextAverage,
        confidenceLabel: args.confidence,
        difficulty: args.difficulty,
        lastReviewedAt: now,
        lastMode: args.mode,
      },
    });
  }

  const currentPhase = normalizeMasteryReviewPhase(queue.phase || requestedPhase);
  const nextPhase = nextMasteryReviewPhase(currentPhase);

  return tx.masteryReviewQueueItem.update({
    where: { id: queue.id },
    data: {
      status: "ACTIVE",
      phase: nextPhase,
      dueAt: args.nextReviewAt,
      priorityScore: clamp(queue.priorityScore - (currentPhase === "CONTRAST" ? 14 : 7)),
      successCount: { increment: 1 },
      lastCorrectAt: now,
      lastResponseMs: args.responseMs,
      averageResponseMs: nextAverage,
      confidenceLabel: args.confidence,
      difficulty: args.difficulty,
      lastReviewedAt: now,
      lastMode: args.mode,
    },
  });
}

function skillLabel(skill: MasterySkillArea) {
  if (skill === MasterySkillArea.VOCABULARY) return "Kelime";
  if (skill === MasterySkillArea.READING) return "Okuma";
  if (skill === MasterySkillArea.LISTENING) return "Dinleme";
  if (skill === MasterySkillArea.WRITING) return "Yazma";
  if (skill === MasterySkillArea.SPEAKING) return "Konuşma";
  return "Gramer";
}

function queuePriorityLabel(score: number): "CRITICAL" | "HIGH" | "MEDIUM" {
  if (score >= 75) return "CRITICAL";
  if (score >= 55) return "HIGH";
  return "MEDIUM";
}

function standaloneReviewItem(row: {
  id: string;
  courseId: string;
  unitId: string | null;
  questionId: string;
  skill: MasterySkillArea;
  tags: string[];
  phase: string;
  dueAt: Date;
  priorityScore: number;
  failureCount: number;
  masteryScore: number | null;
  difficulty: number;
}): ReviewItem {
  const label = skillLabel(row.skill);
  const topic = row.tags[0] ?? label;
  const phase = normalizeMasteryReviewPhase(row.phase);

  return {
    id: `v38:${row.id}`,
    sourceId: row.questionId,
    sourceType: "INSIGHT",
    courseId: row.courseId,
    unitId: row.unitId ?? `mastery-${row.courseId}`,
    unitTitle: `${row.courseId.toUpperCase()} · Mastery tekrarı`,
    skill: label,
    type: "CONCEPT",
    prompt: `${MASTERY_REVIEW_PHASE_LABELS[phase]} · ${topic}: Bildiğini kendi Almanca örneğinle göster.`,
    href: "/mastery",
    priority: queuePriorityLabel(row.priorityScore),
    reason: "Yanlış cevap Mastery Engine tarafından otomatik tekrar kuyruğuna alındı.",
    occurrenceCount: row.failureCount,
    objectiveCode: `V38:${row.id}`,
    reviewMode: "CONCEPT",
    difficulty: row.difficulty,
    mastery: row.masteryScore === null ? undefined : Math.round(row.masteryScore),
    sameErrorStreak: Math.max(0, row.failureCount - 1),
    expectedSeconds: expectedResponseSeconds("CONCEPT", row.difficulty),
    nextReviewAt: row.dueAt.toISOString(),
    hint: "Ders notuna bakmadan önce bilgiyi kendin geri çağırmayı dene.",
  };
}

export async function listStandaloneMasteryReviewItems(
  userId: string,
  excludedQuestionIds: string[],
): Promise<ReviewItem[]> {
  const rows = await prisma.masteryReviewQueueItem.findMany({
    where: {
      userId,
      status: "ACTIVE",
      dueAt: { lte: new Date() },
      ...(excludedQuestionIds.length
        ? { questionId: { notIn: Array.from(new Set(excludedQuestionIds)) } }
        : {}),
    },
    orderBy: [{ priorityScore: "desc" }, { dueAt: "asc" }],
    take: 30,
  });

  return rows.map(standaloneReviewItem);
}

export async function getStandaloneMasteryReviewItem(
  userId: string,
  itemId: string,
): Promise<(ReviewItem & {
  correctAnswer?: unknown;
  acceptedAnswers?: unknown[];
  explanation: string;
}) | null> {
  if (!itemId.startsWith("v38:")) return null;
  const id = itemId.slice(4);
  if (!id) return null;

  const row = await prisma.masteryReviewQueueItem.findFirst({
    where: { id, userId, status: "ACTIVE" },
  });
  if (!row) return null;

  return {
    ...standaloneReviewItem(row),
    correctAnswer: undefined,
    acceptedAnswers: [],
    explanation: "Bu tekrar, zayıf Mastery alanını aktif geri çağırma ve üretim yoluyla güçlendirmek için oluşturuldu.",
  };
}

export async function decorateSmartReviewQueue<T extends ReviewItem>(
  userId: string,
  items: T[],
): Promise<T[]> {
  if (!items.length) return items;

  const sourceIds = Array.from(new Set(items.map((item) => item.sourceId).filter(Boolean)));
  const courseIds = Array.from(new Set(items.map((item) => lower(item.courseId))));

  const queueRows = await prisma.masteryReviewQueueItem.findMany({
    where: {
      userId,
      status: "ACTIVE",
      courseId: { in: courseIds },
      OR: [
        { questionId: { in: sourceIds } },
        { unitId: { in: items.map((item) => item.unitId).filter(Boolean) } },
      ],
    },
    orderBy: [{ priorityScore: "desc" }, { dueAt: "asc" }],
  });

  const byExact = new Map(
    queueRows.map((row) => [`${row.courseId}|${row.questionId}|${row.skill}`, row]),
  );

  const decorated = items.map((item) => {
    const skill = toSkill(item.skill);
    const courseId = lower(item.courseId);
    const exact = byExact.get(`${courseId}|${item.sourceId}|${skill}`);
    const queue = exact ?? queueRows.find((row) =>
      row.courseId === courseId &&
      row.unitId === item.unitId &&
      row.skill === skill
    );

    if (!queue) return item;

    const phase = normalizeMasteryReviewPhase(queue.phase);
    const signals: MasteryReviewSignalSummary = {
      lastCorrectAt: iso(queue.lastCorrectAt),
      lastIncorrectAt: iso(queue.lastIncorrectAt),
      responseMs: queue.lastResponseMs,
      averageResponseMs: queue.averageResponseMs,
      errorCount: queue.failureCount,
      skillMastery: queue.masteryScore === null ? null : Math.round(queue.masteryScore),
      difficulty: queue.difficulty,
      lastReviewAt: iso(queue.lastReviewedAt),
      confidence: queue.confidenceLabel,
      similarTopicScore: queue.similarTopicScore === null ? null : Math.round(queue.similarTopicScore),
    };

    const variant = phaseVariant(item, phase);

    return {
      ...variant,
      masteryPhase: phase,
      masteryPhaseLabel: MASTERY_REVIEW_PHASE_LABELS[phase],
      masteryPhaseInstruction: MASTERY_REVIEW_PHASE_INSTRUCTIONS[phase],
      masteryPriorityScore: queue.priorityScore,
      masteryTags: queue.tags,
      masterySignals: signals,
    } as T;
  });

  return decorated.sort(
    (first, second) => (second.masteryPriorityScore ?? 0) - (first.masteryPriorityScore ?? 0),
  );
}
