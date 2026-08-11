export type RuntimeEnvironment = "development" | "preview" | "production" | "test" | "unknown";

function normalizeEnvironment(value?: string): RuntimeEnvironment {
  const normalized = value?.trim().toLowerCase();
  if (normalized === "production") return "production";
  if (normalized === "preview" || normalized === "staging") return "preview";
  if (normalized === "development" || normalized === "dev") return "development";
  if (normalized === "test") return "test";
  return "unknown";
}

export function runtimeEnvironment(): RuntimeEnvironment {
  return normalizeEnvironment(
    process.env.DATABASE_ENVIRONMENT ??
      process.env.VERCEL_ENV ??
      process.env.NODE_ENV,
  );
}

export function releaseInfo() {
  const commit =
    process.env.VERCEL_GIT_COMMIT_SHA ??
    process.env.GITHUB_SHA ??
    process.env.COMMIT_SHA ??
    "local";

  return {
    version: process.env.NEXT_PUBLIC_APP_VERSION ?? "47.0.0",
    release: process.env.V47_RELEASE ?? `v47-${commit.slice(0, 12)}`,
    commit: commit.slice(0, 12),
    environment: runtimeEnvironment(),
    region: process.env.VERCEL_REGION ?? null,
  } as const;
}
