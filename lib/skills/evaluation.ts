import type { SpeakingEvaluation, SpeakingTask, WritingEvaluation, WritingTask } from "@/types/skills";

function normalize(value: string) {
  return value
    .toLocaleLowerCase("de-DE")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[„“”"'!?.,;:()[\]{}]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function words(value: string) {
  return normalize(value).split(" ").filter(Boolean);
}

function clamp(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, Math.round(value)));
}

function includesLoose(text: string, target: string) {
  const source = normalize(text);
  const needle = normalize(target);
  if (!needle) return false;
  if (source.includes(needle)) return true;
  const stem = needle.length > 5 ? needle.slice(0, Math.max(4, needle.length - 2)) : needle;
  return source.split(" ").some((item) => item.startsWith(stem));
}

function speakingGoalAchieved(transcript: string, keywords: string[]) {
  return keywords.some((keyword) => includesLoose(transcript, keyword));
}

function speakingGrammarNotes(task: SpeakingTask, transcript: string) {
  const notes: Array<{ label: string; suggestion: string }> = [];
  const normalized = normalize(transcript);

  if (task.id === "speak-a1-intro" && /\bich komme in\b/.test(normalized)) {
    notes.push({
      label: "Köken bildirimi",
      suggestion: "Bir ülkeden/şehirden geldiğini söylerken genellikle „Ich komme aus ...“ kullan.",
    });
  }

  if (/\bich bin \d{1,2} jahre\b/.test(normalized)) {
    notes.push({
      label: "Yaş söyleme",
      suggestion: "„Ich bin ... Jahre alt.“ biçimini kullan.",
    });
  }

  if (/\b(ich ich|und und|aber aber)\b/.test(normalized)) {
    notes.push({
      label: "Tekrar",
      suggestion: "Aynı kelimeyi art arda tekrar ettiğin bölümde kısa bir duraklama yapıp cümleyi yeniden kur.",
    });
  }

  if (/\bich will (einen termin|ein anderes zimmer)\b/.test(normalized)) {
    notes.push({
      label: "Kibarlık",
      suggestion: "Hizmet/randevu bağlamında „Ich würde gern ...“, „Ich hätte gern ...“ veya „Wäre es möglich ...?“ daha uygun olabilir.",
    });
  }

  return notes;
}

function speakingPaceScore(level: SpeakingTask["level"], wordsPerMinute: number) {
  const range =
    level === "A1" ? [35, 80] :
    level === "A2" ? [45, 95] :
    level === "B1" ? [55, 110] : [65, 125];

  if (wordsPerMinute >= range[0] && wordsPerMinute <= range[1]) return 94;
  const distance =
    wordsPerMinute < range[0]
      ? range[0] - wordsPerMinute
      : wordsPerMinute - range[1];
  return clamp(94 - distance * 1.4);
}

