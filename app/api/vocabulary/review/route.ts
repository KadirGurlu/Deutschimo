import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth/authorization";
import { prisma } from "@/lib/db";
import { withApiMonitoring } from "@/lib/security/api-monitor";
import { availableModes, evaluateAnswer, makeReviewCard, scheduleReview } from "@/lib/vocabulary/scheduler";
import type { VocabularyRating, VocabularyReviewMode } from "@/types/vocabulary";

const modes = new Set<VocabularyReviewMode>(["DE_TO_TR", "TR_TO_DE", "AUDIO_TO_WORD", "FILL_BLANK", "ARTICLE", "PLURAL", "SENTENCE"]);
const ratings = new Set<VocabularyRating>(["FORGOT", "HARD", "GOOD", "EASY"]);

async function GETHandler(request: Request) {
  const user = await getApiUser();
  if (!user) return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });
  const url = new URL(request.url);
  const requestedMode = url.searchParams.get("mode");
  const now = new Date();
  const dueWhere = { userId: user.id, suspended: false, nextReviewAt: { lte: now } };
  const [item, dueCount, nextItem] = await Promise.all([
    prisma.vocabularyNotebookItem.findFirst({ where: dueWhere, orderBy: [{ nextReviewAt: "asc" }, { mastery: "asc" }] }),
    prisma.vocabularyNotebookItem.count({ where: dueWhere }),
    prisma.vocabularyNotebookItem.findFirst({ where: { userId: user.id, suspended: false, nextReviewAt: { gt: now } }, orderBy: { nextReviewAt: "asc" }, select: { nextReviewAt: true } }),
  ]);
  if (!item) return NextResponse.json({ card: null, dueCount: 0, nextReviewAt: nextItem?.nextReviewAt ?? null });
  return NextResponse.json({ card: makeReviewCard(item, requestedMode), dueCount, availableModes: availableModes(item) });
}

async function POSTHandler(request: Request) {
  const user = await getApiUser();
  if (!user) return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });
  const body = await request.json() as { action?: "CHECK" | "RATE"; itemId?: string; mode?: VocabularyReviewMode; answer?: unknown; rating?: VocabularyRating; responseMs?: number };
  if (!body.itemId || !body.mode || !modes.has(body.mode)) return NextResponse.json({ error: "Geçersiz tekrar isteği." }, { status: 400 });
  const item = await prisma.vocabularyNotebookItem.findFirst({ where: { id: body.itemId, userId: user.id } });
  if (!item) return NextResponse.json({ error: "Kelime bulunamadı." }, { status: 404 });
  if (!availableModes(item).includes(body.mode)) return NextResponse.json({ error: "Bu kelime için tekrar türü kullanılamıyor." }, { status: 400 });
  const result = evaluateAnswer(item, body.mode, body.answer);
  if (body.action !== "RATE") return NextResponse.json({ result });
  if (!body.rating || !ratings.has(body.rating)) return NextResponse.json({ error: "Hatırlama derecesi seçilmedi." }, { status: 400 });
  const effectiveRating: VocabularyRating = !result.correct && (body.rating === "GOOD" || body.rating === "EASY") ? "FORGOT" : body.rating;
  const scheduled = scheduleReview(item, effectiveRating, result.correct);
  const [updated] = await prisma.$transaction([
    prisma.vocabularyNotebookItem.update({ where: { id: item.id }, data: scheduled }),
    prisma.vocabularyReviewAttempt.create({ data: {
      userId: user.id, itemId: item.id, mode: body.mode, rating: effectiveRating, correct: result.correct,
      answer: typeof body.answer === "string" ? body.answer.slice(0, 2000) : JSON.stringify(body.answer ?? "").slice(0, 2000),
      expected: result.expected.slice(0, 2000), responseMs: Number.isFinite(body.responseMs) ? Math.max(0, Math.round(body.responseMs ?? 0)) : null,
    } }),
  ]);
  const dueCount = await prisma.vocabularyNotebookItem.count({ where: { userId: user.id, suspended: false, nextReviewAt: { lte: new Date() } } });
  return NextResponse.json({ result, schedule: { nextReviewAt: updated.nextReviewAt, intervalDays: updated.intervalDays, mastery: updated.mastery }, dueCount });
}

export const GET = withApiMonitoring("/api/vocabulary/review", GETHandler);
export const POST = withApiMonitoring("/api/vocabulary/review", POSTHandler);
