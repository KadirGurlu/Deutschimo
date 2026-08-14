import { ClientPlatform } from "@prisma/client";
import { NextResponse } from "next/server";

import { verifyCredentials } from "@/lib/auth/verify-credentials";
import { createSecureToken, hashToken } from "@/lib/auth/tokens";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ACCESS_TOKEN_TTL_MS = 15 * 60 * 1000;
const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

type MobileLoginBody = {
  email?: unknown;
  password?: unknown;
  platform?: unknown;
  deviceName?: unknown;
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

function parsePlatform(
  value: unknown,
): ClientPlatform | null {
  if (value === ClientPlatform.ANDROID) {
    return ClientPlatform.ANDROID;
  }

  if (value === ClientPlatform.IOS) {
    return ClientPlatform.IOS;
  }

  return null;
}

function parseDeviceName(
  value: unknown,
): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const deviceName = value.trim();

  if (!deviceName) {
    return null;
  }

  return deviceName.slice(0, 120);
}

export async function POST(
  request: Request,
) {
  let body: MobileLoginBody;

  try {
    body = (await request.json()) as MobileLoginBody;
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

  const email =
    typeof body.email === "string"
      ? body.email
      : "";

  const password =
    typeof body.password === "string"
      ? body.password
      : "";

  const platform = parsePlatform(
    body.platform,
  );

  const deviceName = parseDeviceName(
    body.deviceName,
  );

  if (!email || !password || !platform) {
    return jsonResponse(
      {
        ok: false,
        error: "INVALID_REQUEST",
        message:
          "E-posta, şifre ve geçerli platform bilgisi gereklidir.",
      },
      400,
    );
  }

  const verification =
    await verifyCredentials(
      {
        email,
        password,
      },
      request,
    );

  if (!verification.ok) {
    if (
      verification.reason ===
      "RATE_LIMITED"
    ) {
      return jsonResponse(
        {
          ok: false,
          error: "RATE_LIMITED",
          message:
            "Çok fazla giriş denemesi yapıldı. Lütfen daha sonra tekrar dene.",
        },
        429,
      );
    }

    if (
      verification.reason ===
      "SUSPENDED"
    ) {
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
      verification.reason ===
      "UNVERIFIED"
    ) {
      return jsonResponse(
        {
          ok: false,
          error: "EMAIL_VERIFICATION_REQUIRED",
          message:
            "Giriş yapmadan önce e-posta adresini doğrulaman gerekiyor.",
        },
        403,
      );
    }

    return jsonResponse(
      {
        ok: false,
        error: "INVALID_CREDENTIALS",
        message:
          "E-posta veya şifre hatalı.",
      },
      401,
    );
  }

  const now = Date.now();

  const accessExpiresAt = new Date(
    now + ACCESS_TOKEN_TTL_MS,
  );

  const refreshExpiresAt = new Date(
    now + REFRESH_TOKEN_TTL_MS,
  );

  const accessToken =
    createSecureToken();

  const refreshToken =
    createSecureToken();

  const accessTokenHash =
    hashToken(accessToken);

  const refreshTokenHash =
    hashToken(refreshToken);

  const session =
    await prisma.mobileSession.create({
      data: {
        userId:
          verification.user.id,

        platform,

        deviceName,

        accessTokenHash,

        refreshTokenHash,

        accessExpiresAt,

        refreshExpiresAt,

        lastUsedAt: new Date(),
      },

      select: {
        id: true,
      },
    });

  return jsonResponse(
    {
      ok: true,

      sessionId: session.id,

      tokenType: "Bearer",

      accessToken,

      refreshToken,

      accessExpiresAt:
        accessExpiresAt.toISOString(),

      refreshExpiresAt:
        refreshExpiresAt.toISOString(),

      user: {
        id:
          verification.user.id,

        name:
          verification.user.name,

        firstName:
          verification.user.firstName,

        lastName:
          verification.user.lastName,

        email:
          verification.user.email,

        image:
          verification.user.image,

        role:
          verification.user.role,

        status:
          verification.user.status,

        currentLevel:
          verification.user.currentLevel,

        targetLevel:
          verification.user.targetLevel,

        dailyGoalMinutes:
          verification.user
            .dailyGoalMinutes,

        onboardingCompleted:
          verification.user
            .onboardingCompleted,
      },
    },
    200,
  );
}