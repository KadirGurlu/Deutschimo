import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getApiUser } from "@/lib/auth/authorization";
import { prisma } from "@/lib/db";
import { withApiMonitoring } from "@/lib/security/api-monitor";
import type { LabLevel, SkillAttemptPayload, SkillType } from "@/types/skills";

const skills = new Set<SkillType>(["LISTENING", "SPEAKING", "READING", "WRITING"]);
const levels = new Set<LabLevel>(["A1", "A2", "B1", "B2"]);

async function GETHandler(request: Request) {
  const user = await getApiUser();
  if (!user) return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });
  const url = new URL(request.url);
  const requestedSkill = url.searchParams.get("skill")?.toUpperCase();
  const skill = requestedSkill && skills.has(requestedSkill as SkillType) ? requestedSkill : undefined;
  const attempts = await prisma.skillLabAttempt.findMany({
    where: { userId: user.id, ...(skill ? { skill } : {}) },
    orderBy: { completedAt: "desc" },
    take: 30,
  });
  return NextResponse.json({ attempts });
}

async function POSTHandler(request: Request) {
  const user = await getApiUser();
  if (!user) return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });
  const body = await request.json() as SkillAttemptPayload;
  if (!skills.has(body.skill)) return NextResponse.json({ error: "Geçersiz beceri türü." }, { status: 400 });
  if (!levels.has(body.level)) return NextResponse.json({ error: "Geçersiz seviye." }, { status: 400 });
  if (!body.taskId?.trim()) return NextResponse.json({ error: "Görev kimliği eksik." }, { status: 400 });
  const score = Math.max(0, Math.min(100, Math.round(Number(body.score) || 0)));
  const saved = await prisma.skillLabAttempt.create({
    data: {
      userId: user.id,
      skill: body.skill,
      taskId: body.taskId,
      level: body.level,
      score,
      durationSeconds: body.durationSeconds ? Math.max(0, Math.round(body.durationSeconds)) : null,
      answerPayload: body.answerPayload == null ? Prisma.JsonNull : body.answerPayload as Prisma.InputJsonValue,
      transcript: body.transcript?.slice(0, 12000) || null,
      feedback: body.feedback == null ? Prisma.JsonNull : body.feedback as Prisma.InputJsonValue,
    },
  });
  await prisma.userActivityEvent.create({
    data: {
      id: `skill-${saved.id}`,
      userId: user.id,
      eventType: "SKILL_LAB_COMPLETED",
      courseId: body.level.toLowerCase(),
      itemId: body.taskId,
      metadata: { skill: body.skill, score },
      createdAt: new Date(),
    },
  }).catch(() => null);
  return NextResponse.json({ attempt: saved }, { status: 201 });
}

export const GET = withApiMonitoring("/api/skills/attempts", GETHandler);
export const POST = withApiMonitoring("/api/skills/attempts", POSTHandler);
