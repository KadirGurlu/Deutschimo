import { redirect } from "next/navigation";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { requireUser } from "@/lib/auth/authorization";

export default async function OnboardingPage() {
  const { user } = await requireUser();
  if (user.onboardingCompleted) redirect("/dashboard");
  return <OnboardingWizard firstName={user.firstName ?? user.name?.split(" ")[0] ?? "Öğrenci"} />;
}
