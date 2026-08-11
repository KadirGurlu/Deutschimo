import { apiError, apiOk } from "@/lib/v47/api";
import { databaseReadiness } from "@/lib/v47/health";
import { releaseInfo } from "@/lib/v47/release";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = await databaseReadiness();
  const release = releaseInfo();
  if (!db.reachable) {
    return apiError("SERVICE_NOT_READY", "Service dependency is unavailable.", { status: 503 });
  }
  return apiOk({
    status: "ready",
    service: "deutschimo",
    database: "reachable",
    latencyMs: db.latencyMs,
    release: release.release,
    environment: release.environment,
  });
}
