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

function clampProgress(value: number) {
  return Math.max(
    0,
    Math.min(100, Math.round(value)),
  );
}

function stringArray(value: unknown): string[] {
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
        message:
          "Kurs bulunamadı.",
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
        message:
          "Ünite bulunamadı.",
      },
      404,
    );
  }

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
        lessonProgress: true,
        totalProgress: true,
        completedSlideIds: true,
        startedAt: true,
        completedAt: true,
        lastVisitedAt: true,
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

  const slides =
    await getUnitSlides(unit.id);

  const completedSlideIds =
    new Set(
      stringArray(
        currentProgress
          ?.completedSlideIds,
      ),
    );

  const lessons =
    slides.map((slide, index) => {
      const previousSlide =
        index > 0
          ? slides[index - 1]
          : null;

      const nextSlide =
        index < slides.length - 1
          ? slides[index + 1]
          : null;

      return {
        id: slide.id,
        unitId: slide.unitId,
        order: slide.order,
        title: slide.title,

        estimatedMinutes:
          slide.estimatedMinutes,

        isRequired:
          slide.isRequired,

        completionRule:
          slide.completionRule,

        minimumViewSeconds:
          slide.minimumViewSeconds ??
          null,

        previousLessonId:
          slide.previousSlideId ??
          previousSlide?.id ??
          null,

        nextLessonId:
          slide.nextSlideId ??
          nextSlide?.id ??
          null,

        contentBlockCount:
          slide.contentBlocks.length,

        contentTypes:
          Array.from(
            new Set(
              slide.contentBlocks.map(
                (block) => block.type,
              ),
            ),
          ),

        isCompleted:
          completedSlideIds.has(
            slide.id,
          ),
      };
    });

  const firstIncompleteLesson =
    lessons.find(
      (lesson) =>
        !lesson.isCompleted,
    );

  const completedLessonCount =
    lessons.filter(
      (lesson) =>
        lesson.isCompleted,
    ).length;

  const fallbackLessonId =
    lessons.length > 0
      ? lessons[lessons.length - 1].id
      : null;

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

        lessonCount:
          lessons.length,

        completedLessonCount,

        lessonProgress:
          clampProgress(
            currentProgress
              ?.lessonProgress ?? 0,
          ),
      },

      currentLessonId:
        firstIncompleteLesson?.id ??
        fallbackLessonId,

      lessons,
    },
    200,
  );
}