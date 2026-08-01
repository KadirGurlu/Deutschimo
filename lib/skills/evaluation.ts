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

export function evaluateSpeaking(task: SpeakingTask, transcript: string, durationSeconds: number, recognitionConfidence = 0.75): SpeakingEvaluation {
  const transcriptWords = words(transcript);
  const matchedKeywords = task.requiredKeywords.filter((keyword) => includesLoose(transcript, keyword));
  const missingKeywords = task.requiredKeywords.filter((keyword) => !matchedKeywords.includes(keyword));
  const keywordRatio = task.requiredKeywords.length ? matchedKeywords.length / task.requiredKeywords.length : 1;
  const taskCompletion = clamp(keywordRatio * 100);

  const uniqueRatio = transcriptWords.length ? new Set(transcriptWords).size / transcriptWords.length : 0;
  const vocabulary = clamp(keywordRatio * 65 + uniqueRatio * 35);

  const minutes = Math.max(durationSeconds / 60, 0.25);
  const wordsPerMinute = transcriptWords.length / minutes;
  const levelTarget = task.level === "A1" ? 55 : task.level === "A2" ? 70 : task.level === "B1" ? 85 : 100;
  const paceDistance = Math.abs(wordsPerMinute - levelTarget);
  const paceScore = clamp(100 - paceDistance * 1.15);
  const hesitationCount = (normalize(transcript).match(/\b(äh|ähm|also also|hm)\b/g) ?? []).length;
  const fluency = clamp(paceScore - hesitationCount * 7 + Math.min(transcriptWords.length, 40) * 0.45);

  const sentenceCount = transcript.split(/[.!?]+/).map((item) => item.trim()).filter(Boolean).length;
  const minimumSentences = task.level === "A1" ? 2 : task.level === "A2" ? 3 : task.level === "B1" ? 4 : 5;
  const clarity = clamp(recognitionConfidence * 70 + Math.min(sentenceCount / minimumSentences, 1) * 30);

  const overall = clamp(taskCompletion * 0.38 + vocabulary * 0.22 + fluency * 0.22 + clarity * 0.18);
  const pronunciationFocus = missingKeywords.slice(0, 4);
  const feedback: string[] = [];
  if (taskCompletion >= 80) feedback.push("Görevin temel iletişim noktalarını büyük ölçüde tamamladın.");
  else feedback.push(`Yanıtını geliştirirken şu hedefleri ekle: ${missingKeywords.join(", ") || "görev ayrıntıları"}.`);
  if (fluency >= 75) feedback.push("Konuşma hızın ve cümle akışın seviyene uygun görünüyor.");
  else feedback.push("Daha kısa model cümlelerle prova yapıp aynı görevi yeniden kaydet.");
  if (recognitionConfidence < 0.58) feedback.push("Tarayıcı bazı kelimeleri düşük güvenle algıladı; mikrofon mesafesini ve ortam gürültüsünü kontrol et.");
  if (!transcript.trim()) feedback.push("Ses tanıma metni oluşmadı. Tarayıcı izinlerini kontrol et veya metni elle girerek değerlendirmeyi tamamla.");

  return { overall, taskCompletion, vocabulary, fluency, clarity, matchedKeywords, missingKeywords, pronunciationFocus, feedback };
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
