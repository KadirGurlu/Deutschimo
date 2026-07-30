import { unitCanComplete } from "@/lib/learning/completion-rules";
export function calculateUnitProgress(state, unit, slides, exercises, quiz) {
    const current = state.unitProgress[unit.id];
    const requiredSlides = slides.filter((slide) => slide.isRequired && slide.status === "PUBLISHED");
    const completedSlideIds = requiredSlides.filter((slide) => state.slideProgress[slide.id]?.status === "COMPLETED").map((slide) => slide.id);
    const requiredExercises = exercises.filter((exercise) => exercise.isRequired);
    const completedExerciseIds = requiredExercises.filter((exercise) => state.exerciseAttempts.some((attempt) => attempt.exerciseId === exercise.id)).map((exercise) => exercise.id);
    const quizAttempts = state.quizAttempts.filter((attempt) => attempt.quizId === quiz.id);
    const bestQuizScore = quizAttempts.length ? Math.max(...quizAttempts.map((attempt) => attempt.score)) : 0;
    const lessonRatio = requiredSlides.length ? completedSlideIds.length / requiredSlides.length : 1;
    const exerciseRatio = requiredExercises.length ? completedExerciseIds.length / requiredExercises.length : 1;
    const quizRatio = Math.min(1, bestQuizScore / 100);
    const { lessons, exercises: exerciseWeight, quiz: quizWeight } = unit.progressWeights;
    const totalProgress = Math.min(100, Math.round(lessonRatio * lessons + exerciseRatio * exerciseWeight + quizRatio * quizWeight));
    const lessonsDone = completedSlideIds.length === requiredSlides.length;
    const exercisesDone = completedExerciseIds.length === requiredExercises.length;
    const passed = quizAttempts.some((attempt) => attempt.passed);
    const canComplete = unitCanComplete(state, unit, slides, exercises, quiz);
    const now = new Date().toISOString();
    let stage = "LESSONS";
    if (lessonsDone)
        stage = "EXERCISES";
    if (lessonsDone && exercisesDone)
        stage = "QUIZ";
    if (canComplete)
        stage = "COMPLETED";
    const hasActivity = completedSlideIds.length > 0 || completedExerciseIds.length > 0 || quizAttempts.length > 0 || Boolean(current?.startedAt);
    const status = canComplete ? "COMPLETED" : hasActivity ? "IN_PROGRESS" : "NOT_STARTED";
    return {
        id: current?.id ?? `up-${unit.id}`,
        userId: state.userId,
        unitId: unit.id,
        status,
        stage,
        lessonProgress: Math.round(lessonRatio * 100),
        exerciseProgress: Math.round(exerciseRatio * 100),
        quizProgress: Math.round(quizRatio * 100),
        totalProgress: canComplete ? 100 : totalProgress,
        completedSlideIds,
        completedExerciseIds,
        startedAt: current?.startedAt ?? (hasActivity ? now : undefined),
        completedAt: canComplete ? current?.completedAt ?? now : undefined,
        lastVisitedAt: current?.lastVisitedAt,
        bestQuizScore: passed ? Math.max(bestQuizScore, quiz.minimumScore) : bestQuizScore,
    };
}
export function calculateCourseProgress(unitProgress) {
    if (!unitProgress.length)
        return 0;
    return Math.round(unitProgress.reduce((sum, progress) => sum + progress.totalProgress, 0) / unitProgress.length);
}
