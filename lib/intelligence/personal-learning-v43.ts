import type { LearningGoal, OnboardingFocusSkill } from "@/types/onboarding";
import {
  PERSONAL_LEARNING_SKILLS,
  type PersonalLearningDecision,
  type PersonalLearningRawSignal,
  type PersonalLearningReasonCode,
  type PersonalLearningSignal,
  type PersonalLearningSkill,
} from "@/types/personal-learning-v43";
import type { IntelligenceLevel } from "@/types/intelligence";

const clamp = (value: number, min = 0, max = 100) =>
  Math.max(min, Math.min(max, value));

const skillLabels: Record<PersonalLearningSkill, string> = {
  VOCABULARY: "Kelime",
  GRAMMAR: "Gramer",
  READING: "Okuma",
  LISTENING: "Dinleme",
  WRITING: "Yazma",
  SPEAKING: "Konuşma",
};

const goalLabels: Record<LearningGoal, string> = {
  GERMANY_LIFE: "Almanya'da yaşamak",
  UNIVERSITY: "Üniversite",
  WORK: "İş hayatı",
  DAILY_GERMAN: "Günlük Almanca",
  TESTDAF: "TestDaF",
  TELC: "TELC",
  GOETHE: "Goethe",
  IMPROVE: "Almancamı geliştirmek",
};

const goalBoosts: Record<LearningGoal, Partial<Record<PersonalLearningSkill, number>>> = {
  GERMANY_LIFE: { SPEAKING: 15, LISTENING: 13, VOCABULARY: 9, GRAMMAR: 5, READING: 3, WRITING: 3 },
  UNIVERSITY: { READING: 14, WRITING: 13, LISTENING: 9, VOCABULARY: 6, GRAMMAR: 7, SPEAKING: 5 },
  WORK: { SPEAKING: 13, WRITING: 11, LISTENING: 10, VOCABULARY: 7, READING: 5, GRAMMAR: 5 },
  DAILY_GERMAN: { SPEAKING: 14, LISTENING: 14, VOCABULARY: 9, GRAMMAR: 5, READING: 4, WRITING: 4 },
  TESTDAF: { READING: 13, WRITING: 13, LISTENING: 11, GRAMMAR: 8, VOCABULARY: 7, SPEAKING: 8 },
  TELC: { SPEAKING: 12, LISTENING: 12, WRITING: 10, READING: 9, VOCABULARY: 7, GRAMMAR: 7 },
  GOETHE: { READING: 10, LISTENING: 10, WRITING: 10, SPEAKING: 10, VOCABULARY: 7, GRAMMAR: 7 },
  IMPROVE: { VOCABULARY: 5, GRAMMAR: 5, READING: 5, LISTENING: 5, WRITING: 5, SPEAKING: 5 },
};

function rounded(value: number) {
  return Math.round(value * 10) / 10;
}

function scoreSignal(args: {
  raw: PersonalLearningRawSignal;
  focusSkills: OnboardingFocusSkill[];
  learningGoal: LearningGoal | null;
}): PersonalLearningSignal {
  const raw = args.raw;
  const reasons: string[] = [];
  const reasonCodes: PersonalLearningReasonCode[] = [];
  let score = 32;

  const focusIndex = args.focusSkills.indexOf(raw.skill as OnboardingFocusSkill);
  if (focusIndex >= 0) {
    const boost = focusIndex === 0 ? 18 : Math.max(8, 14 - focusIndex * 2);
    score += boost;
    reasonCodes.push("ONBOARDING_FOCUS");
    reasons.push(`Onboarding'de ${skillLabels[raw.skill].toLocaleLowerCase("tr-TR")} gelişim alanı olarak seçildi.`);
  }

  if (args.learningGoal) {
    const boost = goalBoosts[args.learningGoal][raw.skill] ?? 0;
    if (boost > 0) {
      score += boost;
      reasonCodes.push("LEARNING_GOAL");
      reasons.push(`${goalLabels[args.learningGoal]} hedefi bu beceriyi destekliyor.`);
    }
  }

  const masteryScore = raw.masteryScore ?? null;
  const masteryConfidence = clamp(Number(raw.masteryConfidence ?? 0), 0, 1);
  const evidenceCount = Math.max(0, Math.round(raw.evidenceCount ?? 0));

  if (masteryScore !== null) {
    // Confidence damping prevents one weak piece of evidence from dominating a day.
    const confidenceFactor = 0.35 + masteryConfidence * 0.65;
    const masteryBoost = ((100 - clamp(masteryScore)) / 100) * 26 * confidenceFactor;
    score += masteryBoost;
    if (masteryScore < 70) {
      reasonCodes.push("LOW_MASTERY");
      reasons.push(`${skillLabels[raw.skill]} ustalık puanı %${Math.round(masteryScore)}; plan telafi payı ayırıyor.`);
    }
  } else {
    // Cold-start: modest exploration, never pretend this is a measured weakness.
    score += 4;
    reasonCodes.push("BALANCE");
    reasons.push(`${skillLabels[raw.skill]} için henüz yeterli ustalık kanıtı yok; dengeli keşif payı korunuyor.`);
  }

  const recentAttempts = Math.max(0, Math.round(raw.recentAttempts ?? 0));
  const recentAverage = raw.recentAverage ?? null;
  if (recentAverage !== null && recentAttempts > 0) {
    const reliability = recentAttempts >= 3 ? 1 : recentAttempts === 2 ? 0.65 : 0.25;
    const recentBoost = Math.max(0, 72 - clamp(recentAverage)) * 0.38 * reliability;
    score += recentBoost;
    if (recentAverage < 68) {
      reasonCodes.push("RECENT_LOW_SCORE");
      reasons.push(`Son ${recentAttempts} ${skillLabels[raw.skill].toLocaleLowerCase("tr-TR")} çalışmasının ortalaması %${Math.round(recentAverage)}.`);
    }
  }

  const openErrorCount = Math.max(0, Math.round(raw.openErrorCount ?? 0));
  if (openErrorCount > 0) {
    score += Math.min(14, openErrorCount * 2.4);
    reasonCodes.push("OPEN_ERRORS");
    reasons.push(`${openErrorCount} açık hata sinyali bu becerinin önceliğini artırıyor.`);
  }

  const dueReviewCount = Math.max(0, Math.round(raw.dueReviewCount ?? 0));
  if (dueReviewCount > 0) {
    score += Math.min(12, dueReviewCount * 1.6);
    reasonCodes.push("DUE_REVIEW");
    reasons.push(`${dueReviewCount} zamanı gelmiş tekrar sinyali var.`);
  }

  const daysSincePractice = raw.daysSincePractice ?? null;
  if (daysSincePractice !== null && daysSincePractice >= 7) {
    score += Math.min(8, (daysSincePractice - 5) * 0.7);
    reasonCodes.push("LONG_GAP");
    reasons.push(`${skillLabels[raw.skill]} alanında son kanıttan beri ${Math.round(daysSincePractice)} gün geçti.`);
  }

  const finalScore = rounded(clamp(score));
  const priorityBand =
    finalScore >= 67 ? "HIGH" :
    finalScore >= 50 ? "MEDIUM" : "BALANCED";

  return {
    skill: raw.skill,
    priorityScore: finalScore,
    priorityBand,
    masteryScore,
    masteryConfidence: rounded(masteryConfidence),
    evidenceCount,
    recentAverage,
    recentAttempts,
    openErrorCount,
    dueReviewCount,
    daysSincePractice,
    reasons: reasons.slice(0, 4),
    reasonCodes: [...new Set(reasonCodes)],
  };
}

