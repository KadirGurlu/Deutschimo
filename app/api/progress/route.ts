import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getApiUser } from "@/lib/auth/authorization";
import { normalizeLearningStateForUser } from "@/lib/learning/server-state";
import type { LearningState } from "@/types/progress";

export async function GET() {
  const currentUser = await getApiUser();
  if (!currentUser) return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });
  const snapshot = await prisma.learningStateSnapshot.findUnique({ where: { userId: currentUser.id } });
  return NextResponse.json({ state: snapshot?.state ?? null, updatedAt: snapshot?.updatedAt.toISOString() });
}

export async function PUT(request: Request) {
  const currentUser = await getApiUser();
  if (!currentUser) return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });
  const body = await request.json() as { state?: LearningState };
  if (!body.state || typeof body.state !== "object") return NextResponse.json({ error: "Geçerli ilerleme verisi bulunamadı." }, { status: 400 });

  const state = normalizeLearningStateForUser(body.state, currentUser.id);
  const snapshotJson = state as unknown as Prisma.InputJsonValue;
  const unitProgressEntries = Object.values(state.unitProgress);

  await prisma.$transaction(async (tx) => {
    await tx.learningStateSnapshot.upsert({
      where: { userId: currentUser.id },
      create: { userId: currentUser.id, state: snapshotJson, version: 12 },
      update: { state: snapshotJson, version: 12 },
    });

    for (const enrollment of state.enrollments) {
      const courseExists = await tx.course.findUnique({ where: { id: enrollment.courseId }, select: { id: true } });
      if (!courseExists) continue;
      await tx.enrollment.upsert({
        where: { userId_courseId: { userId: currentUser.id, courseId: enrollment.courseId } },
        create: { userId: currentUser.id, courseId: enrollment.courseId, status: enrollment.status, enrolledAt: new Date(enrollment.enrolledAt), completedAt: enrollment.completedAt ? new Date(enrollment.completedAt) : null },
        update: { status: enrollment.status, completedAt: enrollment.completedAt ? new Date(enrollment.completedAt) : null },
      });
    }

    for (const progress of unitProgressEntries) {
      const position = Object.values(state.learningPositions).find((item) => item.unitId === progress.unitId);
      await tx.userUnitProgress.upsert({
        where: { userId_unitId: { userId: currentUser.id, unitId: progress.unitId } },
        create: {
          userId: currentUser.id,
          courseId: position?.courseId ?? progress.unitId.split("-u")[0] ?? "unknown",
          unitId: progress.unitId,
          status: progress.status,
          stage: progress.stage,
          lessonProgress: progress.lessonProgress,
          exerciseProgress: progress.exerciseProgress,
          quizProgress: progress.quizProgress,
          totalProgress: progress.totalProgress,
          bestQuizScore: progress.bestQuizScore,
          completedSlideIds: progress.completedSlideIds as unknown as Prisma.InputJsonValue,
          completedExerciseIds: progress.completedExerciseIds as unknown as Prisma.InputJsonValue,
          startedAt: progress.startedAt ? new Date(progress.startedAt) : null,
          completedAt: progress.completedAt ? new Date(progress.completedAt) : null,
          lastVisitedAt: progress.lastVisitedAt ? new Date(progress.lastVisitedAt) : null,
        },
        update: {
          status: progress.status,
          stage: progress.stage,
          lessonProgress: progress.lessonProgress,
          exerciseProgress: progress.exerciseProgress,
          quizProgress: progress.quizProgress,
          totalProgress: progress.totalProgress,
          bestQuizScore: progress.bestQuizScore,
          completedSlideIds: progress.completedSlideIds as unknown as Prisma.InputJsonValue,
          completedExerciseIds: progress.completedExerciseIds as unknown as Prisma.InputJsonValue,
          startedAt: progress.startedAt ? new Date(progress.startedAt) : null,
          completedAt: progress.completedAt ? new Date(progress.completedAt) : null,
          lastVisitedAt: progress.lastVisitedAt ? new Date(progress.lastVisitedAt) : null,
        },
      });
    }

    for (const event of state.activities.slice(0, 500)) {
      await tx.userActivityEvent.upsert({
        where: { id: event.id },
        create: { id: event.id, userId: currentUser.id, eventType: event.eventType, courseId: event.courseId, unitId: event.unitId, itemId: event.itemId, metadata: event.metadata as Prisma.InputJsonValue | undefined, createdAt: new Date(event.createdAt) },
        update: {},
      });
    }

    for (const session of state.studySessions.slice(-200)) {
      await tx.studySession.upsert({
        where: { id: session.id },
        create: { id: session.id, userId: currentUser.id, courseId: session.courseId, unitId: session.unitId, startedAt: new Date(session.startedAt), endedAt: session.endedAt ? new Date(session.endedAt) : null, activeSeconds: session.activeSeconds, sessionType: session.sessionType, deviceType: session.deviceType },
        update: { endedAt: session.endedAt ? new Date(session.endedAt) : null, activeSeconds: session.activeSeconds },
      });
    }
  });

  return NextResponse.json({ ok: true, updatedAt: new Date().toISOString() });
}
