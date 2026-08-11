import { apiOk } from "@/lib/v47/api";
import { releaseInfo } from "@/lib/v47/release";

export const dynamic = "force-dynamic";

export async function GET() {
  return apiOk(releaseInfo());
}
