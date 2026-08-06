import { withApiMonitoring } from "@/lib/security/api-monitor";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getApiUser } from "@/lib/auth/authorization";
import type { Level } from "@prisma/client";

const levels = new Set(["A1", "A2", "B1", "B2"]);

async function GETHandler() {
  const currentUser = await getApiUser();
  if (!currentUser) return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });
  const user = await prisma.user.findUnique({
    where: { id: currentUser.id },
    select: { id: true, firstName: true, lastName: true, email: true, image: true, currentLevel: true, targetLevel: true, dailyGoalMinutes: true, createdAt: true, lastSeenAt: true },
  });
  return NextResponse.json({ user });
}

async function PATCHHandler(request: Request) {
  const currentUser = await getApiUser();
  if (!currentUser) return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });
  const body = await request.json() as Record<string, unknown>;
  const firstName = String(body.firstName ?? "").trim();
  const lastName = String(body.lastName ?? "").trim();
  const dailyGoalMinutes = Math.min(120, Math.max(10, Number(body.dailyGoalMinutes ?? 30)));
  const currentLevel = levels.has(String(body.currentLevel)) ? String(body.currentLevel) as Level : undefined;
  const targetLevel = levels.has(String(body.targetLevel)) ? String(body.targetLevel) as Level : undefined;
  if (firstName.length < 2 || lastName.length < 2) return NextResponse.json({ error: "Ad ve soyad en az iki karakter olmalıdır." }, { status: 400 });
  const user = await prisma.user.update({
    where: { id: currentUser.id },
    data: { firstName, lastName, name: `${firstName} ${lastName}`, dailyGoalMinutes, ...(currentLevel ? { currentLevel } : {}), ...(targetLevel ? { targetLevel } : {}) },
    select: { id: true, firstName: true, lastName: true, email: true, image: true, currentLevel: true, targetLevel: true, dailyGoalMinutes: true },
  });
  return NextResponse.json({ user });
}

export const GET = withApiMonitoring("/api/profile", GETHandler);
export const PATCH = withApiMonitoring("/api/profile", PATCHHandler);