export function evaluateSpeaking(
  task: SpeakingTask,
  transcript: string,
  durationSeconds: number,
  recognitionConfidence = 0.68,
  manuallyEdited = false,
): SpeakingEvaluation {
  const transcriptWords = words(transcript);
  const matchedKeywords = task.requiredKeywords.filter((keyword) =>
    includesLoose(transcript, keyword),
  );
  const missingKeywords = task.requiredKeywords.filter(
    (keyword) => !matchedKeywords.includes(keyword),
  );
  const keywordRatio = task.requiredKeywords.length
    ? matchedKeywords.length / task.requiredKeywords.length
    : 1;

  const achievedGoals = task.communicationGoals
    .filter((goal) => speakingGoalAchieved(transcript, goal.keywords))
    .map((goal) => goal.label);
  const missingGoals = task.communicationGoals
    .filter((goal) => !speakingGoalAchieved(transcript, goal.keywords))
    .map((goal) => goal.label);
  const goalRatio = task.communicationGoals.length
    ? achievedGoals.length / task.communicationGoals.length
    : 1;

  const taskCompletion = clamp(goalRatio * 82 + keywordRatio * 18);

  const uniqueRatio = transcriptWords.length
    ? new Set(transcriptWords).size / transcriptWords.length
    : 0;
  const vocabulary = clamp(
    keywordRatio * 55 +
    uniqueRatio * 30 +
    Math.min(transcriptWords.length / 35, 1) * 15,
  );

  const minutes = Math.max(durationSeconds / 60, 0.15);
  const wordsPerMinute = Math.round(transcriptWords.length / minutes);
  const hesitationCount =
    (normalize(transcript).match(/\b(äh|ähm|hm|also also|ja ja)\b/g) ?? []).length;
  const paceScore = speakingPaceScore(task.level, wordsPerMinute);
  const expectedWords = Math.max(
    8,
    Math.round(
      task.estimatedSeconds *
      (task.level === "A1" ? 0.55 :
       task.level === "A2" ? 0.72 :
       task.level === "B1" ? 0.90 : 1.05),
    ),
  );
  const lengthCoverage = Math.min(transcriptWords.length / expectedWords, 1);
  const fluency = clamp(
    paceScore * 0.58 +
    Math.max(0, 100 - hesitationCount * 12) * 0.22 +
    lengthCoverage * 100 * 0.20,
  );

  const structureHits = task.grammarTargets.filter((target) => {
    const wordsInTarget = normalize(target)
      .split(" ")
      .filter((item) => item.length >= 3 && !["dativ","akkusativ","perfekt"].includes(item));
    return wordsInTarget.some((item) => includesLoose(transcript, item));
  }).length;
  const structureRatio = task.grammarTargets.length
    ? structureHits / task.grammarTargets.length
    : 1;
  const grammarNotes = speakingGrammarNotes(task, transcript);
  const grammar = clamp(
    52 +
    structureRatio * 28 +
    Math.min(transcriptWords.length / Math.max(expectedWords, 1), 1) * 20 -
    grammarNotes.length * 12,
  );

  const confidenceScore = clamp(recognitionConfidence * 100);
  const clarity = clamp(
    confidenceScore * 0.58 +
    lengthCoverage * 100 * 0.27 +
    Math.min(goalRatio + 0.15, 1) * 100 * 0.15,
  );

  const naturalSuggestions = task.naturalAlternatives
    .filter(
      (item) =>
        includesLoose(transcript, item.trigger) &&
        !includesLoose(transcript, item.suggestion),
    )
    .slice(0, 3)
    .map((item) => ({
      original: item.trigger,
      suggestion: item.suggestion,
      reason: item.reason,
    }));

  const pronunciationFocus =
    (missingKeywords.length
      ? task.pronunciationTargets.filter((word) =>
          missingKeywords.some((missing) =>
            normalize(word).includes(normalize(missing).slice(0, 4)),
          ),
        )
      : task.pronunciationTargets
    ).slice(0, 4);

  const pronunciation =
    manuallyEdited
      ? {
          band: "CHECK" as const,
          label: "Metin elle düzeltildi — telaffuz konusunda temkinli yorum",
          note: "Konuşma metnini elle değiştirdiğin için tarayıcı tanıma sinyalini doğrudan telaffuz kanıtı olarak kullanmıyoruz. Hedef kelimeleri model yanıtla karşılaştırarak yeniden söyle.",
          focusWords: task.pronunciationTargets.slice(0, 4),
        }
      : recognitionConfidence >= 0.72 && lengthCoverage >= 0.65
        ? {
            band: "CLEAR" as const,
            label: "Genel olarak anlaşılır görünüyor",
            note: "Tarayıcı konuşmanın büyük bölümünü tutarlı biçimde çözebildi. Bu, fonetik kusursuzluk anlamına gelmez; iletişim açısından olumlu bir sinyaldir.",
            focusWords: pronunciationFocus.slice(0, 2),
          }
        : recognitionConfidence >= 0.50
          ? {
              band: "CHECK" as const,
              label: "Bazı bölümleri yeniden söyle",
              note: "Bazı kelimeler daha az güvenle çözüldü. Ortam gürültüsünü azaltıp hedef kelimeleri biraz daha belirgin söyleyerek tekrar dene.",
              focusWords: pronunciationFocus.length
                ? pronunciationFocus
                : task.pronunciationTargets.slice(0, 4),
            }
          : {
              band: "RETRY" as const,
              label: "Kayıt koşullarını ve anlaşılabilirliği kontrol et",
              note: "Tanıma sinyali düşük. Bu tek başına kötü telaffuz anlamına gelmez; mikrofon mesafesi, gürültü veya konuşma hacmi de etkili olabilir. Kaydı daha sakin bir ortamda tekrarla.",
              focusWords: task.pronunciationTargets.slice(0, 4),
            };

  // Telaffuz için ayrı bir yapay yüzde genel sonuca eklenmez.
  const overall = clamp(
    taskCompletion * 0.30 +
    clarity * 0.22 +
    fluency * 0.18 +
    vocabulary * 0.15 +
    grammar * 0.15,
  );

  const feedback: string[] = [];
  if (taskCompletion >= 82) {
    feedback.push("Görevin temel iletişim hedeflerini büyük ölçüde tamamladın.");
  } else {
    feedback.push(
      `Bir sonraki denemede şu iletişim noktalarını özellikle ekle: ${missingGoals.join(", ") || "görev ayrıntıları"}.`,
    );
  }

  if (fluency >= 78) {
    feedback.push("Konuşma tempon ve akışın seviyen için iletişimi destekliyor.");
  } else {
    feedback.push("Önce kısa cümlelerle prova yap, sonra aynı görevi kesintisiz olarak yeniden kaydet.");
  }

  if (grammar < 65) {
    feedback.push("Gramer puanı hedef yapıların kullanımı ve belirgin otomatik örüntüler üzerinden hesaplandı; yapı iskeletine yeniden bak.");
  }

  if (naturalSuggestions.length) {
    feedback.push("Aşağıdaki doğal kullanım alternatiflerinden birini ikinci denemende bilinçli olarak kullan.");
  }

  if (!transcript.trim()) {
    feedback.push("Ses tanıma metni oluşmadı. Tarayıcı izinlerini kontrol et veya metni elle girerek değerlendirmeyi tamamla.");
  }

  return {
    overall,
    taskCompletion,
    vocabulary,
    fluency,
    grammar,
    clarity,
    matchedKeywords,
    missingKeywords,
    achievedGoals,
    missingGoals,
    pronunciationFocus,
    pronunciation,
    naturalSuggestions,
    grammarNotes,
    metrics: {
      wordCount: transcriptWords.length,
      wordsPerMinute,
      hesitationCount,
      durationSeconds: Math.max(1, Math.round(durationSeconds)),
    },
    feedback,
  };
}
const correctionPatterns: Array<{ pattern: RegExp; original: string; suggestion: string; reason: string }> = [
  { pattern: /\bich komme in ([A-ZÄÖÜ][\p{L}-]+)/iu, original: "Ich komme in …", suggestion: "Ich komme aus … / Ich wohne in …", reason: "Köken için aus, ikamet için wohnen in kullanılır." },
  { pattern: /\bich bin ([0-9]{1,2}) jahre\b/iu, original: "Ich bin … Jahre.", suggestion: "Ich bin … Jahre alt.", reason: "Yaş söylerken alt kelimesi gerekir." },
  { pattern: /\bweil ich (?:bin|habe|kann|muss)\b/iu, original: "weil ich + çekimli fiil", suggestion: "weil ich … + çekimli fiil (sonda)", reason: "weil yan cümlesinde çekimli fiil sona gider." },
  { pattern: /\bich habe gegangen\b/iu, original: "ich habe gegangen", suggestion: "ich bin gegangen", reason: "gehen fiilinin Perfekt yardımcı fiili sein'dır." },
  { pattern: /\bmehr besser\b/iu, original: "mehr besser", suggestion: "besser", reason: "besser zaten karşılaştırma biçimidir." },
];

