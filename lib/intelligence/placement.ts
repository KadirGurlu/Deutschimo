import {
  placementSkillLabels,
  questionsForPlacementMode,
} from "@/data/placement-test";
import type {
  IntelligenceLevel,
  PlacementGapPlanItem,
  PlacementOverallBand,
  PlacementQuestion,
  PlacementResult,
  PlacementSkill,
  PlacementSkillBand,
  PlacementTestMode,
} from "@/types/intelligence";

const levels: IntelligenceLevel[] = ["A1", "A2", "B1", "B2"];
const skills: PlacementSkill[] = ["GRAMMAR", "VOCABULARY", "READING", "LISTENING", "WRITING", "SPEAKING"];

const skillPlanConfig: Record<PlacementSkill, Omit<PlacementGapPlanItem, "id" | "skill" | "priority">> = {
  GRAMMAR: {
    title: "Gramer temelini güçlendir",
    description: "Zayıf yapılara yönelik kısa konu anlatımı ve uyarlanabilir alıştırmalar çöz.",
    minutesPerDay: 12,
    href: "/weak-topics",
  },
  VOCABULARY: {
    title: "Kelime dağarcığını pekiştir",
    description: "Kişisel kelime setlerini bağlamlı cümleler ve Akıllı Tekrar ile çalış.",
    minutesPerDay: 10,
    href: "/vocabulary",
  },
  READING: {
    title: "Okuma stratejilerini geliştir",
    description: "Seviyene uygun kısa metinlerde ana fikir, detay ve çıkarım çalış.",
    minutesPerDay: 12,
    href: "/reading",
  },
  LISTENING: {
    title: "Dinleme hızını artır",
    description: "Normal ve yavaş hızdaki kayıtlarla ana fikir, detay ve dikte çalış.",
    minutesPerDay: 12,
    href: "/listening",
  },
  WRITING: {
    title: "Yazılı üretimi düzenle",
    description: "Mesaj, e-posta ve görüş metinlerinde görev, bağlaç ve cümle yapısı çalış.",
    minutesPerDay: 15,
    href: "/writing",
  },
  SPEAKING: {
    title: "Konuşma üretimini artır",
    description: "Kısa rol görevleriyle sesli yanıt ver, kaydını dinle ve yeniden söyle.",
    minutesPerDay: 15,
    href: "/speaking",
  },
};

function clamp(value: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, Math.round(value)));
}

