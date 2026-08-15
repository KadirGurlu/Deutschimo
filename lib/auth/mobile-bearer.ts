import { UserStatus } from "@prisma/client";

import { hashToken } from "@/lib/auth/tokens";
import { prisma } from "@/lib/db";

export type MobileBearerUser = {
  id: string;
  name: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  image: string | null;
  role: string;
  status: string;
  currentLevel: string;
  targetLevel: string;
  dailyGoalMinutes: number;
  onboardingCompleted: boolean;
};

export type MobileBearerResult =
  | {
      ok: true;
      sessionId: string;
      user: MobileBearerUser;
    }
  | {
      ok: false;
      reason:
        | "MISSING_TOKEN"
        | "INVALID_TOKEN"
        | "ACCESS_TOKEN_EXPIRED"
        | "SESSION_REVOKED"
        | "SESSION_EXPIRED"
        | "ACCOUNT_UNAVAILABLE"
        | "EMAIL_VERIFICATION_REQUIRED";
    };

function getBearerToken(
  request: Request,
): string | null {
  const authorization =
    request.headers.get("authorization");

  if (!authorization) {
    return null;
  }

  const [scheme, token, ...rest] =
    authorization.trim().split(/\s+/);

  if (
    scheme?.toLowerCase() !== "bearer" ||
    !token ||
    rest.length > 0
  ) {
    return null;
  }

  return token;
}

export async function verifyMobileBearer(
  request: Request,
): Promise<MobileBearerResult> {
  const accessToken =
    getBearerToken(request);

  if (!accessToken) {
    return {
      ok: false,
      reason: "MISSING_TOKEN",
    };
  }

  const accessTokenHash =
    hashToken(accessToken);

  const session =
    await prisma.mobileSession.findUnique({
      where: {
        accessTokenHash,
      },
      select: {
        id: true,
        revokedAt: true,
        accessExpiresAt: true,
        refreshExpiresAt: true,

        user: {
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true,
            email: true,
            emailVerified: true,
            image: true,
            role: true,
            status: true,
            currentLevel: true,
            targetLevel: true,
            dailyGoalMinutes: true,
            onboardingCompleted: true,
          },
        },
      },
    });

  if (!session) {
    return {
      ok: false,
      reason: "INVALID_TOKEN",
    };
  }

  if (session.revokedAt) {
    return {
      ok: false,
      reason: "SESSION_REVOKED",
    };
  }

  const now = new Date();

  if (
    session.refreshExpiresAt <= now
  ) {
    await prisma.mobileSession.updateMany({
      where: {
        id: session.id,
        revokedAt: null,
      },
      data: {
        revokedAt: now,
      },
    });

    return {
      ok: false,
      reason: "SESSION_EXPIRED",
    };
  }

  if (
    session.accessExpiresAt <= now
  ) {
    return {
      ok: false,
      reason: "ACCESS_TOKEN_EXPIRED",
    };
  }

  if (
    session.user.status ===
    UserStatus.SUSPENDED
  ) {
    await prisma.mobileSession.updateMany({
      where: {
        id: session.id,
        revokedAt: null,
      },
      data: {
        revokedAt: now,
      },
    });

    return {
      ok: false,
      reason: "ACCOUNT_UNAVAILABLE",
    };
  }

  if (
    process.env
      .REQUIRE_EMAIL_VERIFICATION ===
      "true" &&
    !session.user.emailVerified
  ) {
    await prisma.mobileSession.updateMany({
      where: {
        id: session.id,
        revokedAt: null,
      },
      data: {
        revokedAt: now,
      },
    });

    return {
      ok: false,
      reason:
        "EMAIL_VERIFICATION_REQUIRED",
    };
  }

  await prisma.mobileSession.update({
    where: {
      id: session.id,
    },
    data: {
      lastUsedAt: now,
    },
  });

  return {
    ok: true,
    sessionId: session.id,

    user: {
      id: session.user.id,
      name: session.user.name,
      firstName:
        session.user.firstName,
      lastName:
        session.user.lastName,
      email: session.user.email,
      image: session.user.image,
      role: session.user.role,
      status: session.user.status,
      currentLevel:
        session.user.currentLevel,
      targetLevel:
        session.user.targetLevel,
      dailyGoalMinutes:
        session.user.dailyGoalMinutes,
      onboardingCompleted:
        session.user
          .onboardingCompleted,
    },
  };
}