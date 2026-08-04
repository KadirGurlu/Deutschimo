export type ReviewConfidence = "UNSURE" | "SURE";
export type AdaptiveReviewRating = "FORGOT" | "HARD" | "GOOD" | "EASY";

export type ReviewMemoryState = {
  mastery: number;
  easeFactor: number;
  intervalDays: number;
  correctStreak: number;
  lapseCount: number;
  reviewCount: number;
  stability?: number;
  retrievability?: number;
  confidenceScore?: number;
  hintUseCount?: number;
  sameErrorStreak?: number;
  averageResponseMs?: number | null;
  lastSeenAt?: Date | null;
};

export type ReviewSignals = {
  correct: boolean;
  responseMs?: number | null;
  hintUsed: boolean;
  repeatedErrorCount: number;
  difficulty: number;
  confidence: ReviewConfidence;
  rating: AdaptiveReviewRating;
  mode: string;
};

export type AdaptiveSchedule = {
  mastery: number;
  easeFactor: number;
  intervalDays: number;
  correctStreak: number;
  lapseCount: number;
  reviewCount: number;
  stability: number;
  retrievability: number;
  confidenceScore: number;
  hintUseCount: number;
  sameErrorStreak: number;
  averageResponseMs: number | null;
  lastResponseMs: number | null;
  lastSeenAt: Date;
  lastReviewedAt: Date;
  nextReviewAt: Date;
  lastRating: AdaptiveReviewRating;
  lastMode: string;
  signalScore: number;
  expectedSeconds: number;
  explanations: string[];
};

const DAY_MS = 86_400_000;
const MINUTE_MS = 60_000;

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function finiteNumber(value: unknown, fallback: number) {
  return Number.isFinite(value) ? Number(value) : fallback;
}

export function expectedResponseSeconds(mode: string, difficulty = 3) {
  const base: Record<string, number> = {
    DE_TO_TR: 16,
    TR_TO_DE: 24,
    LISTEN_WRITE: 30,
    AUDIO_TO_WORD: 30,
    FILL_BLANK: 24,
    SENTENCE_ORDER: 34,
    ARTICLE: 12,
    PLURAL: 18,
    SPEAK: 28,
    NEW_SENTENCE: 58,
    SENTENCE: 58,
    MULTIPLE_CHOICE: 20,
    TRUE_FALSE: 14,
    TRANSLATION: 32,
    CONCEPT: 55,
  };
  return Math.round((base[mode] ?? 26) * (0.78 + clamp(difficulty, 1, 5) * 0.11));
}

function speedScore(responseMs: number | null | undefined, expectedSeconds: number) {
  if (!responseMs || responseMs <= 0) return 0.72;
  const ratio = (expectedSeconds * 1000) / responseMs;
  return clamp(ratio, 0.28, 1.12);
}

function rollingAverage(previous: number | null | undefined, current: number | null) {
  if (!current) return previous ?? null;
  if (!previous) return current;
  return Math.round(previous * 0.72 + current * 0.28);
}

