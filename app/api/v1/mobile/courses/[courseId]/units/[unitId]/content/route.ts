import { NextResponse } from "next/server";

import { verifyMobileBearer } from "@/lib/auth/mobile-bearer";
import { prisma } from "@/lib/db";
import {
  getCourseBySlug,
  getUnitById,
  getUnitExercises,
  getUnitQuiz,
  getUnitSlides,
} from "@/lib/services/course-service";
import type { Exercise, UnitQuiz } from "@/types/exercise";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonResponse(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function authFailure(reason: string) {
  if (reason === "ACCOUNT_UNAVAILABLE" || reason === "EMAIL_VERIFICATION_REQUIRED") {
    return jsonResponse(
      {
        ok: false,
        error: reason,
        message:
          reason === "EMAIL_VERIFICATION_REQUIRED"
            ? "E-posta doğrulaması gereklidir."
            : "Bu hesapla şu anda işlem yapılamıyor.",
      },
      403,
    );
  }

  if (reason === "ACCESS_TOKEN_EXPIRED") {
    return jsonResponse(
      { ok: false, error: "ACCESS_TOKEN_EXPIRED", message: "Access token süresi dolmuş." },
      401,
    );
  }

  return jsonResponse(
    { ok: false, error: "UNAUTHORIZED", message: "Geçerli bir mobil oturum gereklidir." },
    401,
  );
}

function learnerExercise(exercise: Exercise) {
  const {
    correctAnswer: _correctAnswer,
    acceptedAnswers: _acceptedAnswers,
    explanation: _explanation,
    ...safeExercise
  } = exercise;

  return safeExercise;
}

function learnerQuiz(quiz: UnitQuiz | undefined) {
  if (!quiz) return null;

  return {
    ...quiz,
    questions: quiz.questions.map((question) => {
      const {
        correctAnswer: _correctAnswer,
        acceptedAnswers: _acceptedAnswers,
        explanation: _explanation,
        ...safeQuestion
      } = question;
      return safeQuestion;
    }),
  };
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ courseId: string; unitId: string }> },
) {
  const verification = await verifyMobileBearer(request);
  if (!verification.ok) return authFailure(verification.reason);

  const { courseId, unitId } = await params;
  const courseIdentifier = courseId.trim();
  const unitIdentifier = unitId.trim();

  if (!courseIdentifier || !unitIdentifier) {
    return jsonResponse(
      { ok: false, error: "INVALID_CONTENT_PATH", message: "Geçerli kurs ve ünite bilgisi gereklidir." },
      400,
    );
  }

  const course = await getCourseBySlug(courseIdentifier);
  if (!course || course.status !== "PUBLISHED") {
    return jsonResponse({ ok: false, error: "COURSE_NOT_FOUND", message: "Kurs bulunamadı." }, 404);
  }

  const unit = await getUnitById(unitIdentifier);
  if (!unit || unit.courseId !== course.id || unit.status !== "PUBLISHED") {
    return jsonResponse({ ok: false, error: "UNIT_NOT_FOUND", message: "Ünite bulunamadı." }, 404);
  }

  if (unit.prerequisiteUnitId) {
    const prerequisiteProgress = await prisma.userUnitProgress.findFirst({
      where: {
        userId: verification.user.id,
        unitId: unit.prerequisiteUnitId,
      },
      select: { status: true, totalProgress: true },
    });

    const prerequisiteCompleted =
      prerequisiteProgress?.status === "COMPLETED" ||
      (prerequisiteProgress?.totalProgress ?? 0) >= 100;

    if (!prerequisiteCompleted) {
      return jsonResponse(
        { ok: false, error: "UNIT_LOCKED", message: "Bu ünite henüz erişime açık değil." },
        403,
      );
    }
  }

  const [slides, exercises, quiz] = await Promise.all([
    getUnitSlides(unit.id),
    getUnitExercises(unit.id),
    getUnitQuiz(unit.id),
  ]);

  return jsonResponse({
    ok: true,
    source: "WEB_COURSE_SERVICE",
    course: {
      id: course.id,
      slug: course.slug,
      level: course.level,
      title: course.title,
    },
    unit,
    slides,
    exercises: exercises.map(learnerExercise),
    quiz: learnerQuiz(quiz),
    parity: {
      slideCount: slides.length,
      exerciseCount: exercises.length,
      quizQuestionCount: quiz?.questions.length ?? 0,
    },
  });
}
