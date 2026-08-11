import { withApiMonitoring } from "@/lib/security/api-monitor";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getApiUser } from "@/lib/auth/authorization";
import { prisma } from "@/lib/db";
import { getOrCreateDailyPlan } from "@/lib/intelligence/server";
import type { DailyPlanTask } from "@/types/intelligence";

function validDate(value: string | null) {
  return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : new Date().toISOString().slice(0, 10);
}

async function GETHandler(request: Request) {
  const user = await getApiUser();
  if (!user) return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });
  const url = new URL(request.url);
  const planDate = validDate(url.searchParams.get("date"));
  const plan = await getOrCreateDailyPlan({
    userId: user.id,
    planDate,
    goalMinutes: user.dailyGoalMinutes,
    currentLevel: user.currentLevel,
    force: url.searchParams.get("refresh") === "1",
  });
  return NextResponse.json({ plan });
}

async function PATCHHandler(request: Request) {
  const user = await getApiUser();
  if (!user) return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });
  const body = await request.json() as { planDate?: string; taskId?: string; completed?: boolean };
  const planDate = validDate(body.planDate ?? null);
  if (!body.taskId || typeof body.completed !== "boolean") {
    return NextResponse.json({ error: "Görev bilgisi geçersiz." }, { status: 400 });
  }

  // V46.7: lock the user's daily plan row so concurrent PATCH requests cannot
  // overwrite each other's JSON task state / completedMinutes calculation.
  const result = await prisma.$transaction(async (tx) => {
    const locked = await tx.$queryRaw<Array<{ id: string }>>(Prisma.sql`
      SELECT "id"
      FROM "DailyStudyPlan"
      WHERE "userId" = ${user.id} AND "planDate" = ${planDate}
      FOR UPDATE
    `);
    if (!locked.length) return null;

    const existing = await tx.dailyStudyPlan.findUnique({
      where: { userId_planDate: { userId: user.id, planDate } },
    });
    if (!existing) return null;

    const currentTasks = existing.tasks as unknown as DailyPlanTask[];
    if (!currentTasks.some((task) => task.id === body.taskId)) {
      return { invalidTask: true as const };
    }
    const tasks = currentTasks.map((task) =>
      task.id === body.taskId ? { ...task, completed: body.completed } : task,
    );
    const completedMinutes = tasks
      .filter((task) => task.completed)
      .reduce((sum, task) => sum + task.minutes, 0);

    const updated = await tx.dailyStudyPlan.update({
      where: { id: existing.id },
      data: { tasks: tasks as unknown as Prisma.InputJsonValue, completedMinutes },
    });

    return {
      invalidTask: false as const,
      plan: {
        id: updated.id,
        planDate,
        goalMinutes: updated.goalMinutes,
        plannedMinutes: updated.plannedMinutes,
        completedMinutes,
        tasks,
        generatedAt: updated.generatedAt.toISOString(),
      },
    };
  });

  if (!result) return NextResponse.json({ error: "Günlük plan bulunamadı." }, { status: 404 });
  if (result.invalidTask) return NextResponse.json({ error: "Günlük plan görevi bulunamadı." }, { status: 404 });
  return NextResponse.json({ plan: result.plan });
}

export const GET = withApiMonitoring("/api/intelligence/daily-plan", GETHandler);
export const PATCH = withApiMonitoring("/api/intelligence/daily-plan", PATCHHandler);