export function scheduleAdaptiveReview(
  state: ReviewMemoryState,
  signals: ReviewSignals,
  now = new Date(),
): AdaptiveSchedule {
  const difficulty = clamp(Math.round(finiteNumber(signals.difficulty, 3)), 1, 5);
  const repeatedErrorCount = clamp(Math.round(finiteNumber(signals.repeatedErrorCount, 0)), 0, 50);
  const responseMs = Number.isFinite(signals.responseMs)
    ? Math.max(0, Math.round(signals.responseMs ?? 0))
    : null;
  const expectedSeconds = expectedResponseSeconds(signals.mode, difficulty);
  const speed = speedScore(responseMs, expectedSeconds);
  const effectiveCorrect = signals.correct && signals.rating !== "FORGOT";
  const previousSeenAt = state.lastSeenAt instanceof Date && Number.isFinite(state.lastSeenAt.getTime())
    ? state.lastSeenAt
    : null;
  const elapsedDays = previousSeenAt
    ? Math.max(0, (now.getTime() - previousSeenAt.getTime()) / DAY_MS)
    : 0;

  let signalScore = effectiveCorrect ? 0.68 + Math.min(0.28, speed * 0.25) : 0.08;
  if (signals.hintUsed) signalScore -= 0.14;
  signalScore -= Math.min(0.26, repeatedErrorCount * 0.045);
  signalScore -= (difficulty - 3) * 0.025;
  // Aynı bilginin en son ne zaman görüldüğü, geri çağırmanın gücünü ayırt eder.
  // Uzun aradan sonra doğru hatırlama küçük bir dayanıklılık bonusu alır.
  if (effectiveCorrect && elapsedDays >= 1) signalScore += Math.min(0.08, Math.log2(elapsedDays + 1) * 0.018);

  if (signals.confidence === "SURE" && effectiveCorrect) signalScore += 0.06;
  if (signals.confidence === "UNSURE" && effectiveCorrect) signalScore -= 0.06;
  if (signals.confidence === "SURE" && !effectiveCorrect) signalScore -= 0.13;

  const ratingAdjustment: Record<AdaptiveReviewRating, number> = {
    FORGOT: -0.22,
    HARD: -0.07,
    GOOD: 0.04,
    EASY: 0.12,
  };
  signalScore = clamp(signalScore + ratingAdjustment[signals.rating], 0, 1);

  let easeFactor = clamp(finiteNumber(state.easeFactor, 2.5), 1.3, 3.2);
  let intervalDays = Math.max(0, Math.round(finiteNumber(state.intervalDays, 0)));
  let correctStreak = Math.max(0, Math.round(finiteNumber(state.correctStreak, 0)));
  let lapseCount = Math.max(0, Math.round(finiteNumber(state.lapseCount, 0)));
  let mastery = clamp(Math.round(finiteNumber(state.mastery, 0)), 0, 100);
  let stability = Math.max(0.2, finiteNumber(state.stability, Math.max(1, intervalDays || 1)));
  let sameErrorStreak = Math.max(0, Math.round(finiteNumber(state.sameErrorStreak, 0)));
  let delayMs: number;
  const explanations: string[] = [];

  if (!effectiveCorrect) {
    easeFactor = clamp(easeFactor - 0.16 - repeatedErrorCount * 0.012 - (signals.hintUsed ? 0.04 : 0), 1.3, 3.2);
    intervalDays = 0;
    correctStreak = 0;
    lapseCount += 1;
    sameErrorStreak += 1;
    stability = clamp(stability * (0.48 - Math.min(0.18, repeatedErrorCount * 0.025)), 0.2, 365);
    mastery = clamp(Math.round(mastery - 10 - repeatedErrorCount * 1.4 - (signals.confidence === "SURE" ? 4 : 0)), 0, 100);
    const retryMinutes = clamp(
      8 + difficulty * 4 + repeatedErrorCount * 8 + (signals.hintUsed ? 5 : 0),
      10,
      120,
    );
    delayMs = retryMinutes * MINUTE_MS;
    explanations.push(`Yanlış cevap nedeniyle ${Math.round(retryMinutes)} dakika içinde kısa tekrar.`);
  } else {
    correctStreak += 1;
    sameErrorStreak = 0;
    const qualityMultiplier = 0.55 + signalScore * 0.9;
    const difficultyMultiplier = 1.18 - difficulty * 0.075;
    const confidenceMultiplier = signals.confidence === "SURE" ? 1.12 : 0.82;
    const hintMultiplier = signals.hintUsed ? 0.7 : 1;
    const ratingMultiplier: Record<AdaptiveReviewRating, number> = {
      FORGOT: 0.35,
      HARD: 0.72,
      GOOD: 1,
      EASY: 1.42,
    };

    easeFactor = clamp(
      easeFactor
        + (signalScore - 0.63) * 0.22
        + (signals.rating === "EASY" ? 0.08 : 0)
        - (signals.hintUsed ? 0.06 : 0),
      1.3,
      3.2,
    );

    const initialInterval = state.reviewCount <= 0
      ? (signals.confidence === "SURE" && !signals.hintUsed ? 2 : 1)
      : state.reviewCount === 1
        ? 3
        : Math.max(1, intervalDays);

    const calculated = initialInterval
      * easeFactor
      * qualityMultiplier
      * difficultyMultiplier
      * confidenceMultiplier
      * hintMultiplier
      * ratingMultiplier[signals.rating];

    intervalDays = clamp(Math.round(calculated), 1, 365);
    const spacingBonus = 1 + Math.min(0.18, elapsedDays * 0.012);
    stability = clamp(
      stability * (1.08 + signalScore * 0.65) * (signals.hintUsed ? 0.82 : 1) * spacingBonus,
      0.2,
      365,
    );
    mastery = clamp(
      Math.round(
        mastery
        + 4
        + signalScore * 10
        + (signals.confidence === "SURE" ? 2 : 0)
        - (signals.hintUsed ? 3 : 0)
        - Math.min(4, repeatedErrorCount),
      ),
      0,
      100,
    );
    delayMs = intervalDays * DAY_MS;
    explanations.push(`${intervalDays} günlük yeni aralık; doğruluk, hız, güven ve zorluk birlikte değerlendirildi.`);
  }

  if (signals.hintUsed) explanations.push("İpucu kullanıldığı için aralık kısaltıldı.");
  if (signals.confidence === "UNSURE") explanations.push("“Emin değilim” seçimi daha yakın pekiştirme oluşturdu.");
  if (signals.confidence === "SURE" && !effectiveCorrect) explanations.push("Emin olunan yanlış cevap, kalibrasyon hatası olarak daha güçlü kaydedildi.");
  if (repeatedErrorCount > 0) explanations.push(`Aynı hata ${repeatedErrorCount} kez görüldüğü için öncelik artırıldı.`);
  if (responseMs && responseMs > expectedSeconds * 1400) explanations.push("Cevap süresi hedef süreden uzun olduğu için tekrar aralığı azaltıldı.");
  if (effectiveCorrect && elapsedDays >= 3) explanations.push(`Bilgi ${Math.round(elapsedDays)} gün sonra doğru hatırlandığı için istikrar puanı güçlendirildi.`);

  const previousConfidence = clamp(Math.round(finiteNumber(state.confidenceScore, 50)), 0, 100);
  const calibrationTarget = effectiveCorrect
    ? (signals.confidence === "SURE" ? 92 : 68)
    : (signals.confidence === "SURE" ? 20 : 42);
  const confidenceScore = clamp(Math.round(previousConfidence * 0.75 + calibrationTarget * 0.25), 0, 100);
  const retrievability = clamp(effectiveCorrect ? 0.55 + signalScore * 0.45 : 0.18 + signalScore * 0.2, 0.05, 1);
  const nextReviewAt = new Date(now.getTime() + delayMs);

  return {
    mastery,
    easeFactor: Number(easeFactor.toFixed(2)),
    intervalDays,
    correctStreak,
    lapseCount,
    reviewCount: Math.max(0, Math.round(finiteNumber(state.reviewCount, 0))) + 1,
    stability: Number(stability.toFixed(2)),
    retrievability: Number(retrievability.toFixed(3)),
    confidenceScore,
    hintUseCount: Math.max(0, Math.round(finiteNumber(state.hintUseCount, 0))) + (signals.hintUsed ? 1 : 0),
    sameErrorStreak,
    averageResponseMs: rollingAverage(state.averageResponseMs, responseMs),
    lastResponseMs: responseMs,
    lastSeenAt: now,
    lastReviewedAt: now,
    nextReviewAt,
    lastRating: signals.rating,
    lastMode: signals.mode,
    signalScore: Number(signalScore.toFixed(3)),
    expectedSeconds,
    explanations,
  };
}

