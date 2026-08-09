import a1EnrichmentRaw from "@/data/v33-a1-enrichment.json";
import a2EnrichmentRaw from "@/data/v34-a2-enrichment.json";
import b1EnrichmentRaw from "@/data/v35-b1-enrichment.json";
import b2EnrichmentRaw from "@/data/v36-b2-enrichment.json";
import { curriculumContentByUnitId } from "@/data/curriculum-content";
import { units } from "@/data/units";
import type {
  ComprehensionQuestion,
  LabLevel,
  ListeningKeyword,
  ListeningTask,
  VocabularyItem,
} from "@/types/skills";

type SourceQuestion = {
  id: string;
  prompt: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  masteryQuestionId?: string;
  masteryTags?: string[];
};

type SourceEnrichment = {
  id: string;
  listening?: { de?: string; tr?: string };
  listeningQuestions?: SourceQuestion[];
  sourceMethod?: string;
};

type SourceVersion = "V33" | "V34" | "V35" | "V36";

const sourceSets: Array<{
  level: LabLevel;
  sourceVersion: SourceVersion;
  units: SourceEnrichment[];
}> = [
  { level: "A1", sourceVersion: "V33", units: a1EnrichmentRaw as SourceEnrichment[] },
  { level: "A2", sourceVersion: "V34", units: a2EnrichmentRaw as SourceEnrichment[] },
  { level: "B1", sourceVersion: "V35", units: b1EnrichmentRaw as SourceEnrichment[] },
  { level: "B2", sourceVersion: "V36", units: b2EnrichmentRaw as SourceEnrichment[] },
];

type UnitLike = { id: string; courseId: string; title: string };
const unitList = units as UnitLike[];
const unitById = new Map<string, UnitLike>(unitList.map((unit) => [unit.id, unit]));

function choiceId(index: number) {
  return String.fromCharCode(97 + index);
}

