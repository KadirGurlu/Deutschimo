import { getCurriculumContent } from "@/data/curriculum-content";
import { units } from "@/data/units";
import type { ExerciseType } from "@/types/exercise";
import type { AssessmentMetadata, AssessmentSkill, CognitiveLevel, LearningObjective } from "@/types/assessment";
import type { Unit } from "@/types/course";

function levelOf(unit: Unit): "A1" | "A2" | "B1" | "B2" {
  const value = unit.courseId.toUpperCase();
  return value === "A2" || value === "B1" || value === "B2" ? value : "A1";
}

function code(unit: Unit, skill: AssessmentSkill) {
  return `${unit.courseId.toUpperCase()}.U${String(unit.order).padStart(2, "0")}.${skill}`;
}

function objective(unit: Unit, skill: AssessmentSkill, title: string, description: string, weight: number, critical = false): LearningObjective {
  return {
    code: code(unit, skill),
    unitId: unit.id,
    level: levelOf(unit),
    skill,
    topic: skill === "GRAMMAR" ? getCurriculumContent(unit.id).grammarTitle : unit.title,
    title,
    description,
    weight,
    critical,
  };
}

export const learningObjectives: LearningObjective[] = units.flatMap((unit) => {
  const content = getCurriculumContent(unit.id);
  return [
    objective(unit, "GRAMMAR", `${content.grammarTitle} yapısını kullanır`, `${unit.title} bağlamında ${content.grammarTitle} yapısını doğru biçim ve söz dizimiyle kullanır.`, 1.25, true),
    objective(unit, "VOCABULARY", `${unit.title} kelimelerini bağlamda kullanır`, `Ünitenin temel kelime ve kalıp ifadelerini anlam, artikel, çoğul veya fiil biçimiyle tanır ve kullanır.`, 1.1, true),
    objective(unit, "COMMUNICATION", `${unit.title} iletişim görevini tamamlar`, `Seviyeye uygun günlük veya akademik durumda anlaşılır, bağlama uygun ve doğal bir karşılık üretir.`, 1.2, true),
    objective(unit, "READING", `${unit.title} metnini anlar`, `Okuma metninin ana fikrini, önemli ayrıntılarını ve bağlam içindeki kelimeleri ayırt eder.`, 1),
    objective(unit, "LISTENING", `${unit.title} dinleme metnini anlar`, `Dinleme metninde ana fikri, konuşmacı amacını ve temel ayrıntıları belirler.`, 1),
    objective(unit, "WRITING", `${unit.title} hakkında yazılı üretim yapar`, `Görevi karşılayan, seviyeye uygun kelime ve yapılar içeren düzenli bir Almanca metin oluşturur.`, 1.15),
    objective(unit, "SPEAKING", `${unit.title} hakkında sözlü üretim yapar`, `Kısa veya yapılandırılmış bir konuşmada görevi anlaşılır biçimde tamamlar.`, 1.05),
  ];
});

const objectiveMap = new Map(learningObjectives.map((item) => [item.code, item]));
const unitMap = new Map(units.map((unit) => [unit.id, unit]));

export function getLearningObjective(codeValue: string) {
  return objectiveMap.get(codeValue);
}

export function getUnitLearningObjectives(unitId: string) {
  return learningObjectives.filter((item) => item.unitId === unitId);
}

function skillForExercise(type: ExerciseType, topic?: string): AssessmentSkill {
  const normalizedTopic = topic?.toLocaleUpperCase("tr-TR") ?? "";
  if (normalizedTopic.includes("LESEN") || normalizedTopic.includes("OKU")) return "READING";
  if (normalizedTopic.includes("HÖREN") || normalizedTopic.includes("DİNLE")) return "LISTENING";
  if (normalizedTopic.includes("WÖRTER") || normalizedTopic.includes("KELİME")) return "VOCABULARY";
  if (normalizedTopic.includes("STRUKTUREN") || normalizedTopic.includes("GRAMER")) return "GRAMMAR";
  if (type === "WRITING_ASSIGNMENT" || type === "SHORT_ANSWER") return "WRITING";
  if (type === "TRANSLATION" || type === "DIALOGUE_COMPLETION") return "COMMUNICATION";
  if (type === "MATCHING") return "VOCABULARY";
  if (type === "SENTENCE_ORDERING" || type === "TRUE_FALSE" || type === "FILL_IN_THE_BLANK") return "GRAMMAR";
  return "COMMUNICATION";
}

function cognitiveLevelFor(type: ExerciseType): CognitiveLevel {
  if (type === "WRITING_ASSIGNMENT" || type === "SHORT_ANSWER") return "CREATE";
  if (type === "TRANSLATION" || type === "DIALOGUE_COMPLETION" || type === "SENTENCE_ORDERING") return "APPLY";
  if (type === "MULTIPLE_SELECT" || type === "MATCHING") return "ANALYZE";
  if (type === "TRUE_FALSE" || type === "FILL_IN_THE_BLANK") return "UNDERSTAND";
  return "REMEMBER";
}

function baseDifficulty(unit: Unit) {
  if (unit.courseId === "a1") return 1;
  if (unit.courseId === "a2") return 2;
  if (unit.courseId === "b1") return 3;
  return 4;
}

function difficultyFor(unit: Unit, type: ExerciseType, order: number): 1 | 2 | 3 | 4 | 5 {
  let value = baseDifficulty(unit);
  if (["MULTIPLE_SELECT", "TRANSLATION", "SENTENCE_ORDERING", "SHORT_ANSWER"].includes(type)) value += 1;
  if (type === "WRITING_ASSIGNMENT") value += 2;
  if (order >= 9) value += 1;
  return Math.max(1, Math.min(5, value)) as 1 | 2 | 3 | 4 | 5;
}

export function buildAssessmentMetadata(input: { unitId: string; type: ExerciseType; order: number; topic?: string }): AssessmentMetadata {
  const unit = unitMap.get(input.unitId);
  if (!unit) {
    return {
      objectiveCodes: [],
      topicTags: [input.topic ?? "Genel"],
      skill: "COMMUNICATION",
      difficulty: 1,
      cognitiveLevel: cognitiveLevelFor(input.type),
      estimatedSeconds: 45,
    };
  }
  const skill = skillForExercise(input.type, input.topic);
  const objectiveCodes = [code(unit, skill)];
  if (["READING", "LISTENING", "WRITING", "SPEAKING"].includes(skill)) objectiveCodes.push(code(unit, "COMMUNICATION"));
  const content = getCurriculumContent(unit.id);
  return {
    objectiveCodes: Array.from(new Set(objectiveCodes)),
    topicTags: Array.from(new Set([unit.title, content.grammarTitle, input.topic ?? skill])),
    skill,
    difficulty: difficultyFor(unit, input.type, input.order),
    cognitiveLevel: cognitiveLevelFor(input.type),
    estimatedSeconds: input.type === "WRITING_ASSIGNMENT" ? 900 : input.type === "SHORT_ANSWER" ? 240 : input.type === "MATCHING" ? 120 : 60,
  };
}
