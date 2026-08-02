import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth/authorization";
import { prisma } from "@/lib/db";
import { withApiMonitoring } from "@/lib/security/api-monitor";

async function GETHandler(_request: Request, context?: { params: Promise<{ id: string }> }) {
  const user = await getApiUser();
  if (!user) return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });
  const { id } = context ? await context.params : { id: "" };

  if (id === "legacy") {
    const items = await prisma.vocabularyNotebookItem.findMany({
      where: { userId: user.id, setId: null },
      orderBy: { createdAt: "desc" },
      take: 500,
    });
    return NextResponse.json({
      set: {
        id: "legacy",
        title: "Önceki kelime defterim",
        description: "Beceri laboratuvarlarından ve eski kelime defterinden eklenen kelimeler.",
        level: null,
        unitId: null,
        unitTitle: null,
        origin: "LEGACY",
        sourceSlug: null,
        itemCount: items.length,
        lastStudiedAt: null,
        createdAt: items.at(-1)?.createdAt ?? new Date().toISOString(),
        updatedAt: items[0]?.updatedAt ?? new Date().toISOString(),
        items,
      },
    });
  }

  const set = await prisma.vocabularySet.findFirst({
    where: { id, userId: user.id },
    include: { items: { orderBy: { createdAt: "asc" } }, _count: { select: { items: true } } },
  });
  if (!set) return NextResponse.json({ error: "Kelime seti bulunamadı." }, { status: 404 });
  const { _count, ...rest } = set;
  return NextResponse.json({ set: { ...rest, itemCount: _count.items } });
}

export const GET = withApiMonitoring("/api/vocabulary/sets/[id]", GETHandler);
