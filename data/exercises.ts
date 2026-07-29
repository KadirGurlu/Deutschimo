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
      "TRANSLATION",
      "SHORT_ANSWER",
      "WRITING_ASSIGNMENT",
      "MULTIPLE_CHOICE",
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
    "MULTIPLE_CHOICE",
    "FILL_IN_THE_BLANK",
  ];
}

function vocabularyPairs(unitId: string) {
  return getCurriculumContent(unitId).vocabulary.slice(0, 5).map((item) => {
    const [left, ...rightParts] = item.split(" — ");
    return { left, right: rightParts.join(" — ") };
  });
}

function distinct(values: string[], fallback: string): string[] {
  const result = Array.from(new Set(values.filter(Boolean)));
  while (result.length < 3) result.push(`${fallback} ${result.length + 1}`);
  return result.slice(0, 4);
}

function createExampleFill(unitId: string) {
  const content = getCurriculumContent(unitId);
  const sentence = content.examples[1]?.de ?? content.examples[0].de;
  const tokens = sentence.split(/\s+/);
  const targetIndex = Math.min(1, tokens.length - 1);
  const rawAnswer = tokens[targetIndex] ?? "";
  const answer = rawAnswer.replace(/[.,!?;:]/g, "");
  const prompt = tokens.map((token, index) => index === targetIndex ? "___" : token).join(" ");
  return { prompt: `Örneği tamamla: ${prompt}`, answer, acceptedAnswers: [answer] };
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
    relatedSlideId: `${unitId}-s${Math.min(order, 8)}`,
    isRequired: true,
    maxAttempts: 2,
    points: 10,
  } as const;

  switch (type) {
    case "MULTIPLE_CHOICE": {
      if (order > 1) {
        const exampleIndex = Math.min(1, content.examples.length - 1);
        const example = content.examples[exampleIndex];
        const meanings = distinct([
          example.tr,
          ...content.examples.filter((_, index) => index !== exampleIndex).map((item) => item.tr),
        ], "Alternatif anlam");
        return {
          ...common,
          title: "Cümlenin anlamını belirle",
          prompt: `“${example.de}” cümlesinin doğru Türkçe anlamı hangisidir?`,
          options: meanings.map((item, index) => option(`o${index + 1}`, item)),
          correctAnswer: example.tr,
          explanation: "Önce çekimli fiili ve cümlenin temel tamamlayıcısını bul; ardından çeviriyi bağlamla karşılaştır.",
        };
      }
      return {
        ...common,
        title: "Doğru yapıyı seç",
        prompt: content.miniCheck.question,
        options: content.miniCheck.options.map((item, index) => option(`o${index + 1}`, item)),
        correctAnswer: content.miniCheck.correctAnswer,
      };
    }
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
    case "FILL_IN_THE_BLANK": {
      const task = order > 4 ? createExampleFill(unitId) : content.fill;
      return {
        ...common,
        title: order > 4 ? "Örnek cümleyi tamamla" : "Boşluğu tamamla",
        prompt: task.prompt,
        correctAnswer: task.answer,
        acceptedAnswers: task.acceptedAnswers,
        explanation: order > 4 ? "Boşluğun önündeki özneye ve cümlenin anlamına göre doğru çekimli biçimi seç." : content.warning,
      };
    }
    case "MATCHING": {
      const pairs = vocabularyPairs(unitId);
      return {
        ...common,
        title: "Kelimeleri anlamlarıyla eşleştir",
        prompt: "Soldaki Almanca kelime veya ifadeyi doğru Türkçe anlamıyla eşleştir.",
        pairs,
        correctAnswer: pairs.map((pair) => `${pair.left}:${pair.right}`),
        maxAttempts: 3,
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
        maxAttempts: 3,
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
        prompt: `${content.translation.prompt} Cevabını Almanca iki veya üç cümleyle genişlet ve ünitedeki ana yapıyı kullan.`,
        correctAnswer: "öğretmen değerlendirmesi",
        acceptedAnswers: [],
        explanation: "Cevabın gönderildi. Gerçek backend bağlandığında bu görev öğretmen veya otomatik değerlendirme akışına aktarılacaktır.",
      };
    case "WRITING_ASSIGNMENT":
      return {
        ...common,
        title: "Yazma görevi",
        prompt: `${content.dialogue.prompt} Bu durumdan hareketle tutarlı bir metin yaz. En az iki bağlaç ve ünitede öğrendiğin kelimelerden en az üçünü kullan.`,
        correctAnswer: "öğretmen değerlendirmesi",
        minWords: courseId === "b2" ? 150 : 110,
        maxWords: courseId === "b2" ? 220 : 170,
        explanation: "Metnin taslak olarak kaydedildi. Değerlendirme sistemi bağlandığında gramer, kelime çeşitliliği ve metin yapısı üzerinden değerlendirilecektir.",
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
  const translationOptions = distinct([
    content.translation.answer,
    content.examples[1]?.de ?? content.examples[0].de,
    content.examples[2]?.de ?? content.examples[0].de,
  ], "Alternatif cümle");
  const secondExample = content.examples[1] ?? content.examples[0];
  const secondFill = createExampleFill(unit.id);

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
        relatedSlideId: `${unit.id}-s7`,
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
        relatedSlideId: `${unit.id}-s5`,
      },
      {
        id: `${unit.id}-q5`,
        type: "MULTIPLE_CHOICE",
        prompt: `“${content.examples[0].de}” cümlesinin doğru Türkçe anlamı hangisidir?`,
        options: distinct(exampleTranslations, "Alternatif anlam").map((item, index) => option(`q5-${index}`, item)),
        correctAnswer: content.examples[0].tr,
        topic: "Bağlam içinde anlam",
        relatedSlideId: `${unit.id}-s6`,
      },
      {
        id: `${unit.id}-q6`,
        type: "MULTIPLE_CHOICE",
        prompt: `“${secondExample.de}” cümlesinin doğru Türkçe anlamı hangisidir?`,
        options: distinct([secondExample.tr, ...exampleTranslations.filter((item) => item !== secondExample.tr)], "Alternatif anlam").map((item, index) => option(`q6-${index}`, item)),
        correctAnswer: secondExample.tr,
        topic: "Kelime ve cümle anlamı",
        relatedSlideId: `${unit.id}-s6`,
      },
      {
        id: `${unit.id}-q7`,
        type: "FILL_IN_THE_BLANK",
        prompt: secondFill.prompt,
        correctAnswer: secondFill.answer,
        topic: "Fiil çekimi ve cümle yapısı",
        relatedSlideId: `${unit.id}-s4`,
      },
    ],
  };
});

export const exercisesPerUnit = 10;
export const totalExerciseCounts = { A1: 120, A2: 160, B1: 180, B2: 200 } as const;
