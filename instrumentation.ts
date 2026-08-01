export async function register() {}

type RequestErrorRequest = { path: string; method: string; headers: Record<string, string | string[] | undefined> };
type RequestErrorContext = { routerKind: string; routePath: string; routeType: string; renderSource?: string };

export async function onRequestError(error: unknown, request: RequestErrorRequest, context: RequestErrorContext) {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { logSystemError } = await import("@/lib/security/logging");
  await logSystemError({ source: `next-${context.routeType}`, error, route: context.routePath || request.path, method: request.method, metadata: { routerKind: context.routerKind, renderSource: context.renderSource } });
}
