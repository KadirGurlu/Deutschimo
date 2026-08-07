import { Level, Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth/authorization";
import { prisma } from "@/lib/db";
import { buildOnboardingPlan } from "@/lib/onboarding/plan";
import { withApiMonitoring } from "@/lib/security/api-monitor";
import { learningGoals, onboardingFocusSkills, onboardingLevelChoices, type LearningGoal, type OnboardingFocusSkill, type OnboardingLevelChoice } from "@/types/onboarding";

const allowedDailyMinutes = new Set([10, 20, 30, 45, 60]);
const allowedDays = new Set([3, 4, 5, 6, 7]);
const levelChoiceSet = new Set<string>(onboardingLevelChoices);
const learningGoalSet = new Set<string>(learningGoals);
const focusSkillSet = new Set<string>(onboardingFocusSkills);

function asJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}
function levelChoice(value: unknown): OnboardingLevelChoice | undefined {
  return typeof value === "string" && levelChoiceSet.has(value) ? value as OnboardingLevelChoice : undefined;
}
function learningGoal(value: unknown): LearningGoal | undefined {
  return typeof value === "string" && learningGoalSet.has(value) ? value as LearningGoal : undefined;
}
function focusSkills(value: unknown): OnboardingFocusSkill[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const normalized = [...new Set(value.filter((item): item is string => typeof item === "string" && focusSkillSet.has(item)))] as OnboardingFocusSkill[];
  return normalized.length ? normalized : undefined;
}
async function latestPlacement(userId: string) {
  return prisma.placementAssessment.findFirst({
    where: { userId },
    orderBy: { completedAt: "desc" },
    select: { recommendedLevel: true, overallBand: true, completedAt: true },
  });
}

async function GETHandler() {
  const user = await getApiUser();
  if (!user) return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });
  const [profile, placement] = await Promise.all([
    prisma.learnerOnboardingProfile.findUnique({ where: { userId: user.id } }),
    latestPlacement(user.id),
  ]);
  const skills = Array.isArray(profile?.focusSkills) ? profile.focusSkills.filter((item): item is string => typeof item === "string") : [];
  return NextResponse.json({
    completed: Boolean(user.onboardingCompleted),
    profile: profile ? {
      levelChoice: profile.levelChoice ?? undefined,
      learningGoal: profile.learningGoal ?? undefined,
      dailyMinutes: profile.dailyMinutes ?? undefined,
      studyDaysPerWeek: profile.studyDaysPerWeek ?? undefined,
      focusSkills: skills,
    } : null,
    latestPlacement: placement ? {
      recommendedLevel: placement.recommendedLevel,
      overallBand: placement.overallBand ?? undefined,
      completedAt: placement.completedAt.toISOString(),
    } : null,
  });
}

async function POSTHandler(request: Request) {
  const user = await getApiUser();
  if (!user) return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });
  let body: Record<string, unknown>;
  try { body = await request.json() as Record<string, unknown>; }
  catch { return NextResponse.json({ error: "Geçersiz istek gövdesi." }, { status: 400 }); }

  const action = body.action === "complete" ? "complete" : "draft";
  const selectedLevel = levelChoice(body.levelChoice);
  const selectedGoal = learningGoal(body.learningGoal);
  const selectedDaily = Number(body.dailyMinutes);
  const selectedDays = Number(body.studyDaysPerWeek);
  const selectedSkills = focusSkills(body.focusSkills);

  if (action === "draft") {
    const draft = {
      ...(selectedLevel ? { levelChoice: selectedLevel } : {}),
      ...(selectedGoal ? { learningGoal: selectedGoal } : {}),
      ...(allowedDailyMinutes.has(selectedDaily) ? { dailyMinutes: selectedDaily } : {}),
      ...(allowedDays.has(selectedDays) ? { studyDaysPerWeek: selectedDays } : {}),
      ...(selectedSkills ? { focusSkills: asJson(selectedSkills) } : {}),
    };
    await prisma.learnerOnboardingProfile.upsert({
      where: { userId: user.id },
      create: { userId: user.id, ...draft },
      update: draft,
    });
    return NextResponse.json({ ok: true });
  }

  if (!selectedLevel) return NextResponse.json({ error: "Almanca seviyeni seç." }, { status: 400 });
  if (!selectedGoal) return NextResponse.json({ error: "Öğrenme amacını seç." }, { status: 400 });
  if (!allowedDailyMinutes.has(selectedDaily)) return NextResponse.json({ error: "Geçerli bir günlük çalışma süresi seç." }, { status: 400 });
  if (!allowedDays.has(selectedDays)) return NextResponse.json({ error: "Geçerli bir haftalık çalışma günü seç." }, { status: 400 });
  if (!selectedSkills?.length) return NextResponse.json({ error: "En az bir beceri seç." }, { status: 400 });

  const placement = await latestPlacement(user.id);
  if (selectedLevel === "UNSURE" && !placement) {
    return NextResponse.json({ error: "Planı tamamlamak için önce seviye testini bitir.", code: "PLACEMENT_REQUIRED" }, { status: 409 });
  }
  const plan = buildOnboardingPlan({
    levelChoice: selectedLevel,
    learningGoal: selectedGoal,
    dailyMinutes: selectedDaily,
    studyDaysPerWeek: selectedDays,
    focusSkills: selectedSkills,
    placementLevel: placement?.recommendedLevel ?? null,
  });

  await prisma.$transaction(async (tx) => {
    await tx.learnerOnboardingProfile.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        levelChoice: selectedLevel,
        learningGoal: selectedGoal,
        dailyMinutes: selectedDaily,
        studyDaysPerWeek: selectedDays,
        focusSkills: asJson(selectedSkills),
        resolvedLevel: plan.level as Level,
        estimatedCompletionWeeks: plan.estimatedCompletionWeeks,
        planSummary: asJson(plan),
        completedAt: new Date(),
      },
      update: {
        levelChoice: selectedLevel,
        learningGoal: selectedGoal,
        dailyMinutes: selectedDaily,
        studyDaysPerWeek: selectedDays,
        focusSkills: asJson(selectedSkills),
        resolvedLevel: plan.level as Level,
        estimatedCompletionWeeks: plan.estimatedCompletionWeeks,
        planSummary: asJson(plan),
        completedAt: new Date(),
      },
    });
    await tx.user.update({
      where: { id: user.id },
      data: { currentLevel: plan.level as Level, dailyGoalMinutes: selectedDaily, onboardingCompleted: true },
    });
    await tx.dailyStudyPlan.deleteMany({ where: { userId: user.id } });
    await tx.auditLog.create({
      data: {
        actorUserId: user.id,
        actorEmail: user.email ?? undefined,
        action: "ONBOARDING_COMPLETED",
        entityType: "LearnerOnboardingProfile",
        entityId: user.id,
        summary: `V32 onboarding tamamlandı: ${plan.level}, ${selectedDaily} dk x ${selectedDays} gün`,
        after: asJson(plan),
      },
    });
  });
  return NextResponse.json({ ok: true, plan });
}

export const GET = withApiMonitoring("/api/onboarding", GETHandler);
export const POST = withApiMonitoring("/api/onboarding", POSTHandler, { maxBodyBytes: 32 * 1024 });
