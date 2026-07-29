import { getCurriculumContent } from "@/data/curriculum-content";
import { units } from "@/data/units";
import type { Exercise, ExerciseOption, ExerciseType, UnitQuiz } from "@/types/exercise";

const option = (id: string, label: string): ExerciseOption => ({ id, label, value: label });

function exerciseTypes(courseId: string): ExerciseType[] {
  if (courseId === "b1" || courseId === "b2") {
    return [
      "MULTIPLE_CHOICE",
      "MULTIPLE_SELECT",
      "TRUE_FALSE",
      "FILL_IN_THE_BLANK",
      "MATCHING",
      "SENTENCE_ORDERING",
      "SHORT_ANSWER",
      "WRITING_ASSIGNMENT",
    ];
  }
  return [
    "MULTIPLE_CHOICE",
    "MULTIPLE_SELECT",
    "TRUE_FALSE",
    "FILL_IN_THE_BLANK",
    "MATCHING",
    "SENTENCE_ORDERING",
    "TRANSLATION",
    "DIALOGUE_COMPLETION",
  ];
}

function vocabularyPairs(unitId: string) {
  return getCurriculumContent(unitId).vocabulary.slice(0, 4).map((item) => {
    const [left, ...rightParts] = item.split(" — ");
    return { left, right: rightParts.join(" — ") };
  });
}

function createExercise(
  unitId: string,
  courseId: string,
  order: number,
  type: ExerciseType,
): Exercise {
  const content = getCurriculumContent(unitId);
  const id = `${unitId}-e${order}`;
  const common = {
    id,
    unitId,
    groupId: `${unitId}-practice`,
    order,
    type,
    title: `Alıştırma ${order}`,
    explanation: content.warning,
    relatedSlideId: `${unitId}-s${Math.min(order, 6)}`,
    isRequired: true,
    maxAttempts: 2,
    points: 10,
  } as const;

  switch (type) {
    case "MULTIPLE_CHOICE":
      return {
        ...common,
        title: "Doğru yapıyı seç",
        prompt: content.miniCheck.question,
        options: content.miniCheck.options.map((item, index) => option(`o${index + 1}`, item)),
        correctAnswer: content.miniCheck.correctAnswer,
      };
    case "MULTIPLE_SELECT":
      return {
        ...common,
        title: "Uygun ifadeleri belirle",
        prompt: content.multiSelect.prompt,
        options: content.multiSelect.options.map((item, index) => option(`o${index + 1}`, item)),
        correctAnswer: content.multiSelect.answers,
      };
    case "TRUE_FALSE":
      return {
        ...common,
        title: "Kuralı değerlendir",
        prompt: content.trueFalse.prompt,
        correctAnswer: content.trueFalse.answer,
      };
    case "FILL_IN_THE_BLANK":
      return {
        ...common,
        title: "Boşluğu tamamla",
        prompt: content.fill.prompt,
        correctAnswer: content.fill.answer,
        acceptedAnswers: content.fill.acceptedAnswers,
      };
    case "MATCHING": {
      const pairs = vocabularyPairs(unitId);
      return {
        ...common,
        title: "Kelimeleri anlamlarıyla eşleştir",
        prompt: "Soldaki Almanca kelime veya ifadeyi doğru Türkçe anlamıyla eşleştir.",
        pairs,
        correctAnswer: pairs.map((pair) => `${pair.left}:${pair.right}`),
      };
    }
    case "SENTENCE_ORDERING":
      return {
        ...common,
        title: "Cümleyi doğru sıraya koy",
        prompt: "Parçalara dokunarak dil bilgisi bakımından doğru Almanca cümleyi oluştur.",
        tokens: content.ordering.tokens,
        correctAnswer: content.ordering.answer,
      };
    case "TRANSLATION":
      return {
        ...common,
        title: "Türkçeden Almancaya çevir",
        prompt: content.translation.prompt,
        correctAnswer: content.translation.answer,
        acceptedAnswers: content.translation.acceptedAnswers,
      };
    case "DIALOGUE_COMPLETION":
      return {
        ...common,
        title: "Diyaloğu tamamla",
        prompt: content.dialogue.prompt,
        options: content.dialogue.options.map((item, index) => option(`o${index + 1}`, item)),
        correctAnswer: content.dialogue.answer,
      };
    case "SHORT_ANSWER":
      return {
        ...common,
        title: "Kısa yanıt oluştur",
        prompt: `${content.translation.prompt} Cevabını Almanca bir veya iki cümleyle yaz ve ünitedeki yapıyı kullan.`,
        correctAnswer: "öğretmen değerlendirmesi",
        acceptedAnswers: [],
      };
    case "WRITING_ASSIGNMENT":
      return {
        ...common,
        title: "Yazma görevi",
        prompt: content.dialogue.prompt,
        correctAnswer: "öğretmen değerlendirmesi",
        minWords: courseId === "b2" ? 140 : 100,
        maxWords: courseId === "b2" ? 200 : 150,
      };
  }
}

