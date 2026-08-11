import { prisma } from "@/lib/db";

export async function databaseReadiness(timeoutMs = 1500) {
  const started = Date.now();
  let timer: NodeJS.Timeout | undefined;
  try {
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error("database_timeout")), timeoutMs);
      }),
    ]);
    return { reachable: true as const, latencyMs: Date.now() - started };
  } catch {
    return { reachable: false as const, latencyMs: Date.now() - started };
  } finally {
    if (timer) clearTimeout(timer);
  }
}
