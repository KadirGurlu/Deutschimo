import { courses } from "@/data/courses";
import { units } from "@/data/units";
import type { DailyPlanTask, DailyStudyPlan, IntelligenceInsights, IntelligenceLevel } from "@/types/intelligence";
import type { LearningState } from "@/types/progress";

function clampMinutes(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function currentCourseId(level: IntelligenceLevel) {
  return level.toLowerCase();
}

function findContinueUnit(state: LearningState | null | undefined, courseId: string) {
  const position = state?.learningPositions?.[courseId];
  if (position) return units.find((item) => item.id === position.unitId);
  const courseUnits = units.filter((item) => item.courseId === courseId).sort((a, b) => a.order - b.order);
  const incomplete = courseUnits.find((unit) => state?.unitProgress?.[unit.id]?.status !== "COMPLETED");
  return incomplete ?? courseUnits[0];
}

export function buildDailyPlan(args: {
  planDate: string;
  goalMinutes: number;
  currentLevel: IntelligenceLevel;
  state: LearningState | null | undefined;
  insights: IntelligenceInsights;
  reviewRemaining: number;
  hasPlacement: boolean;
}): DailyStudyPlan {
  const { planDate, currentLevel, state, insights, reviewRemaining, hasPlacement } = args;
  const goalMinutes = clampMinutes(args.goalMinutes || 30, 10, 120);
  const courseId = currentCourseId(currentLevel);
  const course = courses.find((item) => item.id === courseId) ?? courses[0];
  const continueUnit = findContinueUnit(state, course.id);
  const tasks: DailyPlanTask[] = [];

  if (!hasPlacement) {
    tasks.push({
      id: `${planDate}-placement`,
      type: "PLACEMENT",
      title: "Seviye belirleme sınavını tamamla",
      description: "24 soruluk sınavla başlangıç seviyeni ve öncelikli çalışma alanlarını belirle.",
      minutes: clampMinutes(goalMinutes * 0.35, 8, 18),
      href: "/placement-test",
      priority: "HIGH",
      completed: false,
    });
  }

  if (continueUnit) {
    tasks.push({
      id: `${planDate}-lesson-${continueUnit.id}`,
      type: "LESSON",
      title: `${continueUnit.title} dersine devam et`,
      description: `${course.level} programındaki sıradaki ders slaytlarını tamamla.`,
      minutes: clampMinutes(goalMinutes * (hasPlacement ? 0.45 : 0.35), 10, 35),
      href: `/learn/${course.id}/${continueUnit.id}`,
      priority: "HIGH",
      completed: state?.unitProgress?.[continueUnit.id]?.status === "COMPLETED",
      unitId: continueUnit.id,
      courseId: course.id,
    });
  }

  if (reviewRemaining > 0 || insights.weakTopics.length > 0) {
    const topWeak = insights.weakTopics[0];
    tasks.push({
      id: `${planDate}-review`,
      type: "REVIEW",
      title: "Akıllı tekrar oturumu",
      description: topWeak
        ? `${topWeak.unitTitle} ünitesindeki ${topWeak.skill.toLocaleLowerCase("tr-TR")} alanını güçlendir.`
        : "Daha önce yanlış yaptığın soruları kısa bir tekrar oturumunda yeniden çöz.",
      minutes: clampMinutes(goalMinutes * 0.25, 6, 18),
      href: "/smart-review",
      priority: "HIGH",
      completed: reviewRemaining === 0,
      unitId: topWeak?.unitId,
      courseId: topWeak?.courseId,
    });
  } else {
    tasks.push({
      id: `${planDate}-vocabulary`,
      type: "VOCABULARY",
      title: "Kelime tekrarını tamamla",
      description: "Bugünkü ünitenin temel kelimelerini artikel ve örnek cümleleriyle tekrar et.",
      minutes: clampMinutes(goalMinutes * 0.2, 5, 12),
      href: "/vocabulary",
      priority: "MEDIUM",
      completed: false,
    });
  }

  if (currentLevel === "B1" || currentLevel === "B2") {
    tasks.push({
      id: `${planDate}-writing`,
      type: "WRITING",
      title: "Kısa yazma çalışması",
      description: "Öğrendiğin yapı ve bağlaçları kullanarak kısa bir metin üret.",
      minutes: clampMinutes(goalMinutes * 0.2, 7, 18),
      href: "/writing",
      priority: "MEDIUM",
      completed: false,
    });
  } else {
    tasks.push({
      id: `${planDate}-quiz`,
      type: "QUIZ",
      title: "Hızlı kazanım kontrolü",
      description: "Bugün çalıştığın ünitede kısa bir değerlendirme yap.",
      minutes: clampMinutes(goalMinutes * 0.15, 5, 10),
      href: continueUnit ? `/learn/${course.id}/${continueUnit.id}/quiz` : `/courses/${course.slug}`,
      priority: "MEDIUM",
      completed: Boolean(continueUnit && (state?.unitProgress?.[continueUnit.id]?.quizProgress ?? 0) >= 100),
      unitId: continueUnit?.id,
      courseId: course.id,
    });
  }

  let plannedMinutes = tasks.reduce((sum, task) => sum + task.minutes, 0);
  if (plannedMinutes > goalMinutes) {
    let excess = plannedMinutes - goalMinutes;
    for (let index = tasks.length - 1; index >= 0 && excess > 0; index -= 1) {
      const reducible = Math.max(0, tasks[index].minutes - 5);
      const reduction = Math.min(reducible, excess);
      tasks[index].minutes -= reduction;
      excess -= reduction;
    }
    plannedMinutes = tasks.reduce((sum, task) => sum + task.minutes, 0);
  }

  const completedMinutes = tasks.filter((task) => task.completed).reduce((sum, task) => sum + task.minutes, 0);
  return {
    planDate,
    goalMinutes,
    plannedMinutes,
    completedMinutes,
    tasks,
    generatedAt: new Date().toISOString(),
  };
}
