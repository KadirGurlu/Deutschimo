import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth/authorization";
import { prisma } from "@/lib/db";
import { withApiMonitoring } from "@/lib/security/api-monitor";

async function GETHandler() {
  const user = await getApiUser();
  if (!user) return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });
  const items = await prisma.vocabularyNotebookItem.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 200 });
  return NextResponse.json({ items });
}

async function POSTHandler(request: Request) {
  const user = await getApiUser();
  if (!user) return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });
  const body = await request.json() as {
    word?: string; article?: string; plural?: string; translation?: string;
    example?: string; exampleTranslation?: string; sourceSkill?: string; sourceTaskId?: string;
  };
  if (!body.word?.trim() || !body.translation?.trim() || !body.sourceTaskId?.trim()) {
    return NextResponse.json({ error: "Kelime, anlam ve kaynak görevi zorunludur." }, { status: 400 });
  }
  const item = await prisma.vocabularyNotebookItem.upsert({
    where: { userId_word_sourceTaskId: { userId: user.id, word: body.word.trim(), sourceTaskId: body.sourceTaskId.trim() } },
    update: {
      article: body.article?.trim() || null,
      plural: body.plural?.trim() || null,
      translation: body.translation.trim(),
      example: body.example?.trim() || null,
      exampleTranslation: body.exampleTranslation?.trim() || null,
      sourceSkill: body.sourceSkill?.trim() || "SKILL_LAB",
    },
    create: {
      userId: user.id,
      word: body.word.trim(),
      article: body.article?.trim() || null,
      plural: body.plural?.trim() || null,
      translation: body.translation.trim(),
      example: body.example?.trim() || null,
      exampleTranslation: body.exampleTranslation?.trim() || null,
      sourceSkill: body.sourceSkill?.trim() || "SKILL_LAB",
      sourceTaskId: body.sourceTaskId.trim(),
    },
  });
  return NextResponse.json({ item }, { status: 201 });
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
export const DELETE = withApiMonitoring("/api/skills/vocabulary", DELETEHandler);
