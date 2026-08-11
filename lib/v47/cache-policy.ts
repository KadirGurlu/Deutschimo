export const PRIVATE_NO_STORE =
  "private, no-store, max-age=0, must-revalidate";

export const PUBLIC_IMMUTABLE =
  "public, max-age=31536000, immutable";

export const CONTENT_CACHE_TAGS = {
  course: (courseId: string) => `course:${courseId}`,
  lesson: (lessonId: string) => `lesson:${lessonId}`,
  publishedContent: "published-content",
} as const;

export const PRIVATE_CACHE_FORBIDDEN_ROUTES = [
  "/dashboard",
  "/progress",
  "/daily-plan",
  "/smart-review",
  "/profile",
] as const;
