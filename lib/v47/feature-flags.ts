import { createHash } from "node:crypto";
import { runtimeEnvironment } from "@/lib/v47/release";

type FlagRule = {
  enabled?: boolean;
  percentage?: number;
  environments?: string[];
  roles?: string[];
  users?: string[];
};

type FlagMap = Record<string, FlagRule>;

function config(): FlagMap {
  const raw = process.env.V47_FEATURE_FLAGS_JSON;
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as FlagMap) : {};
  } catch {
    return {};
  }
}

function bucket(flag: string, userKey: string) {
  const digest = createHash("sha256").update(`${flag}:${userKey}`).digest();
  return digest.readUInt32BE(0) % 100;
}

export function isFeatureEnabled(
  flag: string,
  context: { userId?: string | null; role?: string | null } = {},
) {
  const rule = config()[flag];
  if (!rule?.enabled) return false;

  const env = runtimeEnvironment();
  if (rule.environments?.length && !rule.environments.includes(env)) return false;
  if (context.role && rule.roles?.length && !rule.roles.includes(context.role)) return false;
  if (context.userId && rule.users?.includes(context.userId)) return true;

  const percentage = Math.max(0, Math.min(100, Number(rule.percentage ?? 100)));
  if (percentage >= 100) return true;
  if (!context.userId) return false;
  return bucket(flag, context.userId) < percentage;
}
