import { DashboardPageClient } from "@/components/dashboard/dashboard-page-client";
import { requireOnboardedUser } from "@/lib/auth/authorization";
import { prisma } from "@/lib/db";
import { onboardingFocusSkills, type OnboardingFocusSkill } from "@/types/onboarding";

const focusSkillSet = new Set<string>(onboardingFocusSkills);

export default async function DashboardPage() {
  const { user } = await requireOnboardedUser();
  const profile = await prisma.learnerOnboardingProfile.findUnique({
    where: { userId: user.id },
    select: { studyDaysPerWeek: true, focusSkills: true },
  });
  const focusSkills = Array.isArray(profile?.focusSkills)
    ? profile.focusSkills.filter((item): item is OnboardingFocusSkill => typeof item === "string" && focusSkillSet.has(item))
    : [];
  return <DashboardPageClient weeklyTargetDays={profile?.studyDaysPerWeek ?? 5} focusSkills={focusSkills}/>;
}
