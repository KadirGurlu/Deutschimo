import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth/authorization";
import { refreshInsights } from "@/lib/intelligence/server";

export async function GET() {
  const user = await getApiUser();
  if (!user) return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });
  return NextResponse.json({ insights: await refreshInsights(user.id) });
}
