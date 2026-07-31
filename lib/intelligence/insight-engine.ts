import { exercises, quizzes } from "@/data/exercises";
import { units } from "@/data/units";
import type { Exercise } from "@/types/exercise";
import type { IntelligenceInsights, ReviewItem, StrengthInsight, WeakTopicInsight } from "@/types/intelligence";
import type { LearningState } from "@/types/progress";

const skillLabels: Record<Exercise["type"], string> = {
  MULTIPLE_CHOICE: "Kelime ve yapı seçimi",
  MULTIPLE_SELECT: "İfade sınıflandırma",
  TRUE_FALSE: "Kural farkındalığı",
  FILL_IN_THE_BLANK: "Dil bilgisi ve çekim",
  MATCHING: "Kelime eşleştirme",
  SENTENCE_ORDERING: "Cümle dizilişi",
  TRANSLATION: "Çeviri",
  DIALOGUE_COMPLETION: "Günlük iletişim",
  SHORT_ANSWER: "Kısa üretim",
  WRITING_ASSIGNMENT: "Yazılı anlatım",
};

function severity(accuracy: number): WeakTopicInsight["severity"] {
  if (accuracy < 40) return "CRITICAL";
  if (accuracy < 60) return "HIGH";
  return "MEDIUM";
}

function confidence(attemptCount: number): WeakTopicInsight["confidence"] {
  if (attemptCount >= 6) return "HIGH";
  if (attemptCount >= 3) return "MEDIUM";
  return "LOW";
}

function recommendation(skill: string, unitTitle: string) {
  const base: Record<string, string> = {
    "Kelime ve yapı seçimi": "Temel kelimeleri örnek cümleleriyle tekrar et ve seçenekleri anlamlarına göre karşılaştır.",
    "İfade sınıflandırma": "İfadeleri iletişim amaçlarına göre gruplandırarak kısa bir tekrar yap.",
    "Kural farkındalığı": "Kural açıklamasını yeniden oku; doğru ve yanlış örnekleri yan yana incele.",
    "Dil bilgisi ve çekim": "Fiil çekimi ve cümle dizilişi tablolarına dön, ardından boşluk doldurma sorularını yeniden çöz.",
    "Kelime eşleştirme": "Kelime kartlarında artikel, çoğul ve Türkçe anlamı birlikte tekrar et.",
    "Cümle dizilişi": "Çekimli fiilin konumunu işaretleyerek cümleyi parçalara ayır.",
    "Çeviri": "Önce anlam çekirdeğini bul, sonra özne–fiil uyumunu kontrol ederek yeniden çevir.",
    "Günlük iletişim": "Ünitedeki diyaloğu yüksek sesle oku ve benzer bir konuşmayı kendi bilgilerinle kur.",
    "Kısa üretim": "Kısa model cümlelerden başlayıp aynı yapıyla iki yeni cümle üret.",
    "Yazılı anlatım": "Metni giriş–gelişme–sonuç düzeniyle yeniden planla ve bağlaçları kontrol et.",
    "Ünite değerlendirmesi": "Ünite özetine dön ve quizde kaçırdığın kazanımları hedefleyen akıllı tekrarı tamamla.",
  };
  return `${unitTitle}: ${base[skill] ?? "İlgili ders slaydına dön ve kısa bir hedefli tekrar yap."}`;
}

