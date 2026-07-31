import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth/authorization";
import { getOrCreateDailyPlan, getOrRefreshReviewState, latestPlacement, refreshInsights } from "@/lib/intelligence/server";

export async function GET(request: Request) {
  const user = await getApiUser();
  if (!user) return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });
  const url = new URL(request.url);
  const date = url.searchParams.get("date") && /^\d{4}-\d{2}-\d{2}$/.test(url.searchParams.get("date")!) ? url.searchParams.get("date")! : new Date().toISOString().slice(0, 10);
  const [placement, insights, review, dailyPlan] = await Promise.all([
    latestPlacement(user.id),
    refreshInsights(user.id),
    getOrRefreshReviewState(user.id),
    getOrCreateDailyPlan({ userId: user.id, planDate: date, goalMinutes: user.dailyGoalMinutes, currentLevel: user.currentLevel }),
  ]);
  return NextResponse.json({
    overview: {
      placement,
      insights,
      review: { total: review.queue.length, completed: review.completedIds.length, remaining: review.queue.length - review.completedIds.length },
      dailyPlan,
    },
  });
}
