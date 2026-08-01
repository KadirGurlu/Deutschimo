import { withApiMonitoring } from "@/lib/security/api-monitor";
import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth/authorization";
import { prisma } from "@/lib/db";

async function GETHandler() {
  const current = await getApiUser();
  if (!current) return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { id: current.id }, include: { enrollments: true, learningSnapshot: true, unitProgress: true, activityEvents: true, studySessions: true, placementAttempts: true, intelligenceSnapshot: true, dailyStudyPlans: true, smartReviewState: true } });
  if (!user) return NextResponse.json({ error: "Hesap bulunamadı." }, { status: 404 });
  const { passwordHash: _passwordHash, ...safeUser } = user;
  return new NextResponse(JSON.stringify({ exportedAt: new Date().toISOString(), user: safeUser }, null, 2), { headers: { "Content-Type": "application/json; charset=utf-8", "Content-Disposition": `attachment; filename="deutschimo-verilerim-${new Date().toISOString().slice(0,10)}.json"` } });
}

export const GET = withApiMonitoring("/api/account/export", GETHandler);
