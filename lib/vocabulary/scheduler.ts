import type { VocabularyNotebookItem } from "@prisma/client";
import type { VocabularyRating, VocabularyReviewCard, VocabularyReviewMode, VocabularyReviewResult } from "@/types/vocabulary";

const modeLabels: Record<VocabularyReviewMode, string> = {
  DE_TO_TR: "Almanca → Türkçe",
  TR_TO_DE: "Türkçe → Almanca",
  AUDIO_TO_WORD: "Ses → Kelime",
  FILL_BLANK: "Boşluk doldurma",
  ARTICLE: "Artikel seçme",
  PLURAL: "Çoğul biçimi",
  SENTENCE: "Cümle içinde kullanma",
};

export function normalizeAnswer(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLocaleLowerCase("de-DE")
    .replace(/[„“”"'’`´.,!?;:()[\]{}]/g, "")
    .replace(/\s+/g, " ");
}

function containsWord(example: string, word: string) {
  return normalizeAnswer(example).includes(normalizeAnswer(word));
}

export function availableModes(item: VocabularyNotebookItem): VocabularyReviewMode[] {
  const result: VocabularyReviewMode[] = ["DE_TO_TR", "TR_TO_DE", "AUDIO_TO_WORD"];
  if (item.example && containsWord(item.example, item.word)) result.push("FILL_BLANK");
  if (["der", "die", "das"].includes(normalizeAnswer(item.article))) result.push("ARTICLE");
  if (item.plural?.trim()) result.push("PLURAL");
  if (item.example?.trim()) result.push("SENTENCE");
  return result;
}

function chooseMode(item: VocabularyNotebookItem, requested?: string | null): VocabularyReviewMode {
  const available = availableModes(item);
  if (requested && requested !== "MIXED" && available.includes(requested as VocabularyReviewMode)) return requested as VocabularyReviewMode;
  return available[item.reviewCount % available.length] ?? "DE_TO_TR";
}

function blankExample(example: string, word: string) {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const expression = new RegExp(escaped, "giu");
  const replaced = example.replace(expression, "_____");
  return replaced === example ? `${example}\n\nEksik kelime: _____` : replaced;
}

export function makeReviewCard(item: VocabularyNotebookItem, requestedMode?: string | null): VocabularyReviewCard {
  const mode = chooseMode(item, requestedMode);
  const label = modeLabels[mode];
  const base = {
    itemId: item.id,
    mode,
    hint: label,
    sourceUnitTitle: item.sourceUnitTitle,
    mastery: item.mastery,
    reviewCount: item.reviewCount,
    lapseCount: item.lapseCount,
  };
  switch (mode) {
    case "DE_TO_TR":
      return { ...base, prompt: `${item.article ? `${item.article} ` : ""}${item.word} kelimesinin Türkçe anlamını yaz.` };
    case "TR_TO_DE":
      return { ...base, prompt: `“${item.translation}” anlamındaki Almanca kelimeyi yaz.` };
    case "AUDIO_TO_WORD":
      return { ...base, prompt: "Duyduğun Almanca kelimeyi yaz.", audioText: `${item.article ? `${item.article} ` : ""}${item.word}` };
    case "FILL_BLANK":
      return { ...base, prompt: blankExample(item.example ?? "", item.word), hint: "Cümledeki boşluğu tamamla." };
    case "ARTICLE":
      return { ...base, prompt: `${item.word} kelimesinin artikelini seç.`, options: ["der", "die", "das"] };
    case "PLURAL":
      return { ...base, prompt: `${item.article ? `${item.article} ` : ""}${item.word} kelimesinin çoğul biçimini yaz.` };
    case "SENTENCE":
      return { ...base, prompt: `${item.article ? `${item.article} ` : ""}${item.word} kelimesini kullanarak Almanca bir cümle yaz.`, selfAssessment: true };
  }
}

function expectedAnswers(item: VocabularyNotebookItem, mode: VocabularyReviewMode) {
  switch (mode) {
    case "DE_TO_TR": return [item.translation];
    case "TR_TO_DE": return [item.word, `${item.article ?? ""} ${item.word}`.trim()];
    case "AUDIO_TO_WORD": return [item.word, `${item.article ?? ""} ${item.word}`.trim()];
    case "FILL_BLANK": return [item.word, `${item.article ?? ""} ${item.word}`.trim()];
    case "ARTICLE": return [item.article ?? ""];
    case "PLURAL": return [item.plural ?? ""];
    case "SENTENCE": return [item.example ?? ""];
  }
}

export function evaluateAnswer(item: VocabularyNotebookItem, mode: VocabularyReviewMode, answer: unknown): VocabularyReviewResult {
  const expected = expectedAnswers(item, mode).filter(Boolean);
  const normalized = normalizeAnswer(answer);
  const correct = mode === "SENTENCE"
    ? normalized.length >= 4
    : expected.some((candidate) => normalizeAnswer(candidate) === normalized);
  const expectedDisplay = expected[0] || item.word;
  const detail = mode === "SENTENCE"
    ? "Cümleni model örnekle karşılaştır ve kendi değerlendirmeni yap."
    : correct
      ? "Cevabın doğru. Aralığı belirlemek için hatırlama düzeyini seç."
      : `Beklenen cevap: ${expectedDisplay}`;
  return {
    correct,
    expected: expectedDisplay,
    acceptedAnswers: expected,
    explanation: detail,
    modelSentence: item.example,
  };
}

export function scheduleReview(item: VocabularyNotebookItem, rating: VocabularyRating, correct: boolean, now = new Date()) {
  let easeFactor = Number(item.easeFactor || 2.5);
  let intervalDays = Math.max(0, item.intervalDays || 0);
  let correctStreak = item.correctStreak || 0;
  let lapseCount = item.lapseCount || 0;
  let mastery = item.mastery || 0;
  let delayMs = 0;

  if (rating === "FORGOT") {
    easeFactor = Math.max(1.3, easeFactor - 0.2);
    intervalDays = 0;
    correctStreak = 0;
    lapseCount += 1;
    mastery = Math.max(0, mastery - 18);
    delayMs = 10 * 60 * 1000;
  } else if (rating === "HARD") {
    easeFactor = Math.max(1.3, easeFactor - 0.15);
    intervalDays = Math.max(1, intervalDays ? Math.round(intervalDays * 1.2) : 1);
    correctStreak = correct ? correctStreak + 1 : 0;
    mastery = Math.min(100, Math.max(0, mastery + (correct ? 3 : -5)));
    delayMs = intervalDays * 86400000;
  } else if (rating === "GOOD") {
    easeFactor = Math.min(3.2, easeFactor + 0.03);
    intervalDays = item.reviewCount === 0 ? 1 : item.reviewCount === 1 ? 3 : Math.max(2, Math.round(Math.max(1, intervalDays) * easeFactor));
    correctStreak = correctStreak + 1;
    mastery = Math.min(100, mastery + 9);
    delayMs = intervalDays * 86400000;
  } else if (rating === "EASY") {
    easeFactor = Math.min(3.2, easeFactor + 0.15);
    intervalDays = item.reviewCount === 0 ? 4 : Math.max(4, Math.round(Math.max(1, intervalDays) * easeFactor * 1.3));
    correctStreak = correctStreak + 1;
    mastery = Math.min(100, mastery + 14);
    delayMs = intervalDays * 86400000;
  }

  const nextReviewAt = new Date(now.getTime() + delayMs);
  return {
    easeFactor: Number(easeFactor.toFixed(2)),
    intervalDays,
    correctStreak,
    lapseCount,
    mastery,
    nextReviewAt,
    lastReviewedAt: now,
    reviewCount: (item.reviewCount || 0) + 1,
    lastRating: rating,
  };
}

export function nextIntervalLabel(item: VocabularyNotebookItem, rating: VocabularyRating) {
  const scheduled = scheduleReview(item, rating, rating !== "FORGOT");
  if (scheduled.intervalDays === 0) return "10 dk";
  return scheduled.intervalDays === 1 ? "1 gün" : `${scheduled.intervalDays} gün`;
}
