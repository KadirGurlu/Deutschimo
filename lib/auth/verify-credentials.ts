import { UserStatus } from "@prisma/client";

import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import { checkLoginLimit, recordLoginAttempt } from "@/lib/security/rate-limit";
import { getClientIp } from "@/lib/security/request";

export type VerifiedCredentialUser = {
  id: string;
  name: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string;
  image: string | null;
  role: string;
  status: string;
  currentLevel: string;
  targetLevel: string;
  dailyGoalMinutes: number;
  onboardingCompleted: boolean;
};

export type VerifyCredentialsResult =
  | {
      ok: true;
      user: VerifiedCredentialUser;
    }
  | {
      ok: false;
      reason:
        | "INVALID_INPUT"
        | "RATE_LIMITED"
        | "UNKNOWN_ACCOUNT"
        | "SUSPENDED"
        | "UNVERIFIED"
        | "INVALID_PASSWORD";
    };

export async function verifyCredentials(
  input: {
    email: string;
    password: string;
  },
  request: Request,
): Promise<VerifyCredentialsResult> {
  const email = input.email.trim().toLowerCase();
  const password = input.password;

  if (!email || !password) {
    return {
      ok: false,
      reason: "INVALID_INPUT",
    };
  }

  const ip = getClientIp(request);
  const limit = await checkLoginLimit(email, ip);

  if (!limit.allowed) {
    await recordLoginAttempt({
      emailHash: limit.emailHash,
      ipHash: limit.ipHash,
      success: false,
      reason: "RATE_LIMITED",
    });

    return {
      ok: false,
      reason: "RATE_LIMITED",
    };
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      name: true,
      firstName: true,
      lastName: true,
      email: true,
      image: true,
      passwordHash: true,
      role: true,
      status: true,
      emailVerified: true,
      currentLevel: true,
      targetLevel: true,
      dailyGoalMinutes: true,
      onboardingCompleted: true,
    },
  });

  if (!user?.passwordHash) {
    await recordLoginAttempt({
      emailHash: limit.emailHash,
      ipHash: limit.ipHash,
      success: false,
      reason: "UNKNOWN_ACCOUNT",
    });

    return {
      ok: false,
      reason: "UNKNOWN_ACCOUNT",
    };
  }

  if (user.status === UserStatus.SUSPENDED) {
    await recordLoginAttempt({
      emailHash: limit.emailHash,
      ipHash: limit.ipHash,
      success: false,
      reason: "SUSPENDED",
    });

    return {
      ok: false,
      reason: "SUSPENDED",
    };
  }

  if (
    process.env.REQUIRE_EMAIL_VERIFICATION === "true" &&
    !user.emailVerified
  ) {
    await recordLoginAttempt({
      emailHash: limit.emailHash,
      ipHash: limit.ipHash,
      success: false,
      reason: "UNVERIFIED",
    });

    return {
      ok: false,
      reason: "UNVERIFIED",
    };
  }

  const passwordIsValid = await verifyPassword(
    password,
    user.passwordHash,
  );

  if (!passwordIsValid) {
    await recordLoginAttempt({
      emailHash: limit.emailHash,
      ipHash: limit.ipHash,
      success: false,
      reason: "INVALID_PASSWORD",
    });

    return {
      ok: false,
      reason: "INVALID_PASSWORD",
    };
  }

  await Promise.all([
    prisma.user.update({
      where: { id: user.id },
      data: { lastSeenAt: new Date() },
    }),
    recordLoginAttempt({
      emailHash: limit.emailHash,
      ipHash: limit.ipHash,
      success: true,
      reason: "SUCCESS",
    }),
  ]);

  return {
    ok: true,
    user: {
      id: user.id,
      name:
        user.name ??
        [user.firstName, user.lastName].filter(Boolean).join(" ") ??
        null,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email ?? email,
      image: user.image,
      role: user.role,
      status: user.status,
      currentLevel: user.currentLevel,
      targetLevel: user.targetLevel,
      dailyGoalMinutes: user.dailyGoalMinutes,
      onboardingCompleted: user.onboardingCompleted,
    },
  };
}