export type PrioritySignals = {
  nextReviewAt: Date;
  mastery: number;
  difficulty: number;
  sameErrorStreak: number;
  hintUseCount: number;
  averageResponseMs?: number | null;
  mode?: string | null;
};

export function adaptiveDuePriority(item: PrioritySignals, now = new Date()) {
  const overdueHours = Math.max(0, (now.getTime() - item.nextReviewAt.getTime()) / 3_600_000);
  const expectedMs = expectedResponseSeconds(item.mode ?? "DE_TO_TR", item.difficulty) * 1000;
  const slowFactor = item.averageResponseMs
    ? clamp(item.averageResponseMs / expectedMs - 1, 0, 2) * 8
    : 0;
  return Number((
    overdueHours * 1.8
    + (100 - clamp(item.mastery, 0, 100)) * 0.55
    + clamp(item.difficulty, 1, 5) * 4
    + Math.min(8, item.sameErrorStreak) * 13
    + Math.min(10, item.hintUseCount) * 1.5
    + slowFactor
  ).toFixed(2));
}

export function intervalLabel(nextReviewAt: Date, now = new Date()) {
  const milliseconds = Math.max(0, nextReviewAt.getTime() - now.getTime());
  if (milliseconds < DAY_MS) {
    const minutes = Math.max(1, Math.round(milliseconds / MINUTE_MS));
    return minutes < 60 ? `${minutes} dk` : `${Math.round(minutes / 60)} sa`;
  }
  const days = Math.max(1, Math.round(milliseconds / DAY_MS));
  return days === 1 ? "1 gün" : `${days} gün`;
}
