import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withApiMonitoring } from "@/lib/security/api-monitor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function GETHandler() {
  const startedAt = performance.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({
      status: "ok",
      version: process.env.npm_package_version ?? "24.0.0",
      database: "reachable",
      databaseLatencyMs: Math.max(0, Math.round(performance.now() - startedAt)),
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({
      status: "degraded",
      version: process.env.npm_package_version ?? "24.0.0",
      database: "unreachable",
      timestamp: new Date().toISOString(),
    }, { status: 503 });
  }
}

export const GET = withApiMonitoring("/api/health", GETHandler);
