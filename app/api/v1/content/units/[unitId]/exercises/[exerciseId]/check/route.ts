import { getPlatformApiUser } from "@/lib/platform/auth";
import { answersMatch } from "@/lib/learning/answer-normalizer";
import { apiFailure, apiSuccess } from "@/lib/platform/response";
import { enforceUserRateLimit } from "@/lib/platform/rate-limit";
import { getUnitById, getUnitExercises } from "@/lib/services/course-service";
import { withApiMonitoring } from "@/lib/security/api-monitor";
import type { Exercise } from "@/types/exercise";

export const runtime = "nodejs";

type CheckBody = {
  answer?: unknown;
};

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

async function POSTHandler(
  request: Request,
  context: { params: Promise<{ unitId: string; exerciseId: string }> },
) {
  const auth = await getPlatformApiUser(request);
  if (!auth) return apiFailure(request, 401, "UNAUTHORIZED", "Oturum gerekli.");

  const limited = await enforceUserRateLimit(request, {
    scope: "v47-exercise-check",
    userId: auth.user.id,
    limit: 180,
    windowSeconds: 60,
  });
  if (limited) return limited;

  let body: CheckBody;
  try {
    body = await request.json() as CheckBody;
  } catch {
    return apiFailure(request, 400, "BAD_REQUEST", "Geçerli bir JSON gövdesi gerekli.");
  }

  if (!hasAnswer(body.answer)) {
    return apiFailure(request, 400, "BAD_REQUEST", "Cevap boş bırakılamaz.");
  }

  const { unitId, exerciseId } = await context.params;
  const unit = await getUnitById(unitId);
  if (!unit || unit.status !== "PUBLISHED") {
    return apiFailure(request, 404, "NOT_FOUND", "Yayınlanmış ünite bulunamadı.");
  }

  const exercises = await getUnitExercises(unit.id);
  const exercise = exercises.find((item) => item.id === exerciseId);
  if (!exercise) {
    return apiFailure(request, 404, "NOT_FOUND", "Alıştırma bulunamadı.");
  }

  const preparedAnswer = prepareAnswer(exercise, body.answer);
  const requiresManualEvaluation = exercise.type === "SHORT_ANSWER" || exercise.type === "WRITING_ASSIGNMENT";

  if (requiresManualEvaluation) {
    return apiSuccess(request, {
      exerciseId: exercise.id,
      accepted: true,
      correct: null,
      requiresManualEvaluation: true,
      feedback: "Yanıtın değerlendirme için kabul edildi.",
      maxAttempts: exercise.maxAttempts,
    });
  }

  const correct = answersMatch(preparedAnswer, exercise.correctAnswer, exercise.acceptedAnswers);

  return apiSuccess(request, {
    exerciseId: exercise.id,
    accepted: correct,
    correct,
    requiresManualEvaluation: false,
    correctAnswer: exercise.correctAnswer,
    explanation: exercise.explanation,
    maxAttempts: exercise.maxAttempts,
  });
}

export const POST = withApiMonitoring(
  "/api/v1/content/units/[unitId]/exercises/[exerciseId]/check",
  POSTHandler,
);
