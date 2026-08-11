import { runtimeEnvironment } from "@/lib/v47/release";

const SERVER_SECRET_NAMES = [
  "DATABASE_URL",
  "DATABASE_POSTGRES_URL",
  "AUTH_SECRET",
  "SECURITY_HASH_KEY",
  "CRON_SECRET",
  "OPENAI_API_KEY",
] as const;

export type EnvValidation = {
  ok: boolean;
  environment: string;
  errors: string[];
  warnings: string[];
};

export function validateRuntimeEnvironment(): EnvValidation {
  const environment = runtimeEnvironment();
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const name of SERVER_SECRET_NAMES) {
    if (`NEXT_PUBLIC_${name}` in process.env) {
      errors.push(`${name} must never use NEXT_PUBLIC_ prefix.`);
    }
  }

  if (environment === "production") {
    for (const name of ["DATABASE_URL", "AUTH_SECRET", "SECURITY_HASH_KEY", "CRON_SECRET"] as const) {
      if (!process.env[name]) errors.push(`${name} is required in production.`);
    }
  }

  if (!process.env.DATABASE_ENVIRONMENT) {
    warnings.push("DATABASE_ENVIRONMENT is not explicitly set.");
  }

  if (process.env.DATABASE_ENVIRONMENT === "production" && process.env.NODE_ENV === "test") {
    errors.push("Tests must never target a production database environment.");
  }

  return { ok: errors.length === 0, environment, errors, warnings };
}
