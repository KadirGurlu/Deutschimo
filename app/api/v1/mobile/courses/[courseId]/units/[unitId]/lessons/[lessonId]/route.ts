import { NextResponse } from "next/server";

import { verifyMobileBearer } from "@/lib/auth/mobile-bearer";
import { prisma } from "@/lib/db";

import {
  getCourseBySlug,
  getUnitById,
  getUnitSlides,
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

function stringArray(
  value: unknown,
): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (item): item is string =>
      typeof item === "string",
  );
}

export async function GET(
  request: Request,
  {
    params,
  }: {
    params: Promise<{
      courseId: string;
      unitId: string;
      lessonId: string;
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
    lessonId: lessonIdentifier,
  } = await params;

  const normalizedCourseId =
    courseIdentifier.trim();

  const normalizedUnitId =
    unitIdentifier.trim();

  const normalizedLessonId =
    lessonIdentifier.trim();

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

  if (!normalizedLessonId) {
    return jsonResponse(
      {
        ok: false,
        error: "INVALID_LESSON",
        message:
          "Geçerli bir ders bilgisi gereklidir.",
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
   * Ünite erişim kontrolü:
   * Kullanıcı prerequisite üniteyi
   * tamamlamadıysa ders içeriğine
   * doğrudan URL/API ile de erişemez.
   */
  const progressUnitIds = [
    unit.id,
    unit.prerequisiteUnitId,
  ].filter(
    (value): value is string =>
      Boolean(value),
  );

  const progressRows =
    await prisma.userUnitProgress.findMany({
      where: {
        userId: verification.user.id,
        unitId: {
          in: progressUnitIds,
        },
      },

      select: {
        unitId: true,
        status: true,
        totalProgress: true,
        completedSlideIds: true,
      },
    });

  const progressByUnitId =
    new Map(
      progressRows.map(
        (progress) => [
          progress.unitId,
          progress,
        ],
      ),
    );

  const currentProgress =
    progressByUnitId.get(unit.id);

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

  /*
   * getUnitSlides mevcut Content Studio /
   * fallback verilerinden yayınlanmış
   * dersleri ve gerçek contentBlocks
   * içeriklerini getirir.
   */
  const lessons =
    await getUnitSlides(unit.id);

  const lessonIndex =
    lessons.findIndex(
      (lesson) =>
        lesson.id ===
        normalizedLessonId,
    );

  if (lessonIndex === -1) {
    return jsonResponse(
      {
        ok: false,
        error: "LESSON_NOT_FOUND",
        message: "Ders bulunamadı.",
      },
      404,
    );
  }

  const lesson =
    lessons[lessonIndex];

  const previousLesson =
    lessonIndex > 0
      ? lessons[lessonIndex - 1]
      : null;

  const nextLesson =
    lessonIndex <
    lessons.length - 1
      ? lessons[lessonIndex + 1]
      : null;

  const completedSlideIds =
    new Set(
      stringArray(
        currentProgress
          ?.completedSlideIds,
      ),
    );

  const isCompleted =
    completedSlideIds.has(
      lesson.id,
    );

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

      lesson: {
        id: lesson.id,
        unitId: lesson.unitId,

        order: lesson.order,
        title: lesson.title,

        estimatedMinutes:
          lesson.estimatedMinutes,

        isRequired:
          lesson.isRequired,

        completionRule:
          lesson.completionRule,

        minimumViewSeconds:
          lesson.minimumViewSeconds ??
          null,

        previousLessonId:
          lesson.previousSlideId ??
          previousLesson?.id ??
          null,

        nextLessonId:
          lesson.nextSlideId ??
          nextLesson?.id ??
          null,

        isCompleted,

        contentBlockCount:
          lesson.contentBlocks.length,

        contentBlocks:
          lesson.contentBlocks,
      },
    },
    200,
  );
}