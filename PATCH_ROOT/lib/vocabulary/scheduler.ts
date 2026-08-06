import type { VocabularyNotebookItem } from "@prisma/client";
import {
  adaptiveDuePriority,
  expectedResponseSeconds,
  intervalLabel,
  scheduleAdaptiveReview,
  type ReviewSignals,
} from "@/lib/review/adaptive-scheduler";
import type {
  VocabularyReviewCard,
  VocabularyReviewMode,
  VocabularyReviewResult,
} from "@/types/vocabulary";

const modeLabels: Record<VocabularyReviewMode, string> = {
  DE_TO_TR: "Almanca → Türkçe",
  TR_TO_DE: "Türkçe → Almanca",
  LISTEN_WRITE: "Dinle → Yaz",
  FILL_BLANK: "Boşluğu doldur",
  SENTENCE_ORDER: "Cümleyi sırala",
  SPEAK: "Sesli söyle",
  NEW_SENTENCE: "Yeni cümlede kullan",
  ARTICLE: "Artikel seç",
  PLURAL: "Çoğul biçimi",
  AUDIO_TO_WORD: "Dinle → Yaz",
  SENTENCE: "Yeni cümlede kullan",
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

function normalizedMode(mode: VocabularyReviewMode): VocabularyReviewMode {
  if (mode === "AUDIO_TO_WORD") return "LISTEN_WRITE";
  if (mode === "SENTENCE") return "NEW_SENTENCE";
  return mode;
}

export function availableModes(item: VocabularyNotebookItem): VocabularyReviewMode[] {
  const result: VocabularyReviewMode[] = ["DE_TO_TR", "TR_TO_DE", "LISTEN_WRITE", "SPEAK"];
  if (item.example && containsWord(item.example, item.word)) result.push("FILL_BLANK");
  if (item.example?.trim() && item.example.trim().split(/\s+/).length >= 3) result.push("SENTENCE_ORDER");
  if (item.example?.trim()) result.push("NEW_SENTENCE");
  if (["der", "die", "das"].includes(normalizeAnswer(item.article))) result.push("ARTICLE");
  if (item.plural?.trim()) result.push("PLURAL");
  return result;
}

function chooseMode(item: VocabularyNotebookItem, requested?: string | null): VocabularyReviewMode {
  const available = availableModes(item);
  const normalizedRequested = requested === "AUDIO_TO_WORD"
    ? "LISTEN_WRITE"
    : requested === "SENTENCE"
      ? "NEW_SENTENCE"
      : requested;
  if (
    normalizedRequested
    && normalizedRequested !== "MIXED"
    && available.includes(normalizedRequested as VocabularyReviewMode)
  ) return normalizedRequested as VocabularyReviewMode;

  const weighted = available.flatMap((mode) => {
    if (mode === "TR_TO_DE" || mode === "LISTEN_WRITE" || mode === "SENTENCE_ORDER") return [mode, mode];
    if (mode === "SPEAK" || mode === "NEW_SENTENCE") return item.reviewCount >= 2 ? [mode, mode] : [mode];
    return [mode];
  });
  return weighted[item.reviewCount % weighted.length] ?? "DE_TO_TR";
}

function blankExample(example: string, word: string) {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const expression = new RegExp(`\\b${escaped}\\b`, "giu");
  const replaced = example.replace(expression, "_____");
  return replaced === example ? `${example}\n\nEksik kelime: _____` : replaced;
}

function tokenize(sentence: string) {
  return sentence.trim().split(/\s+/).filter(Boolean);
}

function deterministicShuffle(tokens: string[], seed: string) {
  const copy = [...tokens];
  let state = Array.from(seed).reduce((total, character) => total + character.charCodeAt(0), 0) || 1;
  for (let index = copy.length - 1; index > 0; index -= 1) {
    state = (state * 9301 + 49297) % 233280;
    const target = Math.floor((state / 233280) * (index + 1));
    [copy[index], copy[target]] = [copy[target], copy[index]];
  }
  if (copy.join(" ") === tokens.join(" ") && copy.length > 1) [copy[0], copy[1]] = [copy[1], copy[0]];
  return copy;
}

function wordWithArticle(item: VocabularyNotebookItem) {
  return `${item.article ? `${item.article} ` : ""}${item.word}`.trim();
}

function hintFor(item: VocabularyNotebookItem, mode: VocabularyReviewMode) {
  switch (normalizedMode(mode)) {
    case "DE_TO_TR": return `İlk harf: ${item.translation.trim().charAt(0).toLocaleUpperCase("tr-TR")}`;
    case "TR_TO_DE": return `${item.article ? `Artikel: ${item.article} · ` : ""}İlk harf: ${item.word.charAt(0).toLocaleUpperCase("de-DE")}`;
    case "LISTEN_WRITE": return `${item.article ? `Artikel ${item.article}. ` : ""}${item.word.length} harfli kelime.`;
    case "FILL_BLANK": return item.exampleTranslation || `Eksik kelimenin anlamı: ${item.translation}`;
    case "SENTENCE_ORDER": return item.exampleTranslation || "Fiil çoğu ana cümlede ikinci konumdadır.";
    case "SPEAK": return item.pronunciation || "Önce yavaşça dinle, sonra aynı ritimle tekrar et.";
    case "NEW_SENTENCE": return item.example || `“${item.translation}” anlamındaki kelimeyi kullan.`;
    case "ARTICLE": return `Kelimeyi artikel ile birlikte hatırla: ${item.word}.`;
    case "PLURAL": return item.example || `Tekil biçim: ${wordWithArticle(item)}`;
    default: return modeLabels[mode];
  }
}

export function makeReviewCard(item: VocabularyNotebookItem, requestedMode?: string | null): VocabularyReviewCard {
  const mode = chooseMode(item, requestedMode);
  const normalized = normalizedMode(mode);
  const difficulty = Math.min(5, Math.max(1, item.difficulty || 3));
  const base = {
    itemId: item.id,
    mode: normalized,
    hint: hintFor(item, normalized),
    sourceUnitTitle: item.sourceUnitTitle,
    mastery: item.mastery,
    reviewCount: item.reviewCount,
    lapseCount: item.lapseCount,
    difficulty,
    expectedSeconds: expectedResponseSeconds(normalized, difficulty),
    sameErrorStreak: item.sameErrorStreak || 0,
  };

  switch (normalized) {
    case "DE_TO_TR":
      return { ...base, prompt: `${wordWithArticle(item)} kelimesinin Türkçe anlamını yaz.` };
    case "TR_TO_DE":
      return { ...base, prompt: `“${item.translation}” anlamındaki Almanca kelimeyi yaz.` };
    case "LISTEN_WRITE":
      return { ...base, prompt: "Duyduğun Almanca kelimeyi yaz.", audioText: wordWithArticle(item) };
    case "FILL_BLANK":
      return { ...base, prompt: blankExample(item.example ?? "", item.word) };
    case "SENTENCE_ORDER": {
      const tokens = tokenize(item.example ?? "");
      return {
        ...base,
        prompt: "Kelimeleri doğru Almanca cümle olacak şekilde sırala.",
        tokens: deterministicShuffle(tokens, `${item.id}:${item.reviewCount}`),
        modelSentence: item.example,
      };
    }
    case "SPEAK":
      return {
        ...base,
        prompt: `Dinle ve sesli söyle: ${wordWithArticle(item)}`,
        audioText: wordWithArticle(item),
        speechTarget: wordWithArticle(item),
        selfAssessment: true,
      };
    case "NEW_SENTENCE":
      return {
        ...base,
        prompt: `${wordWithArticle(item)} kelimesini kullanarak yeni bir Almanca cümle yaz.`,
        selfAssessment: true,
        modelSentence: item.example,
      };
    case "ARTICLE":
      return { ...base, prompt: `${item.word} kelimesinin artikelini seç.`, options: ["der", "die", "das"] };
    case "PLURAL":
      return { ...base, prompt: `${wordWithArticle(item)} kelimesinin çoğul biçimini yaz.` };
    default:
      return { ...base, prompt: `${wordWithArticle(item)} kelimesinin anlamını yaz.` };
  }
}

function expectedAnswers(item: VocabularyNotebookItem, mode: VocabularyReviewMode) {
  switch (normalizedMode(mode)) {
    case "DE_TO_TR": return [item.translation];
    case "TR_TO_DE": return [item.word, wordWithArticle(item)];
    case "LISTEN_WRITE": return [item.word, wordWithArticle(item)];
    case "FILL_BLANK": return [item.word, wordWithArticle(item)];
    case "SENTENCE_ORDER": return [item.example ?? ""];
    case "SPEAK": return [wordWithArticle(item)];
    case "ARTICLE": return [item.article ?? ""];
    case "PLURAL": return [item.plural ?? ""];
    case "NEW_SENTENCE": return [item.example ?? ""];
    default: return [item.word];
  }
}

export function evaluateAnswer(
  item: VocabularyNotebookItem,
  mode: VocabularyReviewMode,
  answer: unknown,
): VocabularyReviewResult {
  const normalizedModeValue = normalizedMode(mode);
  const expected = expectedAnswers(item, normalizedModeValue).filter(Boolean);
  const normalized = normalizeAnswer(answer);
  const selfAssessment = normalizedModeValue === "NEW_SENTENCE" || normalizedModeValue === "SPEAK";
  let correct: boolean;

  if (normalizedModeValue === "NEW_SENTENCE") {
    correct = normalized.length >= 8 && normalizeAnswer(answer).includes(normalizeAnswer(item.word));
  } else if (normalizedModeValue === "SPEAK") {
    correct = normalized === "__spoken__" || expected.some((candidate) => normalizeAnswer(candidate) === normalized);
  } else {
    correct = expected.some((candidate) => normalizeAnswer(candidate) === normalized);
  }

  const expectedDisplay = expected[0] || item.word;
  const explanation = selfAssessment
    ? correct
      ? "Üretim görevini tamamladın. Modeli incele ve hatırlama düzeyini dürüstçe değerlendir."
      : normalizedModeValue === "NEW_SENTENCE"
        ? `Cümlende “${item.word}” kelimesini kullan ve en az birkaç kelimelik anlamlı bir yapı kur.`
        : "Kelimeyi sesli söyledikten sonra “Söyledim” düğmesini kullan."
    : correct
      ? "Cevabın doğru. Sistem hız, ipucu ve güven seçimini de tekrar zamanına katacak."
      : `Beklenen cevap: ${expectedDisplay}`;

  return {
    correct,
    expected: expectedDisplay,
    acceptedAnswers: expected,
    explanation,
    modelSentence: item.example,
    selfAssessment,
  };
}

export function scheduleReview(item: VocabularyNotebookItem, signals: ReviewSignals, now = new Date()) {
  return scheduleAdaptiveReview({
    mastery: item.mastery,
    easeFactor: item.easeFactor,
    intervalDays: item.intervalDays,
    correctStreak: item.correctStreak,
    lapseCount: item.lapseCount,
    reviewCount: item.reviewCount,
    stability: item.stability,
    retrievability: item.retrievability,
    confidenceScore: item.confidenceScore,
    hintUseCount: item.hintUseCount,
    sameErrorStreak: item.sameErrorStreak,
    averageResponseMs: item.averageResponseMs,
    lastSeenAt: item.lastSeenAt,
  }, signals, now);
}

export function reviewPriority(item: VocabularyNotebookItem, now = new Date()) {
  return adaptiveDuePriority({
    nextReviewAt: item.nextReviewAt,
    mastery: item.mastery,
    difficulty: item.difficulty,
    sameErrorStreak: item.sameErrorStreak,
    hintUseCount: item.hintUseCount,
    averageResponseMs: item.averageResponseMs,
    mode: item.lastMode,
  }, now);
}

export function nextIntervalLabel(nextReviewAt: Date, now = new Date()) {
  return intervalLabel(nextReviewAt, now);
}
