import { NextResponse } from "next/server";

import {
  verifyMobileBearer,
} from "@/lib/auth/mobile-bearer";
import { prisma } from "@/lib/db";
import {
  getCourses,
  getCourseUnits,
} from "@/lib/services/course-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonResponse(
  body: unknown,
  status = 200,
) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

function clampProgress(
  value: number,
) {
  return Math.max(
    0,
    Math.min(100, Math.round(value)),
  );
}

function getLatestDate(
  dates: Array<Date | null>,
) {
  const validDates = dates.filter(
    (date): date is Date => Boolean(date),
  );

  if (validDates.length === 0) {
    return null;
  }

  return new Date(
    Math.max(
      ...validDates.map((date) =>
        date.getTime(),
      ),
    ),
  );
}

export async function GET(
  request: Request,
) {
  const verification =
    await verifyMobileBearer(request);

  if (!verification.ok) {
    if (
      verification.reason ===
        "ACCOUNT_UNAVAILABLE" ||
      verification.reason ===
        "EMAIL_VERIFICATION_REQUIRED"
    ) {
      return jsonResponse(
        {
          ok: false,
          error: verification.reason,
          message:
            verification.reason ===
            "EMAIL_VERIFICATION_REQUIRED"
              ? "E-posta doğrulaması gereklidir."
              : "Bu hesapla şu anda işlem yapılamıyor.",
        },
        403,
      );
    }

    if (
      verification.reason ===
      "ACCESS_TOKEN_EXPIRED"
    ) {
      return jsonResponse(
        {
          ok: false,
          error: "ACCESS_TOKEN_EXPIRED",
          message:
            "Access token süresi dolmuş.",
        },
        401,
      );
    }

    return jsonResponse(
      {
        ok: false,
        error: "UNAUTHORIZED",
        message:
          "Geçerli bir mobil oturum gereklidir.",
      },
      401,
    );
  }

  const userId =
    verification.user.id;

  const [
    courses,
    progressRows,
    enrollments,
  ] = await Promise.all([
    getCourses(),

    prisma.userUnitProgress.findMany({
      where: {
        userId,
      },
      select: {
        courseId: true,
        unitId: true,
        status: true,
        totalProgress: true,
        lastVisitedAt: true,
        completedAt: true,
      },
    }),

    prisma.enrollment.findMany({
      where: {
        userId,
      },
      select: {
        courseId: true,
        status: true,
        enrolledAt: true,
        completedAt: true,
      },
    }),
  ]);

  const unitLists =
    await Promise.all(
      courses.map((course) =>
        getCourseUnits(course.id),
      ),
    );

  const responseCourses =
    courses.map((course, index) => {
      const courseUnits =
        unitLists[index] ?? [];

      const publishedUnitIds =
        new Set(
          courseUnits.map(
            (unit) => unit.id,
          ),
        );

      const courseProgress =
        progressRows.filter(
          (progress) =>
            progress.courseId ===
              course.id ||
            publishedUnitIds.has(
              progress.unitId,
            ),
        );

      const progressByUnitId =
        new Map(
          courseProgress.map(
            (progress) => [
              progress.unitId,
              progress,
            ],
          ),
        );

      const unitCount =
        courseUnits.length ||
        course.unitCount;

      const totalProgress =
        unitCount > 0
          ? courseUnits.length > 0
            ? courseUnits.reduce(
                (sum, unit) =>
                  sum +
                  (
                    progressByUnitId.get(
                      unit.id,
                    )?.totalProgress ??
                    0
                  ),
                0,
              ) / unitCount
            : courseProgress.length > 0
              ? courseProgress.reduce(
                  (sum, progress) =>
                    sum +
                    progress.totalProgress,
                  0,
                ) /
                Math.max(
                  unitCount,
                  courseProgress.length,
                )
              : 0
          : 0;

      const completedUnitCount =
        courseUnits.length > 0
          ? courseUnits.filter(
              (unit) => {
                const progress =
                  progressByUnitId.get(
                    unit.id,
                  );

                return (
                  progress?.status ===
                    "COMPLETED" ||
                  (
                    progress?.totalProgress ??
                    0
                  ) >= 100
                );
              },
            ).length
          : courseProgress.filter(
              (progress) =>
                progress.status ===
                  "COMPLETED" ||
                progress.totalProgress >=
                  100,
            ).length;

      const nextUnit =
        courseUnits.find(
          (unit) => {
            const progress =
              progressByUnitId.get(
                unit.id,
              );

            return (
              !progress ||
              progress.totalProgress < 100
            );
          },
        ) ?? null;

      const nextUnitProgress =
        nextUnit
          ? progressByUnitId.get(
              nextUnit.id,
            )
          : null;

      const enrollment =
        enrollments.find(
          (item) =>
            item.courseId ===
            course.id,
        );

      const lastVisitedAt =
        getLatestDate(
          courseProgress.map(
            (progress) =>
              progress.lastVisitedAt,
          ),
        );

      return {
        id: course.id,
        slug: course.slug,
        level: course.level,
        title: course.title,
        description:
          course.description,
        estimatedHours:
          course.estimatedHours,
        unitCount,
        completedUnitCount,
        progress:
          clampProgress(
            totalProgress,
          ),

        enrollment: enrollment
          ? {
              status:
                enrollment.status,
              enrolledAt:
                enrollment.enrolledAt
                  .toISOString(),
              completedAt:
                enrollment.completedAt
                  ?.toISOString() ??
                null,
            }
          : null,

        nextUnit: nextUnit
          ? {
              id: nextUnit.id,
              slug: nextUnit.slug,
              order: nextUnit.order,
              title: nextUnit.title,
              description:
                nextUnit.description,
              estimatedMinutes:
                nextUnit
                  .estimatedMinutes,
              progress:
                clampProgress(
                  nextUnitProgress
                    ?.totalProgress ??
                    0,
                ),
            }
          : null,

        lastVisitedAt:
          lastVisitedAt
            ?.toISOString() ??
          null,

        isCurrentLevel:
          course.level ===
          verification.user
            .currentLevel,

        isTargetLevel:
          course.level ===
          verification.user
            .targetLevel,
      };
    });

  return jsonResponse(
    {
      ok: true,

      learner: {
        currentLevel:
          verification.user
            .currentLevel,
        targetLevel:
          verification.user
            .targetLevel,
        dailyGoalMinutes:
          verification.user
            .dailyGoalMinutes,
      },

      summary: {
        courseCount:
          responseCourses.length,

        totalUnitCount:
          responseCourses.reduce(
            (sum, course) =>
              sum +
              course.unitCount,
            0,
          ),

        completedUnitCount:
          responseCourses.reduce(
            (sum, course) =>
              sum +
              course.completedUnitCount,
            0,
          ),
      },

      courses: responseCourses,
    },
    200,
  );
}