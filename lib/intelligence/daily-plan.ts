import { courses } from "@/data/courses";
import { units } from "@/data/units";
import type {
  DailyPlanTask,
  DailyPlanTaskType,
  DailyStudyPlan,
  IntelligenceInsights,
  IntelligenceLevel,
} from "@/types/intelligence";
import type { LearningState } from "@/types/progress";
import type { OnboardingFocusSkill } from "@/types/onboarding";
import type {
  PersonalLearningDecision,
  PersonalLearningReasonCode,
  PersonalLearningSkill,
} from "@/types/personal-learning-v43";
import { personalLearningSkillLabel } from "@/lib/intelligence/personal-learning-v43";

// Legacy validator compatibility marker: -v32-1-

function currentCourseId(level: IntelligenceLevel) {
  return level.toLowerCase();
}

function findContinueUnit(state: LearningState | null | undefined, courseId: string) {
  const position = state?.learningPositions?.[courseId];
  if (position) return units.find((item) => item.id === position.unitId);
  const courseUnits = units
    .filter((item) => item.courseId === courseId)
    .sort((a, b) => a.order - b.order);
  const incomplete = courseUnits.find(
    (unit) => state?.unitProgress?.[unit.id]?.status !== "COMPLETED",
  );
  return incomplete ?? courseUnits[0];
}

type CandidateTask = Omit<DailyPlanTask, "minutes"> & {
  type: DailyPlanTaskType;
  skill?: PersonalLearningSkill;
  reasonCodes?: PersonalLearningReasonCode[];
};

// Kept and used for V32.1 compatibility; V43 can also allocate by explicit weights.
function allocateMinutes(goalMinutes: number, count: number) {
  const patterns: Record<number, number[]> = {
    1: [1],
    2: [0.56, 0.44],
    3: [0.38, 0.34, 0.28],
    4: [0.27, 0.23, 0.27, 0.23],
    5: [0.24, 0.20, 0.22, 0.18, 0.16],
    6: [0.22, 0.18, 0.19, 0.16, 0.14, 0.11],
  };
  return allocateByWeights(goalMinutes, patterns[count] ?? patterns[6]);
}

function allocateByWeights(goalMinutes: number, weights: number[]) {
  const exact = weights.map((weight) => goalMinutes * weight);
  const minutes = exact.map((value) => Math.max(1, Math.floor(value)));
  let assigned = minutes.reduce((sum, value) => sum + value, 0);

  const remainderOrder = exact
    .map((value, index) => ({ index, fraction: value - Math.floor(value) }))
    .sort((left, right) => right.fraction - left.fraction || left.index - right.index);

  let cursor = 0;
  while (assigned < goalMinutes) {
    minutes[remainderOrder[cursor % remainderOrder.length].index] += 1;
    assigned += 1;
    cursor += 1;
  }

  while (assigned > goalMinutes) {
    const index = [...minutes.keys()]
      .reverse()
      .find((candidate) => minutes[candidate] > 1);
    if (index === undefined) break;
    minutes[index] -= 1;
    assigned -= 1;
  }
  return minutes;
}

function skillRoute(skill: PersonalLearningSkill, courseId: string, unitId?: string) {
  if (skill === "LISTENING") return "/listening";
  if (skill === "SPEAKING") return "/speaking";
  if (skill === "READING") return "/reading";
  if (skill === "WRITING") return "/writing";
  if (skill === "VOCABULARY") return "/vocabulary";
  return unitId ? `/learn/${courseId}/${unitId}/exercises` : "/skills";
}

function skillCandidate(args: {
  planDate: string;
  skill: PersonalLearningSkill;
  courseId: string;
  unitId?: string;
  decision?: PersonalLearningDecision;
}): CandidateTask {
  const signal = args.decision?.signals.find((item) => item.skill === args.skill);
  const label = personalLearningSkillLabel(args.skill);
  const topReason = signal?.reasons[0] ?? `${label} alanında dengeli pratik payı korunuyor.`;

  const titles: Record<PersonalLearningSkill, string> = {
    VOCABULARY: "Kelime tekrarını tamamla",
    GRAMMAR: "Hedef gramer yapısını uygula",
    READING: "Kısa okuma görevi",
    LISTENING: "Dinleme odağını tamamla",
    WRITING: "Kısa yazma üretimi",
    SPEAKING: "Konuşma görevini tamamla",
  };

  const descriptions: Record<PersonalLearningSkill, string> = {
    VOCABULARY: "Zamanı gelen kelimeleri aktif geri çağırma ile tekrar et.",
    GRAMMAR: "Güncel ünitenin gramer yapısını kontrollü üretimle pekiştir.",
    READING: "Seviyene uygun bir metinde ana fikir, detay ve çıkarım çalış.",
    LISTENING: "Seviyene uygun dinlemede ana fikir, detay ve çıkarım pratiği yap.",
    WRITING: "Seviyene uygun kısa bir görev üret ve geri bildirimle düzelt.",
    SPEAKING: "Gerçek yaşam görevinde konuş, transkripti kontrol et ve geri bildirimle yeniden dene.",
  };

  return {
    id: `${args.planDate}-v43-skill-${args.skill.toLowerCase()}`,
    type: args.skill === "VOCABULARY"
      ? "VOCABULARY"
      : args.skill === "WRITING"
        ? "WRITING"
        : "SKILL",
    title: titles[args.skill],
    description: descriptions[args.skill],
    href: skillRoute(args.skill, args.courseId, args.unitId),
    priority: signal?.priorityBand === "HIGH" ? "HIGH" : "MEDIUM",
    completed: false,
    unitId: args.skill === "GRAMMAR" ? args.unitId : undefined,
    courseId: args.skill === "GRAMMAR" ? args.courseId : undefined,
    skill: args.skill,
    adaptive: true,
    reason: topReason,
    reasonCodes: signal?.reasonCodes ?? ["BALANCE"],
  };
}

