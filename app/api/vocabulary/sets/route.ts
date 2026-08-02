import { NextResponse } from "next/server";
import { Level } from "@prisma/client";
import { getApiUser } from "@/lib/auth/authorization";
import { prisma } from "@/lib/db";
import { withApiMonitoring } from "@/lib/security/api-monitor";
import { getCuratedVocabularySet, getCuratedVocabularySetSummaries } from "@/lib/vocabulary/curated-sets";

const clean = (value: unknown, max = 500) => typeof value === "string" ? value.trim().slice(0, max) : "";
const optional = (value: unknown, max = 500) => clean(value, max) || null;
const allowedLevels = new Set(["A1", "A2", "B1", "B2"]);
const parseLevel = (value: unknown): Level | null => {
  const level = clean(value, 2).toUpperCase();
  return allowedLevels.has(level) ? level as Level : null;
};

type EntryInput = {
  word?: unknown;
  article?: unknown;
  plural?: unknown;
  translation?: unknown;
  pronunciation?: unknown;
  wordType?: unknown;
  example?: unknown;
  exampleTranslation?: unknown;
};

function normalizeEntries(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 200).map((entry) => {
    const source = (entry && typeof entry === "object" ? entry : {}) as EntryInput;
    return {
      word: clean(source.word, 180),
      article: optional(source.article, 20),
      plural: optional(source.plural, 180),
      translation: clean(source.translation, 300),
      pronunciation: optional(source.pronunciation, 180),
      wordType: optional(source.wordType, 80),
      example: optional(source.example, 1800),
      exampleTranslation: optional(source.exampleTranslation, 1800),
    };
  }).filter((entry) => entry.word && entry.translation);
}

async function GETHandler() {
  const user = await getApiUser();
  if (!user) return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });

  const [sets, legacyCount] = await Promise.all([
    prisma.vocabularySet.findMany({
      where: { userId: user.id },
      include: { _count: { select: { items: true } } },
      orderBy: [{ lastStudiedAt: "desc" }, { updatedAt: "desc" }],
    }),
    prisma.vocabularyNotebookItem.count({ where: { userId: user.id, setId: null } }),
  ]);

  const importedBySlug = new Map(sets.filter((set) => set.sourceSlug).map((set) => [set.sourceSlug as string, set.id]));
  const curated = getCuratedVocabularySetSummaries().map((set) => ({
    ...set,
    importedSetId: importedBySlug.get(set.slug) ?? null,
  }));

  return NextResponse.json({
    sets: sets.map(({ _count, ...set }) => ({ ...set, itemCount: _count.items })),
    legacyCount,
    curated,
  });
}

async function POSTHandler(request: Request) {
  const user = await getApiUser();
  if (!user) return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });
  const body = await request.json() as Record<string, unknown>;
  const action = clean(body.action, 40).toUpperCase();

  if (action === "IMPORT_CURATED") {
    const slug = clean(body.slug, 240);
    const curated = getCuratedVocabularySet(slug);
    if (!curated) return NextResponse.json({ error: "Hazır kelime seti bulunamadı." }, { status: 404 });

    const existing = await prisma.vocabularySet.findFirst({ where: { userId: user.id, sourceSlug: slug } });
    if (existing) return NextResponse.json({ set: existing, alreadyImported: true });

    const set = await prisma.$transaction(async (tx) => {
      const created = await tx.vocabularySet.create({
        data: {
          userId: user.id,
          title: curated.title,
          description: curated.description,
          level: curated.level as Level,
          unitId: curated.unitId,
          unitTitle: curated.unitTitle,
          origin: "CURATED",
          sourceSlug: curated.slug,
        },
      });
      await tx.vocabularyNotebookItem.createMany({
        data: curated.entries.map((entry, index) => ({
          userId: user.id,
          setId: created.id,
          word: entry.word,
          article: entry.article || null,
          plural: entry.plural || null,
          translation: entry.translation,
          pronunciation: entry.pronunciation || null,
          wordType: entry.wordType || null,
          example: entry.example || null,
          exampleTranslation: entry.exampleTranslation || null,
          sourceSkill: "CURATED_SET",
          sourceTaskId: `curated-${curated.slug}-${index + 1}`,
          sourceCourseId: curated.level.toLowerCase(),
          sourceUnitId: curated.unitId,
          sourceUnitTitle: curated.unitTitle,
        })),
      });
      return created;
    });
    return NextResponse.json({ set }, { status: 201 });
  }

  if (action === "CREATE_SET") {
    const title = clean(body.title, 140);
    const description = optional(body.description, 1200);
    const level = parseLevel(body.level);
    const entries = normalizeEntries(body.entries);
    if (!title) return NextResponse.json({ error: "Kelime setinin adı zorunludur." }, { status: 400 });
    if (!entries.length) return NextResponse.json({ error: "Sete en az bir kelime eklemelisin." }, { status: 400 });

    const set = await prisma.$transaction(async (tx) => {
      const created = await tx.vocabularySet.create({
        data: { userId: user.id, title, description, level, origin: "USER" },
      });
      await tx.vocabularyNotebookItem.createMany({
        data: entries.map((entry, index) => ({
          userId: user.id,
          setId: created.id,
          ...entry,
          sourceSkill: "MANUAL_SET",
          sourceTaskId: `manual-set-${created.id}-${index + 1}`,
        })),
      });
      return created;
    });
    return NextResponse.json({ set }, { status: 201 });
  }

  return NextResponse.json({ error: "Geçersiz işlem." }, { status: 400 });
}

async function PATCHHandler(request: Request) {
  const user = await getApiUser();
  if (!user) return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });
  const body = await request.json() as Record<string, unknown>;
  const id = clean(body.id, 80);
  if (!id) return NextResponse.json({ error: "Set kimliği eksik." }, { status: 400 });
  const existing = await prisma.vocabularySet.findFirst({ where: { id, userId: user.id } });
  if (!existing) return NextResponse.json({ error: "Kelime seti bulunamadı." }, { status: 404 });

  const action = clean(body.action, 40).toUpperCase();
  const set = await prisma.vocabularySet.update({
    where: { id },
    data: action === "MARK_STUDIED"
      ? { lastStudiedAt: new Date() }
      : {
          title: clean(body.title, 140) || existing.title,
          description: optional(body.description, 1200),
          level: parseLevel(body.level),
        },
  });
  return NextResponse.json({ set });
}

async function DELETEHandler(request: Request) {
  const user = await getApiUser();
  if (!user) return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Set kimliği eksik." }, { status: 400 });
  await prisma.vocabularySet.deleteMany({ where: { id, userId: user.id } });
  return NextResponse.json({ ok: true });
}

export const GET = withApiMonitoring("/api/vocabulary/sets", GETHandler);
export const POST = withApiMonitoring("/api/vocabulary/sets", POSTHandler);
export const PATCH = withApiMonitoring("/api/vocabulary/sets", PATCHHandler);
export const DELETE = withApiMonitoring("/api/vocabulary/sets", DELETEHandler);