function normalizeText(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function stripSpeakerLabels(value: string) {
  return value
    .replace(/\b[\p{L}ÄÖÜäöüß-]{2,28}:\s*/gu, "")
    .replace(/[„“"]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function sentences(value: string) {
  const cleaned = stripSpeakerLabels(value);
  const raw = cleaned
    .split(/(?<=[.!?])\s+/u)
    .map((part) => normalizeText(part))
    .filter(Boolean);

  if (raw.length) return raw;
  return cleaned ? [cleaned] : [];
}

function wordCount(value: string) {
  return value.split(/\s+/).filter(Boolean).length;
}

function boundedSegments(
  transcript: string,
  level: LabLevel,
  mode: "DICTATION" | "SHADOWING",
) {
  const maxWords = level === "A1" ? 9 : level === "A2" ? 12 : level === "B1" ? 17 : 22;
  const targetCount = mode === "DICTATION"
    ? level === "A1" || level === "A2" ? 2 : 3
    : level === "A1" ? 3 : 4;

  const result: string[] = [];
  for (const sentence of sentences(transcript)) {
    const words = sentence.split(/\s+/).filter(Boolean);
    if (words.length < 3) continue;

    if (words.length <= maxWords) {
      result.push(sentence);
    } else {
      for (let index = 0; index < words.length; index += maxWords) {
        const chunk = words.slice(index, index + maxWords).join(" ").trim();
        if (wordCount(chunk) >= 3) result.push(chunk);
      }
    }

    if (result.length >= targetCount) break;
  }

  if (!result.length) {
    const fallback = stripSpeakerLabels(transcript).split(/\s+/).slice(0, maxWords).join(" ");
    if (fallback) result.push(fallback);
  }

  return result.slice(0, targetCount);
}

function levelRates(level: LabLevel) {
  const normal =
    level === "A1" ? 0.84 :
    level === "A2" ? 0.91 :
    level === "B1" ? 1.0 :
    1.04;

  return {
    normalRate: normal,
    slowRate: Number((normal * 0.75).toFixed(2)),
  };
}

function parseVocabularyRow(row: string): { keyword: ListeningKeyword; vocabulary: VocabularyItem } {
  const [rawTerm, ...meaningParts] = row.split("—");
  const term = normalizeText(rawTerm ?? row);
  const translation = normalizeText(meaningParts.join("—") || "Ünite anahtar kelimesi");
  const articleMatch = term.match(/^(der|die|das)\s+(.+)$/i);
  const article = articleMatch?.[1]?.toLowerCase();
  const word = articleMatch?.[2] ?? term;

  return {
    keyword: { de: term, tr: translation },
    vocabulary: {
      word,
      ...(article ? { article } : {}),
      translation,
      example: term,
      exampleTranslation: translation,
    },
  };
}

function keywordsAndVocabulary(unitId: string) {
  const curriculum = curriculumContentByUnitId[unitId];
  const rows = curriculum?.vocabulary?.slice(0, 7) ?? [];
  const parsed = rows.map(parseVocabularyRow);
  return {
    keywords: parsed.map((item) => item.keyword),
    vocabulary: parsed.map((item) => item.vocabulary),
  };
}

function toChoiceQuestion(
  source: SourceQuestion,
  kind: ComprehensionQuestion["kind"],
): ComprehensionQuestion | null {
  const options = Array.isArray(source.options) ? source.options.filter(Boolean) : [];
  if (options.length < 2) return null;
  const correctIndex = options.findIndex((option) => normalizeText(option) === normalizeText(source.correctAnswer));
  const safeCorrect = correctIndex >= 0 ? correctIndex : 0;

  return {
    id: source.id,
    kind,
    prompt: source.prompt,
    options: options.map((label, index) => ({ id: choiceId(index), label })),
    correctAnswer: choiceId(safeCorrect),
    explanation: source.explanation,
    masteryQuestionId: source.masteryQuestionId,
    masteryTags: source.masteryTags,
  };
}

function adjacentTitles(level: LabLevel, unitId: string, title: string) {
  return unitList
    .filter((item) => item.courseId === level.toLowerCase() && item.id !== unitId)
    .map((item) => item.title)
    .filter((item) => item !== title)
    .slice(0, 2);
}

function mainIdeaQuestion(level: LabLevel, unitId: string, title: string): ComprehensionQuestion {
  const distractors = adjacentTitles(level, unitId, title);
  const labels = [title, ...distractors];
  while (labels.length < 3) labels.push("Konuyla ilgisiz bir günlük durum");

  return {
    id: `${unitId}-v39-main`,
    kind: "MAIN_IDEA",
    prompt: level === "A1" || level === "A2"
      ? "Dinlemenin ana konusu hangisidir?"
      : "Dinlemenin merkezindeki konu veya iletişim amacı hangisidir?",
    options: labels.slice(0, 3).map((label, index) => ({ id: choiceId(index), label })),
    correctAnswer: "a",
    explanation: `Dinleme, “${title}” ünitesinin Gold Standard bağlamını işler.`,
    masteryQuestionId: `${unitId}-v39-main`,
    masteryTags: [`listening-${unitId}-main-idea`, "listening-main-idea"],
  };
}

function communicationProfile(text: string, level: LabLevel) {
  const normalized = text.toLocaleLowerCase("de-DE");

  if (/(leider|problem|störung|defekt|beschwer|reklam|ärger|schwierig)/u.test(normalized)) {
    return {
      inference: "Konuşmacı bir sorun veya güçlükle ilgili çözüm, açıklama ya da sonraki adımı netleştiriyor.",
      attitude: level === "B1" || level === "B2" ? "kontrollü, sorun odaklı ve çözüm arayan" : "nazik ve çözüm arayan",
    };
  }

  if (/(achtung|mitteilung|meldung|bericht|untersuch|studie|ergebnis|präsent|vortrag)/u.test(normalized)) {
    return {
      inference: "Konuşmacının temel amacı bilgiyi düzenli biçimde aktarmak ve dinleyicinin önemli noktaları ayırt etmesini sağlamaktır.",
      attitude: "nötr ve bilgilendirici",
    };
  }

  if (/(ich denke|meiner meinung|aus meiner sicht|allerdings|einerseits|andererseits|vorteil|nachteil)/u.test(normalized)) {
    return {
      inference: "Konuşmacılar yalnız bilgi vermiyor; bir konuyu değerlendiriyor ve gerekçeler arasında seçim yapıyor.",
      attitude: "değerlendirici ve gerekçelendiren",
    };
  }

  if (/(bitte|danke|könnte|möchte|würde gern|termin|helfen|entschuldigung)/u.test(normalized)) {
    return {
      inference: "Konuşmada günlük bir ihtiyacın nazik ve işlevsel biçimde karşılanması hedefleniyor.",
      attitude: "nazik ve iş birliğine açık",
    };
  }

  return {
    inference: level === "A1" || level === "A2"
      ? "Konuşmacılar günlük bir durumda somut bilgi alışverişi yapıyor."
      : "Konuşmacı, bağlama uygun bilgileri seçerek dinleyicinin durumu anlamasını sağlıyor.",
    attitude: "nötr ve amaca odaklı",
  };
}

function inferenceQuestion(unitId: string, text: string, level: LabLevel): ComprehensionQuestion {
  const profile = communicationProfile(text, level);
  const distractors = level === "A1" || level === "A2"
    ? [
        "Konuşmacı yalnızca ilgisiz kelimeleri sıralıyor.",
        "Konuşmanın amacı dinleyiciden bütün metni ezberlemesini istemek.",
      ]
    : [
        "Konuşmacının amacı bağlamdan bağımsız rastgele ayrıntılar sıralamak.",
        "Metin, dinleyicinin hiçbir sonuç çıkarmamasını gerektiren bir kelime listesinden oluşuyor.",
      ];

  return {
    id: `${unitId}-v39-inference`,
    kind: "INFERENCE",
    prompt: level === "A1" || level === "A2"
      ? "Dinlediklerinden hangi sonucu çıkarabilirsin?"
      : "Metindeki ipuçlarına göre hangi çıkarım en iyi desteklenir?",
    options: [profile.inference, ...distractors].map((label, index) => ({ id: choiceId(index), label })),
    correctAnswer: "a",
    explanation: "Çıkarım sorusu, söylenen bilgiyi bağlam ve iletişim amacıyla birlikte yorumlamanı ölçer.",
    masteryQuestionId: `${unitId}-v39-inference`,
    masteryTags: [`listening-${unitId}-inference`, "listening-inference"],
  };
}

function attitudeQuestion(unitId: string, text: string, level: LabLevel): ComprehensionQuestion {
  const profile = communicationProfile(text, level);
  const distractors = [
    "konudan kopuk ve rastgele",
    level === "B1" || level === "B2" ? "açıkça saldırgan ve uzlaşmayı reddeden" : "kaba ve ilgisiz",
  ];

  return {
    id: `${unitId}-v39-attitude`,
    kind: "ATTITUDE",
    prompt: level === "A1" || level === "A2"
      ? "Konuşmacının genel tutumu nasıl?"
      : "Kelime seçimi ve söylem işaretlerine göre konuşmacının genel tutumu nasıl değerlendirilebilir?",
    options: [profile.attitude, ...distractors].map((label, index) => ({ id: choiceId(index), label })),
    correctAnswer: "a",
    explanation: "Tutum sorusunda tek tek kelimelerden çok konuşmanın genel amacı, nezaket biçimleri ve değerlendirme ifadeleri birlikte dikkate alınır.",
    masteryQuestionId: `${unitId}-v39-attitude`,
    masteryTags: [`listening-${unitId}-attitude`, "listening-attitude"],
  };
}

function sourceQuestions(unitId: string, items: SourceQuestion[]): ComprehensionQuestion[] {
  return items
    .map((question) => toChoiceQuestion(question, "DETAIL"))
    .filter((question): question is ComprehensionQuestion => Boolean(question))
    .map((question, index) => ({
      ...question,
      id: question.id || `${unitId}-detail-${index + 1}`,
      masteryQuestionId: question.masteryQuestionId || `${unitId}-detail-${index + 1}`,
      masteryTags: question.masteryTags?.length
        ? question.masteryTags
        : [`listening-${unitId}-detail`, "listening-detail"],
    }));
}

function speakerHint(transcript: string) {
  const names = Array.from(
    new Set(
      Array.from(transcript.matchAll(/\b([\p{L}ÄÖÜäöüß-]{2,24}):/gu))
        .map((match) => match[1])
        .filter(Boolean),
    ),
  );

  return names.length ? names.slice(0, 3).join(" · ") : "Almanca konuşmacı";
}

function buildTask(
  source: SourceEnrichment,
  level: LabLevel,
  sourceVersion: SourceVersion,
): ListeningTask | null {
  const transcript = normalizeText(source.listening?.de ?? "");
  const translation = normalizeText(source.listening?.tr ?? "");
  if (!transcript || !translation) return null;

  const unit = unitById.get(source.id);
  if (!unit) return null;

  const { keywords, vocabulary } = keywordsAndVocabulary(source.id);
  const sourceDetailQuestions = sourceQuestions(source.id, source.listeningQuestions ?? []);
  const rates = levelRates(level);

  const questions: ComprehensionQuestion[] = [
    mainIdeaQuestion(level, source.id, unit.title),
    ...sourceDetailQuestions,
    inferenceQuestion(source.id, transcript, level),
    attitudeQuestion(source.id, transcript, level),
  ];

  return {
    id: `v39-${source.id}`,
    unitId: source.id,
    level,
    title: unit.title,
    situation: `${unit.title} · Gold Standard dinleme görevi`,
    speakerHint: speakerHint(transcript),
    estimatedMinutes: level === "A1" ? 9 : level === "A2" ? 10 : level === "B1" ? 12 : 14,
    transcript,
    translation,
    questions,
    vocabulary,
    keywords,
    dictationSegments: boundedSegments(transcript, level, "DICTATION"),
    shadowingSegments: boundedSegments(transcript, level, "SHADOWING"),
    normalRate: rates.normalRate,
    slowRate: rates.slowRate,
    sourceVersion,
    sourceMethod: source.sourceMethod ?? `Deutschimo ${sourceVersion} Gold Standard enrichment`,
  };
}

export const goldStandardListeningTasks: ListeningTask[] = sourceSets
  .flatMap(({ level, sourceVersion, units: sourceUnits }) =>
    sourceUnits.map((unit) => buildTask(unit, level, sourceVersion)),
  )
  .filter((task): task is ListeningTask => Boolean(task));

export const listeningTaskCounts = goldStandardListeningTasks.reduce<Record<LabLevel, number>>(
  (counts, task) => {
    counts[task.level] += 1;
    return counts;
  },
  { A1: 0, A2: 0, B1: 0, B2: 0 },
);