export function buildPersonalLearningDecision(args: {
  level: IntelligenceLevel;
  learningGoal: LearningGoal | null;
  dailyMinutes: number;
  studyDaysPerWeek: number;
  focusSkills: OnboardingFocusSkill[];
  rawSignals: PersonalLearningRawSignal[];
}): PersonalLearningDecision {
  const signalMap = new Map(args.rawSignals.map((item) => [item.skill, item]));
  const signals = PERSONAL_LEARNING_SKILLS
    .map((skill) => scoreSignal({
      raw: signalMap.get(skill) ?? { skill },
      focusSkills: args.focusSkills,
      learningGoal: args.learningGoal,
    }))
    .sort((left, right) =>
      right.priorityScore - left.priorityScore ||
      PERSONAL_LEARNING_SKILLS.indexOf(left.skill) - PERSONAL_LEARNING_SKILLS.indexOf(right.skill),
    );

  const evidenceSkills = signals.filter((item) =>
    item.evidenceCount >= 2 ||
    item.recentAttempts >= 2 ||
    item.openErrorCount >= 1 ||
    item.dueReviewCount >= 1,
  ).length;
  const dataCoverage = Math.round((evidenceSkills / PERSONAL_LEARNING_SKILLS.length) * 100);
  const mode = dataCoverage >= 50 ? "ADAPTIVE" : "PROFILE_LED";

  const primary = signals[0];
  const secondary = signals[1] ?? signals[0];

  // A severe focus needs repeated/reliable evidence; a single weak result is intentionally insufficient.
  const severeFocus = Boolean(
    (primary.masteryScore !== null && primary.masteryScore < 58 && primary.masteryConfidence >= 0.35) ||
    (primary.recentAverage !== null && primary.recentAverage < 58 && primary.recentAttempts >= 2) ||
    primary.openErrorCount >= 3 ||
    primary.dueReviewCount >= 6
  );

  const dailyMinutes = Math.max(10, Math.min(120, Math.round(args.dailyMinutes || 30)));
  const studyDaysPerWeek = Math.max(1, Math.min(7, Math.round(args.studyDaysPerWeek || 5)));
  const focusLabels = args.focusSkills.map((skill) => skillLabels[skill as PersonalLearningSkill]);

  const reasons = [
    mode === "ADAPTIVE"
      ? `Plan ${dataCoverage}% beceri kanıtı kapsamıyla performansa göre uyarlanıyor.`
      : `Henüz veri kapsamı %${dataCoverage}; plan profil tercihlerini öne alıyor ve sahte kesinlik üretmiyor.`,
    `${skillLabels[primary.skill]} bugün birinci öncelik (${primary.priorityScore}/100).`,
    `${skillLabels[secondary.skill]} ikinci öncelik (${secondary.priorityScore}/100).`,
    severeFocus
      ? `${skillLabels[primary.skill]} için güvenilir zayıflık/tekrar sinyali var; dakika payı geçici olarak yükseltilecek.`
      : "Tek bir düşük sonuç plana aşırı yön vermiyor; ders, tekrar ve iki beceri dengesi korunuyor.",
  ];

  return {
    version: "V43",
    mode,
    dataCoverage,
    profile: {
      level: args.level,
      learningGoal: args.learningGoal,
      goalLabel: args.learningGoal ? goalLabels[args.learningGoal] : "Genel Almanca",
      dailyMinutes,
      studyDaysPerWeek,
      weeklyMinutes: dailyMinutes * studyDaysPerWeek,
      focusSkills: args.focusSkills,
      focusLabels,
    },
    primarySkill: primary.skill,
    secondarySkill: secondary.skill,
    severeFocus,
    signals,
    reasons,
    generatedAt: new Date().toISOString(),
  };
}

export const personalLearningSkillLabel = (skill: PersonalLearningSkill) => skillLabels[skill];
