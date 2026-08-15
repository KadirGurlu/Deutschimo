import { NextResponse } from "next/server";

import {
  verifyMobileBearer,
} from "@/lib/auth/mobile-bearer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

export async function GET(
  request: Request,
) {
  const verification =
    await verifyMobileBearer(request);

  if (!verification.ok) {
    if (
      verification.reason ===
        "ACCOUNT_UNAVAILABLE" ||
      verification.reason ===
        "EMAIL_VERIFICATION_REQUIRED"
    ) {
      return jsonResponse(
        {
          ok: false,
          error: verification.reason,
          message:
            verification.reason ===
            "EMAIL_VERIFICATION_REQUIRED"
              ? "E-posta doğrulaması gereklidir."
              : "Bu hesapla şu anda işlem yapılamıyor.",
        },
        403,
      );
    }

    if (
      verification.reason ===
      "ACCESS_TOKEN_EXPIRED"
    ) {
      return jsonResponse(
        {
          ok: false,
          error: "ACCESS_TOKEN_EXPIRED",
          message:
            "Access token süresi dolmuş.",
        },
        401,
      );
    }

    return jsonResponse(
      {
        ok: false,
        error: "UNAUTHORIZED",
        message:
          "Geçerli bir mobil oturum gereklidir.",
      },
      401,
    );
  }

  return jsonResponse(
    {
      ok: true,
      sessionId:
        verification.sessionId,

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