export const exercises: Exercise[] = units.flatMap((unit) =>
  exerciseTypes(unit.courseId).map((type, index) =>
    createExercise(unit.id, unit.courseId, index + 1, type),
  ),
);

export const quizzes: UnitQuiz[] = units.map((unit) => {
  const content = getCurriculumContent(unit.id);
  const exampleTranslations = content.examples.map((example) => example.tr);
  const translationOptions = [
    content.translation.answer,
    content.examples[1]?.de ?? content.examples[0].de,
    content.examples[2]?.de ?? content.examples[0].de,
  ];

  return {
    id: `${unit.id}-quiz`,
    unitId: unit.id,
    title: `${unit.title} · Ünite Sonu Değerlendirmesi`,
    minimumScore: unit.completionRules.minimumQuizScore,
    maxAttempts: 3,
    showAnswersAfterSubmit: true,
    questions: [
      {
        id: `${unit.id}-q1`,
        type: "MULTIPLE_CHOICE",
        prompt: content.miniCheck.question,
        options: content.miniCheck.options.map((item, index) => option(`q1-${index}`, item)),
        correctAnswer: content.miniCheck.correctAnswer,
        topic: content.grammarTitle,
        relatedSlideId: `${unit.id}-s2`,
      },
      {
        id: `${unit.id}-q2`,
        type: "TRUE_FALSE",
        prompt: content.trueFalse.prompt,
        correctAnswer: content.trueFalse.answer,
        topic: "Kullanım kuralı",
        relatedSlideId: `${unit.id}-s5`,
      },
      {
        id: `${unit.id}-q3`,
        type: "FILL_IN_THE_BLANK",
        prompt: content.fill.prompt,
        correctAnswer: content.fill.answer,
        topic: "Dil bilgisi uygulaması",
        relatedSlideId: `${unit.id}-s2`,
      },
      {
        id: `${unit.id}-q4`,
        type: "MULTIPLE_CHOICE",
        prompt: content.translation.prompt,
        options: translationOptions.map((item, index) => option(`q4-${index}`, item)),
        correctAnswer: content.translation.answer,
        topic: "Çeviri ve üretim",
        relatedSlideId: `${unit.id}-s4`,
      },
      {
        id: `${unit.id}-q5`,
        type: "MULTIPLE_CHOICE",
        prompt: `“${content.examples[0].de}” cümlesinin doğru Türkçe anlamı hangisidir?`,
        options: exampleTranslations.slice(0, 3).map((item, index) => option(`q5-${index}`, item)),
        correctAnswer: content.examples[0].tr,
        topic: "Bağlam içinde anlam",
        relatedSlideId: `${unit.id}-s4`,
      },
    ],
  };
});

export const exercisesPerUnit = 8;
export const totalExerciseCounts = { A1: 96, A2: 128, B1: 144, B2: 160 } as const;
