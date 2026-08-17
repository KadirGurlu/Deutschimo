import { NextResponse } from "next/server";

import { verifyMobileBearer } from "@/lib/auth/mobile-bearer";
import { answersMatch } from "@/lib/learning/answer-normalizer";
import { getCourseBySlug, getUnitById, getUnitExercises } from "@/lib/services/course-service";
import type { Exercise } from "@/types/exercise";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CheckBody = { answer?: unknown };

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

function hasAnswer(answer: unknown) {
  if (typeof answer === "boolean") return true;
  if (Array.isArray(answer)) return answer.length > 0;
  if (answer && typeof answer === "object") return Object.keys(answer).length > 0;
  return String(answer ?? "").trim().length > 0;
}

function prepareAnswer(exercise: Exercise, answer: unknown) {
  if (exercise.type === "MATCHING" && answer && typeof answer === "object" && !Array.isArray(answer)) {
    return Object.entries(answer as Record<string, unknown>)
      .map(([left, right]) => `${left}:${String(right)}`)
      .sort();
  }

  if (exercise.type === "SENTENCE_ORDERING" && Array.isArray(answer)) {
    return answer.map(String).join(" ");
  }

  if (exercise.type === "MULTIPLE_SELECT" && Array.isArray(answer)) {
    return answer.map(String);
  }

  return answer;
}

export async function POST(
  request: Request,
  {
    params,
  }: {
    params: Promise<{ courseId: string; unitId: string; exerciseId: string }>;
  },
) {
  const verification = await verifyMobileBearer(request);
  if (!verification.ok) return authFailure(verification.reason);

  let body: CheckBody;
  try {
    body = (await request.json()) as CheckBody;
  } catch {
    return jsonResponse(
      { ok: false, error: "INVALID_BODY", message: "Geçerli bir JSON gövdesi gereklidir." },
      400,
    );
  }

  if (!hasAnswer(body.answer)) {
    return jsonResponse(
      { ok: false, error: "ANSWER_REQUIRED", message: "Cevap boş bırakılamaz." },
      400,
    );
  }

  const { courseId, unitId, exerciseId } = await params;
  const course = await getCourseBySlug(courseId.trim());
  if (!course || course.status !== "PUBLISHED") {
    return jsonResponse({ ok: false, error: "COURSE_NOT_FOUND", message: "Kurs bulunamadı." }, 404);
  }

  const unit = await getUnitById(unitId.trim());
  if (!unit || unit.courseId !== course.id || unit.status !== "PUBLISHED") {
    return jsonResponse({ ok: false, error: "UNIT_NOT_FOUND", message: "Ünite bulunamadı." }, 404);
  }

  const exercises = await getUnitExercises(unit.id);
  const exercise = exercises.find((item) => item.id === exerciseId.trim());
  if (!exercise) {
    return jsonResponse(
      { ok: false, error: "EXERCISE_NOT_FOUND", message: "Alıştırma bulunamadı." },
      404,
    );
  }

  const preparedAnswer = prepareAnswer(exercise, body.answer);
  const requiresManualEvaluation =
    exercise.type === "SHORT_ANSWER" || exercise.type === "WRITING_ASSIGNMENT";

  if (requiresManualEvaluation) {
    return jsonResponse({
      ok: true,
      exerciseId: exercise.id,
      accepted: true,
      correct: null,
      requiresManualEvaluation: true,
      explanation: "Yanıtın değerlendirme için kabul edildi.",
      maxAttempts: exercise.maxAttempts,
    });
  }

  const correct = answersMatch(preparedAnswer, exercise.correctAnswer, exercise.acceptedAnswers);

  return jsonResponse({
    ok: true,
    exerciseId: exercise.id,
    accepted: correct,
    correct,
    requiresManualEvaluation: false,
    correctAnswer: exercise.correctAnswer,
    explanation: exercise.explanation,
    maxAttempts: exercise.maxAttempts,
  });
}