export function analyzeLearningState(state: LearningState | null | undefined): IntelligenceInsights {
  if (!state) return { weakTopics: [], strengths: [], generatedAt: new Date().toISOString(), hasEnoughData: false };

  const latestAttempts = new Map<string, (typeof state.exerciseAttempts)[number]>();
  for (const attempt of state.exerciseAttempts) {
    const previous = latestAttempts.get(attempt.exerciseId);
    if (!previous || new Date(attempt.submittedAt).getTime() > new Date(previous.submittedAt).getTime()) latestAttempts.set(attempt.exerciseId, attempt);
  }

  const groups = new Map<string, { unitId: string; skill: string; correct: number; total: number }>();
  for (const attempt of latestAttempts.values()) {
    const exercise = exercises.find((item) => item.id === attempt.exerciseId);
    if (!exercise) continue;
    const skill = skillLabels[exercise.type];
    const key = `${exercise.unitId}::${skill}`;
    const group = groups.get(key) ?? { unitId: exercise.unitId, skill, correct: 0, total: 0 };
    group.total += 1;
    if (attempt.isCorrect) group.correct += 1;
    groups.set(key, group);
  }

  for (const attempt of state.quizAttempts) {
    const quiz = quizzes.find((item) => item.id === attempt.quizId);
    if (!quiz) continue;
    const key = `${quiz.unitId}::Ünite değerlendirmesi`;
    const group = groups.get(key) ?? { unitId: quiz.unitId, skill: "Ünite değerlendirmesi", correct: 0, total: 0 };
    group.total += 1;
    group.correct += Math.max(0, Math.min(1, attempt.score / 100));
    groups.set(key, group);
  }

  const weakTopics: WeakTopicInsight[] = [];
  const strengths: StrengthInsight[] = [];

  for (const [key, group] of groups) {
    const unit = units.find((item) => item.id === group.unitId);
    if (!unit || group.total === 0) continue;
    const accuracy = Math.round((group.correct / group.total) * 100);
    if (accuracy < 75) {
      weakTopics.push({
        id: key,
        unitId: unit.id,
        courseId: unit.courseId,
        unitTitle: unit.title,
        skill: group.skill,
        accuracy,
        attemptCount: group.total,
        incorrectCount: Math.max(1, Math.round(group.total - group.correct)),
        severity: severity(accuracy),
        confidence: confidence(group.total),
        recommendation: recommendation(group.skill, unit.title),
        href: `/learn/${unit.courseId}/${unit.id}`,
      });
    } else if (accuracy >= 85) {
      strengths.push({ id: key, title: `${unit.title} · ${group.skill}`, accuracy, attemptCount: group.total });
    }
  }

  weakTopics.sort((a, b) => a.accuracy - b.accuracy || b.attemptCount - a.attemptCount);
  strengths.sort((a, b) => b.accuracy - a.accuracy || b.attemptCount - a.attemptCount);

  return {
    weakTopics: weakTopics.slice(0, 8),
    strengths: strengths.slice(0, 6),
    generatedAt: new Date().toISOString(),
    hasEnoughData: latestAttempts.size >= 3 || state.quizAttempts.length > 0,
  };
}

const supportedReviewTypes = new Set<Exercise["type"]>(["MULTIPLE_CHOICE", "TRUE_FALSE", "FILL_IN_THE_BLANK", "TRANSLATION"]);

export function buildReviewQueue(state: LearningState | null | undefined, insights: IntelligenceInsights): Array<ReviewItem & { correctAnswer?: unknown; acceptedAnswers?: string[]; explanation: string }> {
  const queue: Array<ReviewItem & { correctAnswer?: unknown; acceptedAnswers?: string[]; explanation: string }> = [];
  if (state) {
    const latestAttempts = new Map<string, (typeof state.exerciseAttempts)[number]>();
    for (const attempt of state.exerciseAttempts) {
      const previous = latestAttempts.get(attempt.exerciseId);
      if (!previous || new Date(attempt.submittedAt).getTime() > new Date(previous.submittedAt).getTime()) latestAttempts.set(attempt.exerciseId, attempt);
    }

    for (const attempt of latestAttempts.values()) {
      if (attempt.isCorrect) continue;
      const exercise = exercises.find((item) => item.id === attempt.exerciseId);
      if (!exercise || !supportedReviewTypes.has(exercise.type)) continue;
      const unit = units.find((item) => item.id === exercise.unitId);
      if (!unit) continue;
      queue.push({
        id: `review-${exercise.id}`,
        sourceId: exercise.id,
        sourceType: "EXERCISE",
        courseId: unit.courseId,
        unitId: unit.id,
        unitTitle: unit.title,
        skill: skillLabels[exercise.type],
        type: exercise.type as ReviewItem["type"],
        prompt: exercise.prompt,
        options: exercise.options,
        href: `/learn/${unit.courseId}/${unit.id}/exercises`,
        correctAnswer: exercise.correctAnswer,
        acceptedAnswers: exercise.acceptedAnswers,
        explanation: exercise.explanation,
      });
    }
  }

  if (queue.length < 6) {
    for (const insight of insights.weakTopics) {
      if (queue.some((item) => item.unitId === insight.unitId && item.skill === insight.skill)) continue;
      queue.push({
        id: `review-insight-${insight.id}`,
        sourceId: insight.id,
        sourceType: "INSIGHT",
        courseId: insight.courseId,
        unitId: insight.unitId,
        unitTitle: insight.unitTitle,
        skill: insight.skill,
        type: "CONCEPT",
        prompt: insight.recommendation,
        href: insight.href,
        explanation: insight.recommendation,
      });
    }
  }

  return queue.slice(0, 12);
}
