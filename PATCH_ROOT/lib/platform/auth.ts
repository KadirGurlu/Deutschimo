import { getApiUser } from "@/lib/auth/authorization";

export async function getPlatformApiUser(_request: Request) {
  const user = await getApiUser();
  return user ? { user, authMode: "SESSION" as const } : null;
}
