import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth/authorization";
import { getPersonalLearningDecisionForUser } from "@/lib/intelligence/personal-learning-server-v43";
import { withApiMonitoring } from "@/lib/security/api-monitor";

async function GETHandler() {
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });
  }

  const decision = await getPersonalLearningDecisionForUser({
    userId: user.id,
    currentLevel: user.currentLevel,
    fallbackDailyMinutes: user.dailyGoalMinutes,
  });

  return NextResponse.json({ decision });
}

export const GET = withApiMonitoring(
  "/api/intelligence/personal-learning",
  GETHandler,
);
