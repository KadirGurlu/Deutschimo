import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getApiUser } from "@/lib/auth/authorization";
import { prisma } from "@/lib/db";
import { withApiMonitoring } from "@/lib/security/api-monitor";
import type { LabLevel, SkillAttemptPayload, SkillType } from "@/types/skills";


/* V37_ROUTE_COMPAT_INLINE
 * V28.x-V36 static release validators expect the historical learning logic
 * to remain visible in this route file. V37 therefore keeps the original
 * POST implementation inline and mirrors only successful responses into
 * Mastery Engine. The old business logic runs first and remains authoritative.
 */
import { captureMasteryExchange } from "@/lib/mastery/bridge";

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
const __v37LegacyPost = withApiMonitoring("/api/skills/attempts", POSTHandler);


export async function POST(request: Request): Promise<Response> {
  const requestCopy = request.clone();

  const response = await (
    __v37LegacyPost as unknown as (request: Request) => Promise<Response>
  )(request);

  if (response.ok) {
    try {
      const requestBody = await requestCopy.json().catch(() => null);
      const responseBody = await response.clone().json().catch(() => null);

      await captureMasteryExchange({
        source: "skills-attempts",
        requestBody,
        responseBody,
      });
    } catch (error) {
      console.warn(
        "V37 mastery bridge skipped:",
        error instanceof Error ? error.message : "unknown"
      );
    }
  }

  return response;
}
