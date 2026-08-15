import { NextResponse } from "next/server";

import { hashToken } from "@/lib/auth/tokens";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type MobileLogoutBody = {
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

export async function POST(
  request: Request,
) {
  let body: MobileLogoutBody;

  try {
    body =
      (await request.json()) as MobileLogoutBody;
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

  const refreshTokenHash =
    hashToken(refreshToken);

  const now = new Date();

  await prisma.mobileSession.updateMany({
    where: {
      refreshTokenHash,
      revokedAt: null,
    },
    data: {
      revokedAt: now,
      lastUsedAt: now,
    },
  });

  return jsonResponse(
    {
      ok: true,
    },
    200,
  );
}