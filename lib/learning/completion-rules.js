export function requiredSlidesCompleted(state, slides) {
    const required = slides.filter((slide) => slide.isRequired && slide.status === "PUBLISHED");
    return required.every((slide) => state.slideProgress[slide.id]?.status === "COMPLETED");
}
export function requiredExercisesCompleted(state, exercises) {
    const required = exercises.filter((exercise) => exercise.isRequired);
    return required.every((exercise) => state.exerciseAttempts.some((attempt) => attempt.exerciseId === exercise.id));
}
export function quizPassed(state, quiz) {
    return state.quizAttempts.some((attempt) => attempt.quizId === quiz.id && attempt.passed);
}
export function unitCanComplete(state, unit, slides, exercises, quiz) {
    const rules = unit.completionRules;
    if (rules.requireAllSlides && !requiredSlidesCompleted(state, slides))
        return false;
    if (rules.requireAllExercises && !requiredExercisesCompleted(state, exercises))
        return false;
    if (rules.requireUnitQuiz && !quizPassed(state, quiz))
        return false;
    if (rules.requireWritingAssignment) {
        const writing = exercises.filter((exercise) => exercise.type === "WRITING_ASSIGNMENT" && exercise.isRequired);
        if (!writing.every((exercise) => state.exerciseAttempts.some((attempt) => attempt.exerciseId === exercise.id)))
            return false;
    }
    return true;
}
