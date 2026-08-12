import type { Session } from "next-auth";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { apiError, apiOk } from "@/lib/v47/api";

export const dynamic = "force-dynamic";

function userIdFromSession(session: Session | null) {
  return (session?.user as { id?: string } | undefined)?.id ?? null;
}

export async function GET() {
  const session = await auth();
  const userId = userIdFromSession(session);

  if (!userId) {
    return apiError(
      "UNAUTHENTICATED",
      "Authentication required.",
      { status: 401 },
    );
  }

  const consent = await prisma.userConsent.findUnique({
    where: { userId },
  });

  return apiOk({
    analyticsEnabled: consent?.analyticsEnabled ?? false,
    functionalEnabled: consent?.functionalEnabled ?? true,
    marketingEnabled: consent?.marketingEnabled ?? false,
    policyVersion: consent?.policyVersion ?? "LEGAL_REVIEW_REQUIRED",
    updatedAt: consent?.updatedAt ?? null,
  });
}

export async function PUT(request: Request) {
  const session = await auth();
  const userId = userIdFromSession(session);

  if (!userId) {
    return apiError(
      "UNAUTHENTICATED",
      "Authentication required.",
      { status: 401 },
    );
  }

  const body = await request.json().catch(() => null);

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return apiError(
      "INVALID_BODY",
      "Invalid consent payload.",
      { status: 422 },
    );
  }

  const value = body as Record<string, unknown>;

  if (typeof value.analyticsEnabled !== "boolean") {
    return apiError(
      "INVALID_ANALYTICS_CONSENT",
      "analyticsEnabled must be boolean.",
      { status: 422 },
    );
  }

  const consent = await prisma.userConsent.upsert({
    where: { userId },

    update: {
      analyticsEnabled: value.analyticsEnabled,

      functionalEnabled:
        typeof value.functionalEnabled === "boolean"
          ? value.functionalEnabled
          : true,

      marketingEnabled:
        typeof value.marketingEnabled === "boolean"
          ? value.marketingEnabled
          : false,

      policyVersion:
        typeof value.policyVersion === "string"
          ? value.policyVersion.slice(0, 80)
          : "LEGAL_REVIEW_REQUIRED",
    },

    create: {
      userId,

      analyticsEnabled: value.analyticsEnabled,

      functionalEnabled:
        typeof value.functionalEnabled === "boolean"
          ? value.functionalEnabled
          : true,

      marketingEnabled:
        typeof value.marketingEnabled === "boolean"
          ? value.marketingEnabled
          : false,

      policyVersion:
        typeof value.policyVersion === "string"
          ? value.policyVersion.slice(0, 80)
          : "LEGAL_REVIEW_REQUIRED",
    },
  });

  return apiOk({
    analyticsEnabled: consent.analyticsEnabled,
    functionalEnabled: consent.functionalEnabled,
    marketingEnabled: consent.marketingEnabled,
    policyVersion: consent.policyVersion,
    updatedAt: consent.updatedAt,
  });
}