const connectors = ["zuerst", "danach", "außerdem", "deshalb", "trotzdem", "einerseits", "andererseits", "allerdings", "abschließend", "zusammenfassend", "weil", "obwohl", "wenn"];

export function evaluateWriting(task: WritingTask, text: string): WritingEvaluation {
  const textWords = words(text);
  const wordCount = textWords.length;
  const matchedPoints = task.requiredPoints.filter((point, index) => {
    const target = task.targetKeywords[index] ?? point;
    return includesLoose(text, target) || includesLoose(text, point);
  });
  const missingPoints = task.requiredPoints.filter((point) => !matchedPoints.includes(point));
  const pointRatio = task.requiredPoints.length ? matchedPoints.length / task.requiredPoints.length : 1;
  const rangeScore = wordCount >= task.minWords && wordCount <= task.maxWords
    ? 100
    : wordCount < task.minWords
      ? clamp((wordCount / task.minWords) * 100)
      : clamp(100 - ((wordCount - task.maxWords) / Math.max(task.maxWords, 1)) * 70);
  const taskSuccess = clamp(pointRatio * 78 + rangeScore * 0.22);

  const corrections = correctionPatterns
    .filter((item) => item.pattern.test(text))
    .map(({ original, suggestion, reason }) => ({ original, suggestion, reason }));
  const sentences = text.split(/[.!?]+/).map((item) => item.trim()).filter(Boolean);
  const lowercaseStarts = sentences.filter((sentence) => /^[a-zäöüß]/.test(sentence)).length;
  const punctuationScore = text.trim() && /[.!?]$/.test(text.trim()) ? 100 : 70;
  const grammar = clamp(100 - corrections.length * 14 - lowercaseStarts * 6 - (punctuationScore < 100 ? 8 : 0));

  const uniqueRatio = textWords.length ? new Set(textWords).size / textWords.length : 0;
  const matchedTargets = task.targetKeywords.filter((keyword) => includesLoose(text, keyword)).length;
  const targetRatio = task.targetKeywords.length ? matchedTargets / task.targetKeywords.length : 1;
  const vocabulary = clamp(uniqueRatio * 52 + targetRatio * 48);

  const connectorCount = connectors.filter((connector) => includesLoose(text, connector)).length;
  const expectedSentences = task.level === "A1" ? 4 : task.level === "A2" ? 6 : task.level === "B1" ? 8 : 10;
  const paragraphCount = text.split(/\n\s*\n/).map((item) => item.trim()).filter(Boolean).length;
  const structure = clamp(Math.min(sentences.length / expectedSentences, 1) * 55 + Math.min(connectorCount / (task.level === "A1" ? 1 : task.level === "A2" ? 2 : 4), 1) * 30 + Math.min(paragraphCount, 2) / 2 * 15);

  const overall = clamp(taskSuccess * 0.34 + grammar * 0.26 + vocabulary * 0.20 + structure * 0.20);
  const feedback: string[] = [];
  if (wordCount < task.minWords) feedback.push(`Metin ${task.minWords - wordCount} kelime daha uzun olmalı.`);
  else if (wordCount > task.maxWords) feedback.push(`Metni yaklaşık ${wordCount - task.maxWords} kelime kısaltarak daha odaklı hâle getir.`);
  else feedback.push("Kelime sayısı görev aralığına uygun.");
  if (missingPoints.length) feedback.push(`Eksik görev noktaları: ${missingPoints.join(", ")}.`);
  else feedback.push("Görevde istenen temel noktaların tamamına değindin.");
  if (corrections.length) feedback.push("Belirlenen dil bilgisi örüntülerini düzeltip metni yeniden kontrol et.");
  else feedback.push("Otomatik taramada belirgin bir temel yapı hatası bulunmadı.");
  if (structure < 65) feedback.push("Cümleleri bağlamak için zuerst, danach, außerdem, deshalb veya allerdings gibi bağlaçlardan yararlan.");

  return { overall, taskSuccess, grammar, vocabulary, structure, wordCount, matchedPoints, missingPoints, corrections, feedback };
}
