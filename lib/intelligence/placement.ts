import { placementQuestions } from "@/data/placement-test";
import type { IntelligenceLevel, PlacementResult } from "@/types/intelligence";

const levels: IntelligenceLevel[] = ["A1", "A2", "B1", "B2"];

export function evaluatePlacement(answers: Record<string, string>): PlacementResult {
  const levelStats = Object.fromEntries(levels.map((level) => [level, { correct: 0, total: 0 }])) as Record<IntelligenceLevel, { correct: number; total: number }>;
  const topicStats = new Map<string, { correct: number; total: number }>();
  let correctCount = 0;

  for (const question of placementQuestions) {
    const isCorrect = answers[question.id] === question.correctAnswer;
    levelStats[question.level].total += 1;
    if (isCorrect) {
      correctCount += 1;
      levelStats[question.level].correct += 1;
    }
    const topic = topicStats.get(question.topic) ?? { correct: 0, total: 0 };
    topic.total += 1;
    if (isCorrect) topic.correct += 1;
    topicStats.set(question.topic, topic);
  }

  const levelScores = Object.fromEntries(levels.map((level) => {
    const stat = levelStats[level];
    return [level, stat.total ? Math.round((stat.correct / stat.total) * 100) : 0];
  })) as Record<IntelligenceLevel, number>;

  let recommendedLevel: IntelligenceLevel = "A1";
  if (levelScores.A1 >= 67) recommendedLevel = "A2";
  if (levelScores.A1 >= 67 && levelScores.A2 >= 67) recommendedLevel = "B1";
  if (levelScores.A1 >= 67 && levelScores.A2 >= 67 && levelScores.B1 >= 60) recommendedLevel = "B2";

  const rankedTopics = [...topicStats.entries()].map(([topic, stat]) => ({
    topic,
    score: stat.total ? Math.round((stat.correct / stat.total) * 100) : 0,
  }));

  const strengths = rankedTopics
    .filter((item) => item.score >= 80)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map((item) => item.topic);

  const weakTopics = rankedTopics
    .filter((item) => item.score < 60)
    .sort((a, b) => a.score - b.score)
    .slice(0, 5)
    .map((item) => item.topic);

  return {
    recommendedLevel,
    totalScore: Math.round((correctCount / placementQuestions.length) * 100),
    correctCount,
    questionCount: placementQuestions.length,
    levelScores,
    strengths,
    weakTopics,
    completedAt: new Date().toISOString(),
  };
}
