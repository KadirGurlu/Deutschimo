import { courses } from "@/data/courses";
import { units } from "@/data/units";
import type { DailyPlanTask, DailyPlanTaskType, DailyStudyPlan, IntelligenceInsights, IntelligenceLevel } from "@/types/intelligence";
import type { LearningState } from "@/types/progress";
import type { OnboardingFocusSkill } from "@/types/onboarding";

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

type CandidateTask = Omit<DailyPlanTask, "minutes"> & { type: DailyPlanTaskType };

function allocateMinutes(goalMinutes: number, count: number) {
  const patterns: Record<number, number[]> = {
    1: [1],
    2: [0.6, 0.4],
    3: [0.5, 0.25, 0.25],
    4: [0.45, 0.2, 0.2, 0.15],
  };
  const weights = patterns[count] ?? patterns[4];
  const minutes = weights.map((weight) => Math.max(1, Math.floor(goalMinutes * weight)));
  let assigned = minutes.reduce((sum, value) => sum + value, 0);
  let cursor = 0;
  while (assigned < goalMinutes) {
    minutes[cursor % minutes.length] += 1;
    assigned += 1;
    cursor += 1;
  }
  while (assigned > goalMinutes) {
    const index = minutes.findIndex((value) => value > 1);
    if (index < 0) break;
    minutes[index] -= 1;
    assigned -= 1;
  }
  return minutes;
}

function focusCandidate(args: {
  planDate: string;
  focusSkills: OnboardingFocusSkill[];
  courseId: string;
  continueUnitId?: string;
}): CandidateTask {
  const { planDate, focusSkills, courseId, continueUnitId } = args;
  const primary = focusSkills[0];
  if (primary === "VOCABULARY") {
    return {
      id: `${planDate}-v32-1-focus-vocabulary`, type: "VOCABULARY", title: "Kelime önceliğini tamamla",
      description: "Kişisel planındaki kelime hedefi için artikel, anlam ve örnek cümle tekrarı yap.",
      href: "/vocabulary", priority: "MEDIUM", completed: false,
    };
  }
  if (primary === "GRAMMAR") {
    return {
      id: `${planDate}-v32-1-focus-grammar`, type: "SKILL", title: "Kısa gramer pratiği",
      description: "Bugünkü dersin gramer yapısını kısa bir uygulamayla pekiştir.",
      href: continueUnitId ? `/learn/${courseId}/${continueUnitId}/exercises` : "/skills", priority: "MEDIUM", completed: false,
      unitId: continueUnitId, courseId,
    };
  }
  if (primary === "WRITING") {
    return {
      id: `${planDate}-v32-1-focus-writing`, type: "WRITING", title: "Kısa yazma çalışması",
      description: "Kişisel planındaki yazma önceliği için kısa ve seviyene uygun bir metin üret.",
      href: "/writing-coach", priority: "MEDIUM", completed: false,
    };
  }
  const skillLabel = primary === "READING" ? "Okuma" : primary === "LISTENING" ? "Dinleme" : primary === "SPEAKING" ? "Konuşma" : "Beceri";
  return {
    id: `${planDate}-v32-1-focus-skill`, type: "SKILL", title: `${skillLabel} mini çalışması`,
    description: `Kişisel planındaki ${skillLabel.toLocaleLowerCase("tr-TR")} önceliğine uygun kısa bir görev tamamla.`,
    href: "/skills", priority: "MEDIUM", completed: false,
  };
}

export function buildDailyPlan(args: {
  planDate: string;
  goalMinutes: number;
  currentLevel: IntelligenceLevel;
  state: LearningState | null | undefined;
  insights: IntelligenceInsights;
  reviewRemaining: number;
  hasPlacement: boolean;
  selfReportedLevelReady?: boolean;
  focusSkills?: OnboardingFocusSkill[];
}): DailyStudyPlan {
  const { planDate, currentLevel, state, insights, reviewRemaining, hasPlacement } = args;
  const goalMinutes = Math.max(10, Math.min(120, Math.round(args.goalMinutes || 30)));
  const courseId = currentCourseId(currentLevel);
  const course = courses.find((item) => item.id === courseId) ?? courses[0];
  const continueUnit = findContinueUnit(state, course.id);
  const candidates: CandidateTask[] = [];
  const placementRequired = !hasPlacement && !args.selfReportedLevelReady;

  if (placementRequired) {
    candidates.push({
      id: `${planDate}-v32-1-placement`, type: "PLACEMENT", title: "Seviye belirleme sınavını tamamla",
      description: "Başlangıç seviyeni doğrula ve sonraki günlük planlarını daha isabetli hale getir.",
      href: "/placement-test", priority: "HIGH", completed: false,
    });
  }

  if (continueUnit) {
    candidates.push({
      id: `${planDate}-v32-1-lesson-${continueUnit.id}`, type: "LESSON", title: `${course.level} · ${continueUnit.title}`,
      description: "Kaldığın yerden devam et ve bugünkü ana ders bölümünü tamamla.",
      href: `/learn/${course.id}/${continueUnit.id}`, priority: "HIGH",
      completed: state?.unitProgress?.[continueUnit.id]?.status === "COMPLETED", unitId: continueUnit.id, courseId: course.id,
    });
  }

  if (reviewRemaining > 0 || insights.weakTopics.length > 0) {
    const topWeak = insights.weakTopics[0];
    candidates.push({
      id: `${planDate}-v32-1-review`, type: "REVIEW", title: "Akıllı Tekrar",
      description: topWeak
        ? `${topWeak.unitTitle} ünitesindeki ${topWeak.skill.toLocaleLowerCase("tr-TR")} alanını kısa bir tekrar ile güçlendir.`
        : `${reviewRemaining} tekrar maddesinden öncelikli olanları tamamla.`,
      href: "/smart-review", priority: "HIGH", completed: reviewRemaining === 0,
      unitId: topWeak?.unitId, courseId: topWeak?.courseId,
    });
  }

  candidates.push(focusCandidate({
    planDate,
    focusSkills: args.focusSkills?.length ? args.focusSkills : [currentLevel === "A1" || currentLevel === "A2" ? "VOCABULARY" : "SPEAKING"],
    courseId: course.id,
    continueUnitId: continueUnit?.id,
  }));

  candidates.push({
    id: `${planDate}-v32-1-quick-check`, type: "QUIZ", title: "Günlük Alıştırma",
    description: "Bugünkü kazanımı 5 kısa soruyla kontrol et.",
    href: continueUnit ? `/learn/${course.id}/${continueUnit.id}/quiz` : `/courses/${course.slug}`,
    priority: "MEDIUM", completed: Boolean(continueUnit && (state?.unitProgress?.[continueUnit.id]?.quizProgress ?? 0) >= 100),
    unitId: continueUnit?.id, courseId: course.id,
  });

  let maxTasks = goalMinutes <= 15 ? 1 : goalMinutes <= 25 ? 2 : goalMinutes < 45 ? 3 : 4;
  maxTasks = Math.min(maxTasks, candidates.length);
  const selected = candidates.slice(0, maxTasks);
  const allocations = allocateMinutes(goalMinutes, selected.length);
  const tasks: DailyPlanTask[] = selected.map((task, index) => ({ ...task, minutes: allocations[index] }));
  const completedMinutes = tasks.filter((task) => task.completed).reduce((sum, task) => sum + task.minutes, 0);
  return {
    planDate,
    goalMinutes,
    plannedMinutes: goalMinutes,
    completedMinutes,
    tasks,
    generatedAt: new Date().toISOString(),
  };
}
