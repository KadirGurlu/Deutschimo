export const MASTERY_REVIEW_PHASES = ["RECALL", "SENTENCE", "PRODUCTION", "CONTRAST"] as const;

export type MasteryReviewPhase = typeof MASTERY_REVIEW_PHASES[number];

export type MasteryReviewSignalSummary = {
  lastCorrectAt: string | null;
  lastIncorrectAt: string | null;
  responseMs: number | null;
  averageResponseMs: number | null;
  errorCount: number;
  skillMastery: number | null;
  difficulty: number;
  lastReviewAt: string | null;
  confidence: string | null;
  similarTopicScore: number | null;
};

export const MASTERY_REVIEW_PHASE_LABELS: Record<MasteryReviewPhase, string> = {
  RECALL: "Hatırlama",
  SENTENCE: "Cümle",
  PRODUCTION: "Üretim",
  CONTRAST: "Karşılaştırma",
};

export const MASTERY_REVIEW_PHASE_INSTRUCTIONS: Record<MasteryReviewPhase, string> = {
  RECALL: "Bilgiyi ipucusuz geri çağır ve ilk cevabını ver.",
  SENTENCE: "Aynı bilgiyi bu kez cümle içinde doğru biçimde kullan.",
  PRODUCTION: "Hazır seçeneklerden seçmek yerine kendi Almanca cümleni üret.",
  CONTRAST: "Karıştırılabilecek biçimleri karşılaştır ve doğru kullanımı Almanca bir örnekle göster.",
};

export function normalizeMasteryReviewPhase(value: unknown): MasteryReviewPhase {
  return typeof value === "string" && (MASTERY_REVIEW_PHASES as readonly string[]).includes(value)
    ? value as MasteryReviewPhase
    : "RECALL";
}

export function nextMasteryReviewPhase(phase: MasteryReviewPhase): MasteryReviewPhase {
  if (phase === "RECALL") return "SENTENCE";
  if (phase === "SENTENCE") return "PRODUCTION";
  if (phase === "PRODUCTION") return "CONTRAST";
  return "RECALL";
}
