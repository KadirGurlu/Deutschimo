import { NextResponse } from "next/server";

import { verifyMobileBearer } from "@/lib/auth/mobile-bearer";
import { prisma } from "@/lib/db";

import {
  getCourseBySlug,
  getUnitById,
  getUnitExercises,
} from "@/lib/services/course-service";

import type { Exercise } from "@/types/exercise";

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

function toMobileExercise(
  exercise: Exercise,
) {
  return {
    id: exercise.id,
    unitId: exercise.unitId,
    groupId: exercise.groupId,

    order: exercise.order,
    type: exercise.type,

    title: exercise.title,
    prompt: exercise.prompt,

    options:
      exercise.options ?? [],

    pairs:
      exercise.pairs ?? [],

    tokens:
      exercise.tokens ?? [],

    relatedLessonId:
      exercise.relatedSlideId ?? null,

    isRequired:
      exercise.isRequired,

    maxAttempts:
      exercise.maxAttempts,

    points:
      exercise.points,

    minWords:
      exercise.minWords ?? null,

    maxWords:
      exercise.maxWords ?? null,
  };
}

export async function GET(
  request: Request,
  {
    params,
  }: {
    params: Promise<{
      courseId: string;
      unitId: string;
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
    unitId: unitIdentifier,
  } = await params;

  const normalizedCourseId =
    courseIdentifier.trim();

  const normalizedUnitId =
    unitIdentifier.trim();

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

  if (!normalizedUnitId) {
    return jsonResponse(
      {
        ok: false,
        error: "INVALID_UNIT",
        message:
          "Geçerli bir ünite bilgisi gereklidir.",
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
        message: "Kurs bulunamadı.",
      },
      404,
    );
  }

  const unit =
    await getUnitById(
      normalizedUnitId,
    );

  if (
    !unit ||
    unit.courseId !== course.id ||
    unit.status !== "PUBLISHED"
  ) {
    return jsonResponse(
      {
        ok: false,
        error: "UNIT_NOT_FOUND",
        message: "Ünite bulunamadı.",
      },
      404,
    );
  }

  /*
   * Kullanıcı prerequisite üniteyi
   * tamamlamadıysa alıştırmaları
   * doğrudan API üzerinden de açamaz.
   */
  if (unit.prerequisiteUnitId) {
    const prerequisiteProgress =
      await prisma.userUnitProgress.findFirst(
        {
          where: {
            userId:
              verification.user.id,

            unitId:
              unit.prerequisiteUnitId,
          },

          select: {
            status: true,
            totalProgress: true,
          },
        },
      );

    const prerequisiteCompleted =
      prerequisiteProgress?.status ===
        "COMPLETED" ||
      (
        prerequisiteProgress
          ?.totalProgress ?? 0
      ) >= 100;

    if (!prerequisiteCompleted) {
      return jsonResponse(
        {
          ok: false,
          error: "UNIT_LOCKED",
          message:
            "Bu ünite henüz erişime açık değil.",
        },
        403,
      );
    }
  }

  /*
   * Aynı kaynak web tarafında da
   * kullanılmaktadır:
   *
   * Content Studio QUESTION kayıtları
   * varsa onlar;
   * yoksa data/exercises fallback'i.
   */
  const exercises =
    await getUnitExercises(unit.id);

  const mobileExercises =
    exercises.map(
      toMobileExercise,
    );

  const totalPoints =
    exercises.reduce(
      (total, exercise) =>
        total + exercise.points,
      0,
    );

  const requiredExerciseCount =
    exercises.filter(
      (exercise) =>
        exercise.isRequired,
    ).length;

  return jsonResponse(
    {
      ok: true,

      course: {
        id: course.id,
        slug: course.slug,
        level: course.level,
        title: course.title,
      },

      unit: {
        id: unit.id,
        slug: unit.slug,
        order: unit.order,
        title: unit.title,
        description:
          unit.description,

        estimatedMinutes:
          unit.estimatedMinutes,
      },

      summary: {
        exerciseCount:
          exercises.length,

        requiredExerciseCount,

        totalPoints,
      },

      exercises:
        mobileExercises,
    },
    200,
  );
}