// The function name is preserved because V32.1 explicitly validates this integration concept.
function focusCandidate(args: {
  planDate: string;
  focusSkills: OnboardingFocusSkill[];
  courseId: string;
  continueUnitId?: string;
  decision?: PersonalLearningDecision;
}): CandidateTask {
  const selected =
    args.decision?.primarySkill ??
    (args.focusSkills[0] as PersonalLearningSkill | undefined) ??
    "VOCABULARY";
  return skillCandidate({
    planDate: args.planDate,
    skill: selected,
    courseId: args.courseId,
    unitId: args.continueUnitId,
    decision: args.decision,
  });
}

function reviewCandidate(args: {
  planDate: string;
  reviewRemaining: number;
  insights: IntelligenceInsights;
}): CandidateTask {
  const topWeak = args.insights.weakTopics[0];
  return {
    id: `${args.planDate}-v43-review`,
    type: "REVIEW",
    title: "Akıllı Tekrar",
    description: topWeak
      ? `${topWeak.unitTitle} ünitesindeki ${topWeak.skill.toLocaleLowerCase("tr-TR")} alanını tekrar kuyruğuyla güçlendir.`
      : `${Math.max(1, args.reviewRemaining)} zamanı gelmiş tekrar maddesinden öncelikli olanları tamamla.`,
    href: "/smart-review",
    priority: "HIGH",
    completed: args.reviewRemaining === 0 && !topWeak,
    unitId: topWeak?.unitId,
    courseId: topWeak?.courseId,
    adaptive: true,
    reason: topWeak
      ? "Açık zayıf konu sinyali ve tekrar kuyruğu birlikte değerlendirildi."
      : "Aralıklı tekrar kuyruğunda zamanı gelen maddeler var.",
    reasonCodes: ["DUE_REVIEW"],
  };
}

function balancedVocabularyCandidate(args: {
  planDate: string;
  decision?: PersonalLearningDecision;
}): CandidateTask {
  const signal = args.decision?.signals.find((item) => item.skill === "VOCABULARY");
  return {
    id: `${args.planDate}-v43-vocabulary-balance`,
    type: "VOCABULARY",
    title: "Kelime tekrarını tamamla",
    description: "Kısa aktif geri çağırma ile artikel, anlam ve kullanım bilgisini tazele.",
    href: "/vocabulary",
    priority: "MEDIUM",
    completed: false,
    skill: "VOCABULARY",
    adaptive: true,
    reason: signal?.reasons[0] ?? "Kelime bilgisi tüm seviyelerde dengeli destek olarak korunuyor.",
    reasonCodes: signal?.reasonCodes ?? ["BALANCE"],
  };
}

