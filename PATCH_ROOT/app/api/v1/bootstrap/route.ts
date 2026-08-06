import { getPlatformApiUser } from "@/lib/platform/auth";
import { prisma } from "@/lib/db";
import { DEUTSCHIMO_API_VERSION, DEUTSCHIMO_PLATFORM_VERSION } from "@/lib/platform/contracts";
import { enforceUserRateLimit } from "@/lib/platform/rate-limit";
import { apiFailure, apiSuccess } from "@/lib/platform/response";
import { clientCompatibility } from "@/lib/platform/version";
import { withApiMonitoring } from "@/lib/security/api-monitor";

export const runtime = "nodejs";

async function GETHandler(request: Request) {
  const auth = await getPlatformApiUser(request);
  if (!auth) return apiFailure(request, 401, "UNAUTHORIZED", "Oturum gerekli.");
  const { user } = auth;

  const limited = await enforceUserRateLimit(request, {
    scope: "v31-bootstrap",
    userId: user.id,
    limit: 60,
    windowSeconds: 60,
  });
  if (limited) return limited;

  const [enrollmentCount, realGermany, writingCoach, smartReview] = await Promise.all([
    prisma.enrollment.count({ where: { userId: user.id } }),
    prisma.realGermanyScenarioProgress.groupBy({
      by: ["status"],
      where: { userId: user.id },
      _count: { _all: true },
    }),
    prisma.writingCoachSession.findFirst({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      select: { latestScore: true, scoreImprovement: true, updatedAt: true },
    }),
    prisma.smartReviewState.findUnique({
      where: { userId: user.id },
      select: { updatedAt: true },
    }),
  ]);

  const realGermanySummary = Object.fromEntries(realGermany.map((item) => [item.status, item._count._all]));

  return apiSuccess(request, {
    api: {
      version: DEUTSCHIMO_API_VERSION,
      platformVersion: DEUTSCHIMO_PLATFORM_VERSION,
      compatibility: clientCompatibility(),
    },
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      firstName: user.firstName,
      lastName: user.lastName,
      image: user.image,
      role: user.role,
      currentLevel: user.currentLevel,
      targetLevel: user.targetLevel,
      dailyGoalMinutes: user.dailyGoalMinutes,
    },
    capabilities: {
      courses: true,
      smartReview: true,
      placementTest: true,
      writingCoach: true,
      realGermany: true,
      deviceRegistration: true,
      idempotentMutations: true,
      offlineSync: false,
      pushNotifications: false,
      mobileAuthentication: false,
      currentAuthenticationMode: auth.authMode,
    },
    summary: {
      enrollmentCount,
      realGermany: {
        notStarted: Number(realGermanySummary.NOT_STARTED ?? 0),
        inProgress: Number(realGermanySummary.IN_PROGRESS ?? 0),
        completed: Number(realGermanySummary.COMPLETED ?? 0),
      },
      writingCoach: writingCoach ? {
        latestScore: writingCoach.latestScore,
        scoreImprovement: writingCoach.scoreImprovement,
        updatedAt: writingCoach.updatedAt.toISOString(),
      } : null,
      smartReviewUpdatedAt: smartReview?.updatedAt.toISOString() ?? null,
    },
  });
}

export const GET = withApiMonitoring("/api/v1/bootstrap", GETHandler);