function normalizeText(value: string): string {
  return value
    .toLocaleLowerCase("de-DE")
    .replace(/[„“”"'’.,!?;:()[\]{}]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function words(value: string): string[] {
  return normalizeText(value).split(" ").filter(Boolean);
}

function scoreConstructedResponse(question: PlacementQuestion, answer: string): number {
  const answerWords = words(answer);
  if (!answerWords.length) return 0;

  const minimum = Math.max(1, question.minWords ?? 20);
  const target = Math.max(minimum, Math.round(((question.minWords ?? minimum) + (question.maxWords ?? minimum * 2)) / 2));
  const wordCountScore = clamp((answerWords.length / target) * 40, 0, 40);

  const normalized = normalizeText(answer);
  const keywordList = question.keywords ?? [];
  const matchedKeywords = keywordList.filter((keyword) => normalized.includes(normalizeText(keyword))).length;
  const keywordScore = keywordList.length ? clamp((matchedKeywords / Math.min(keywordList.length, 5)) * 25, 0, 25) : 15;

  const sentenceCount = answer.split(/[.!?]+/).map((item) => item.trim()).filter(Boolean).length;
  const sentenceScore = clamp((sentenceCount / (question.skill === "WRITING" ? 5 : 4)) * 15, 0, 15);

  const connectors = ["und", "aber", "weil", "deshalb", "außerdem", "obwohl", "wenn", "dass", "zuerst", "dann", "zum schluss"];
  const connectorCount = connectors.filter((connector) => normalized.includes(connector)).length;
  const connectorScore = clamp((connectorCount / 3) * 10, 0, 10);

  const uniqueWords = new Set(answerWords).size;
  const diversity = answerWords.length ? uniqueWords / answerWords.length : 0;
  const diversityScore = clamp(diversity * 14, 0, 10);

  const minimumPenalty = answerWords.length < minimum
    ? clamp(((minimum - answerWords.length) / minimum) * 35, 0, 35)
    : 0;

  return clamp(wordCountScore + keywordScore + sentenceScore + connectorScore + diversityScore - minimumPenalty);
}

function scoreQuestion(question: PlacementQuestion, answer: string | undefined): number {
  if (!answer) return 0;
  if (question.kind === "WRITING" || question.kind === "SPEAKING") {
    return scoreConstructedResponse(question, answer);
  }
  return answer === question.correctAnswer ? 100 : 0;
}

function toSkillBand(score: number): PlacementSkillBand {
  if (score < 32) return "A1";
  if (score < 44) return "A1+";
  if (score < 57) return "A2";
  if (score < 69) return "A2+";
  if (score < 80) return "B1";
  if (score < 90) return "B1+";
  return "B2";
}

function toOverallBand(score: number): PlacementOverallBand {
  if (score < 24) return "A1.1";
  if (score < 36) return "A1.2";
  if (score < 49) return "A2.1";
  if (score < 61) return "A2.2";
  if (score < 72) return "B1.1";
  if (score < 82) return "B1.2";
  if (score < 91) return "B2.1";
  return "B2.2";
}

function courseLevelForBand(band: PlacementOverallBand): IntelligenceLevel {
  if (band.startsWith("B2")) return "B2";
  if (band.startsWith("B1")) return "B1";
  if (band.startsWith("A2")) return "A2";
  return "A1";
}

function buildGapPlan(
  skillScores: Record<PlacementSkill, number>,
  measuredSkills: PlacementSkill[],
): PlacementGapPlanItem[] {
  return measuredSkills
    .map((skill) => ({ skill, score: skillScores[skill] }))
    .sort((a, b) => a.score - b.score)
    .slice(0, 4)
    .map(({ skill, score }, index) => ({
      id: `placement-plan-${skill.toLocaleLowerCase("en-US")}`,
      skill,
      ...skillPlanConfig[skill],
      priority: index < 2 || score < 45 ? "HIGH" : index === 2 ? "MEDIUM" : "LOW",
    }));
}

export function evaluatePlacement(args: {
  mode: PlacementTestMode;
  answers: Record<string, string>;
  durationSeconds?: number;
}): PlacementResult {
  const questions = questionsForPlacementMode(args.mode);
  const levelPoints = Object.fromEntries(levels.map((level) => [level, { points: 0, total: 0 }])) as Record<IntelligenceLevel, { points: number; total: number }>;
  const skillPoints = Object.fromEntries(skills.map((skill) => [skill, { points: 0, total: 0 }])) as Record<PlacementSkill, { points: number; total: number }>;
  const topicPoints = new Map<string, { points: number; total: number }>();

  let objectiveCorrect = 0;
  let objectiveCount = 0;

  for (const question of questions) {
    const score = scoreQuestion(question, args.answers[question.id]);
    levelPoints[question.level].points += score;
    levelPoints[question.level].total += 100;
    skillPoints[question.skill].points += score;
    skillPoints[question.skill].total += 100;

    const topic = topicPoints.get(question.topic) ?? { points: 0, total: 0 };
    topic.points += score;
    topic.total += 100;
    topicPoints.set(question.topic, topic);

    if (question.kind === "MULTIPLE_CHOICE" || question.kind === "LISTENING") {
      objectiveCount += 1;
      if (score === 100) objectiveCorrect += 1;
    }
  }

  const levelScores = Object.fromEntries(levels.map((level) => {
    const stat = levelPoints[level];
    return [level, stat.total ? clamp((stat.points / stat.total) * 100) : 0];
  })) as Record<IntelligenceLevel, number>;

  const skillScores = Object.fromEntries(skills.map((skill) => {
    const stat = skillPoints[skill];
    return [skill, stat.total ? clamp((stat.points / stat.total) * 100) : 0];
  })) as Record<PlacementSkill, number>;

  const measuredSkills = skills.filter((skill) => skillPoints[skill].total > 0);
  const averageSkillScore = measuredSkills.length
    ? measuredSkills.reduce((sum, skill) => sum + skillScores[skill], 0) / measuredSkills.length
    : 0;
  const weakestSkillScore = measuredSkills.length
    ? Math.min(...measuredSkills.map((skill) => skillScores[skill]))
    : 0;

  const totalScore = clamp(args.mode === "DETAILED"
    ? averageSkillScore * 0.72 + weakestSkillScore * 0.28
    : averageSkillScore);
  const overallBand = toOverallBand(totalScore);
  const recommendedLevel = courseLevelForBand(overallBand);

  const skillLevels = Object.fromEntries(skills.map((skill) => [skill, toSkillBand(skillScores[skill])])) as Record<PlacementSkill, PlacementSkillBand>;
  const rankedSkills = measuredSkills
    .map((skill) => ({ skill, score: skillScores[skill] }))
    .sort((a, b) => b.score - a.score);
  const rankedTopics = [...topicPoints.entries()]
    .map(([topic, stat]) => ({ topic, score: stat.total ? clamp((stat.points / stat.total) * 100) : 0 }))
    .sort((a, b) => b.score - a.score);

  const strengths = [
    ...rankedSkills.filter((item) => item.score >= 72).slice(0, 3).map((item) => placementSkillLabels[item.skill]),
    ...rankedTopics.filter((item) => item.score >= 85).slice(0, 2).map((item) => item.topic),
  ].filter((item, index, list) => list.indexOf(item) === index);

  const weakTopics = [
    ...rankedSkills.filter((item) => item.score < 58).reverse().slice(0, 4).map((item) => placementSkillLabels[item.skill]),
    ...rankedTopics.filter((item) => item.score < 50).reverse().slice(0, 3).map((item) => item.topic),
  ].filter((item, index, list) => list.indexOf(item) === index);

  const answeredCount = questions.filter((question) => Boolean(args.answers[question.id]?.trim())).length;
  const completionRatio = questions.length ? answeredCount / questions.length : 0;
  const confidenceScore = clamp((args.mode === "DETAILED" ? 82 : 62) + completionRatio * (args.mode === "DETAILED" ? 16 : 18));

  return {
    mode: args.mode,
    recommendedLevel,
    overallBand,
    totalScore,
    correctCount: objectiveCorrect,
    questionCount: questions.length,
    levelScores,
    skillScores,
    skillLevels,
    strengths,
    weakTopics,
    studyPlan: buildGapPlan(skillScores, measuredSkills),
    confidenceScore,
    durationSeconds: Math.max(0, Math.round(args.durationSeconds ?? 0)),
    completedAt: new Date().toISOString(),
  };
}

export function requiredPlacementQuestionIds(mode: PlacementTestMode): string[] {
  return questionsForPlacementMode(mode).map((question) => question.id);
}
