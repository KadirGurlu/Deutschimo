import { units } from "@/data/units";
import type { Exercise, ExerciseOption, ExerciseType, UnitQuiz } from "@/types/exercise";

const option = (id: string, label: string): ExerciseOption => ({ id, label, value: label });

function exerciseTypes(courseId: string): ExerciseType[] {
  if (courseId === "b1" || courseId === "b2") {
    return ["MULTIPLE_CHOICE", "MULTIPLE_SELECT", "TRUE_FALSE", "FILL_IN_THE_BLANK", "MATCHING", "SENTENCE_ORDERING", "SHORT_ANSWER", "WRITING_ASSIGNMENT"];
  }
  return ["MULTIPLE_CHOICE", "MULTIPLE_SELECT", "TRUE_FALSE", "FILL_IN_THE_BLANK", "MATCHING", "SENTENCE_ORDERING", "TRANSLATION", "DIALOGUE_COMPLETION"];
}

function createExercise(unitId: string, courseId: string, order: number, type: ExerciseType): Exercise {
  const id = `${unitId}-e${order}`;
  const common = {
    id,
    unitId,
    groupId: `${unitId}-practice`,
    order,
    type,
    title: `Alıştırma ${order}`,
    prompt: "Bu alana soru metni gelecek.",
    explanation: "Bu alana doğru cevabın kısa açıklaması ve ilgili ders slaydına yönlendirme bilgisi gelecek.",
    relatedSlideId: `${unitId}-s${Math.min(order, 6)}`,
    isRequired: true,
    maxAttempts: 2,
    points: 10,
  } as const;

  switch (type) {
    case "MULTIPLE_CHOICE":
      return { ...common, options: [option("a", "Seçenek A"), option("b", "Seçenek B"), option("c", "Seçenek C")], correctAnswer: "Seçenek B" };
    case "MULTIPLE_SELECT":
      return { ...common, prompt: "İki doğru seçeneği işaretle.", options: [option("a", "Seçenek A"), option("b", "Seçenek B"), option("c", "Seçenek C")], correctAnswer: ["Seçenek A", "Seçenek C"] };
    case "TRUE_FALSE":
      return { ...common, prompt: "Verilen açıklama doğru mu, yanlış mı?", correctAnswer: true };
    case "FILL_IN_THE_BLANK":
      return { ...common, prompt: "Boşluğu uygun ifadeyle tamamla: ____", correctAnswer: "örnek cevap", acceptedAnswers: ["örnek cevap", "ornek cevap"] };
    case "MATCHING":
      return { ...common, prompt: "Sol ve sağ sütundaki alanları eşleştir.", pairs: [{ left: "Öğe 1", right: "Eş 1" }, { left: "Öğe 2", right: "Eş 2" }, { left: "Öğe 3", right: "Eş 3" }], correctAnswer: ["Öğe 1:Eş 1", "Öğe 2:Eş 2", "Öğe 3:Eş 3"] };
    case "SENTENCE_ORDERING":
      return { ...common, prompt: "Parçaları doğru sıraya koy.", tokens: ["Parça 1", "Parça 2", "Parça 3", "Parça 4"], correctAnswer: "Parça 1 Parça 2 Parça 3 Parça 4" };
    case "TRANSLATION":
      return { ...common, prompt: "Bu alandaki kısa ifadeyi hedef dile çevir.", correctAnswer: "örnek çeviri", acceptedAnswers: ["örnek çeviri", "ornek ceviri"] };
    case "DIALOGUE_COMPLETION":
      return { ...common, prompt: "Diyalogdaki eksik bölümü tamamla.", options: [option("a", "Yanıt A"), option("b", "Yanıt B"), option("c", "Yanıt C")], correctAnswer: "Yanıt B" };
    case "SHORT_ANSWER":
      return { ...common, prompt: "Soruyu 1-2 cümleyle cevapla.", correctAnswer: "öğretmen değerlendirmesi", acceptedAnswers: [] };
    case "WRITING_ASSIGNMENT":
      return { ...common, prompt: "Verilen göreve uygun kısa bir metin yaz.", correctAnswer: "öğretmen değerlendirmesi", minWords: courseId === "b2" ? 120 : 80, maxWords: courseId === "b2" ? 180 : 130 };
  }
}

export const exercises: Exercise[] = units.flatMap((unit) =>
  exerciseTypes(unit.courseId).map((type, index) => createExercise(unit.id, unit.courseId, index + 1, type)),
);

export const quizzes: UnitQuiz[] = units.map((unit) => ({
  id: `${unit.id}-quiz`,
  unitId: unit.id,
  title: `${unit.title} · Ünite Sonu Değerlendirmesi`,
  minimumScore: unit.completionRules.minimumQuizScore,
  maxAttempts: 3,
  showAnswersAfterSubmit: true,
  questions: Array.from({ length: 5 }, (_, index) => ({
    id: `${unit.id}-q${index + 1}`,
    type: index === 3 ? "TRUE_FALSE" : index === 4 ? "FILL_IN_THE_BLANK" : "MULTIPLE_CHOICE",
    prompt: `Ünite sonu soru metni ${index + 1}`,
    options: index < 3 ? [option("a", "Seçenek A"), option("b", "Seçenek B"), option("c", "Seçenek C")] : undefined,
    correctAnswer: index === 3 ? true : index === 4 ? "örnek cevap" : "Seçenek B",
    topic: `Konu alanı ${index + 1}`,
    relatedSlideId: `${unit.id}-s${Math.min(index + 1, 6)}`,
  })),
}));

export const exercisesPerUnit = 8;
export const totalExerciseCounts = { A1: 96, A2: 128, B1: 144, B2: 160 } as const;
