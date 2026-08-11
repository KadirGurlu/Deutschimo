export const PRODUCT_EVENTS = [
  "user_registered",
  "user_logged_in",
  "onboarding_started",
  "onboarding_completed",
  "level_test_started",
  "level_test_completed",
  "course_opened",
  "unit_started",
  "lesson_started",
  "lesson_completed",
  "exercise_started",
  "exercise_answered",
  "exercise_completed",
  "review_started",
  "review_completed",
  "daily_plan_opened",
  "daily_plan_completed",
  "listening_started",
  "listening_completed",
  "speaking_started",
  "speaking_completed",
  "feedback_submitted",
  "network_unavailable",
  "network_restored",
] as const;

export type ProductEventName = (typeof PRODUCT_EVENTS)[number];

const EVENT_SET = new Set<string>(PRODUCT_EVENTS);

export function isProductEventName(value: unknown): value is ProductEventName {
  return typeof value === "string" && EVENT_SET.has(value);
}

export const LEARNING_SUCCESS_EVENTS = new Set<ProductEventName>([
  "lesson_completed",
  "exercise_completed",
  "review_completed",
  "daily_plan_completed",
  "listening_completed",
  "speaking_completed",
]);
