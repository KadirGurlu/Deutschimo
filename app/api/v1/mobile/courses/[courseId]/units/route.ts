import { NextResponse } from "next/server";

import {
  verifyMobileBearer,
} from "@/lib/auth/mobile-bearer";
import { prisma } from "@/lib/db";
import {
  getCourseBySlug,
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
    Math.min(
      100,
      Math.round(value),
    ),
  );
}

export async function GET(
  request: Request,
  {
    params,
  }: {
    params: Promise<{
      courseId: string;
    }>;
  },
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
          error:
            verification.reason,
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
          error:
            "ACCESS_TOKEN_EXPIRED",
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

  const {
    courseId: courseIdentifier,
  } = await params;

  const normalizedCourseId =
    courseIdentifier.trim();

  if (!normalizedCourseId) {
    return jsonResponse(
      {
        ok: false,
        error: "INVALID_COURSE",
        message:
          "Geçerli bir kurs bilgisi gereklidir.",
      },
      400,
    );
  }

  const course =
    await getCourseBySlug(
      normalizedCourseId,
    );

  if (
    !course ||
    course.status !== "PUBLISHED"
  ) {
    return jsonResponse(
      {
        ok: false,
        error: "COURSE_NOT_FOUND",
        message:
          "Kurs bulunamadı.",
      },
      404,
    );
  }

  const units =
    await getCourseUnits(course.id);

  const unitIds =
    units.map((unit) => unit.id);

  const progressRows =
    unitIds.length > 0
      ? await prisma.userUnitProgress.findMany({
          where: {
            userId:
              verification.user.id,
            unitId: {
              in: unitIds,
            },
          },
          select: {
            unitId: true,
            status: true,
            stage: true,
            lessonProgress: true,
            exerciseProgress: true,
            quizProgress: true,
            totalProgress: true,
            bestQuizScore: true,
            startedAt: true,
            completedAt: true,
            lastVisitedAt: true,
          },
        })
      : [];

  const progressByUnitId =
    new Map(
      progressRows.map(
        (progress) => [
          progress.unitId,
          progress,
        ],
      ),
    );

  const responseUnits =
    units.map(
      (unit) => {
        const progress =
          progressByUnitId.get(
            unit.id,
          );

        const prerequisiteProgress =
          unit.prerequisiteUnitId
            ? progressByUnitId.get(
                unit.prerequisiteUnitId,
              )
            : null;

        const prerequisiteCompleted =
          !unit.prerequisiteUnitId ||
          prerequisiteProgress?.status ===
            "COMPLETED" ||
          (
            prerequisiteProgress
              ?.totalProgress ?? 0
          ) >= 100;

        return {
          id: unit.id,
          slug: unit.slug,
          courseId:
            unit.courseId,
          order: unit.order,
          title: unit.title,
          description:
            unit.description,
          estimatedMinutes:
            unit.estimatedMinutes,

          prerequisiteUnitId:
            unit.prerequisiteUnitId ??
            null,

          isLocked:
            !prerequisiteCompleted,

          progress: {
            status:
              progress?.status ??
              "NOT_STARTED",

            stage:
              progress?.stage ??
              "LESSON",

            lesson:
              clampProgress(
                progress
                  ?.lessonProgress ??
                  0,
              ),

            exercises:
              clampProgress(
                progress
                  ?.exerciseProgress ??
                  0,
              ),

            quiz:
              clampProgress(
                progress
                  ?.quizProgress ??
                  0,
              ),

            total:
              clampProgress(
                progress
                  ?.totalProgress ??
                  0,
              ),

            bestQuizScore:
              progress
                ?.bestQuizScore ??
              null,

            startedAt:
              progress
                ?.startedAt
                ?.toISOString() ??
              null,

            completedAt:
              progress
                ?.completedAt
                ?.toISOString() ??
              null,

            lastVisitedAt:
              progress
                ?.lastVisitedAt
                ?.toISOString() ??
              null,
          },
        };
      },
    );

  const completedUnitCount =
    responseUnits.filter(
      (unit) =>
        unit.progress.status ===
          "COMPLETED" ||
        unit.progress.total >= 100,
    ).length;

  const courseProgress =
    responseUnits.length > 0
      ? clampProgress(
          responseUnits.reduce(
            (sum, unit) =>
              sum +
              unit.progress.total,
            0,
          ) /
            responseUnits.length,
        )
      : 0;

  return jsonResponse(
    {
      ok: true,

      course: {
        id: course.id,
        slug: course.slug,
        level: course.level,
        title: course.title,
        description:
          course.description,
        estimatedHours:
          course.estimatedHours,

        unitCount:
          responseUnits.length,

        completedUnitCount,

        progress:
          courseProgress,
      },

      units:
        responseUnits,
    },
    200,
  );
}