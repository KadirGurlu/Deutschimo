import { exercises, quizzes } from "@/data/exercises";
import { units } from "@/data/units";
import type { Exercise, UnitQuizQuestion } from "@/types/exercise";
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

const assessmentSkillLabels: Record<string, string> = {
  GRAMMAR: "Dil bilgisi",
  VOCABULARY: "Kelime bilgisi",
  COMMUNICATION: "İletişim",
  READING: "Okuma",
  LISTENING: "Dinleme",
  WRITING: "Yazma",
  SPEAKING: "Konuşma",
  PRONUNCIATION: "Telaffuz",
};

export type PersonalizedErrorSignal = {
  id: string;
 sourceType:
  | "EXERCISE"
  | "UNIT_QUIZ"
  | "SKILL_LAB"
  | "PLACEMENT"
  | "SMART_REVIEW"
  | "REAL_GERMANY";
  sourceId: string;
  courseId: string;
  unitId: string | null;
  level: "A1" | "A2" | "B1" | "B2";
  skill: string;
  objectiveCode: string;
  topic: string;
  correctAnswer?: unknown;
  explanation: string | null;
  relatedSlideId: string | null;
  occurrenceCount: number;
  lastOccurredAt: string;
};

export type StoredReviewItem = ReviewItem & {
  correctAnswer?: unknown;
  acceptedAnswers?: string[];
  explanation: string;
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
const quizQuestionById = new Map<string, { question: UnitQuizQuestion; unitId: string }>();
for (const quiz of quizzes) {
  for (const question of quiz.questions) quizQuestionById.set(question.id, { question, unitId: quiz.unitId });
}

function errorPriority(occurrenceCount: number): ReviewItem["priority"] {
  if (occurrenceCount >= 3) return "CRITICAL";
  if (occurrenceCount >= 2) return "HIGH";
  return "MEDIUM";
}

function fromErrorHistory(error: PersonalizedErrorSignal): StoredReviewItem | null {
  const unit = units.find((item) => item.id === error.unitId) ?? units.find((item) => item.courseId === error.courseId);
  if (!unit) return null;

  const exercise = error.sourceType === "EXERCISE" ? exercises.find((item) => item.id === error.sourceId) : undefined;
  const quizMatch = error.sourceType === "UNIT_QUIZ" ? quizQuestionById.get(error.sourceId) : undefined;
  const question = exercise ?? quizMatch?.question;
  const supported = question && supportedReviewTypes.has(question.type as Exercise["type"]);
  const href = error.sourceType === "UNIT_QUIZ"
    ? `/learn/${unit.courseId}/${unit.id}/quiz`
    : error.sourceType === "EXERCISE"
      ? `/learn/${unit.courseId}/${unit.id}/exercises`
      : `/learn/${unit.courseId}/${unit.id}`;
  const reason = error.occurrenceCount > 1
    ? `${error.occurrenceCount} kez tekrarlanan hata · ${error.topic}`
    : `Hata geçmişindeki açık kayıt · ${error.topic}`;

  return {
    id: `review-error-${error.id}`,
    sourceId: error.sourceId,
    sourceType: "ERROR_HISTORY",
    errorHistoryId: error.id,
    objectiveCode: error.objectiveCode,
    courseId: unit.courseId,
    unitId: unit.id,
    unitTitle: unit.title,
    skill: question && "type" in question ? skillLabels[question.type as Exercise["type"]] ?? assessmentSkillLabels[error.skill] ?? error.topic : assessmentSkillLabels[error.skill] ?? error.topic,
    type: supported ? question!.type as ReviewItem["type"] : "CONCEPT",
    prompt: supported ? question!.prompt : `${error.topic} konusundaki hatanı yeniden incele ve ilgili kuralı bir örnekle tekrar et.`,
    options: supported && "options" in question! ? question!.options : undefined,
    href,
    priority: errorPriority(error.occurrenceCount),
    reason,
    occurrenceCount: error.occurrenceCount,
    correctAnswer: supported ? question!.correctAnswer : error.correctAnswer,
    acceptedAnswers: exercise?.acceptedAnswers,
    explanation: error.explanation ?? question?.explanation ?? `${error.topic} konusundaki açıklamayı ders notlarından tekrar et.`,
  };
}

export function buildReviewQueue(
  state: LearningState | null | undefined,
  insights: IntelligenceInsights,
  errorHistory: PersonalizedErrorSignal[] = [],
): StoredReviewItem[] {
  const queue: StoredReviewItem[] = [];
  const seenSourceIds = new Set<string>();
  const seenConcepts = new Set<string>();

  // Önce öğrencinin açık ve tekrarlanan hata geçmişi gelir.
  for (const error of errorHistory.slice(0, 8)) {
    const item = fromErrorHistory(error);
    if (!item) continue;
    queue.push(item);
    seenSourceIds.add(error.sourceId);
    seenConcepts.add(`${item.unitId}::${item.skill}`);
  }

  // Eski öğrenme durumundaki son yanlışlar, ölçme altyapısında henüz kayıt yoksa kuyruğu tamamlar.
  if (state && queue.length < 10) {
    const latestAttempts = new Map<string, (typeof state.exerciseAttempts)[number]>();
    for (const attempt of state.exerciseAttempts) {
      const previous = latestAttempts.get(attempt.exerciseId);
      if (!previous || new Date(attempt.submittedAt).getTime() > new Date(previous.submittedAt).getTime()) latestAttempts.set(attempt.exerciseId, attempt);
    }

    const wrongAttempts = [...latestAttempts.values()]
      .filter((attempt) => !attempt.isCorrect)
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());

    for (const attempt of wrongAttempts) {
      if (queue.length >= 10 || seenSourceIds.has(attempt.exerciseId)) break;
      const exercise = exercises.find((item) => item.id === attempt.exerciseId);
      if (!exercise || !supportedReviewTypes.has(exercise.type)) continue;
      const unit = units.find((item) => item.id === exercise.unitId);
      if (!unit) continue;
      const item: StoredReviewItem = {
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
        priority: "HIGH",
        reason: "Son alıştırma denemendeki yanlış cevap",
        correctAnswer: exercise.correctAnswer,
        acceptedAnswers: exercise.acceptedAnswers,
        explanation: exercise.explanation,
      };
      queue.push(item);
      seenSourceIds.add(exercise.id);
      seenConcepts.add(`${unit.id}::${item.skill}`);
    }
  }

  // Zayıf konu analizi, tekil yanlışların arkasındaki daha geniş öğrenme açığını hedefler.
  for (const insight of insights.weakTopics) {
    if (queue.length >= 12) break;
    const conceptKey = `${insight.unitId}::${insight.skill}`;
    if (seenConcepts.has(conceptKey)) continue;
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
      priority: insight.severity,
      reason: `Zayıf konu analizi · başarı %${insight.accuracy}`,
      occurrenceCount: insight.incorrectCount,
      explanation: insight.recommendation,
    });
    seenConcepts.add(conceptKey);
  }

  // Kuyruk boşluklarını daha fazla açık hata ile doldur; böylece hiçbir kişisel hata gözden kaçmaz.
  if (queue.length < 12) {
    for (const error of errorHistory.slice(8)) {
      if (queue.length >= 12 || seenSourceIds.has(error.sourceId)) continue;
      const item = fromErrorHistory(error);
      if (!item) continue;
      queue.push(item);
      seenSourceIds.add(error.sourceId);
    }
  }

  return queue.slice(0, 12);
}
