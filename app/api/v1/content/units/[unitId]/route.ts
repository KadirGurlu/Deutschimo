import { getPlatformApiUser } from "@/lib/platform/auth";
import { apiFailure, apiSuccess } from "@/lib/platform/response";
import { enforceUserRateLimit } from "@/lib/platform/rate-limit";
import {
  getCourseBySlug,
  getUnitById,
  getUnitExercises,
  getUnitQuiz,
  getUnitSlides,
} from "@/lib/services/course-service";
import { withApiMonitoring } from "@/lib/security/api-monitor";
import type { Exercise, UnitQuiz } from "@/types/exercise";

export const runtime = "nodejs";

function learnerExercise(exercise: Exercise) {
  const {
    correctAnswer: _correctAnswer,
    acceptedAnswers: _acceptedAnswers,
    explanation: _explanation,
    ...safe
  } = exercise;

  return safe;
}

function learnerQuiz(quiz: UnitQuiz | undefined) {
  if (!quiz) return null;

  return {
    id: quiz.id,
    unitId: quiz.unitId,
    title: quiz.title,
    minimumScore: quiz.minimumScore,
    maxAttempts: quiz.maxAttempts,
    showAnswersAfterSubmit: quiz.showAnswersAfterSubmit,
    questions: quiz.questions.map((question) => {
      const {
        correctAnswer: _correctAnswer,
        explanation: _explanation,
        ...safeQuestion
      } = question;
      return safeQuestion;
    }),
  };
}

async function GETHandler(
  request: Request,
  context: { params: Promise<{ unitId: string }> },
) {
  const auth = await getPlatformApiUser(request);
  if (!auth) return apiFailure(request, 401, "UNAUTHORIZED", "Oturum gerekli.");

  const limited = await enforceUserRateLimit(request, {
    scope: "v47-unit-content",
    userId: auth.user.id,
    limit: 120,
    windowSeconds: 60,
  });
  if (limited) return limited;

  const { unitId } = await context.params;
  const unit = await getUnitById(unitId);
  if (!unit || unit.status !== "PUBLISHED") {
    return apiFailure(request, 404, "NOT_FOUND", "Yayınlanmış ünite bulunamadı.");
  }

  const course = await getCourseBySlug(unit.courseId);
  if (!course || course.status !== "PUBLISHED") {
    return apiFailure(request, 404, "NOT_FOUND", "Yayınlanmış kurs bulunamadı.");
  }

  const [slides, exercises, quiz] = await Promise.all([
    getUnitSlides(unit.id),
    getUnitExercises(unit.id),
    getUnitQuiz(unit.id),
  ]);

  return apiSuccess(request, {
    course,
    unit,
    slides,
    exercises: exercises.map(learnerExercise),
    quiz: learnerQuiz(quiz),
    parity: {
      source: "WEB_COURSE_SERVICE",
      slideCount: slides.length,
      exerciseCount: exercises.length,
      quizQuestionCount: quiz?.questions.length ?? 0,
    },
  });
}

export const GET = withApiMonitoring(
  "/api/v1/content/units/[unitId]",
  GETHandler,
);
