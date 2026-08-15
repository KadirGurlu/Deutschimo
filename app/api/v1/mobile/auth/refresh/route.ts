import { UserStatus } from "@prisma/client";
import { NextResponse } from "next/server";

import {
  createSecureToken,
  hashToken,
} from "@/lib/auth/tokens";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ACCESS_TOKEN_TTL_MS =
  15 * 60 * 1000;

const REFRESH_TOKEN_TTL_MS =
  30 * 24 * 60 * 60 * 1000;

type MobileRefreshBody = {
  refreshToken?: unknown;
};

function jsonResponse(
  body: unknown,
  status = 200,
) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

function invalidRefreshTokenResponse() {
  return jsonResponse(
    {
      ok: false,
      error: "INVALID_REFRESH_TOKEN",
      message:
        "Mobil oturum geçersiz veya süresi dolmuş.",
    },
    401,
  );
}

export async function POST(
  request: Request,
) {
  let body: MobileRefreshBody;

  try {
    body =
      (await request.json()) as MobileRefreshBody;
  } catch {
    return jsonResponse(
      {
        ok: false,
        error: "INVALID_REQUEST",
        message: "Geçersiz istek.",
      },
      400,
    );
  }

  const refreshToken =
    typeof body.refreshToken === "string"
      ? body.refreshToken.trim()
      : "";

  if (!refreshToken) {
    return jsonResponse(
      {
        ok: false,
        error: "INVALID_REQUEST",
        message:
          "Refresh token gereklidir.",
      },
      400,
    );
  }

  const currentRefreshTokenHash =
    hashToken(refreshToken);

  const now = new Date();

  const session =
    await prisma.mobileSession.findUnique({
      where: {
        refreshTokenHash:
          currentRefreshTokenHash,
      },
      select: {
        id: true,
        userId: true,
        revokedAt: true,
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
    return invalidRefreshTokenResponse();
  }

  if (session.revokedAt) {
    return invalidRefreshTokenResponse();
  }

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

    return invalidRefreshTokenResponse();
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

    return jsonResponse(
      {
        ok: false,
        error: "ACCOUNT_UNAVAILABLE",
        message:
          "Bu hesapla şu anda giriş yapılamıyor.",
      },
      403,
    );
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

    return jsonResponse(
      {
        ok: false,
        error:
          "EMAIL_VERIFICATION_REQUIRED",
        message:
          "Devam etmeden önce e-posta adresini doğrulaman gerekiyor.",
      },
      403,
    );
  }

  const nextAccessToken =
    createSecureToken();

  const nextRefreshToken =
    createSecureToken();

  const nextAccessTokenHash =
    hashToken(nextAccessToken);

  const nextRefreshTokenHash =
    hashToken(nextRefreshToken);

  const accessExpiresAt =
    new Date(
      now.getTime() +
        ACCESS_TOKEN_TTL_MS,
    );

  const refreshExpiresAt =
    new Date(
      now.getTime() +
        REFRESH_TOKEN_TTL_MS,
    );

  const rotationResult =
    await prisma.mobileSession.updateMany({
      where: {
        id: session.id,
        refreshTokenHash:
          currentRefreshTokenHash,
        revokedAt: null,
        refreshExpiresAt: {
          gt: now,
        },
      },

      data: {
        accessTokenHash:
          nextAccessTokenHash,

        refreshTokenHash:
          nextRefreshTokenHash,

        accessExpiresAt,
        refreshExpiresAt,

        lastUsedAt: now,
      },
    });

  if (rotationResult.count !== 1) {
    return invalidRefreshTokenResponse();
  }

  return jsonResponse(
    {
      ok: true,

      sessionId: session.id,

      tokenType: "Bearer",

      accessToken:
        nextAccessToken,

      refreshToken:
        nextRefreshToken,

      accessExpiresAt:
        accessExpiresAt.toISOString(),

      refreshExpiresAt:
        refreshExpiresAt.toISOString(),

      user: {
        id: session.user.id,

        name: session.user.name,

        firstName:
          session.user.firstName,

        lastName:
          session.user.lastName,

        email:
          session.user.email,

        image:
          session.user.image,

        role:
          session.user.role,

        status:
          session.user.status,

        currentLevel:
          session.user.currentLevel,

        targetLevel:
          session.user.targetLevel,

        dailyGoalMinutes:
          session.user
            .dailyGoalMinutes,

        onboardingCompleted:
          session.user
            .onboardingCompleted,
      },
    },
    200,
  );
}