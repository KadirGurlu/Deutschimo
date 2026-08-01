import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getApiUser } from "@/lib/auth/authorization";
import { prisma } from "@/lib/db";
import { withApiMonitoring } from "@/lib/security/api-monitor";

const clean = (value: unknown, max = 500) => typeof value === "string" ? value.trim().slice(0, max) : "";
const optional = (value: unknown, max = 500) => clean(value, max) || null;

function conjugation(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return Prisma.JsonNull;
  const allowed = ["ich", "du", "erSieEs", "wir", "ihr", "sieSie"];
  const result = Object.fromEntries(allowed.map((key) => [key, clean((value as Record<string, unknown>)[key], 120)]).filter(([, entry]) => entry));
  return Object.keys(result).length ? result : Prisma.JsonNull;
}

async function GETHandler() {
  const user = await getApiUser();
  if (!user) return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });
  const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
  const now = new Date();
  const [items, recentAttempts, due, mastered, reviewedToday] = await Promise.all([
    prisma.vocabularyNotebookItem.findMany({ where: { userId: user.id }, orderBy: [{ nextReviewAt: "asc" }, { createdAt: "desc" }], take: 500 }),
    prisma.vocabularyReviewAttempt.findMany({ where: { userId: user.id }, include: { item: { select: { word: true } } }, orderBy: { createdAt: "desc" }, take: 30 }),
    prisma.vocabularyNotebookItem.count({ where: { userId: user.id, suspended: false, nextReviewAt: { lte: now } } }),
    prisma.vocabularyNotebookItem.count({ where: { userId: user.id, mastery: { gte: 80 } } }),
    prisma.vocabularyReviewAttempt.count({ where: { userId: user.id, createdAt: { gte: startOfDay } } }),
  ]);
  const total = items.length;
  const averageMastery = total ? Math.round(items.reduce((sum, item) => sum + item.mastery, 0) / total) : 0;
  const newCount = items.filter((item) => item.reviewCount === 0).length;
  const learning = items.filter((item) => item.reviewCount > 0 && item.mastery < 80).length;
  const activeDays = new Set(recentAttempts.map((attempt) => attempt.createdAt.toISOString().slice(0, 10)));
  let currentStreak = 0; const cursor = new Date();
  while (activeDays.has(cursor.toISOString().slice(0, 10))) { currentStreak += 1; cursor.setDate(cursor.getDate() - 1); }
  return NextResponse.json({
    items,
    stats: { total, due, newCount, learning, mastered, averageMastery, reviewedToday, currentStreak },
    recentAttempts: recentAttempts.map((attempt) => ({ ...attempt, word: attempt.item.word })),
  });
}

async function POSTHandler(request: Request) {
  const user = await getApiUser();
  if (!user) return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });
  const body = await request.json() as Record<string, unknown>;
  const word = clean(body.word, 180);
  const translation = clean(body.translation, 300);
  if (!word || !translation) return NextResponse.json({ error: "Kelime ve Türkçe anlam zorunludur." }, { status: 400 });
  const sourceTaskId = clean(body.sourceTaskId, 180) || `manual-${word.toLocaleLowerCase("de-DE").replace(/[^a-z0-9äöüß]+/giu, "-")}`;
  const values = {
    article: optional(body.article, 20), plural: optional(body.plural, 180), translation,
    pronunciation: optional(body.pronunciation, 180), wordType: optional(body.wordType, 80),
    example: optional(body.example, 1800), exampleTranslation: optional(body.exampleTranslation, 1800),
    verbConjugation: conjugation(body.verbConjugation), perfectForm: optional(body.perfectForm, 240),
    governedPreposition: optional(body.governedPreposition, 240), sourceSkill: clean(body.sourceSkill, 80) || "MANUAL",
    sourceCourseId: optional(body.sourceCourseId, 120), sourceUnitId: optional(body.sourceUnitId, 120),
    sourceUnitTitle: optional(body.sourceUnitTitle, 240), notes: optional(body.notes, 2000), suspended: false,
  };
  const item = await prisma.vocabularyNotebookItem.upsert({
    where: { userId_word_sourceTaskId: { userId: user.id, word, sourceTaskId } },
    update: values,
    create: { userId: user.id, word, sourceTaskId, ...values },
  });
  return NextResponse.json({ item }, { status: 201 });
}

async function PATCHHandler(request: Request) {
  const user = await getApiUser();
  if (!user) return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });
  const body = await request.json() as Record<string, unknown>;
  const id = clean(body.id, 80);
  if (!id) return NextResponse.json({ error: "Kelime kimliği eksik." }, { status: 400 });
  const existing = await prisma.vocabularyNotebookItem.findFirst({ where: { id, userId: user.id } });
  if (!existing) return NextResponse.json({ error: "Kelime bulunamadı." }, { status: 404 });
  const word = clean(body.word, 180) || existing.word;
  const translation = clean(body.translation, 300) || existing.translation;
  const item = await prisma.vocabularyNotebookItem.update({
    where: { id },
    data: {
      word, translation, article: optional(body.article, 20), plural: optional(body.plural, 180),
      pronunciation: optional(body.pronunciation, 180), wordType: optional(body.wordType, 80),
      example: optional(body.example, 1800), exampleTranslation: optional(body.exampleTranslation, 1800),
      verbConjugation: conjugation(body.verbConjugation), perfectForm: optional(body.perfectForm, 240),
      governedPreposition: optional(body.governedPreposition, 240), sourceCourseId: optional(body.sourceCourseId, 120),
      sourceUnitId: optional(body.sourceUnitId, 120), sourceUnitTitle: optional(body.sourceUnitTitle, 240),
      notes: optional(body.notes, 2000), suspended: Boolean(body.suspended),
    },
  });
  return NextResponse.json({ item });
}

async function DELETEHandler(request: Request) {
  const user = await getApiUser();
  if (!user) return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Kelime kimliği eksik." }, { status: 400 });
  await prisma.vocabularyNotebookItem.deleteMany({ where: { id, userId: user.id } });
  return NextResponse.json({ ok: true });
}

export const GET = withApiMonitoring("/api/skills/vocabulary", GETHandler);
export const POST = withApiMonitoring("/api/skills/vocabulary", POSTHandler);
export const PATCH = withApiMonitoring("/api/skills/vocabulary", PATCHHandler);
export const DELETE = withApiMonitoring("/api/skills/vocabulary", DELETEHandler);
