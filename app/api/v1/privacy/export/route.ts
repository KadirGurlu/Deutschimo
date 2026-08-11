import { auth } from "@/auth";
import { apiError, apiOk } from "@/lib/v47/api";
import { getPrivacyExport } from "@/lib/v47/privacy";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id ?? null;
  if (!userId) return apiError("UNAUTHENTICATED", "Authentication required.", { status: 401 });
  return apiOk(await getPrivacyExport(userId));
}