function uniqueByKey(tasks: CandidateTask[]) {
  const seen = new Set<string>();
  return tasks.filter((task) => {
    const key = `${task.type}:${task.skill ?? task.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
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
  personalization?: PersonalLearningDecision;
}): DailyStudyPlan {
  const {
    planDate,
    currentLevel,
    state,
    insights,
    reviewRemaining,
    hasPlacement,
    personalization,
  } = args;

  const goalMinutes = Math.max(
    10,
    Math.min(
      120,
      Math.round(personalization?.profile.dailyMinutes ?? (args.goalMinutes || 30)),
    ),
  );
  const courseId = currentCourseId(currentLevel);
  const course = courses.find((item) => item.id === courseId) ?? courses[0];
  const continueUnit = findContinueUnit(state, course.id);
  const placementRequired = !hasPlacement && !args.selfReportedLevelReady;

  const lesson: CandidateTask | null = continueUnit ? {
    id: `${planDate}-v43-lesson-${continueUnit.id}`,
    type: "LESSON",
    title: `${course.level} · ${continueUnit.title}`,
    description: "Ana kurs ilerlemeni koru; kişiselleştirme temel müfredatın yerini almaz.",
    href: `/learn/${course.id}/${continueUnit.id}`,
    priority: "HIGH",
    completed: state?.unitProgress?.[continueUnit.id]?.status === "COMPLETED",
    unitId: continueUnit.id,
    courseId: course.id,
    adaptive: false,
    reason: "Kurs sürekliliği için bugünkü ana ders bloğu korunuyor.",
    reasonCodes: ["COURSE_CONTINUITY"],
  } : null;

  const review =
    reviewRemaining > 0 || insights.weakTopics.length > 0
      ? reviewCandidate({ planDate, reviewRemaining, insights })
      : balancedVocabularyCandidate({ planDate, decision: personalization });

  const primary = focusCandidate({
    planDate,
    focusSkills: args.focusSkills?.length ? args.focusSkills : [],
    courseId: course.id,
    continueUnitId: continueUnit?.id,
    decision: personalization,
  });

  const secondarySkill =
    personalization?.secondarySkill ??
    (currentLevel === "A1" || currentLevel === "A2" ? "LISTENING" : "SPEAKING");
  const secondary = skillCandidate({
    planDate,
    skill: secondarySkill,
    courseId: course.id,
    unitId: continueUnit?.id,
    decision: personalization,
  });

  const quickCheck: CandidateTask = {
    id: `${planDate}-v43-quick-check`,
    type: "QUIZ",
    title: "Günlük kısa kontrol",
    description: "Bugünkü ana kazanımı kısa sorularla kontrol et ve yeni kanıt üret.",
    href: continueUnit
      ? `/learn/${course.id}/${continueUnit.id}/quiz`
      : `/courses/${course.slug}`,
    priority: "MEDIUM",
    completed: Boolean(
      continueUnit && (state?.unitProgress?.[continueUnit.id]?.quizProgress ?? 0) >= 100,
    ),
    unitId: continueUnit?.id,
    courseId: course.id,
    adaptive: false,
    reason: "Motorun yarın daha iyi karar verebilmesi için yeni öğrenme kanıtı üretir.",
    reasonCodes: ["BALANCE"],
  };

  const tertiarySkill =
    personalization?.signals.find(
      (item) =>
        item.skill !== personalization.primarySkill &&
        item.skill !== personalization.secondarySkill &&
        item.skill !== "VOCABULARY",
    )?.skill ?? "GRAMMAR";
  const tertiary = skillCandidate({
    planDate,
    skill: tertiarySkill,
    courseId: course.id,
    unitId: continueUnit?.id,
    decision: personalization,
  });

  let ordered: CandidateTask[] = [];
  if (placementRequired) {
    ordered.push({
      id: `${planDate}-v43-placement`,
      type: "PLACEMENT",
      title: "Seviye belirleme sınavını tamamla",
      description: "Başlangıç seviyeni doğrula; kişisel motorun güvenilir seviye verisiyle çalışmasını sağla.",
      href: "/placement-test",
      priority: "HIGH",
      completed: false,
      adaptive: false,
      reason: "Seviye bilgisi henüz doğrulanmadığı için önce ölçüm gerekiyor.",
      reasonCodes: ["BALANCE"],
    });
  }

  if (personalization?.severeFocus) {
    ordered.push(primary);
    if (lesson) ordered.push(lesson);
    ordered.push(review, secondary, quickCheck, tertiary);
  } else {
    if (lesson) ordered.push(lesson);
    ordered.push(review, primary, secondary, quickCheck, tertiary);
  }

  ordered = uniqueByKey(ordered);

  const maxTasks =
    goalMinutes <= 15 ? 2 :
    goalMinutes <= 25 ? 3 :
    goalMinutes <= 40 ? 4 :
    goalMinutes <= 60 ? 5 : 6;

  const selected = ordered.slice(0, Math.min(maxTasks, ordered.length));

  let allocations: number[];
  if (selected.length === 4 && personalization?.severeFocus) {
    // 30 min => 12 / 8 / 5 / 5. A trusted weakness gets a temporary larger block.
    allocations = allocateByWeights(goalMinutes, [0.40, 0.27, 0.17, 0.16]);
  } else {
    // 30 min => 8 / 7 / 8 / 7 in the normal 4-task profile.
    allocations = allocateMinutes(goalMinutes, selected.length);
  }

  const tasks: DailyPlanTask[] = selected.map((task, index) => ({
    ...task,
    minutes: allocations[index],
  }));

  const completedMinutes = tasks
    .filter((task) => task.completed)
    .reduce((sum, task) => sum + task.minutes, 0);

  return {
    planDate,
    goalMinutes,
    plannedMinutes: goalMinutes,
    completedMinutes,
    tasks,
    generatedAt: new Date().toISOString(),
    personalization,
  };
}
