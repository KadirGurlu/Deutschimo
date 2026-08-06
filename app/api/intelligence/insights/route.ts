import { withApiMonitoring } from "@/lib/security/api-monitor";
import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth/authorization";
import { refreshInsights } from "@/lib/intelligence/server";

async function GETHandler() {
  const user = await getApiUser();
  if (!user) return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });
  return NextResponse.json({ insights: await refreshInsights(user.id) });
}

export const GET = withApiMonitoring("/api/intelligence/insights", GETHandler);
